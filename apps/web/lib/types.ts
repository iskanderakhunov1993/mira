/* ── Mira Data Types ── */

// Cycle
export type CyclePhase = "menstruation" | "follicular" | "ovulation" | "luteal";

export type CycleConfig = {
  periodStart: string; // ISO date of last period start (онбординг / последний якорь)
  cycleLength: number; // days, default 28 (онбординг-оценка, fallback)
  periodLength: number; // days, default 5
  periodStarts?: string[]; // ISO даты реальных стартов месячных (история, по возрастанию)
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
  bleedingAfter?: boolean;
  showInCalendar?: boolean;
};

export type PmsSymptom = string;
export type PmsEntry = {
  symptoms: PmsSymptom[];
};

export type NoteEntry = {
  text: string;
};

export type BadSymptom =
  | "abdominal_pain"
  | "heavy_bleeding"
  | "dizziness"
  | "fainting"
  | "nausea"
  | "no_energy"
  | "anxiety"
  | "crying"
  | "sharp_pain"
  | "pain_after_sex"
  | "delay"
  | "mid_cycle_bleeding";

export type BadEpisode = {
  id: string;
  savedAt: string;
  symptoms: BadSymptom[];
  severity: "self_care" | "watch" | "doctor";
  summary: string;
  actions: string[];
  watch: string[];
  doctor: string[];
};

export type DelayReason =
  | "sex"
  | "unprotected"
  | "stress"
  | "illness"
  | "weight_change"
  | "travel"
  | "medications"
  | "irregular_cycle";

export type DelayCheck = {
  id: string;
  savedAt: string;
  delayDays: number;
  reasons: DelayReason[];
  summary: string;
  possibleCauses: string[];
  testAdvice: string;
  doctorAdvice: string;
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

export type AppetiteValue = "low" | "normal" | "high";
export type LibidoValue = "low" | "normal" | "high";
export type SymptomLog = {
  appetite?: AppetiteValue;
  sweetCraving?: boolean;
  libido?: LibidoValue;
  anxiety?: boolean;
  medications?: string[];
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
  badEpisodes?: BadEpisode[];
  delayChecks?: DelayCheck[];
  discharge?: string;
  stress?: string;
  symptomLog?: SymptomLog;
};

// Workout
export type ActivityType = "rest" | "breathing" | "stretching" | "walk" | "yoga" | "light_strength" | "moderate_strength" | "light_cardio" | "run" | "hiit" | "pilates" | "swim" | "dance";
export type WorkoutLocation = "gym" | "home" | "outdoor";
export type WorkoutEquipment = "full" | "minimal" | "none";
export type WorkoutLog = {
  id: string;
  date: string;
  status: "completed" | "skipped" | "lighter";
  activityType: ActivityType;
  durationMinutes?: number;
  title: string;
  exercises?: GeneratedExercise[];
  location?: WorkoutLocation;
};

export type GeneratedExercise = {
  name: string;
  sets?: number;
  reps?: string;
  duration?: string;
  rest?: string;
};

export type GeneratedWorkout = {
  id: string;
  title: string;
  duration: string;
  intensity: "light" | "moderate" | "intense";
  exercises: GeneratedExercise[];
  warmup: string;
  cooldown: string;
  phaseNote: string;
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
  madhab?: "hanafi" | "shafii" | "maliki" | "hanbali";
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

// Water tracking
export type WaterEntry = {
  date: string;
  glasses: number;
  goal: number;
};

export type WalkingEntry = {
  date: string;
  steps: number;
  goal: number;
  source?: "manual" | "sync";
};

export type PeriodKitItemId =
  | "pads"
  | "tampons"
  | "cup"
  | "pain_relief"
  | "heating_pad"
  | "wet_wipes"
  | "spare_underwear"
  | "water"
  | "snack";

export type PeriodKitItem = {
  id: PeriodKitItemId;
  checked: boolean;
};

export type PeriodKit = {
  items: PeriodKitItem[];
  updatedAt?: string;
};

// Lab tests — результаты анализов (часть 2 фичи «Анализы»)
export type LabResult = {
  id: string;
  testId: string; // ключ из labCatalog (lib/labs.ts)
  value: number;
  unit: string;
  date: string;   // YYYY-MM-DD — дата сдачи
  note?: string;
};

// Full local data store
export type MiraLocalData = {
  version: number;
  profile?: UserProfile;
  checkIns: Record<string, DailyCheckIn>; // keyed by YYYY-MM-DD
  workouts: WorkoutLog[];
  waterLog?: Record<string, WaterEntry>; // keyed by YYYY-MM-DD
  walkingLog?: Record<string, WalkingEntry>; // keyed by YYYY-MM-DD
  periodKit?: PeriodKit;
  islamicEntries?: Record<string, IslamicEntry>;
  labs?: LabResult[]; // результаты анализов (необяз., обратная совместимость)
  onboardingCompleted: boolean;
};
