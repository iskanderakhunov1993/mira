import { dateKey, getCheckIn, getDaysUntilPeriod, getWaterEntry } from "./store";
import { getRedFlags, getSexCycleInsight } from "./alerts";
import type { MiraLocalData, PersonalReminderId, PersonalReminderSettings } from "./types";

export type PersonalReminder = {
  id: PersonalReminderId;
  title: string;
  body: string;
  priority: "low" | "medium" | "high";
  action: string;
};

export const personalReminderCatalog: Array<{ id: PersonalReminderId; label: string; desc: string }> = [
  { id: "periodSoon", label: "Скоро месячные", desc: "предупредить за 1–4 дня" },
  { id: "symptoms", label: "Отметь симптомы", desc: "мягкий чек-ин дня" },
  { id: "water", label: "Выпей воды", desc: "если воды сегодня мало" },
  { id: "periodKit", label: "Подготовь аптечку", desc: "средства гигиены, вода, обезболивающее" },
  { id: "pregnancyTest", label: "Сделай тест", desc: "если есть задержка после секса" },
  { id: "pain", label: "Запиши боль", desc: "когда боль сильная или повторяется" },
  { id: "doctor", label: "Не забудь врача", desc: "если есть красные флаги" },
];

export const defaultReminderSettings: PersonalReminderSettings = {
  enabled: true,
  quietText: true,
  items: {
    periodSoon: true,
    symptoms: true,
    water: true,
    periodKit: true,
    pregnancyTest: true,
    pain: true,
    doctor: true,
  },
};

export function getReminderSettings(data: MiraLocalData): PersonalReminderSettings {
  return {
    ...defaultReminderSettings,
    ...data.profile?.reminders,
    items: {
      ...defaultReminderSettings.items,
      ...(data.profile?.reminders?.items ?? {}),
    },
  };
}

export function getPersonalReminders(data: MiraLocalData): PersonalReminder[] {
  const profile = data.profile;
  if (!profile) return [];

  const settings = getReminderSettings(data);
  if (!settings.enabled) return [];

  const enabled = (id: PersonalReminderId) => settings.items[id];
  const today = getCheckIn(data);
  const water = getWaterEntry(data);
  const daysUntil = getDaysUntilPeriod(profile);
  const redFlags = getRedFlags(data);
  const sexInsight = getSexCycleInsight(data);
  const reminders: PersonalReminder[] = [];

  if (enabled("periodSoon") && daysUntil >= 1 && daysUntil <= 4) {
    reminders.push({
      id: "periodSoon",
      title: daysUntil === 1 ? "Месячные могут начаться завтра" : `Месячные примерно через ${daysUntil} дн.`,
      body: "Mira мягко напомнит подготовиться, чтобы не держать это в голове.",
      priority: "medium",
      action: "Проверить план",
    });
  }

  if (enabled("symptoms") && !today) {
    reminders.push({
      id: "symptoms",
      title: "Отметь состояние",
      body: "10 секунд: боль, настроение, энергия и сон. Так Mira точнее увидит, что повторяется.",
      priority: "low",
      action: "Отметить",
    });
  }

  if (enabled("water") && (water?.glasses ?? 0) < 3) {
    reminders.push({
      id: "water",
      title: "Выпей воды",
      body: "Небольшой стакан сейчас лучше, чем вспоминать вечером.",
      priority: "low",
      action: "Добавить воду",
    });
  }

  if (enabled("periodKit") && daysUntil >= 0 && daysUntil <= 3) {
    reminders.push({
      id: "periodKit",
      title: "Проверь аптечку",
      body: "Прокладки/тампоны, привычное обезболивающее, вода, салфетки и запасное бельё.",
      priority: daysUntil <= 1 ? "high" : "medium",
      action: "Открыть аптечку",
    });
  }

  if (enabled("pregnancyTest") && sexInsight?.nextStep.toLowerCase().includes("тест")) {
    reminders.push({
      id: "pregnancyTest",
      title: "Напоминание о тесте",
      body: sexInsight.nextStep,
      priority: "high",
      action: "Посмотреть совет",
    });
  }

  if (enabled("pain") && today?.pain?.level === "strong") {
    reminders.push({
      id: "pain",
      title: "Запиши боль",
      body: "Отметь уровень, место и что помогло. Это важно для отчёта врачу, если повторится.",
      priority: "medium",
      action: "Записать",
    });
  }

  if (enabled("doctor") && redFlags.length > 0) {
    reminders.push({
      id: "doctor",
      title: "Не забудь врача",
      body: redFlags[0].body,
      priority: "high",
      action: "Открыть отчёт",
    });
  }

  return reminders.sort((a, b) => {
    const score = { high: 3, medium: 2, low: 1 };
    return score[b.priority] - score[a.priority];
  });
}

export function getNotificationCopy(reminder: PersonalReminder, quietText: boolean): { title: string; body: string } {
  if (!quietText) return { title: reminder.title, body: reminder.body };
  return {
    title: "Mira",
    body: reminder.id === "water" ? "Мягкое напоминание на сегодня." : "Есть короткая подсказка для тебя.",
  };
}
