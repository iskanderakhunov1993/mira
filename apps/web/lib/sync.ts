import { supabase } from "./supabase";
import { readData, writeData } from "./store";
import { sanitizeForCloud } from "./privacy";
import type { MiraLocalData } from "./types";
import { useMiraStore } from "@/store";
import { persistedMiraStateSchema } from "@/store/schema";
import type { CareState, CycleState, LogState, SettingsState, UserState } from "@/store/types";
import { migrateHealthSnapshot } from "@/db/migrations";
import type { HealthSnapshot } from "@/types/health";
import { syncDerivedStoresFromHealthSnapshot } from "./healthSnapshotClientSync";

/*
 * Гибридный sync: localStorage + Zustand — локальный источник истины,
 * Supabase/Postgres — зеркало для бэкапа и синхронизации между устройствами.
 * Стратегия — last-write-wins по серверному updated_at.
 * Один JSONB-блоб на пользователя (таблица user_data).
 */

const LAST_PULLED_KEY = "mira:lastPulledAt"; // ISO updated_at последнего успешного pull
const CLOUD_SCHEMA_VERSION = 3;
const HEALTH_SNAPSHOT_STORAGE_KEY = "mira-new-health-v1";

type PersistedMiraState = {
  user: UserState;
  cycle: CycleState;
  logs: LogState;
  care: CareState;
  settings: SettingsState;
};

type MiraCloudPayload = MiraLocalData & {
  cloudSchemaVersion?: number;
  zustand?: PersistedMiraState;
  healthSnapshot?: HealthSnapshot;
};

export type SyncState =
  | { status: "disabled" } // нет клиента Supabase или пользователь не вошёл
  | { status: "idle"; lastSyncedAt?: string }
  | { status: "syncing" }
  | { status: "error"; message: string };

export type CloudSnapshot = {
  data: MiraCloudPayload;
  updatedAt: string; // ISO
};

function getStoreSnapshot(): PersistedMiraState {
  const state = useMiraStore.getState();
  return {
    user: state.user,
    cycle: state.cycle,
    logs: state.logs,
    care: state.care,
    settings: state.settings,
  };
}

function sanitizeStoreSnapshotForCloud(snapshot: PersistedMiraState, legacyData: MiraLocalData): PersistedMiraState {
  const excluded = new Set(legacyData.profile?.cloudSyncExclude ?? []);
  if (excluded.size === 0) return snapshot;

  return {
    ...snapshot,
    logs: {
      ...snapshot.logs,
      dailyLogs: snapshot.logs.dailyLogs.map((log) => ({
        ...log,
        symptoms: {
          ...log.symptoms,
          note: excluded.has("notes") ? "" : log.symptoms.note,
          libido: excluded.has("intimacy") ? null : log.symptoms.libido,
        },
      })),
    },
  };
}

function buildCloudPayload(data: MiraLocalData): MiraCloudPayload {
  const sanitizedLegacyData = sanitizeForCloud(data);
  return {
    ...sanitizedLegacyData,
    cloudSchemaVersion: CLOUD_SCHEMA_VERSION,
    zustand: sanitizeStoreSnapshotForCloud(getStoreSnapshot(), sanitizedLegacyData),
    healthSnapshot: readLocalHealthSnapshot(),
  };
}

function getLegacyDataFromCloud(payload: MiraCloudPayload): MiraLocalData {
  const { cloudSchemaVersion: _cloudSchemaVersion, zustand: _zustand, healthSnapshot: _healthSnapshot, ...legacyData } = payload;
  return legacyData;
}

function applyStoreSnapshot(snapshot: unknown): void {
  const parsed = persistedMiraStateSchema.safeParse(snapshot);
  if (!parsed.success) return;
  useMiraStore.setState((state) => ({
    ...state,
    ...parsed.data,
  }));
}

function getLastPulledAt(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LAST_PULLED_KEY);
}

function setLastPulledAt(iso: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAST_PULLED_KEY, iso);
}

function readLocalHealthSnapshot(): HealthSnapshot | undefined {
  if (typeof window === "undefined") return undefined;
  const raw = window.localStorage.getItem(HEALTH_SNAPSHOT_STORAGE_KEY);
  if (!raw) return undefined;

  try {
    return migrateHealthSnapshot(JSON.parse(raw));
  } catch {
    return undefined;
  }
}

function writeLocalHealthSnapshot(snapshot: HealthSnapshot | undefined): void {
  if (!snapshot || typeof window === "undefined") return;
  window.localStorage.setItem(HEALTH_SNAPSHOT_STORAGE_KEY, JSON.stringify(migrateHealthSnapshot(snapshot)));
}

/** Текущий пользователь, либо null если не вошёл / sync выключен. */
export async function getSyncUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user.id;
}

