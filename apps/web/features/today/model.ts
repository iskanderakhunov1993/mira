import type { DailyEntry, TrackerPreference } from "../../types/health";
import { buildCycleSummary } from "../cycle/model.ts";
import type { TodaySource, TodayViewModel } from "./types";

function toDateKey(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function formatDate(date: Date) {
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long", weekday: "long" });
}

function entryForDate(entries: DailyEntry[], date: string) {
  return entries.find((entry) => entry.date === date);
}

function pickQuickTracker(preferences: TrackerPreference[], todayEntry: DailyEntry | undefined): TodayViewModel["quickTracker"] {
  if (preferences.includes("water")) {
    return {
      type: "water",
      label: "Вода",
      valueLabel: todayEntry?.waterMl ? `${todayEntry.waterMl} мл` : "ещё не отмечено",
      actionLabel: "+250 мл",
    };
  }

  if (preferences.includes("sleep")) {
    return {
      type: "sleep",
      label: "Сон",
      valueLabel: todayEntry?.sleep?.quality ? `сон: ${qualityLabel(todayEntry.sleep.quality)}` : "ещё не отмечено",
      actionLabel: "Отметить сон",
    };
  }

  return {
    type: "basal_temperature",
    label: "Базальная температура",
    valueLabel: "ещё не отмечено",
    actionLabel: "Добавить",
  };
}

function qualityLabel(value: NonNullable<DailyEntry["sleep"]>["quality"]) {
  if (value === "good") return "хорошо";
  if (value === "poor") return "плохо";
  return "обычно";
}

function checkInLabel(value: TodayViewModel["checkIn"]) {
  if (value === "good") return "Хорошо";
  if (value === "normal") return "Обычно";
  if (value === "not_great") return "Не очень";
  if (value === "hard") return "Тяжело";
  return null;
}

function formatRange(start: string, end: string) {
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  const sameMonth = startDate.getMonth() === endDate.getMonth();
  const startLabel = startDate.toLocaleDateString("ru-RU", { day: "numeric", month: sameMonth ? undefined : "long" });
  const endLabel = endDate.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  return `${startLabel}–${endLabel}`;
}

export function buildTodayViewModel({ profile, settings, cycles = [], entries, now = new Date() }: TodaySource): TodayViewModel {
  const today = toDateKey(now);
  const todayEntry = entryForDate(entries, today);
  const dateLabel = formatDate(now);
  const cycle = buildCycleSummary({ profile, cycles, entries, now });

  if (!profile) {
    return {
      dateLabel,
      todayKey: today,
      cycleDay: null,
      cycleBadge: "без данных",
      cardState: "empty",
      cardTitle: "Мы начинаем узнавать ваш ритм",
      cardBody: "Можно пройти короткую настройку или просто отметить самочувствие за сегодня.",
      checkIn: todayEntry?.checkIn?.value ?? null,
      quickTracker: pickQuickTracker(settings.trackerPreferences, todayEntry),
      insight: null,
      recommendation: "Начните с одного короткого check-in. Этого достаточно для первого дня.",
      hasProfile: false,
    };
  }

  const cycleDay = cycle.cycleDay;
  const periodStartedToday = Boolean(todayEntry?.period?.state === "started" || cycle.lastPeriodStart === today);
  const isLongCycle = cycle.isDelayed;
  const isPeriodSoon = Boolean(cycle.daysUntilPeriod !== null && cycle.daysUntilPeriod > 0 && cycle.daysUntilPeriod <= 5);

  let cardState: TodayViewModel["cardState"] = "ordinary";
  let cardTitle = "Обычный день";
  let cardBody = "Сегодня можно просто отметить самочувствие и оставить Mira ещё один факт о ритме.";

  if (!cycleDay) {
    cardState = "empty";
    cardTitle = "Мы начинаем узнавать ваш ритм";
    cardBody = "Дата последних месячных не указана, поэтому Mira пока не строит прогноз.";
  } else if (periodStartedToday) {
    cardState = "period_started";
    cardTitle = "Сегодня начался новый цикл";
    cardBody = "Если это верно, отметка уже поможет Mira точнее понимать длительность цикла.";
  } else if (isLongCycle) {
    cardState = "long_cycle";
    cardTitle = cycle.delayDays ? `Задержка ${cycle.delayDays} дн.` : "Этот цикл длиннее вашего привычного диапазона";
    cardBody = `Mira показывает это как наблюдение, не как диагноз. Основано на ${cycle.sampleSize} завершённых циклах. Если есть тревожные симптомы, consider discussing this with a qualified clinician.`;
  } else if (isPeriodSoon) {
    cardState = "period_soon";
    cardTitle = cycle.forecastRange
      ? `Месячные могут начаться ${formatRange(cycle.forecastRange.start, cycle.forecastRange.end)}`
      : `До менструации примерно ${cycle.daysUntilPeriod} дней`;
    cardBody = `Прогноз ${cycle.reliability === "high" ? "уже опирается на вашу историю" : "пока ориентировочный"}. Основано на ${cycle.sampleSize} завершённых циклах.`;
  }

  const insight = entries.length >= 2
    ? {
        title: "Mira заметила",
        body: todayEntry?.checkIn ? `Сегодня уже отмечено: ${checkInLabel(todayEntry.checkIn.value)}.` : "Чем регулярнее короткие отметки, тем спокойнее будут будущие наблюдения.",
        sample: `${entries.length} записей`,
      }
    : null;

  return {
    dateLabel,
    todayKey: today,
    cycleDay,
    cycleBadge: cycleDay ? `день ${cycleDay}` : "без даты цикла",
    cardState,
    cardTitle,
    cardBody,
    checkIn: todayEntry?.checkIn?.value ?? null,
    quickTracker: pickQuickTracker(settings.trackerPreferences, todayEntry),
    insight,
    recommendation: cycleDay && todayEntry?.period ? "Если боль усиливается, снизьте интенсивность нагрузки сегодня." : "Одной короткой отметки сегодня достаточно.",
    hasProfile: true,
  };
}

export function mergeTodayEntry(entries: DailyEntry[], entry: DailyEntry) {
  const existing = entries.find((item) => item.id === entry.id || item.date === entry.date);
  if (!existing) return entry;

  return {
    ...existing,
    ...entry,
    checkIn: entry.checkIn ?? existing.checkIn,
    period: entry.period ?? existing.period,
    waterMl: entry.waterMl ?? existing.waterMl,
    sleep: entry.sleep ?? existing.sleep,
    symptoms: Array.from(new Set([...(existing.symptoms ?? []), ...(entry.symptoms ?? [])])),
    createdAt: existing.createdAt,
  };
}
