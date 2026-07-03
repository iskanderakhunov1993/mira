"use client";

import type { DailyCheckIn, EnergyValue, MiraLocalData, MoodValue, PainLevel, SleepQuality } from "@/lib/types";
import type { CareState, CycleState, DailyLog, UserState } from "@/store";

function toPainLevel(level: DailyLog["symptoms"]["pain"]["level"]): PainLevel | undefined {
  if (level >= 4) return "strong";
  if (level >= 2) return "medium";
  if (level === 1) return "light";
  return undefined;
}

function toMood(value: DailyLog["symptoms"]["mood"]): MoodValue | undefined {
  const map: Record<NonNullable<DailyLog["symptoms"]["mood"]>, MoodValue> = {
    great: "joy",
    good: "normal",
    neutral: "normal",
    low: "sadness",
    anxious: "anxiety",
    irritable: "anger",
  };
  return value ? map[value] : undefined;
}

function toEnergy(value: DailyLog["symptoms"]["energy"]): EnergyValue | undefined {
  return value ?? undefined;
}

function toSleep(value: DailyLog["symptoms"]["sleep"]["quality"]): SleepQuality | undefined {
  const map: Record<NonNullable<DailyLog["symptoms"]["sleep"]["quality"]>, SleepQuality> = {
    good: "good",
    normal: "normal",
    poor: "bad",
  };
  return value ? map[value] : undefined;
}

function toDailyCheckIn(log: DailyLog): DailyCheckIn {
  const painLevel = toPainLevel(log.symptoms.pain.level);
  const mood = toMood(log.symptoms.mood);
  const energy = toEnergy(log.symptoms.energy);
  const sleepQuality = toSleep(log.symptoms.sleep.quality);
  const period = log.symptoms.bleeding.amount > 0
    ? {
      intensity: log.symptoms.bleeding.amount >= 3 ? "heavy" as const : log.symptoms.bleeding.amount === 2 ? "moderate" as const : "light" as const,
      type: log.symptoms.bleeding.clots === "large" ? "clots" as const : "normal" as const,
    }
    : undefined;

  return {
    date: log.date,
    savedAt: new Date().toISOString(),
    period,
    pain: painLevel ? { level: painLevel, kinds: log.symptoms.pain.location.length > 0 ? ["lower_abdomen"] : ["none"] } : undefined,
    mood: mood ? { value: mood } : undefined,
    energy: energy ? { value: energy } : undefined,
    sleep: sleepQuality ? { quality: sleepQuality, hours: log.symptoms.sleep.hours ?? undefined } : undefined,
    note: log.symptoms.note ? { text: log.symptoms.note } : undefined,
    symptomLog: {
      anxiety: log.symptoms.mood === "anxious",
      libido: log.symptoms.libido === "high" ? "high" : log.symptoms.libido === "medium" ? "normal" : log.symptoms.libido === "low" ? "low" : undefined,
    },
  };
}

export function mergeStoreIntoReportData(
  legacyData: MiraLocalData,
  user: UserState,
  cycle: CycleState,
  logs: DailyLog[],
  care: CareState
): MiraLocalData {
  const hasLegacyProfile = Boolean(legacyData.profile);
  const looksLikeDefaultDemoUser = !hasLegacyProfile && logs.length === 0 && user.name === "Елена" && user.age === 52;
  const checkInsFromStore = logs.reduce<Record<string, DailyCheckIn>>((acc, log) => {
    acc[log.date] = {
      ...(legacyData.checkIns[log.date] ?? {}),
      ...toDailyCheckIn(log),
    };
    return acc;
  }, {});

  const waterLog = logs.reduce<MiraLocalData["waterLog"]>((acc, log) => {
    if (log.selfCare.water <= 0) return acc;
    return {
      ...(acc ?? {}),
      [log.date]: {
        date: log.date,
        glasses: Math.round(log.selfCare.water / 0.25),
        goal: Math.round(care.water.target / 0.25),
      },
    };
  }, legacyData.waterLog);

  const walkingLog = logs.reduce<MiraLocalData["walkingLog"]>((acc, log) => {
    if (!log.selfCare.walking || log.selfCare.walking === "none") return acc;
    const stepsByLevel = { little: 2500, normal: 6500, much: 10000 };
    return {
      ...(acc ?? {}),
      [log.date]: {
        date: log.date,
        steps: stepsByLevel[log.selfCare.walking],
        goal: 7000,
        source: "manual",
      },
    };
  }, legacyData.walkingLog);

  const weightLog = care.weight.history.reduce<MiraLocalData["weightLog"]>((acc, entry) => ({
    ...(acc ?? {}),
    [entry.date]: entry,
  }), legacyData.weightLog);

  return {
    ...legacyData,
    profile: {
      ...(legacyData.profile ?? {}),
      name: looksLikeDefaultDemoUser ? "Mira" : user.name || legacyData.profile?.name || "Mira",
      age: looksLikeDefaultDemoUser ? legacyData.profile?.age : user.age || legacyData.profile?.age,
      weight: care.weight.current ?? legacyData.profile?.weight,
      showCalories: legacyData.profile?.showCalories ?? false,
      cycleConfig: {
        ...(legacyData.profile?.cycleConfig ?? {}),
        periodStart: cycle.lastPeriodStart ?? legacyData.profile?.cycleConfig.periodStart ?? new Date().toISOString().slice(0, 10),
        cycleLength: cycle.averageLength,
        periodLength: cycle.periodLength,
        periodStarts: cycle.cycles.map((item) => item.startDate),
      },
      trackingPreferences: legacyData.profile?.trackingPreferences ?? ["cycle", "pain", "mood", "energy", "sleep", "nutrition", "workout", "intimacy"],
      additionalMode: legacyData.profile?.additionalMode ?? "none",
      pinEnabled: legacyData.profile?.pinEnabled ?? false,
      hiddenNotifications: legacyData.profile?.hiddenNotifications ?? false,
      privateMarks: legacyData.profile?.privateMarks ?? true,
    },
    checkIns: {
      ...legacyData.checkIns,
      ...checkInsFromStore,
    },
    waterLog,
    walkingLog,
    weightLog,
    onboardingCompleted: true,
  };
}
