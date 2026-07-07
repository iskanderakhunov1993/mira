import type { DailyEntry } from "../../types/health";

export type AddAction =
  | "period"
  | "wellbeing"
  | "water"
  | "energy"
  | "sleep"
  | "pain"
  | "mood"
  | "symptom"
  | "other";

export type PeriodAction = NonNullable<DailyEntry["period"]>["state"];
export type WellbeingValue = NonNullable<DailyEntry["checkIn"]>["value"];
export type WaterAmount = 250 | 500 | 750 | "custom";
export type EnergyValue = NonNullable<DailyEntry["energy"]>;
export type SleepQuality = NonNullable<DailyEntry["sleep"]>["quality"];
export type MoodValue = NonNullable<DailyEntry["mood"]>;

export interface AddDraft {
  action: AddAction | null;
  periodState: PeriodAction;
  wellbeing: WellbeingValue;
  waterAmount: WaterAmount;
  customWaterMl: string;
  energy: EnergyValue;
  sleepQuality: SleepQuality;
  sleepHours: string;
  painLocation: string;
  painIntensity: 1 | 2 | 3 | 4 | 5;
  painAffectedLife: NonNullable<DailyEntry["pain"]>["affectedLife"];
  mood: MoodValue;
  symptom: string;
  customSymptom: string;
  context: string;
  note: string;
}
