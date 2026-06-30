import type { CloudSyncCategory, MiraLocalData, PartnerShareSettings } from "./types";

const PIN_HASH_KEY = "mira:pinHash";

export const cloudSyncCategories: Array<{ id: CloudSyncCategory; label: string; desc: string }> = [
  { id: "intimacy", label: "Секс и контрацепция", desc: "не отправлять интимные отметки" },
  { id: "notes", label: "Личный дневник", desc: "не отправлять свободные заметки" },
  { id: "badEpisodes", label: "Мне плохо", desc: "не отправлять кризисные эпизоды" },
  { id: "delayChecks", label: "Задержки", desc: "не отправлять, что может влиять на задержку" },
  { id: "labs", label: "Анализы", desc: "не отправлять результаты анализов" },
  { id: "islamic", label: "Религиозные отметки", desc: "не отправлять исламский режим" },
];

export const defaultPartnerShare: PartnerShareSettings = {
  phase: true,
  moodEnergy: true,
  tips: true,
};

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, "0")).join("");
}

export async function savePin(pin: string): Promise<void> {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PIN_HASH_KEY, await sha256(pin));
}

export function hasPin(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.localStorage.getItem(PIN_HASH_KEY));
}

export function clearPin(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PIN_HASH_KEY);
}

export async function verifyPin(pin: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const saved = window.localStorage.getItem(PIN_HASH_KEY);
  if (!saved) return false;
  return saved === await sha256(pin);
}

export function sanitizeForCloud(data: MiraLocalData): MiraLocalData {
  const excluded = new Set(data.profile?.cloudSyncExclude ?? []);
  if (excluded.size === 0) return data;

  const checkIns = Object.fromEntries(Object.entries(data.checkIns).map(([date, checkIn]) => {
    const next = { ...checkIn };
    if (excluded.has("intimacy")) delete next.intimacy;
    if (excluded.has("notes")) delete next.note;
    if (excluded.has("badEpisodes")) delete next.badEpisodes;
    if (excluded.has("delayChecks")) delete next.delayChecks;
    return [date, next];
  }));

  return {
    ...data,
    checkIns,
    labs: excluded.has("labs") ? [] : data.labs,
    islamicEntries: excluded.has("islamic") ? undefined : data.islamicEntries,
  };
}
