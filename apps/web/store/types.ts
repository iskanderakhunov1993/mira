export type CyclePhase = "menstrual" | "follicular" | "ovulatory" | "luteal";
export type ActiveTab = "analytics" | "today" | "care" | "profile";
export type NotificationType = "success" | "error" | "warning" | "info";

export interface UserState {
  name: string;
  age: number;
  email?: string;
  trackingMonths: number;
  totalCycles: number;
}

export interface Cycle {
  id: string;
  startDate: string;
  endDate: string | null;
  length: number;
  periodLength: number;
  symptoms: DailyLog[];
}

export interface CycleState {
  averageLength: number;
  periodLength: number;
  lastPeriodStart: string | null;
  cycles: Cycle[];
  currentDay: number;
  phase: CyclePhase;
  daysUntilPeriod: number;
}

export interface LogState {
  dailyLogs: DailyLog[];
  currentDate: string;
}

export interface DailyLog {
  date: string;
  cycleDay: number;
  symptoms: {
    bleeding: {
      amount: 0 | 1 | 2 | 3;
      pads: number;
      color: "bright" | "dark" | "brown" | "watery" | null;
      clots: "none" | "small" | "large" | null;
    };
    pain: {
      level: 0 | 1 | 2 | 3 | 4 | 5;
      type: "cramping" | "aching" | "sharp" | "cutting" | "dull" | "pulsating" | null;
      location: string[];
      radiation: string[];
      affectedLife: "none" | "slightly" | "moderately" | "cancelled_plans" | "bedridden";
      tookPainkiller: boolean;
      painkillerHelped: boolean | null;
    };
    mood: "great" | "good" | "neutral" | "low" | "anxious" | "irritable" | null;
    energy: "high" | "normal" | "low" | "exhausted" | null;
    sleep: {
      quality: "good" | "normal" | "poor" | null;
      hours: number | null;
      wokeUp: boolean | null;
      wokeUpReason: string[] | null;
    };
    skin: {
      acne: boolean;
      acneCount: number | null;
      dryness: boolean;
      oiliness: boolean;
      hairLoss: boolean;
    };
    libido: "none" | "low" | "medium" | "high" | null;
    context: string[];
    note: string;
  };
  selfCare: {
    water: number;
    calories: number | null;
    protein: number | null;
    fats: number | null;
    carbs: number | null;
    walking: "none" | "little" | "normal" | "much" | null;
    workout: "none" | "light" | "medium" | "heavy" | null;
    weight: number | null;
    vitamins: {
      magnesium: boolean;
      omega3: boolean;
      zinc: boolean;
    };
  };
}

export interface CareState {
  water: {
    current: number;
    target: number;
  };
  vitamins: {
    magnesium: boolean;
    omega3: boolean;
    zinc: boolean;
  };
  weight: {
    current: number | null;
    history: WeightEntry[];
  };
  activity: {
    walking: "none" | "little" | "normal" | "much" | null;
    workout: "none" | "light" | "medium" | "heavy" | null;
  };
}

export interface WeightEntry {
  date: string;
  weight: number;
}

export interface SettingsState {
  reminders: {
    water: boolean;
    log: boolean;
    vitamins: boolean;
  };
  privacy: {
    pin: boolean;
    pinCode: string | null;
    dataStorage: "device" | "cloud";
  };
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedDate: string | null;
  progress: number;
  target: number;
}

export interface UIState {
  isLoading: boolean;
  isPainModalOpen: boolean;
  activeTab: ActiveTab;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  read: boolean;
}

export interface MiraState {
  user: UserState;
  cycle: CycleState;
  logs: LogState;
  care: CareState;
  settings: SettingsState;
  ui: UIState;
}

export interface MiraActions {
  setUser: (user: Partial<UserState>) => void;
  updateTrackingStats: (months: number, cycles: number) => void;
  setCycleLength: (length: number) => void;
  setPeriodLength: (length: number) => void;
  setLastPeriodStart: (date: string) => void;
  addCycle: (cycle: Cycle) => void;
  updateCurrentDay: () => void;
  calculatePhase: (day: number) => CyclePhase;
  calculateDaysUntilPeriod: () => number;
  setDailyLog: (log: DailyLog) => void;
  addDailyLog: (log: DailyLog) => void;
  updateDailyLog: (date: string, updates: Partial<DailyLog>) => void;
  getLogByDate: (date: string) => DailyLog | undefined;
  getLogsByCycle: (cycleId: string) => DailyLog[];
  setWater: (amount: number) => void;
  addWater: (amount: number) => void;
  setVitamin: (name: keyof CareState["vitamins"], has: boolean) => void;
  setWeight: (weight: number) => void;
  setActivity: <T extends keyof CareState["activity"]>(type: T, value: CareState["activity"][T]) => void;
  toggleReminder: (name: keyof SettingsState["reminders"]) => void;
  togglePin: (enabled: boolean, code?: string) => void;
  unlockAchievement: (id: string) => void;
  updateAchievementProgress: (id: string, progress: number) => void;
  setLoading: (isLoading: boolean) => void;
  setActiveTab: (tab: ActiveTab) => void;
  openPainModal: () => void;
  closePainModal: () => void;
  addNotification: (notification: Omit<Notification, "id" | "read">) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
}

export type MiraStore = MiraState & MiraActions;
