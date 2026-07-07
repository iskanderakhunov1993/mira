import { createEmptyHealthSnapshot } from "../../data/seed.ts";
import type { DailyCheckIn, MiraLocalData, TrackingCategory, UserProfile as LegacyUserProfile } from "../../lib/types";
import type { Cycle, DailyEntry, HealthSettings, TrackerPreference, UserProfile } from "../../types/health";
import { defaultTrackers } from "./options.ts";
import type { InitialCheckIn, OnboardingDraft } from "./types";

const DEFAULT_CYCLE_LENGTH = 28;
const DEFAULT_PERIOD_LENGTH = 5;

function nowIso() {
  return new Date().toISOString();
}

export function todayKey(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export function createInitialOnboardingDraft(date = new Date()): OnboardingDraft {
  return {
    goal: null,
    periodStartMode: null,
    lastPeriodStart: todayKey(date),
    regularity: null,
    factors: [],
    trackers: [...defaultTrackers],
    initialCheckIn: null,
  };
}

export function periodStartForDraft(draft: OnboardingDraft, date = new Date()): string | undefined {
  if (draft.periodStartMode === "date" && draft.lastPeriodStart) return draft.lastPeriodStart;
  if (draft.periodStartMode === "current") return todayKey(date);
  return undefined;
}

function healthCheckInValue(value: InitialCheckIn): DailyEntry["checkIn"] {
  return { value };
}

function legacyMood(value: InitialCheckIn): DailyCheckIn["mood"] {
  if (value === "good") return { value: "joy" };
  if (value === "not_great") return { value: "sadness" };
  if (value === "hard") return { value: "anxiety" };
  return { value: "normal" };
}

function trackerToLegacy(category: TrackerPreference): TrackingCategory | null {
  const map: Partial<Record<TrackerPreference, TrackingCategory>> = {
    cycle: "cycle",
    mood: "mood",
    energy: "energy",
    sleep: "sleep",
    pain: "pain",
    food: "nutrition",
    activity: "workout",
  };
  return map[category] ?? null;
}

export function buildHealthSnapshotUpdates(draft: OnboardingDraft, date = new Date()) {
  const savedAt = nowIso();
  const periodStart = periodStartForDraft(draft, date);
  const profile: UserProfile = {
    id: "local-profile",
    displayName: "Mira",
    onboardingCompleted: true,
    goal: draft.goal ?? "try",
    lastPeriodStart: periodStart,
    periodStartUnknown: !periodStart,
    cycleRegularity: draft.regularity ?? "unknown",
    factors: draft.factors,
    trackerPreferences: draft.trackers,
    createdAt: savedAt,
    updatedAt: savedAt,
  };

  const settingsBase = createEmptyHealthSnapshot().settings;
  const settings: HealthSettings = {
    ...settingsBase,
    trackerPreferences: draft.trackers,
    updatedAt: savedAt,
  };

  const cycle: Cycle | null = periodStart
    ? {
        id: `cycle-${periodStart}`,
        startDate: periodStart,
        source: "user",
        createdAt: savedAt,
        updatedAt: savedAt,
      }
    : null;

  const entryDate = periodStart ?? todayKey(date);
  const dailyEntry: DailyEntry | null = draft.initialCheckIn
    ? {
        id: `entry-${entryDate}`,
        date: entryDate,
        checkIn: healthCheckInValue(draft.initialCheckIn),
        period: periodStart
          ? {
              id: `period-${periodStart}`,
              date: periodStart,
              state: "started",
              createdAt: savedAt,
            }
          : undefined,
        context: [],
        symptoms: [],
        createdAt: savedAt,
        updatedAt: savedAt,
      }
    : null;

  return { profile, settings, cycle, dailyEntry };
}

export function buildLegacyOnboardingData(existing: MiraLocalData, draft: OnboardingDraft, date = new Date()): MiraLocalData {
  const savedAt = nowIso();
  const periodStart = periodStartForDraft(draft, date);
  const fallbackStart = periodStart ?? todayKey(date);
  const legacyTrackers = Array.from(new Set(["cycle", ...draft.trackers.map(trackerToLegacy).filter(Boolean)])) as TrackingCategory[];
  const previousProfile = existing.profile;
  const profile: LegacyUserProfile = {
    name: previousProfile?.name ?? "Mira",
    email: previousProfile?.email,
    height: previousProfile?.height,
    weight: previousProfile?.weight,
    age: previousProfile?.age,
    activityLevel: previousProfile?.activityLevel,
    dietaryRestrictions: previousProfile?.dietaryRestrictions,
    nutritionGoal: previousProfile?.nutritionGoal,
    showCalories: draft.trackers.includes("calories") ? (previousProfile?.showCalories ?? false) : false,
    cycleConfig: {
      periodStart: fallbackStart,
      cycleLength: previousProfile?.cycleConfig.cycleLength ?? DEFAULT_CYCLE_LENGTH,
      periodLength: previousProfile?.cycleConfig.periodLength ?? DEFAULT_PERIOD_LENGTH,
      periodStarts: periodStart
        ? Array.from(new Set([...(previousProfile?.cycleConfig.periodStarts ?? []), periodStart])).sort()
        : previousProfile?.cycleConfig.periodStarts ?? [],
    },
    trackingPreferences: legacyTrackers,
    additionalMode: previousProfile?.additionalMode ?? "none",
    madhab: previousProfile?.madhab,
    pinEnabled: previousProfile?.pinEnabled ?? false,
    hiddenNotifications: previousProfile?.hiddenNotifications ?? false,
    privateMarks: previousProfile?.privateMarks ?? true,
    hiddenMode: previousProfile?.hiddenMode,
    deviceUnlockEnabled: previousProfile?.deviceUnlockEnabled,
    reportSexDefault: false,
    cloudSyncExclude: Array.from(new Set([...(previousProfile?.cloudSyncExclude ?? []), "intimacy", "notes"])),
    partnerShare: previousProfile?.partnerShare,
    reminders: previousProfile?.reminders,
  };

  const checkIns = { ...existing.checkIns };
  if (draft.initialCheckIn || periodStart) {
    const dateKey = periodStart ?? todayKey(date);
    checkIns[dateKey] = {
      ...checkIns[dateKey],
      date: dateKey,
      savedAt,
      mood: draft.initialCheckIn ? legacyMood(draft.initialCheckIn) : checkIns[dateKey]?.mood,
      period: periodStart
        ? {
            intensity: "moderate",
            type: draft.periodStartMode === "irregular" ? "spotting" : "normal",
          }
        : checkIns[dateKey]?.period,
    };
  }

  return {
    ...existing,
    profile,
    checkIns,
    onboardingCompleted: true,
  };
}

export function buildStoreOnboardingPatch(draft: OnboardingDraft, date = new Date()) {
  const periodStart = periodStartForDraft(draft, date);
  const fallbackStart = periodStart ?? todayKey(date);
  return {
    user: {
      name: "Mira",
      trackingMonths: 0,
      totalCycles: periodStart ? 1 : 0,
    },
    cycle: {
      averageLength: DEFAULT_CYCLE_LENGTH,
      periodLength: DEFAULT_PERIOD_LENGTH,
      lastPeriodStart: fallbackStart,
      cycles: periodStart
        ? [
            {
              id: `cycle-${periodStart}`,
              startDate: periodStart,
              endDate: null,
              length: DEFAULT_CYCLE_LENGTH,
              periodLength: DEFAULT_PERIOD_LENGTH,
              symptoms: [],
            },
          ]
        : [],
    },
  };
}
