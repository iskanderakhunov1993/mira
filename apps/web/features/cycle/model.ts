import type { Cycle, DailyEntry, UserProfile } from "../../types/health";

const DAY_MS = 86_400_000;
const DEFAULT_CYCLE_LENGTH = 28;

export type CycleReliability = "low" | "medium" | "high";
export type CycleForecastStatus = "empty" | "predicted" | "irregular" | "delayed";

export interface CycleSource {
  profile: UserProfile | null;
  cycles: Cycle[];
  entries: DailyEntry[];
  now?: Date;
}

export interface CycleForecastRange {
  start: string;
  end: string;
}

export interface CycleSummary {
  starts: string[];
  completedLengths: number[];
  medianLength: number | null;
  sampleSize: number;
  reliability: CycleReliability;
  forecastStatus: CycleForecastStatus;
  forecastRange: CycleForecastRange | null;
  cycleDay: number | null;
  daysUntilPeriod: number | null;
  isDelayed: boolean;
  delayDays: number;
  spread: number;
  lastPeriodStart: string | null;
}

export function dateKey(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export function addDays(date: string, days: number) {
  const next = new Date(`${date}T00:00:00`);
  next.setDate(next.getDate() + days);
  return dateKey(next);
}

export function diffDays(from: string, to: string) {
  return Math.round((new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) / DAY_MS);
}

export function median(numbers: number[]) {
  if (!numbers.length) return null;
  const sorted = [...numbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

export function collapseCloseStarts(starts: string[]) {
  const normalized: string[] = [];

  for (const start of starts.sort()) {
    const previous = normalized[normalized.length - 1];
    if (previous && Math.abs(diffDays(previous, start)) < 10) continue;
    normalized.push(start);
  }

  return normalized;
}

export function uniquePeriodStarts(source: CycleSource) {
  const starts = new Set<string>();
  if (source.profile?.lastPeriodStart) starts.add(source.profile.lastPeriodStart);
  for (const cycle of source.cycles) starts.add(cycle.startDate);
  for (const entry of source.entries) {
    if (entry.period?.state === "started") starts.add(entry.date);
  }
  return collapseCloseStarts(Array.from(starts));
}

export function completedCycleLengths(starts: string[]) {
  const lengths: number[] = [];

  for (let index = 1; index < starts.length; index += 1) {
    const length = diffDays(starts[index - 1], starts[index]);
    if (length >= 15 && length <= 60) lengths.push(length);
  }

  return lengths;
}

export function buildCycleSummary(source: CycleSource): CycleSummary {
  const starts = uniquePeriodStarts(source);
  const completedLengths = completedCycleLengths(starts);
  const sampleSize = completedLengths.length;
  const medianLength = sampleSize ? median(completedLengths) : null;
  const fallbackLength = source.profile?.cycleRegularity === "unpredictable" ? 32 : DEFAULT_CYCLE_LENGTH;
  const effectiveLength = medianLength ?? fallbackLength;
  const today = dateKey(source.now ?? new Date());
  const lastPeriodStart = starts.at(-1) ?? null;
  const spread = completedLengths.length ? Math.max(...completedLengths) - Math.min(...completedLengths) : 0;
  const irregular = source.profile?.cycleRegularity === "unpredictable" || (sampleSize >= 3 && spread > 7);
  const reliability: CycleReliability = sampleSize >= 3 && !irregular ? "high" : sampleSize >= 1 ? "medium" : "low";

  if (!lastPeriodStart) {
    return {
      starts,
      completedLengths,
      medianLength,
      sampleSize,
      reliability: "low",
      forecastStatus: "empty",
      forecastRange: null,
      cycleDay: null,
      daysUntilPeriod: null,
      isDelayed: false,
      delayDays: 0,
      spread,
      lastPeriodStart,
    };
  }

  const daysSinceStart = Math.max(0, diffDays(lastPeriodStart, today));
  const cycleDay = daysSinceStart + 1;
  const isDelayed = cycleDay > effectiveLength;
  const delayDays = isDelayed ? cycleDay - effectiveLength : 0;
  const daysUntilPeriod = isDelayed ? 0 : Math.max(0, effectiveLength - daysSinceStart);
  const margin = irregular ? Math.max(5, Math.ceil(spread / 2), 6) : sampleSize >= 3 ? Math.max(1, Math.ceil(spread / 2)) : 4;
  const center = addDays(lastPeriodStart, effectiveLength);
  const forecastRange = {
    start: addDays(center, -margin),
    end: addDays(center, margin),
  };

  return {
    starts,
    completedLengths,
    medianLength,
    sampleSize,
    reliability,
    forecastStatus: isDelayed ? "delayed" : irregular ? "irregular" : "predicted",
    forecastRange,
    cycleDay,
    daysUntilPeriod,
    isDelayed,
    delayDays,
    spread,
    lastPeriodStart,
  };
}
