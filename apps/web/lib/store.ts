import type { MiraLocalData, DailyCheckIn, WorkoutLog, UserProfile, IslamicEntry, CyclePhase } from "./types";

const STORAGE_KEY = "mira:data";
const DATA_VERSION = 2;

// ── Date helpers ──

export function dateKey(date = new Date()): string {
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return d.toISOString().slice(0, 10);
}

// ── CRUD ──

export function createEmpty(): MiraLocalData {
  return {
    version: DATA_VERSION,
    checkIns: {},
    workouts: [],
    onboardingCompleted: false,
  };
}

export function readData(): MiraLocalData {
  if (typeof window === "undefined") return createEmpty();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmpty();
    const parsed = JSON.parse(raw) as MiraLocalData;
    if (parsed.version !== DATA_VERSION) return createEmpty();
    return parsed;
  } catch {
    return createEmpty();
  }
}

export function writeData(data: MiraLocalData): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearData(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

// ── Check-in helpers ──

export function saveCheckIn(data: MiraLocalData, checkIn: DailyCheckIn): MiraLocalData {
  return {
    ...data,
    checkIns: { ...data.checkIns, [checkIn.date]: checkIn },
  };
}

export function getCheckIn(data: MiraLocalData, date?: string): DailyCheckIn | undefined {
  return data.checkIns[date ?? dateKey()];
}

// ── Workout helpers ──

export function addWorkout(data: MiraLocalData, workout: Omit<WorkoutLog, "id" | "date">): MiraLocalData {
  return {
    ...data,
    workouts: [
      { ...workout, id: `w-${Date.now()}`, date: dateKey() },
      ...data.workouts,
    ],
  };
}

// ── Profile ──

export function saveProfile(data: MiraLocalData, profile: UserProfile): MiraLocalData {
  return { ...data, profile };
}

// ── Islamic entries ──

export function saveIslamicEntry(data: MiraLocalData, date: string, entry: IslamicEntry): MiraLocalData {
  return {
    ...data,
    islamicEntries: { ...data.islamicEntries, [date]: entry },
  };
}

export function getIslamicEntry(data: MiraLocalData, date?: string): IslamicEntry | undefined {
  return data.islamicEntries?.[date ?? dateKey()];
}

export function countQadaDays(data: MiraLocalData): number {
  if (!data.islamicEntries) return 0;
  let missed = 0;
  let madeUp = 0;
  for (const entry of Object.values(data.islamicEntries)) {
    if (entry.fasting === "missed" || entry.fasting === "exempt") missed++;
    if (entry.fasting === "makeup") madeUp++;
  }
  return Math.max(0, missed - madeUp);
}

export function countHaydDays(data: MiraLocalData): number {
  if (!data.islamicEntries) return 0;
  return Object.values(data.islamicEntries).filter(e => e.hayd).length;
}

export function isInHayd(data: MiraLocalData): boolean {
  return !!data.islamicEntries?.[dateKey()]?.hayd;
}

export function isInPurity(data: MiraLocalData): boolean {
  return !!data.islamicEntries?.[dateKey()]?.purity;
}

// ── Cycle calculations ──

export function getCycleDay(profile: UserProfile | undefined): number {
  if (!profile?.cycleConfig.periodStart) return 1;
  const start = new Date(profile.cycleConfig.periodStart);
  const today = new Date();
  const days = Math.max(0, Math.floor((today.getTime() - start.getTime()) / 86_400_000));
  return (days % profile.cycleConfig.cycleLength) + 1;
}

export function getCyclePhase(day: number, periodLength = 5, cycleLength = 28): CyclePhase {
  if (day <= periodLength) return "menstruation";
  if (day <= cycleLength - 16) return "follicular";
  if (day <= cycleLength - 12) return "ovulation";
  return "luteal";
}

export function getPhaseLabel(phase: CyclePhase): string {
  const labels: Record<CyclePhase, string> = {
    menstruation: "Менструация",
    follicular: "Фолликулярная",
    ovulation: "Овуляция",
    luteal: "Лютеиновая",
  };
  return labels[phase];
}

export function getDaysUntilPeriod(profile: UserProfile | undefined): number {
  if (!profile) return 0;
  const day = getCycleDay(profile);
  return Math.max(0, profile.cycleConfig.cycleLength - day);
}
