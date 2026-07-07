export type RepositoryResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: RepositoryError };

export interface RepositoryError {
  code: "storage_unavailable" | "parse_error" | "validation_error" | "unknown";
  message: string;
}

export type TrackerPreference =
  | "cycle"
  | "wellbeing"
  | "mood"
  | "energy"
  | "water"
  | "sleep"
  | "pain"
  | "symptoms"
  | "basal_temperature"
  | "discharge"
  | "activity"
  | "food"
  | "calories";

export type ThemeMode = "light" | "dark" | "system";

export interface UserProfile {
  id: string;
  displayName?: string;
  onboardingCompleted: boolean;
  goal?: "understand_cycle" | "prepare_period" | "track_wellbeing" | "understand_symptoms" | "try";
  lastPeriodStart?: string;
  periodStartUnknown?: boolean;
  cycleRegularity?: "regular" | "sometimes_changes" | "unpredictable" | "unknown";
  factors: string[];
  trackerPreferences: TrackerPreference[];
  createdAt: string;
  updatedAt: string;
}

export interface Cycle {
  id: string;
  startDate: string;
  endDate?: string;
  periodLength?: number;
  source: "user" | "seed" | "migration";
  createdAt: string;
  updatedAt: string;
}

export interface PeriodEntry {
  id: string;
  date: string;
  state: "started" | "continued" | "ended" | "spotting" | "unusual_bleeding";
  createdAt: string;
}

export interface CheckIn {
  value: "good" | "normal" | "not_great" | "hard";
  note?: string;
}

export interface DailyEntry {
  id: string;
  date: string;
  checkIn?: CheckIn;
  period?: PeriodEntry;
  waterMl?: number;
  energy?: "low" | "normal" | "high";
  sleep?: {
    quality: "good" | "normal" | "poor";
    hours?: number;
  };
  pain?: {
    location?: string;
    intensity: 1 | 2 | 3 | 4 | 5;
    affectedLife?: "none" | "slightly" | "moderately" | "cancelled_plans" | "bedridden";
  };
  mood?: "calm" | "good" | "sensitive" | "irritated" | "anxious" | "sad" | "angry";
  context: string[];
  symptoms: string[];
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HealthSettings {
  themeMode: ThemeMode;
  waterTargetMl: number;
  trackerPreferences: TrackerPreference[];
  demoDataEnabled: boolean;
  notificationsMode: "important_only" | "custom" | "off";
  reminders: {
    periodWindow: boolean;
    cycleStartConfirm: boolean;
    water: boolean;
    sleep: boolean;
    basalTemperature: boolean;
    weeklyInsight: boolean;
    checkIn: boolean;
  };
  privacy: {
    pinEnabled: boolean;
    biometricsEnabled: boolean;
    exportNoticeAcceptedAt?: string;
  };
  basalTemperature: {
    enabled: boolean;
    unit: "celsius" | "fahrenheit";
  };
  customSymptoms: string[];
  createdAt: string;
  updatedAt: string;
}

export interface HealthSnapshot {
  schemaVersion: number;
  profile: UserProfile | null;
  cycles: Cycle[];
  dailyEntries: DailyEntry[];
  settings: HealthSettings;
}

export interface HealthRepository {
  getSnapshot(): Promise<RepositoryResult<HealthSnapshot>>;
  getProfile(): Promise<RepositoryResult<UserProfile | null>>;
  saveProfile(profile: UserProfile): Promise<RepositoryResult<UserProfile>>;
  listCycles(): Promise<RepositoryResult<Cycle[]>>;
  saveCycle(cycle: Cycle): Promise<RepositoryResult<Cycle>>;
  listDailyEntries(): Promise<RepositoryResult<DailyEntry[]>>;
  saveDailyEntry(entry: DailyEntry): Promise<RepositoryResult<DailyEntry>>;
  getSettings(): Promise<RepositoryResult<HealthSettings>>;
  saveSettings(settings: HealthSettings): Promise<RepositoryResult<HealthSettings>>;
  resetLocalData(): Promise<RepositoryResult<HealthSnapshot>>;
}

export interface SessionState {
  hydrated: boolean;
  onboardingCompleted: boolean;
  themeMode: ThemeMode;
  toast: {
    message: string;
    tone: "success" | "error" | "info";
  } | null;
  bottomSheet: {
    id: "add" | null;
    open: boolean;
  };
}
