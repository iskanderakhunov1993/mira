"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LocalHealthRepository } from "@/data/healthRepository";
import { createEmptyHealthSnapshot } from "@/data/seed";
import { buildTodayViewModel, mergeTodayEntry } from "@/features/today/model";
import { NewTodayPage } from "@/components/screens/NewTodayPage";
import { readData } from "@/lib/store";
import { syncDerivedStoresFromHealthSnapshot } from "@/lib/healthSnapshotClientSync";
import type { CheckIn, Cycle, DailyEntry, HealthSettings, UserProfile } from "@/types/health";
import type { AddAction } from "@/features/add/types";

type TodayRepositoryState = {
  profile: UserProfile | null;
  settings: HealthSettings;
  cycles: Cycle[];
  entries: DailyEntry[];
};

function nowIso() {
  return new Date().toISOString();
}

function createEntry(date: string, patch: Partial<DailyEntry>): DailyEntry {
  const savedAt = nowIso();
  return {
    id: `entry-${date}`,
    date,
    symptoms: [],
    context: [],
    createdAt: savedAt,
    updatedAt: savedAt,
    ...patch,
  };
}

export function TodayRoute() {
  const router = useRouter();
  const repository = useMemo(() => new LocalHealthRepository(), []);
  const [state, setState] = useState<TodayRepositoryState>(() => ({
    profile: null,
    settings: createEmptyHealthSnapshot().settings,
    cycles: [],
    entries: [],
  }));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [offline, setOffline] = useState(false);

  async function load() {
    setLoading(true);
    const [profile, settings, cycles, entries] = await Promise.all([
      repository.getProfile(),
      repository.getSettings(),
      repository.listCycles(),
      repository.listDailyEntries(),
    ]);

    const legacyData = readData();
    setState({
      profile: profile.ok ? profile.data : null,
      settings: settings.ok ? settings.data : createEmptyHealthSnapshot().settings,
      cycles: cycles.ok ? cycles.data : [],
      entries: entries.ok ? entries.data : [],
    });
    setOffline(typeof navigator !== "undefined" ? !navigator.onLine : false);

    if (!profile.ok || !settings.ok || !cycles.ok || !entries.ok) {
      setState((current) => ({
        ...current,
        profile: legacyData.onboardingCompleted
          ? {
              id: "legacy-profile",
              displayName: legacyData.profile?.name ?? "Mira",
              onboardingCompleted: true,
              lastPeriodStart: legacyData.profile?.cycleConfig.periodStart,
              periodStartUnknown: !legacyData.profile?.cycleConfig.periodStart,
              cycleRegularity: "unknown",
              factors: [],
              trackerPreferences: ["cycle", "wellbeing", "mood", "energy", "water"],
              createdAt: nowIso(),
              updatedAt: nowIso(),
            }
          : current.profile,
      }));
    }

    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const model = useMemo(() => buildTodayViewModel(state), [state]);

  async function saveEntry(entry: DailyEntry) {
    setSaving(true);
    const merged = mergeTodayEntry(state.entries, entry);
    await repository.saveDailyEntry(merged);
    const snapshot = await repository.getSnapshot();
    if (snapshot.ok) syncDerivedStoresFromHealthSnapshot(snapshot.data);
    setState((current) => ({
      ...current,
      entries: [...current.entries.filter((item) => item.id !== merged.id && item.date !== merged.date), merged],
    }));
    setSaving(false);
  }

  async function handleCheckIn(value: CheckIn["value"]) {
    const entry = createEntry(model.todayKey, { checkIn: { value } });
    await saveEntry(entry);
  }

  async function handleQuickTracker() {
    if (model.quickTracker.type === "water") {
      const existing = state.entries.find((entry) => entry.date === model.todayKey);
      await saveEntry(createEntry(model.todayKey, { waterMl: (existing?.waterMl ?? 0) + 250 }));
      return;
    }

    if (model.quickTracker.type === "sleep") {
      await saveEntry(createEntry(model.todayKey, { sleep: { quality: "normal" } }));
      return;
    }

    router.push("/add");
  }

  return (
    <NewTodayPage
      model={model}
      loading={loading}
      offline={offline}
      saving={saving}
      onCheckIn={handleCheckIn}
      onQuickTracker={handleQuickTracker}
      onOnboarding={() => router.push("/onboarding?restart=1")}
      onAdd={() => router.push("/add")}
      onAddAction={(action: AddAction) => router.push(`/add?action=${action}`)}
    />
  );
}
