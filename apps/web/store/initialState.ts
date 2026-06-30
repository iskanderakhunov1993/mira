import type { CareState, CycleState, LogState, SettingsState, UIState, UserState } from "./types";

export const initialUserState: UserState = {
  name: "Елена",
  age: 52,
  trackingMonths: 3,
  totalCycles: 6,
};

export const initialCycleState: CycleState = {
  averageLength: 35,
  periodLength: 5,
  lastPeriodStart: "2026-06-01",
  cycles: [],
  currentDay: 15,
  phase: "luteal",
  daysUntilPeriod: 3,
};

export const initialLogState: LogState = {
  dailyLogs: [],
  currentDate: new Date().toISOString().slice(0, 10),
};

export const initialCareState: CareState = {
  water: {
    current: 1.5,
    target: 2,
  },
  vitamins: {
    magnesium: true,
    omega3: false,
    zinc: false,
  },
  weight: {
    current: 65.9,
    history: [{ date: "2026-06-30", weight: 65.9 }],
  },
  activity: {
    walking: "little",
    workout: "light",
  },
};

export const initialSettingsState: SettingsState = {
  reminders: {
    water: true,
    log: true,
    vitamins: false,
  },
  privacy: {
    pin: false,
    pinCode: null,
    dataStorage: "device",
  },
  achievements: [
    { id: "streak-7", title: "7 дней подряд", description: "Отмечай состояние неделю", unlocked: true, unlockedDate: "2026-06-07", progress: 7, target: 7 },
    { id: "cycles-3", title: "3 цикла записано", description: "Собери данные за 3 цикла", unlocked: true, unlockedDate: "2026-06-25", progress: 3, target: 3 },
    { id: "streak-30", title: "30 дней подряд", description: "Месяц регулярных отметок", unlocked: false, unlockedDate: null, progress: 25, target: 30 },
  ],
};

export const initialUIState: UIState = {
  isLoading: false,
  isPainModalOpen: false,
  activeTab: "analytics",
  notifications: [],
};
