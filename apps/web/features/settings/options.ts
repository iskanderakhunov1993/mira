import type { TrackerPreference } from "../../types/health";

export const trackerOptions: Array<{ id: TrackerPreference; label: string }> = [
  { id: "cycle", label: "Цикл" },
  { id: "wellbeing", label: "Самочувствие" },
  { id: "mood", label: "Настроение" },
  { id: "energy", label: "Энергия" },
  { id: "water", label: "Вода" },
  { id: "sleep", label: "Сон" },
  { id: "pain", label: "Боль" },
  { id: "symptoms", label: "Симптомы" },
  { id: "basal_temperature", label: "Базальная температура" },
  { id: "discharge", label: "Выделения" },
  { id: "activity", label: "Активность" },
  { id: "food", label: "Питание" },
  { id: "calories", label: "Калории" },
];

export const reminderOptions = [
  { id: "periodWindow", label: "Ориентировочный период месячных" },
  { id: "cycleStartConfirm", label: "Подтверждение начала цикла" },
  { id: "water", label: "Напоминания воды" },
  { id: "sleep", label: "Сон" },
  { id: "basalTemperature", label: "Базальная температура" },
  { id: "weeklyInsight", label: "Еженедельный инсайт" },
  { id: "checkIn", label: "Мягкий check-in" },
] as const;

export const forbiddenNotificationCopy = [
  "Mira не использует серии, наказания за пропуски, тревожные пуши о задержке, осуждение калорий или рекламу.",
];
