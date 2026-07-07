import type { Cycle, DailyEntry, UserProfile } from "../../types/health";

export type CalendarDayKind = "empty" | "normal" | "today" | "confirmed_period" | "predicted_period";

export interface CalendarDayCell {
  date: string | null;
  dayNumber: number | null;
  kind: CalendarDayKind;
  hasEntry: boolean;
  isSelected: boolean;
}

export interface CycleForecast {
  status: "empty" | "observed" | "predicted" | "irregular";
  text: string;
  reliability: "low" | "medium" | "high";
  sampleSize: number;
  medianLength: number | null;
  range: { start: string; end: string } | null;
}

export interface CalendarCycleHistoryItem {
  id: string;
  startDate: string;
  nextStartDate?: string;
  length?: number;
}

export interface SelectedDaySummary {
  date: string;
  title: string;
  entries: string[];
}

export interface CalendarViewModel {
  monthLabel: string;
  selectedDate: string;
  days: CalendarDayCell[];
  forecast: CycleForecast;
  selectedDay: SelectedDaySummary;
  history: CalendarCycleHistoryItem[];
}

export interface CalendarSource {
  profile: UserProfile | null;
  cycles: Cycle[];
  entries: DailyEntry[];
  monthDate: Date;
  selectedDate: string;
  now?: Date;
}
