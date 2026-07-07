import type { Cycle, DailyEntry, UserProfile } from "../../types/health";

export interface BodyRhythm {
  averageCycleLength: number | null;
  cycleRange: string;
  averagePeriodLength: number | null;
  lastCycle: string;
  completedCycles: number;
}

export interface BodyInsight {
  title: string;
  body: string;
  sample: string;
}

export interface BodyChange {
  label: string;
  value: string;
}

export interface DoctorSummary {
  period: string;
  cycleDates: string[];
  cycleLengths: number[];
  periodEntries: DailyEntry[];
  painEntries: DailyEntry[];
  symptomEntries: DailyEntry[];
  moodEnergyEntries: DailyEntry[];
  sleepEntries: DailyEntry[];
  noteEntries: DailyEntry[];
  lifeImpactEntries: DailyEntry[];
  observations: string[];
  questions: string[];
}

export interface DoctorSummaryOptions {
  cycleDates: boolean;
  cycleLengths: boolean;
  periodEntries: boolean;
  pain: boolean;
  symptoms: boolean;
  moodEnergy: boolean;
  sleep: boolean;
  notes: boolean;
}

export interface BodyViewModel {
  rhythm: BodyRhythm;
  insights: BodyInsight[];
  changes: BodyChange[];
  importantChanges: BodyChange[];
  comparison: BodyChange[];
  doctorSummary: DoctorSummary;
  hasEnoughForInsights: boolean;
}

export interface BodySource {
  profile: UserProfile | null;
  cycles: Cycle[];
  entries: DailyEntry[];
  now?: Date;
}
