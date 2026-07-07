import type { CheckIn, Cycle, DailyEntry, HealthSettings, TrackerPreference, UserProfile } from "../../types/health";

export type TodayCardState = "empty" | "ordinary" | "period_soon" | "period_started" | "long_cycle";

export interface TodayViewModel {
  dateLabel: string;
  todayKey: string;
  cycleDay: number | null;
  cycleBadge: string;
  cardState: TodayCardState;
  cardTitle: string;
  cardBody: string;
  checkIn: CheckIn["value"] | null;
  quickTracker: {
    type: Extract<TrackerPreference, "water" | "sleep" | "basal_temperature">;
    label: string;
    valueLabel: string;
    actionLabel: string;
  };
  insight: {
    title: string;
    body: string;
    sample: string;
  } | null;
  recommendation: string;
  hasProfile: boolean;
}

export interface TodaySource {
  profile: UserProfile | null;
  settings: HealthSettings;
  cycles?: Cycle[];
  entries: DailyEntry[];
  now?: Date;
}
