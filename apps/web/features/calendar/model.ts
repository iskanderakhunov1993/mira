import type { CalendarDayKind, CalendarSource, CalendarViewModel, CycleForecast } from "./types";
import type { DailyEntry } from "../../types/health";
import {
  addDays,
  buildCycleSummary,
  completedCycleLengths,
  dateKey,
  diffDays,
  median,
  uniquePeriodStarts,
} from "../cycle/model.ts";

export { completedCycleLengths, dateKey, median, uniquePeriodStarts };

function forecastFor(source: CalendarSource): CycleForecast {
  const summary = buildCycleSummary(source);

  if (summary.forecastStatus === "empty") {
    return {
      status: "empty",
      text: "Пока нет подтверждённых стартов месячных. Mira не строит прогноз.",
      reliability: "low",
      sampleSize: 0,
      medianLength: null,
      range: null,
    };
  }

  if (summary.forecastStatus === "irregular") {
    return {
      status: "irregular",
      text: "Этот цикл меняется сильнее обычного, поэтому Mira показывает более широкий диапазон.",
      reliability: summary.reliability,
      sampleSize: summary.sampleSize,
      medianLength: summary.medianLength,
      range: summary.forecastRange,
    };
  }

  if (summary.forecastStatus === "delayed") {
    return {
      status: "predicted",
      text: summary.delayDays === 1 ? "Есть задержка 1 день." : `Есть задержка ${summary.delayDays} дн.`,
      reliability: summary.reliability,
      sampleSize: summary.sampleSize,
      medianLength: summary.medianLength,
      range: summary.forecastRange,
    };
  }

  return {
    status: "predicted",
    text: summary.forecastRange
      ? `Месячные могут начаться примерно ${formatRange(summary.forecastRange.start, summary.forecastRange.end)}.`
      : "Mira пока уточняет прогноз.",
    reliability: summary.reliability,
    sampleSize: summary.sampleSize,
    medianLength: summary.medianLength,
    range: summary.forecastRange,
  };
}

function formatRange(start: string, end: string) {
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  const sameMonth = startDate.getMonth() === endDate.getMonth();
  const startLabel = startDate.toLocaleDateString("ru-RU", { day: "numeric", month: sameMonth ? undefined : "long" });
  const endLabel = endDate.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  return `${startLabel}–${endLabel}`;
}

function entryLabels(entry: DailyEntry | undefined) {
  if (!entry) return [];
  const labels: string[] = [];
  if (entry.period) labels.push(periodLabel(entry.period.state));
  if (entry.checkIn) labels.push("Самочувствие");
  if (entry.waterMl) labels.push(`Вода ${entry.waterMl} мл`);
  if (entry.energy) labels.push("Энергия");
  if (entry.sleep) labels.push("Сон");
  if (entry.pain) labels.push(`Боль ${entry.pain.intensity}/5`);
  if (entry.mood) labels.push("Настроение");
  if (entry.symptoms.length) labels.push(`Симптомы: ${entry.symptoms.slice(0, 2).join(", ")}`);
  if (entry.context.length) labels.push(`Факторы: ${entry.context.slice(0, 2).join(", ")}`);
  return labels;
}

function periodLabel(state: NonNullable<DailyEntry["period"]>["state"]) {
  if (state === "started") return "Месячные начались";
  if (state === "continued") return "Месячные продолжаются";
  if (state === "ended") return "Месячные закончились";
  if (state === "spotting") return "Мазня";
  return "Необычное кровотечение";
}

export function buildCalendarViewModel(source: CalendarSource): CalendarViewModel {
  const starts = uniquePeriodStarts(source);
  const forecast = forecastFor(source);
  const today = dateKey(source.now ?? new Date());
  const year = source.monthDate.getFullYear();
  const month = source.monthDate.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const mondayOffset = (first.getDay() + 6) % 7;
  const entriesByDate = new Map(source.entries.map((entry) => [entry.date, entry]));
  const confirmedPeriodDates = new Set(source.entries.filter((entry) => entry.period).map((entry) => entry.date));
  const predictedDates = new Set<string>();

  if (forecast.range) {
    const total = diffDays(forecast.range.start, forecast.range.end);
    for (let offset = 0; offset <= total; offset += 1) predictedDates.add(addDays(forecast.range.start, offset));
  }

  const days = [
    ...Array.from({ length: mondayOffset }, () => ({
      date: null,
      dayNumber: null,
      kind: "empty" as const,
      hasEntry: false,
      isSelected: false,
    })),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const dayNumber = index + 1;
      const cellDate = dateKey(new Date(year, month, dayNumber));
      const hasEntry = entriesByDate.has(cellDate);
      const kind: CalendarDayKind = cellDate === today
        ? "today"
        : confirmedPeriodDates.has(cellDate)
          ? "confirmed_period"
          : predictedDates.has(cellDate)
            ? "predicted_period"
            : "normal";
      return {
        date: cellDate,
        dayNumber,
        kind,
        hasEntry,
        isSelected: cellDate === source.selectedDate,
      };
    }),
  ];

  while (days.length % 7 !== 0) {
    days.push({ date: null, dayNumber: null, kind: "empty", hasEntry: false, isSelected: false });
  }

  const selectedEntry = entriesByDate.get(source.selectedDate);
  const selectedDate = new Date(`${source.selectedDate}T00:00:00`);

  return {
    monthLabel: source.monthDate.toLocaleDateString("ru-RU", { month: "long", year: "numeric" }),
    selectedDate: source.selectedDate,
    days,
    forecast,
    selectedDay: {
      date: source.selectedDate,
      title: selectedDate.toLocaleDateString("ru-RU", { day: "numeric", month: "long" }),
      entries: entryLabels(selectedEntry),
    },
    history: starts.slice(-6).reverse().map((start, index, reversed) => {
      const nextStart = starts[starts.indexOf(start) + 1];
      return {
        id: `cycle-${start}-${index}-${reversed.length}`,
        startDate: start,
        nextStartDate: nextStart,
        length: nextStart ? diffDays(start, nextStart) : undefined,
      };
    }),
  };
}
