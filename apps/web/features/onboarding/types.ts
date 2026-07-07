import type { TrackerPreference } from "../../types/health";

export type OnboardingGoal =
  | "understand_cycle"
  | "prepare_period"
  | "track_wellbeing"
  | "understand_symptoms"
  | "try";

export type PeriodStartMode = "date" | "unknown" | "current" | "irregular";

export type CycleRegularity = "regular" | "sometimes_changes" | "unpredictable" | "unknown";

export type OnboardingFactor =
  | "hormonal_contraception"
  | "changed_contraception"
  | "postpartum"
  | "no_period"
  | "none"
  | "prefer_not";

export type InitialCheckIn = "good" | "normal" | "not_great" | "hard";

export interface OnboardingDraft {
  goal: OnboardingGoal | null;
  periodStartMode: PeriodStartMode | null;
  lastPeriodStart: string;
  regularity: CycleRegularity | null;
  factors: OnboardingFactor[];
  trackers: TrackerPreference[];
  initialCheckIn: InitialCheckIn | null;
}

export interface OnboardingOption<T extends string> {
  id: T;
  label: string;
  description?: string;
}
