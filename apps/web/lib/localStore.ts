import type { CheckInState, OnboardingState } from "@/lib/recommendations";

export const miraLocalStorageKey = "mira:local-data";
export const miraLocalDataVersion = 1;

export type DailyCheckInRecord = {
  date: string;
  savedAt: string;
  value: CheckInState;
};

export type WorkoutLog = {
  id: string;
  date: string;
  status: "completed" | "skipped" | "recovery";
  title: string;
  durationMinutes?: number;
  note?: string;
};

export type MealLog = {
  id: string;
  date: string;
  label: string;
  source: "manual" | "photo-demo" | "photo-ai";
  energyKcal?: { min: number; max: number };
  confidence?: number;
  note?: string;
};

export type DailyReflection = {
  date: string;
  energyAfter?: number;
  painLevel?: number;
  note?: string;
};

export type PlanFeedback = {
  date: string;
  value: "useful" | "too_much" | "too_little" | "not_relevant";
};

export type MiraLocalData = {
  version: typeof miraLocalDataVersion;
  profile?: OnboardingState;
  checkIns: Record<string, DailyCheckInRecord>;
  workouts: WorkoutLog[];
  meals: MealLog[];
  notes: Record<string, string>;
  reflections: Record<string, DailyReflection>;
  planFeedback: Record<string, PlanFeedback>;
};

export function createEmptyMiraLocalData(): MiraLocalData {
  return {
    version: miraLocalDataVersion,
    checkIns: {},
    workouts: [],
    meals: [],
    notes: {},
    reflections: {},
    planFeedback: {}
  };
}

export function localDateKey(date = new Date()): string {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 10);
}

export function readMiraLocalData(): MiraLocalData {
  if (typeof window === "undefined") return createEmptyMiraLocalData();

  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(miraLocalStorageKey) ?? "null");
    return parseMiraLocalData(parsed) ?? createEmptyMiraLocalData();
  } catch {
    return createEmptyMiraLocalData();
  }
}

export function writeMiraLocalData(value: MiraLocalData): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(miraLocalStorageKey, JSON.stringify(value));
}

export function clearMiraLocalData(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(miraLocalStorageKey);
}

export function readLegacyOnboardingProfile(): OnboardingState | undefined {
  if (typeof window === "undefined") return undefined;

  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem("mira:onboarding") ?? "null");
    return isObject(parsed) && isOnboardingState(parsed.profile) ? parsed.profile : undefined;
  } catch {
    return undefined;
  }
}

function parseMiraLocalData(value: unknown): MiraLocalData | undefined {
  if (!isObject(value) || value.version !== miraLocalDataVersion) return undefined;

  const checkIns = parseCheckIns(value.checkIns);
  if (!checkIns) return undefined;

  return {
    version: miraLocalDataVersion,
    profile: isOnboardingState(value.profile) ? value.profile : undefined,
    checkIns,
    workouts: parseArray(value.workouts, isWorkoutLog),
    meals: parseArray(value.meals, isMealLog),
    notes: parseStringRecord(value.notes),
    reflections: parseReflections(value.reflections),
    planFeedback: parsePlanFeedback(value.planFeedback)
  };
}

function parseCheckIns(value: unknown): Record<string, DailyCheckInRecord> | undefined {
  if (!isObject(value)) return undefined;

  const entries = Object.entries(value);
  if (!entries.every(([date, entry]) => isDateKey(date) && isDailyCheckInRecord(entry))) return undefined;
  return Object.fromEntries(entries) as Record<string, DailyCheckInRecord>;
}

function parseStringRecord(value: unknown): Record<string, string> {
  if (!isObject(value)) return {};
  return Object.entries(value).reduce<Record<string, string>>((result, [date, note]) => {
    if (isDateKey(date) && typeof note === "string") result[date] = note;
    return result;
  }, {});
}

