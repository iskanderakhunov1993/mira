import type { Cycle, DailyEntry, HealthSettings, HealthSnapshot, TrackerPreference } from "../types/health";
import type { DailyCheckIn, EnergyValue, MiraLocalData, MoodValue, PainKind, PainLevel, SleepQuality, TrackingCategory, UserProfile } from "./types";

const DEFAULT_CYCLE_LENGTH = 28;
const DEFAULT_PERIOD_LENGTH = 5;

function trackerToLegacy(tracker: TrackerPreference): TrackingCategory | null {
  const map: Partial<Record<TrackerPreference, TrackingCategory>> = {
    cycle: "cycle",
    pain: "pain",
    mood: "mood",
    energy: "energy",
    sleep: "sleep",
    food: "nutrition",
    activity: "workout",
  };
  return map[tracker] ?? null;
}

function checkInToMood(value: DailyEntry["checkIn"] | undefined): MoodValue | undefined {
  if (!value) return undefined;
  if (value.value === "good") return "joy";
  if (value.value === "not_great") return "sadness";
  if (value.value === "hard") return "anxiety";
  return "normal";
}

function moodToLegacy(value: DailyEntry["mood"] | undefined): MoodValue | undefined {
  if (value === "good") return "joy";
  if (value === "sad") return "sadness";
  if (value === "angry" || value === "irritated") return "anger";
  if (value === "anxious") return "anxiety";
  if (value === "sensitive") return "swings";
  if (value === "calm") return "normal";
  return undefined;
}

function energyToLegacy(value: DailyEntry["energy"] | undefined): EnergyValue | undefined {
  if (value === "low") return "low";
  if (value === "high") return "high";
  if (value === "normal") return "normal";
  return undefined;
}

function sleepToLegacy(value: DailyEntry["sleep"] | undefined): SleepQuality | undefined {
  if (!value) return undefined;
  if (value.quality === "poor") return "bad";
  return value.quality;
}

function painToLevel(value: DailyEntry["pain"] | undefined): PainLevel | undefined {
  if (!value) return undefined;
  if (value.intensity >= 4) return "strong";
  if (value.intensity >= 2) return "medium";
  return "light";
}

function painToKinds(value: DailyEntry["pain"] | undefined): PainKind[] {
  if (!value) return [];
  const location = value.location?.toLowerCase() ?? "";
  if (location.includes("голов")) return ["headache"];
  if (location.includes("спин")) return ["back"];
  if (location.includes("груд")) return ["breast"];
  if (location.includes("овул")) return ["ovulatory"];
  return ["lower_abdomen"];
}

function legacyTrackerToHealth(tracker: TrackingCategory): TrackerPreference | null {
  const map: Partial<Record<TrackingCategory, TrackerPreference>> = {
    cycle: "cycle",
    pain: "pain",
    mood: "mood",
    energy: "energy",
    sleep: "sleep",
    nutrition: "food",
    workout: "activity",
  };
  return map[tracker] ?? null;
}

function legacyMoodToHealth(value: DailyCheckIn["mood"] | undefined): DailyEntry["mood"] | undefined {
  if (!value) return undefined;
  if (value.value === "joy") return "good";
  if (value.value === "sadness") return "sad";
  if (value.value === "anger") return "angry";
  if (value.value === "anxiety") return "anxious";
  if (value.value === "swings") return "irritated";
  return "calm";
}

function legacyEnergyToHealth(value: DailyCheckIn["energy"] | undefined): DailyEntry["energy"] | undefined {
  if (!value) return undefined;
  if (value.value === "high") return "high";
  if (value.value === "low" || value.value === "exhausted") return "low";
  return "normal";
}

function legacySleepToHealth(value: DailyCheckIn["sleep"] | undefined): DailyEntry["sleep"] | undefined {
  if (!value) return undefined;
  return {
    quality: value.quality === "good" ? "good" : value.quality === "normal" ? "normal" : "poor",
    hours: value.hours,
  };
}

function legacyPainToHealth(value: DailyCheckIn["pain"] | undefined): DailyEntry["pain"] | undefined {
  if (!value || !value.level) return undefined;
  const intensity: NonNullable<DailyEntry["pain"]>["intensity"] =
    value.level === "strong" ? 4 : value.level === "medium" ? 3 : 1;
  const firstKind = value.kinds.find((kind) => kind !== "none");
  const locationMap: Partial<Record<PainKind, string>> = {
    cramps: "низ живота",
    lower_abdomen: "низ живота",
    headache: "голова",
    breast: "грудь",
    back: "спина",
    ovulatory: "овуляторная боль",
  };

  return {
    intensity,
    location: firstKind ? locationMap[firstKind] ?? firstKind : undefined,
    affectedLife: value.level === "strong" ? "moderately" : "none",
  };
}

function legacyPeriodToHealth(entry: DailyCheckIn): DailyEntry["period"] {
  if (!entry.period) return undefined;
  return {
    id: `period-${entry.date}`,
    date: entry.date,
    state: entry.period.type === "spotting" || entry.period.type === "brown" ? "spotting" : "started",
    createdAt: entry.savedAt,
  };
}

