export type Mood = 'great' | 'calm' | 'sensitive' | 'tired' | 'low';
export type TrackingModule = 'cycle' | 'wellbeing' | 'sleep' | 'body' | 'personal';
export type DailyMetric = 'water' | 'nutrition' | 'steps';
export type ReportOption = 'cycles' | 'pain' | 'symptoms' | 'wellbeing' | 'sleep' | 'lifestyle' | 'measurements' | 'questions' | 'notes' | 'sex';

export type Tab = 'today' | 'diary' | 'calendar' | 'insights' | 'report' | 'articles' | 'profile';

export type Profile = {
  name: string;
  birthDate: string;
  cycleLength: number;
  periodLength: number;
  waterGoalMl: number;
  trackingModules: TrackingModule[];
  dailyMetrics: DailyMetric[];
  showHormonoscope: boolean;
  showCycloscope: boolean;
  reminderEnabled: boolean;
  reminderTime: string;
};

export type DoctorReportDraft = {
  period: '3' | '6' | 'all';
  questions: string;
  included: Record<ReportOption, boolean>;
  updatedAt: string;
};

export type DayEntry = {
  date: string;
  dayRating?: 1 | 2 | 3 | 4 | 5;
  waterMl: number;
  mood?: Mood;
  moods?: string[];
  sleepHours?: number;
  sleepQuality?: 'poor' | 'okay' | 'good';
  appetite?: 'low' | 'normal' | 'high';
  steps?: number;
  calories?: number;
  activity?: 'low' | 'medium' | 'high';
  pain?: 0 | 1 | 2 | 3;
  flow?: 0 | 1 | 2 | 3;
  energy?: 1 | 2 | 3 | 4 | 5;
  hadSex: boolean;
  symptoms: string[];
  symptomsChecked?: boolean;
  symptomSeverity?: Record<string, 1 | 2 | 3>;
  symptomsAffectDailyLife?: boolean;
  discharge?: string[];
  digestion?: string[];
  contextTags?: string[];
  basalTemperature?: number;
  weightKg?: number;
  note: string;
};

export type AppState = {
  onboardingComplete: boolean;
  profile: Profile;
  periodDays: string[];
  entries: Record<string, DayEntry>;
  savedArticles: string[];
  lastBackupAt?: string;
  doctorReportDraft?: DoctorReportDraft;
  insightFeedback?: Record<string, 'helpful' | 'not-helpful'>;
};
