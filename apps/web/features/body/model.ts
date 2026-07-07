import type { BodyInsight, BodySource, BodyViewModel, DoctorSummary, DoctorSummaryOptions } from "./types";
import type { Cycle, DailyEntry } from "../../types/health";

const DAY_MS = 86_400_000;

function diffDays(from: string, to: string) {
  return Math.round((new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) / DAY_MS);
}

function average(values: number[]) {
  if (!values.length) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function periodStarts(source: BodySource) {
  const starts = new Set<string>();
  if (source.profile?.lastPeriodStart) starts.add(source.profile.lastPeriodStart);
  for (const cycle of source.cycles) starts.add(cycle.startDate);
  for (const entry of source.entries) if (entry.period?.state === "started") starts.add(entry.date);
  return Array.from(starts).sort();
}

function completedLengths(starts: string[]) {
  const lengths: number[] = [];
  for (let index = 1; index < starts.length; index += 1) {
    const length = diffDays(starts[index - 1], starts[index]);
    if (length >= 15 && length <= 60) lengths.push(length);
  }
  return lengths;
}

function averagePeriodLength(entries: DailyEntry[]) {
  const periodDays = entries.filter((entry) => entry.period);
  if (!periodDays.length) return null;
  const grouped = new Map<string, number>();
  for (const entry of periodDays) {
    const key = entry.date.slice(0, 7);
    grouped.set(key, (grouped.get(key) ?? 0) + 1);
  }
  return average(Array.from(grouped.values()));
}

function countBy<T extends string>(values: T[]) {
  const counts = new Map<T, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return counts;
}

function buildInsights(source: BodySource, lengths: number[]): BodyInsight[] {
  if (lengths.length < 3) return [];
  const entries = source.entries;
  const insights: BodyInsight[] = [];
  const painEntries = entries.filter((entry) => (entry.pain?.intensity ?? 0) >= 3);
  const lowEnergy = entries.filter((entry) => entry.energy === "low");
  const symptomCounts = countBy(entries.flatMap((entry) => entry.symptoms));

  if (painEntries.length >= 2) {
    insights.push({
      title: "Боль повторялась",
      body: "В нескольких записях боль была заметной. Mira показывает это как наблюдение, не как причину.",
      sample: `${painEntries.length} записей`,
    });
  }
  if (lowEnergy.length >= 2) {
    insights.push({
      title: "Энергия снижалась",
      body: "Низкая энергия отмечалась больше одного раза. Это может быть полезно сравнить с фазами цикла позже.",
      sample: `${lowEnergy.length} записей`,
    });
  }

  for (const [symptom, count] of symptomCounts) {
    if (count >= 2) {
      insights.push({
        title: "Симптом повторялся",
        body: `${symptom} встречался в нескольких записях.`,
        sample: `${count} записей`,
      });
      break;
    }
  }

  return insights.slice(0, 3);
}

function buildDoctorSummary(source: BodySource, lengths: number[], observations: string[]): DoctorSummary {
  const entries = source.entries;
  const starts = periodStarts(source);
  const periodEntries = entries.filter((entry) => entry.period);
  const painEntries = entries.filter((entry) => entry.pain);
  const symptomEntries = entries.filter((entry) => entry.symptoms.length > 0);
  const moodEnergyEntries = entries.filter((entry) => entry.mood || entry.checkIn || entry.energy);
  const sleepEntries = entries.filter((entry) => entry.sleep);
  const noteEntries = entries.filter((entry) => entry.note);
  const lifeImpactEntries = entries.filter((entry) => entry.pain?.affectedLife && entry.pain.affectedLife !== "none");
  const from = entries[0]?.date ?? starts[0] ?? "нет данных";
  const to = entries[entries.length - 1]?.date ?? starts[starts.length - 1] ?? "нет данных";

  return {
    period: `${from} — ${to}`,
    cycleDates: starts,
    cycleLengths: lengths,
    periodEntries,
    painEntries,
    symptomEntries,
    moodEnergyEntries,
    sleepEntries,
    noteEntries,
    lifeImpactEntries,
    observations,
    questions: [
      "Какие из этих наблюдений стоит продолжать отслеживать?",
      "Есть ли записи, которые важно дополнить перед следующим приёмом?",
    ],
  };
}

export function buildBodyViewModel(source: BodySource): BodyViewModel {
  const starts = periodStarts(source);
  const lengths = completedLengths(starts);
  const avgCycle = average(lengths);
  const min = lengths.length ? Math.min(...lengths) : null;
  const max = lengths.length ? Math.max(...lengths) : null;
  const periodLength = averagePeriodLength(source.entries);
  const lastCycle = starts.length ? starts[starts.length - 1] : "нет данных";
  const insights = buildInsights(source, lengths);
  const painDays = source.entries.filter((entry) => entry.pain).length;
  const moodDays = source.entries.filter((entry) => entry.mood || entry.checkIn).length;
  const sleepDays = source.entries.filter((entry) => entry.sleep).length;
  const waterDays = source.entries.filter((entry) => entry.waterMl).length;
  const strongPain = source.entries.filter((entry) => (entry.pain?.intensity ?? 0) >= 4).length;
  const repeatedSymptoms = Array.from(countBy(source.entries.flatMap((entry) => entry.symptoms))).filter(([, count]) => count >= 2);

  const changes = [
    { label: "Настроение", value: `${moodDays} дней с отметками` },
    { label: "Энергия", value: `${source.entries.filter((entry) => entry.energy).length} дней` },
    { label: "Сон", value: `${sleepDays} дней` },
    { label: "Боль", value: `${painDays} дней` },
    { label: "Симптомы", value: `${source.entries.filter((entry) => entry.symptoms.length).length} дней` },
    { label: "Вода", value: `${waterDays} дней` },
  ];

  const importantChanges = [
    lengths.length && avgCycle && max && max > avgCycle + 5 ? { label: "Цикл длиннее привычного", value: `${max} дн. при среднем ${avgCycle}` } : null,
    strongPain ? { label: "Боль стала сильнее", value: `${strongPain} записей с болью 4–5/5` } : null,
    repeatedSymptoms.length ? { label: "Повторяющийся симптом", value: `${repeatedSymptoms[0][0]} · ${repeatedSymptoms[0][1]} раза` } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  const comparison = lengths.slice(-3).map((length, index) => ({
    label: `Цикл ${Math.max(1, lengths.length - 2 + index)}`,
    value: `${length} дн.`,
  }));
  const observations = insights.length ? insights.map((insight) => `${insight.title}: ${insight.sample}`) : ["Данных пока недостаточно для устойчивых наблюдений."];

  return {
    rhythm: {
      averageCycleLength: avgCycle,
      cycleRange: min && max ? `${min}–${max} дн.` : "нет диапазона",
      averagePeriodLength: periodLength,
      lastCycle,
      completedCycles: lengths.length,
    },
    insights,
    changes,
    importantChanges,
    comparison,
    doctorSummary: buildDoctorSummary(source, lengths, observations),
    hasEnoughForInsights: lengths.length >= 3,
  };
}

export const defaultDoctorSummaryOptions: DoctorSummaryOptions = {
  cycleDates: true,
  cycleLengths: true,
  periodEntries: true,
  pain: true,
  symptoms: true,
  moodEnergy: true,
  sleep: true,
  notes: false,
};

function formatMoodEnergy(entry: DailyEntry) {
  return [
    entry.checkIn ? `самочувствие ${entry.checkIn.value}` : null,
    entry.mood ? `настроение ${entry.mood}` : null,
    entry.energy ? `энергия ${entry.energy}` : null,
  ].filter(Boolean).join(", ");
}

function formatSleep(entry: DailyEntry) {
  if (!entry.sleep) return "";
  return `${entry.sleep.quality}${entry.sleep.hours ? `, ${entry.sleep.hours} ч` : ""}`;
}

export function buildDoctorSummaryText(summary: DoctorSummary, options: DoctorSummaryOptions = defaultDoctorSummaryOptions) {
  return [
    "Mira — сводка для врача",
    `Период: ${summary.period}`,
    options.cycleDates ? `Даты циклов: ${summary.cycleDates.join(", ") || "нет данных"}` : null,
    options.cycleLengths ? `Длины циклов: ${summary.cycleLengths.join(", ") || "нет данных"}` : null,
    options.periodEntries ? `Месячные: ${summary.periodEntries.map((entry) => entry.date).join(", ") || "нет данных"}` : null,
    options.pain ? `Боль: ${summary.painEntries.map((entry) => `${entry.date} ${entry.pain?.intensity}/5`).join("; ") || "нет данных"}` : null,
    options.symptoms ? `Симптомы: ${summary.symptomEntries.map((entry) => `${entry.date}: ${entry.symptoms.join(", ")}`).join("; ") || "нет данных"}` : null,
    options.moodEnergy ? `Настроение и энергия: ${summary.moodEnergyEntries.map((entry) => `${entry.date}: ${formatMoodEnergy(entry)}`).join("; ") || "нет данных"}` : null,
    options.sleep ? `Сон: ${summary.sleepEntries.map((entry) => `${entry.date}: ${formatSleep(entry)}`).join("; ") || "нет данных"}` : null,
    options.notes ? `Личные заметки: ${summary.noteEntries.map((entry) => `${entry.date}: ${entry.note}`).join("; ") || "нет данных"}` : null,
    options.pain ? `Влияние на обычную жизнь: ${summary.lifeImpactEntries.map((entry) => `${entry.date}: ${entry.pain?.affectedLife}`).join("; ") || "нет данных"}` : null,
    `Наблюдения Mira: ${summary.observations.join("; ")}`,
    `Вопросы врачу: ${summary.questions.join("; ")}`,
    "Отчёт не является диагнозом и не заменяет консультацию врача.",
  ].filter(Boolean).join("\n");
}

export function buildDoctorSummaryHtml(summary: DoctorSummary, options: DoctorSummaryOptions = defaultDoctorSummaryOptions) {
  const rows = [
    ["Период", summary.period],
    options.cycleDates ? ["Даты циклов", summary.cycleDates.join(", ") || "нет данных"] : null,
    options.cycleLengths ? ["Длины циклов", summary.cycleLengths.join(", ") || "нет данных"] : null,
    options.periodEntries ? ["Месячные", summary.periodEntries.map((entry) => entry.date).join(", ") || "нет данных"] : null,
    options.pain ? ["Боль", summary.painEntries.map((entry) => `${entry.date} ${entry.pain?.intensity}/5`).join("; ") || "нет данных"] : null,
    options.symptoms ? ["Симптомы", summary.symptomEntries.map((entry) => `${entry.date}: ${entry.symptoms.join(", ")}`).join("; ") || "нет данных"] : null,
    options.moodEnergy ? ["Настроение и энергия", summary.moodEnergyEntries.map((entry) => `${entry.date}: ${formatMoodEnergy(entry)}`).join("; ") || "нет данных"] : null,
    options.sleep ? ["Сон", summary.sleepEntries.map((entry) => `${entry.date}: ${formatSleep(entry)}`).join("; ") || "нет данных"] : null,
    options.notes ? ["Личные заметки", summary.noteEntries.map((entry) => `${entry.date}: ${entry.note}`).join("; ") || "нет данных"] : null,
    options.pain ? ["Влияние на обычную жизнь", summary.lifeImpactEntries.map((entry) => `${entry.date}: ${entry.pain?.affectedLife}`).join("; ") || "нет данных"] : null,
    ["Наблюдения Mira", summary.observations.join("; ")],
    ["Вопросы врачу", summary.questions.join("; ")],
  ].filter(Boolean) as string[][];

  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Mira doctor summary</title><style>body{font-family:system-ui,sans-serif;color:#1A1A1A;padding:32px;line-height:1.45}h1{font-size:24px}table{border-collapse:collapse;width:100%;margin-top:20px}td{border:1px solid #ddd;padding:10px;vertical-align:top}td:first-child{font-weight:700;width:28%}.notice{margin-top:20px;color:#666;font-size:13px}</style></head><body><h1>Mira — сводка для врача</h1><table>${rows.map(([label, value]) => `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`).join("")}</table><p class="notice">Отчёт не является диагнозом и не заменяет консультацию врача.</p></body></html>`;
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