/** Залить локальные данные в облако (upsert). Возвращает серверный updated_at. */
export async function pushData(data: MiraLocalData): Promise<string> {
  if (!supabase) throw new Error("Supabase не настроен");
  const userId = await getSyncUserId();
  if (!userId) throw new Error("Нужно войти, чтобы синхронизировать");
  const cloudData = buildCloudPayload(data);

  const { data: row, error } = await supabase
    .from("user_data")
    .upsert(
      { user_id: userId, data: cloudData, data_version: data.version },
      { onConflict: "user_id" }
    )
    .select("updated_at")
    .single();

  if (error) throw new Error(error.message);
  setLastPulledAt(row.updated_at);
  return row.updated_at;
}

/** Залить новый local-first HealthSnapshot в тот же Supabase JSONB-блоб. */
export async function pushHealthSnapshot(snapshot: HealthSnapshot): Promise<string> {
  if (!supabase) throw new Error("Supabase не настроен");
  const userId = await getSyncUserId();
  if (!userId) throw new Error("Нужно войти, чтобы синхронизировать");

  const cloud = await pullData().catch(() => null);
  const fallbackPayload = buildCloudPayload(readData());
  const nextPayload: MiraCloudPayload = {
    ...(cloud?.data ?? fallbackPayload),
    cloudSchemaVersion: CLOUD_SCHEMA_VERSION,
    healthSnapshot: migrateHealthSnapshot(snapshot),
  };

  const { data: row, error } = await supabase
    .from("user_data")
    .upsert(
      { user_id: userId, data: nextPayload, data_version: nextPayload.version ?? fallbackPayload.version },
      { onConflict: "user_id" }
    )
    .select("updated_at")
    .single();

  if (error) throw new Error(error.message);
  setLastPulledAt(row.updated_at);
  return row.updated_at;
}

/** Считать облачный снимок, либо null если его ещё нет. */
export async function pullData(): Promise<CloudSnapshot | null> {
  if (!supabase) throw new Error("Supabase не настроен");
  const userId = await getSyncUserId();
  if (!userId) throw new Error("Нужно войти, чтобы синхронизировать");

  const { data: row, error } = await supabase
    .from("user_data")
    .select("data, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!row) return null;
  return { data: row.data as MiraCloudPayload, updatedAt: row.updated_at };
}

/**
 * Синхронизация при загрузке / входе. Last-write-wins:
 *  - облака нет        → заливаем локальные данные (первый бэкап);
 *  - облако новее      → подтягиваем в localStorage;
 *  - локальные новее   → заливаем (перезаписываем облако).
 * Возвращает итоговые данные, которые теперь лежат локально.
 */
export async function syncOnLoad(): Promise<MiraLocalData> {
  const local = readData();
  if (!supabase) return local;

  const userId = await getSyncUserId();
  if (!userId) return local;

  const cloud = await pullData();

  // Облака ещё нет — заливаем то, что есть локально.
  if (!cloud) {
    await pushData(local);
    return local;
  }

  const lastPulled = getLastPulledAt();
  const cloudIsNewer = !lastPulled || cloud.updatedAt > lastPulled;

  if (cloudIsNewer) {
    // На другом устройстве данные изменились — забираем себе.
    writeLocalHealthSnapshot(cloud.data.healthSnapshot);
    if (cloud.data.healthSnapshot) {
      const nextLegacyData = syncDerivedStoresFromHealthSnapshot(cloud.data.healthSnapshot);
      setLastPulledAt(cloud.updatedAt);
      return nextLegacyData;
    }

    writeData(getLegacyDataFromCloud(cloud.data));
    applyStoreSnapshot(cloud.data.zustand);
    setLastPulledAt(cloud.updatedAt);
    return getLegacyDataFromCloud(cloud.data);
  }

  // Локальные изменения новее облака — заливаем их.
  await pushData(local);
  return local;
}

/** Дебаунс-пуш: дёргать после каждого локального сохранения. */
let pushTimer: ReturnType<typeof setTimeout> | null = null;
export function schedulePush(data: MiraLocalData, delayMs = 2000): void {
  if (!supabase) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    pushData(data).catch((e) => console.warn("sync push failed:", e));
  }, delayMs);
}

/** Подписка на Zustand: любые изменения нового стора тоже уходят в Postgres. */
let unsubscribeStorePush: (() => void) | null = null;
export function startStoreCloudSync(): () => void {
  if (!supabase || unsubscribeStorePush) return () => undefined;

  unsubscribeStorePush = useMiraStore.subscribe((state, prevState) => {
    if (
      state.user === prevState.user &&
      state.cycle === prevState.cycle &&
      state.logs === prevState.logs &&
      state.care === prevState.care &&
      state.settings === prevState.settings
    ) {
      return;
    }
    schedulePush(readData());
  });

  return () => {
    unsubscribeStorePush?.();
    unsubscribeStorePush = null;
  };
}

/** Сбросить локальный маркер синка (например, при выходе). */
export function resetSyncMarker(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LAST_PULLED_KEY);
}
