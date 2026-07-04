import type { CareState, CycleState, LogState, SettingsState, UIState, UserState } from "./types";

export const initialUserState: UserState = {
  name: "Mira",
  age: 0,
  trackingMonths: 0,
  totalCycles: 0,
};

export const initialCycleState: CycleState = {
  averageLength: 28,
  periodLength: 5,
  lastPeriodStart: null,
  cycles: [],
  currentDay: 1,
  phase: "menstrual",
  daysUntilPeriod: 0,
};

export const initialLogState: LogState = {
  dailyLogs: [],
  currentDate: new Date().toISOString().slice(0, 10),
};

export const initialCareState: CareState = {
  water: {
    current: 0,
    target: 2,
  },
  vitamins: {
    magnesium: false,
    omega3: false,
    zinc: false,
  },
  weight: {
    current: null,
    history: [],
  },
  activity: {
    walking: null,
    workout: null,
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
    { id: "streak-7", title: "7 дней подряд", description: "Отмечай состояние неделю", unlocked: false, unlockedDate: null, progress: 0, target: 7 },
    { id: "cycles-3", title: "3 цикла записано", description: "Собери данные за 3 цикла", unlocked: false, unlockedDate: null, progress: 0, target: 3 },
    { id: "streak-30", title: "30 дней подряд", description: "Месяц регулярных отметок", unlocked: false, unlockedDate: null, progress: 0, target: 30 },
  ],
};

export const initialUIState: UIState = {
  isLoading: false,
  isPainModalOpen: false,
  activeTab: "today",
  notifications: [],
};