function parseReflections(value: unknown): Record<string, DailyReflection> {
  if (!isObject(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(([date, reflection]) => isDateKey(date) && isDailyReflection(reflection))
  ) as Record<string, DailyReflection>;
}

function parsePlanFeedback(value: unknown): Record<string, PlanFeedback> {
  if (!isObject(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(([date, feedback]) => isDateKey(date) && isPlanFeedback(feedback))
  ) as Record<string, PlanFeedback>;
}

function parseArray<T>(value: unknown, guard: (item: unknown) => item is T): T[] {
  return Array.isArray(value) ? value.filter(guard) : [];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isOnboardingState(value: unknown): value is OnboardingState {
  return Boolean(
    isObject(value) &&
      typeof value.goal === "string" &&
      Array.isArray(value.focusAreas) &&
      value.focusAreas.every((area) => typeof area === "string") &&
      typeof value.periodStart === "string" &&
      typeof value.cycleLength === "number" &&
      typeof value.cycleRegularity === "string" &&
      typeof value.trainingPlace === "string" &&
      typeof value.level === "string" &&
      typeof value.workoutsPerWeek === "number" &&
      typeof value.sleepQuality === "string" &&
      typeof value.stressLevel === "number" &&
      typeof value.activityLevel === "string"
  );
}

function isDailyCheckInRecord(value: unknown): value is DailyCheckInRecord {
  return Boolean(
    isObject(value) &&
      typeof value.date === "string" &&
      typeof value.savedAt === "string" &&
      isCheckInState(value.value)
  );
}

function isCheckInState(value: unknown): value is CheckInState {
  return Boolean(
    isObject(value) &&
      typeof value.energy === "number" &&
      typeof value.sleep === "string" &&
      typeof value.stress === "number" &&
      typeof value.mood === "number" &&
      typeof value.painLevel === "number" &&
      Array.isArray(value.painAreas) &&
      value.painAreas.every((area) => typeof area === "string") &&
      typeof value.workload === "string" &&
      Array.isArray(value.symptoms) &&
      value.symptoms.every((symptom) => typeof symptom === "string") &&
      typeof value.note === "string"
  );
}

function isWorkoutLog(value: unknown): value is WorkoutLog {
  return Boolean(
    isObject(value) &&
      typeof value.id === "string" &&
      typeof value.date === "string" &&
      (value.status === "completed" || value.status === "skipped" || value.status === "recovery") &&
      typeof value.title === "string" &&
      (value.durationMinutes === undefined || typeof value.durationMinutes === "number") &&
      (value.note === undefined || typeof value.note === "string")
  );
}

function isMealLog(value: unknown): value is MealLog {
  return Boolean(
    isObject(value) &&
      typeof value.id === "string" &&
      typeof value.date === "string" &&
      typeof value.label === "string" &&
      (value.source === "manual" || value.source === "photo-demo" || value.source === "photo-ai") &&
      (value.energyKcal === undefined || isEnergyRange(value.energyKcal)) &&
      (value.confidence === undefined || (typeof value.confidence === "number" && value.confidence >= 0 && value.confidence <= 1)) &&
      (value.note === undefined || typeof value.note === "string")
  );
}

function isEnergyRange(value: unknown): value is { min: number; max: number } {
  return Boolean(
    isObject(value) &&
      typeof value.min === "number" &&
      typeof value.max === "number" &&
      Number.isFinite(value.min) &&
      Number.isFinite(value.max) &&
      value.min >= 0 &&
      value.min <= value.max
  );
}

function isDailyReflection(value: unknown): value is DailyReflection {
  return Boolean(
    isObject(value) &&
      typeof value.date === "string" &&
      (value.energyAfter === undefined || typeof value.energyAfter === "number") &&
      (value.painLevel === undefined || typeof value.painLevel === "number") &&
      (value.note === undefined || typeof value.note === "string")
  );
}

function isPlanFeedback(value: unknown): value is PlanFeedback {
  return Boolean(
    isObject(value) &&
      typeof value.date === "string" &&
      (value.value === "useful" || value.value === "too_much" || value.value === "too_little" || value.value === "not_relevant")
  );
}
