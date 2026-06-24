/* ── Mira Data Types ── */

// Cycle
export type CyclePhase = "menstruation" | "follicular" | "ovulation" | "luteal";

export type CycleConfig = {
  periodStart: string; // ISO date of last period start
  cycleLength: number; // days, default 28
  periodLength: number; // days, default 5
};

// Tracking — 9 categories

export type PeriodIntensity = "light" | "moderate" | "heavy" | "very_heavy";
export type PeriodType = "normal" | "spotting" | "brown" | "clots";
export type PeriodEntry = {
  intensity: PeriodIntensity;
  type?: PeriodType;
};

export type PainKind = "none" | "cramps" | "lower_abdomen" | "headache" | "breast" | "back" | "ovulatory";
export type PainLevel = "light" | "medium" | "strong";
export type PainEntry = {
  kinds: PainKind[];
  level?: PainLevel;
};

export type MoodValue = "normal" | "joy" | "sadness" | "anger" | "anxiety" | "swings";
export type MoodEntry = {
  value: MoodValue;
};

export type EnergyValue = "exhausted" | "low" | "normal" | "high";
export type EnergyEntry = {
  value: EnergyValue;
};

export type SleepQuality = "good" | "normal" | "bad" | "little" | "insomnia";
export type SleepEntry = {
  quality: SleepQuality;
  hours?: number;
};

export type IntimacyProtection = "protected" | "unprotected" | "interrupted" | "masturbation" | "toy";
export type IntimacyFeeling = "good" | "normal" | "discomfort" | "pain";
export type IntimacyEntry = {
  happened: boolean;
  protection?: IntimacyProtection;
  feeling?: IntimacyFeeling;
  showInCalendar?: boolean;
};

export type PmsSymptom = string;
export type PmsEntry = {
  symptoms: PmsSymptom[];
};

export type NoteEntry = {
  text: string;
};

// Meal tracking (simplified, no photo)
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type MealSize = "small" | "medium" | "large";
export type MealComponent = "protein" | "vegetables" | "fruits" | "grains" | "dairy" | "sweets" | "fastfood";
export type MealEntry = {
  type: MealType;
  size: MealSize;
  components: MealComponent[];
  estimatedKcal?: { min: number; max: number };
};

// Daily check-in — all categories for one day
export type DailyCheckIn = {
  date: string; // YYYY-MM-DD
  savedAt: string; // ISO
  period?: PeriodEntry;
  pain?: PainEntry;
  mood?: MoodEntry;
  energy?: EnergyEntry;
  sleep?: SleepEntry;
  intimacy?: IntimacyEntry;
  pms?: PmsEntry;
  meals?: MealEntry[];
  note?: NoteEntry;
};

// Workout
export type ActivityType = "rest" | "breathing" | "stretching" | "walk" | "yoga" | "light_strength" | "moderate_strength" | "light_cardio";
export type WorkoutLog = {
  id: string;
  date: string;
  status: "completed" | "skipped" | "lighter";
  activityType: ActivityType;
  durationMinutes?: number;
  title: string;
};

// Profile
export type ActivityLevel = "low" | "medium" | "high";
export type NutritionGoal = "energy_support" | "observation" | "none";
export type DietaryRestriction = string;

export type UserProfile = {
  name: string;
  email?: string;
  height?: number; // cm
  weight?: number; // kg
  age?: number;
  activityLevel?: ActivityLevel;
  dietaryRestrictions?: DietaryRestriction[];
  nutritionGoal?: NutritionGoal;
  showCalories: boolean;
  cycleConfig: CycleConfig;
  trackingPreferences: TrackingCategory[];
  additionalMode: AdditionalMode;
  pinEnabled: boolean;
  hiddenNotifications: boolean;
  privateMarks: boolean;
};

export type TrackingCategory = "cycle" | "pain" | "mood" | "energy" | "sleep" | "nutrition" | "workout" | "intimacy";

// Additional mode (religious)
export type AdditionalMode = "none" | "islam";

// Islamic mode entries
export type FastingStatus = "fasted" | "missed" | "exempt" | "makeup";
export type IslamicEntry = {
  hayd?: boolean;
  istihadha?: boolean;
  nifas?: boolean;
  purity?: boolean;
  fasting?: FastingStatus;
  ghusl?: boolean;
  note?: string;
};

// Full local data store
export type MiraLocalData = {
  version: number;
  profile?: UserProfile;
  checkIns: Record<string, DailyCheckIn>; // keyed by YYYY-MM-DD
  workouts: WorkoutLog[];
  islamicEntries?: Record<string, IslamicEntry>;
  onboardingCompleted: boolean;
};