function legacyCheckInToDailyEntry(entry: DailyCheckIn, existing?: DailyEntry): DailyEntry {
  const symptoms = Array.from(new Set([
    ...(existing?.symptoms ?? []),
    ...(entry.pms?.symptoms ?? []),
    ...(entry.symptomLog?.anxiety ? ["тревожность"] : []),
  ]));
  const context = Array.from(new Set([
    ...(existing?.context ?? []),
    entry.stress ? `стресс: ${entry.stress}` : null,
    entry.discharge ? `выделения: ${entry.discharge}` : null,
    entry.symptomLog?.appetite ? `аппетит: ${entry.symptomLog.appetite}` : null,
    entry.symptomLog?.sweetCraving ? "тяга к сладкому" : null,
    ...(entry.symptomLog?.medications?.map((item) => `препарат: ${item}`) ?? []),
  ].filter(Boolean) as string[]));

  return {
    id: existing?.id ?? `entry-${entry.date}`,
    date: entry.date,
    checkIn: existing?.checkIn,
    period: legacyPeriodToHealth(entry) ?? existing?.period,
    waterMl: existing?.waterMl,
    energy: legacyEnergyToHealth(entry.energy) ?? existing?.energy,
    sleep: legacySleepToHealth(entry.sleep) ?? existing?.sleep,
    pain: legacyPainToHealth(entry.pain) ?? existing?.pain,
    mood: legacyMoodToHealth(entry.mood) ?? existing?.mood,
    context,
    symptoms,
    note: entry.note?.text ?? existing?.note,
    createdAt: existing?.createdAt ?? entry.savedAt,
    updatedAt: entry.savedAt,
  };
}

function legacyProfileToHealth(data: MiraLocalData, existing: HealthSnapshot["profile"]): HealthSnapshot["profile"] {
  const profile = data.profile;
  if (!profile) return existing;
  const trackers: TrackerPreference[] = Array.from(new Set<TrackerPreference>([
    "cycle",
    "wellbeing",
    ...(profile.trackingPreferences.map(legacyTrackerToHealth).filter(Boolean) as TrackerPreference[]),
  ]));

  return {
    id: existing?.id ?? "local-profile",
    displayName: profile.name,
    onboardingCompleted: data.onboardingCompleted || existing?.onboardingCompleted || false,
    goal: existing?.goal,
    lastPeriodStart: profile.cycleConfig.periodStart,
    periodStartUnknown: !profile.cycleConfig.periodStart,
    cycleRegularity: existing?.cycleRegularity ?? "unknown",
    factors: existing?.factors ?? [],
    trackerPreferences: trackers,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function cyclesFromLegacy(data: MiraLocalData, existing: Cycle[]): Cycle[] {
  const starts = Array.from(new Set([
    ...(data.profile?.cycleConfig.periodStarts ?? []),
    ...Object.values(data.checkIns).filter((entry) => entry.period).map((entry) => entry.date),
  ])).sort();
  const byId = new Map(existing.map((cycle) => [cycle.id, cycle]));

  for (const startDate of starts) {
    const id = `cycle-${startDate}`;
    const previous = byId.get(id);
    byId.set(id, {
      id,
      startDate,
      periodLength: previous?.periodLength ?? data.profile?.cycleConfig.periodLength,
      source: previous?.source ?? "migration",
      createdAt: previous?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return Array.from(byId.values()).sort((a, b) => a.startDate.localeCompare(b.startDate));
}

function settingsFromLegacy(data: MiraLocalData, existing: HealthSettings): HealthSettings {
  if (!data.profile) return existing;
  const trackers = Array.from(new Set([
    ...existing.trackerPreferences,
    ...(data.profile.trackingPreferences.map(legacyTrackerToHealth).filter(Boolean) as TrackerPreference[]),
  ]));

  return {
    ...existing,
    trackerPreferences: trackers,
    privacy: {
      ...existing.privacy,
      pinEnabled: data.profile.pinEnabled || existing.privacy.pinEnabled,
      biometricsEnabled: Boolean(data.profile.deviceUnlockEnabled) || existing.privacy.biometricsEnabled,
    },
    updatedAt: new Date().toISOString(),
  };
}

function buildLegacyProfile(snapshot: HealthSnapshot, existing?: UserProfile): UserProfile | undefined {
  const profile = snapshot.profile;
  if (!profile && !existing) return undefined;

  const periodStarts = Array.from(new Set([
    ...(existing?.cycleConfig.periodStarts ?? []),
    ...snapshot.cycles.map((cycle) => cycle.startDate),
    ...snapshot.dailyEntries.filter((entry) => entry.period?.state === "started").map((entry) => entry.date),
  ])).sort();
  const periodStart = profile?.lastPeriodStart ?? periodStarts.at(-1) ?? existing?.cycleConfig.periodStart;
  if (!periodStart && !existing) return undefined;

  const trackers = Array.from(new Set([
    "cycle",
    ...(profile?.trackerPreferences ?? snapshot.settings.trackerPreferences).map(trackerToLegacy).filter(Boolean),
  ])) as TrackingCategory[];

  return {
    name: existing?.name ?? profile?.displayName ?? "Mira",
    email: existing?.email,
    height: existing?.height,
    weight: existing?.weight,
    age: existing?.age,
    activityLevel: existing?.activityLevel,
    dietaryRestrictions: existing?.dietaryRestrictions,
    nutritionGoal: existing?.nutritionGoal,
    showCalories: (profile?.trackerPreferences ?? snapshot.settings.trackerPreferences).includes("calories") ? (existing?.showCalories ?? false) : false,
    cycleConfig: {
      periodStart: periodStart ?? new Date().toISOString().slice(0, 10),
      cycleLength: existing?.cycleConfig.cycleLength ?? DEFAULT_CYCLE_LENGTH,
      periodLength: existing?.cycleConfig.periodLength ?? DEFAULT_PERIOD_LENGTH,
      periodStarts,
    },
    trackingPreferences: trackers,
    additionalMode: existing?.additionalMode ?? "none",
    madhab: existing?.madhab,
    pinEnabled: snapshot.settings.privacy.pinEnabled || (existing?.pinEnabled ?? false),
    hiddenNotifications: existing?.hiddenNotifications ?? false,
    privateMarks: existing?.privateMarks ?? true,
    hiddenMode: existing?.hiddenMode,
    deviceUnlockEnabled: snapshot.settings.privacy.biometricsEnabled || existing?.deviceUnlockEnabled,
    reportSexDefault: false,
    cloudSyncExclude: Array.from(new Set([...(existing?.cloudSyncExclude ?? []), "intimacy", "notes"])),
    partnerShare: existing?.partnerShare,
    reminders: existing?.reminders,
  };
}

function dailyEntryToCheckIn(entry: DailyEntry, previous?: DailyCheckIn): DailyCheckIn {
  const mood = moodToLegacy(entry.mood) ?? checkInToMood(entry.checkIn);
  return {
    ...previous,
    date: entry.date,
    savedAt: entry.updatedAt,
    period: entry.period
      ? {
          intensity: entry.period.state === "unusual_bleeding" ? "heavy" : "moderate",
          type: entry.period.state === "spotting" ? "spotting" : "normal",
        }
      : previous?.period,
    pain: entry.pain
      ? {
          kinds: painToKinds(entry.pain),
          level: painToLevel(entry.pain),
        }
      : previous?.pain,
    mood: mood ? { value: mood } : previous?.mood,
    energy: entry.energy ? { value: energyToLegacy(entry.energy) ?? "normal" } : previous?.energy,
    sleep: entry.sleep ? { quality: sleepToLegacy(entry.sleep) ?? "normal", hours: entry.sleep.hours } : previous?.sleep,
    pms: entry.symptoms.length ? { symptoms: Array.from(new Set([...(previous?.pms?.symptoms ?? []), ...entry.symptoms])) } : previous?.pms,
    note: entry.note ? { text: entry.note } : previous?.note,
  };
}

export function mergeHealthSnapshotIntoLegacy(existing: MiraLocalData, snapshot: HealthSnapshot): MiraLocalData {
  const profile = buildLegacyProfile(snapshot, existing.profile);
  const checkIns = { ...existing.checkIns };
  const waterLog = { ...(existing.waterLog ?? {}) };

  for (const entry of snapshot.dailyEntries) {
    checkIns[entry.date] = dailyEntryToCheckIn(entry, checkIns[entry.date]);
    if (typeof entry.waterMl === "number") {
      waterLog[entry.date] = {
        date: entry.date,
        glasses: Math.max(0, Math.round(entry.waterMl / 250)),
        goal: snapshot.settings.waterTargetMl,
      };
    }
  }

  return {
    ...existing,
    profile,
    checkIns,
    waterLog: Object.keys(waterLog).length ? waterLog : existing.waterLog,
    onboardingCompleted: existing.onboardingCompleted || Boolean(snapshot.profile?.onboardingCompleted),
  };
}

export function mergeLegacyIntoHealthSnapshot(existing: HealthSnapshot, data: MiraLocalData): HealthSnapshot {
  const entriesByDate = new Map(existing.dailyEntries.map((entry) => [entry.date, entry]));

  for (const checkIn of Object.values(data.checkIns)) {
    entriesByDate.set(checkIn.date, legacyCheckInToDailyEntry(checkIn, entriesByDate.get(checkIn.date)));
  }

  return {
    ...existing,
    profile: legacyProfileToHealth(data, existing.profile),
    cycles: cyclesFromLegacy(data, existing.cycles),
    dailyEntries: Array.from(entriesByDate.values()).sort((a, b) => a.date.localeCompare(b.date)),
    settings: settingsFromLegacy(data, existing.settings),
  };
}
