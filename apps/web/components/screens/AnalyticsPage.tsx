"use client";

import React, { memo, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  Bell,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Droplets,
  FileText,
  HeartPulse,
  Mail,
  Moon,
  Settings,
  ShieldAlert,
  Smile,
  Sparkles,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  Waves,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMiraStore } from "@/store";
import type { Cycle, CycleState, DailyLog } from "@/store/types";

type PeriodKey = "current" | "3" | "6" | "12";

type CyclePoint = {
  month: string;
  length: number;
};

type FlowPoint = {
  day: string;
  count: number;
};

type SymptomPoint = {
  name: string;
  count: number;
};

type SkinCyclePoint = {
  cycleDay: number;
  acneCount: number;
  drynessCount?: number;
  oilinessCount?: number;
  hairLossCount?: number;
};

type CycleHistoryItem = {
  id: string;
  title: string;
  range: string;
  startDate: string | null;
  endDate: string | null;
  length: number;
  periodLength: number;
  noteCount: number;
  isCurrent?: boolean;
  isIrregular?: boolean;
};

type CycleHistorySummary = {
  current: CycleHistoryItem;
  completed: CycleHistoryItem[];
  all: CycleHistoryItem[];
  fluctuationMin: number;
  fluctuationMax: number;
  averageLength: number;
};

type AnalyticsData = {
  cycleLengthData: CyclePoint[];
  flowData: FlowPoint[];
  symptoms: SymptomPoint[];
  skinData?: SkinCyclePoint[];
  factors: string[];
  redFlags: string[];
  periodStart?: string;
  periodEnd?: string;
  avgCycle?: number;
  peakDay?: string;
  peakCount?: number;
  normalCount?: number;
  trackedCycles: number;
};

type AnalyticsPageProps = {
  datasets?: Partial<Record<PeriodKey, AnalyticsData>>;
  onOpenDoctorReport?: () => void;
  onExportPdf?: () => void;
  onExportTxt?: () => void;
  onSendToSelf?: () => void;
};

type AnalysisTopicId =
  | "cycle"
  | "period"
  | "pms"
  | "pain"
  | "mood"
  | "sleep"
  | "skin"
  | "care"
  | "doctor";

type AnalysisTopic = {
  id: AnalysisTopicId;
  title: string;
  label: string;
  headline: string;
  metric: string;
  note: string;
  status: "empty" | "watch" | "repeat" | "doctor";
  sampleSize: number;
  icon: typeof CalendarDays;
  chart: "line" | "bar" | "dots" | "rings" | "list";
};

const pink = "#F9359E";
const bg = "#050505";
const text = "#F5F0ED";
const muted = "#8D817B";
const green = "#84E600";
const yellow = "#FFB800";
const red = "#FF6B6B";
const darkCardClass = "border-[#2E2826] bg-[#1D1816] shadow-[0_18px_48px_rgba(0,0,0,0.28)]";
const darkInsetClass = "border-[#342D2A] bg-[#2A2523]";
const limeButtonClass = "bg-[#84E600] text-[#11100F] shadow-[0_12px_30px_rgba(132,230,0,0.20)] hover:bg-[#73CC00]";

const periods: Array<{ value: PeriodKey; label: string }> = [
  { value: "current", label: "Текущий цикл" },
  { value: "3", label: "3 цикла" },
  { value: "6", label: "6 циклов" },
  { value: "12", label: "12 циклов" },
];

const emptyAnalyticsData: Record<PeriodKey, AnalyticsData> = {
  current: {
    cycleLengthData: [],
    flowData: [],
    symptoms: [],
    skinData: [],
    factors: [],
    redFlags: [],
    trackedCycles: 1,
  },
  "3": {
    cycleLengthData: [],
    flowData: [],
    symptoms: [],
    skinData: [],
    factors: [],
    redFlags: [],
    trackedCycles: 0,
  },
  "6": {
    cycleLengthData: [],
    flowData: [],
    symptoms: [],
    skinData: [],
    factors: [],
    redFlags: [],
    trackedCycles: 0,
  },
  "12": {
    cycleLengthData: [],
    flowData: [],
    symptoms: [],
    skinData: [],
    factors: [],
    redFlags: [],
    trackedCycles: 0,
  },
};

function getDataset(period: PeriodKey, datasets?: Partial<Record<PeriodKey, AnalyticsData>>) {
  return datasets?.[period] ?? emptyAnalyticsData[period];
}

function getMonthShort(date: string, fallback: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toLocaleDateString("ru-RU", { month: "short" }).slice(0, 1).toUpperCase();
}

function formatAnalyticsCycleDate(date: string | null) {
  if (!date) return "дата не указана";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "дата не указана";
  return parsed.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

function formatAnalyticsCycleRange(startDate: string | null, endDate?: string | null) {
  const start = formatAnalyticsCycleDate(startDate);
  if (!endDate) return `Начался ${start}`;
  return `${start} – ${formatAnalyticsCycleDate(endDate)}`;
}

function getCycleNotesCount(item: Cycle, logs: DailyLog[]) {
  if (item.symptoms?.length) return item.symptoms.length;
  if (!item.startDate) return 0;
  return logs.filter((log) => log.date >= item.startDate && (!item.endDate || log.date <= item.endDate)).length;
}

function getCycleHistorySummary(cycle: CycleState, logs: DailyLog[]): CycleHistorySummary {
  const completed = cycle.cycles.filter((item) => item.endDate).length
    ? [...cycle.cycles]
        .filter((item) => item.endDate)
        .sort((a, b) => b.startDate.localeCompare(a.startDate))
        .map((item) => ({
          id: item.id,
          title: `${item.length} ${item.length === 1 ? "день" : item.length < 5 ? "дня" : "дней"}`,
          range: formatAnalyticsCycleRange(item.startDate, item.endDate),
          startDate: item.startDate,
          endDate: item.endDate,
          length: item.length,
          periodLength: item.periodLength,
          noteCount: getCycleNotesCount(item, logs),
          isIrregular: item.length < 21 || item.length > 35 || Math.abs(item.length - cycle.averageLength) > 7,
        }))
    : [];

  const current: CycleHistoryItem = {
    id: "current-cycle",
    title: `Текущий цикл: ${cycle.currentDay} ${cycle.currentDay === 1 ? "день" : cycle.currentDay < 5 ? "дня" : "дней"}`,
    range: formatAnalyticsCycleRange(cycle.lastPeriodStart),
    startDate: cycle.lastPeriodStart,
    endDate: null,
    length: cycle.currentDay,
    periodLength: cycle.periodLength,
    noteCount: logs.filter((log) => log.cycleDay <= cycle.currentDay).length,
    isCurrent: true,
  };

  const lengths = completed.map((item) => item.length);
  return {
    current,
    completed,
    all: [current, ...completed],
    fluctuationMin: lengths.length ? Math.min(...lengths) : current.length,
    fluctuationMax: lengths.length ? Math.max(...lengths) : current.length,
    averageLength: cycle.averageLength,
  };
}

function getLogsForPeriod(logs: DailyLog[], period: PeriodKey, cycle: CycleState) {
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  if (period === "current") return sorted.filter((log) => log.cycleDay <= cycle.currentDay).slice(-cycle.averageLength);
  const cycleCount = Number(period);
  return sorted.slice(-cycle.averageLength * cycleCount);
}

function isDailyLogLike(log: unknown): log is DailyLog {
  if (!log || typeof log !== "object") return false;
  const item = log as Partial<DailyLog>;
  return Boolean(
    typeof item.date === "string" &&
      typeof item.cycleDay === "number" &&
      item.symptoms &&
      item.selfCare &&
      item.symptoms.bleeding &&
      item.symptoms.pain &&
      item.symptoms.sleep &&
      item.symptoms.skin
  );
}

function getSafeLogs(logs: unknown[]) {
  return logs.filter(isDailyLogLike);
}

function latestAnalyticsLogWithSelfCare(logs: DailyLog[], field: keyof DailyLog["selfCare"]) {
  return [...logs]
    .filter((log) => log.selfCare[field] !== null && log.selfCare[field] !== undefined)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}

function latestAnalyticsSleepLog(logs: DailyLog[]) {
  return [...logs]
    .filter((log) => log.symptoms.sleep.hours !== null || log.symptoms.sleep.quality !== null)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}

function relativeAnalyticsDateLabel(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "дата есть";
  const diff = Math.round((Date.now() - parsed.getTime()) / 86_400_000);
  if (diff <= 0) return "сегодня";
  if (diff === 1) return "вчера";
  return `${diff} дн. назад`;
}

function walkingAnalyticsLabel(value: DailyLog["selfCare"]["walking"]) {
  const labels: Record<NonNullable<DailyLog["selfCare"]["walking"]>, string> = {
    none: "почти нет",
    little: "немного",
    normal: "норма",
    much: "много",
  };
  return value ? labels[value] : "нет";
}

function DataSourceMap({
  logs,
  cycle,
}: {
  logs: DailyLog[];
  cycle: CycleState;
}) {
  const care = useMiraStore((state) => state.care);
  const waterLog = latestAnalyticsLogWithSelfCare(logs, "water");
  const walkingLog = latestAnalyticsLogWithSelfCare(logs, "walking");
  const weightLog = latestAnalyticsLogWithSelfCare(logs, "weight");
  const sleepLog = latestAnalyticsSleepLog(logs);
  const symptomCount = logs.reduce((sum, log) => {
    const hasPain = log.symptoms.pain.level > 0;
    const hasMood = log.symptoms.mood !== null;
    const hasEnergy = log.symptoms.energy !== null;
    const hasSkin = log.symptoms.skin.acne || log.symptoms.skin.dryness || log.symptoms.skin.oiliness || log.symptoms.skin.hairLoss;
    return sum + [hasPain, hasMood, hasEnergy, hasSkin].filter(Boolean).length;
  }, 0);
  const water = waterLog?.selfCare.water ?? care.water.current;
  const walking = walkingLog?.selfCare.walking ?? care.activity.walking;
  const weight = weightLog?.selfCare.weight ?? care.weight.current;
  const sleep = sleepLog?.symptoms.sleep.hours ?? null;
  const completion = Math.min(100, Math.round(((logs.length ? 1 : 0) + (water > 0 ? 1 : 0) + (walking ? 1 : 0) + (sleep ? 1 : 0) + (weight ? 1 : 0)) * 20));

  const sources = [
    {
      icon: CalendarDays,
      title: "Цикл",
      value: `день ${cycle.currentDay}`,
      detail: cycle.lastPeriodStart ? `якорь: ${formatAnalyticsCycleDate(cycle.lastPeriodStart)}` : "нужен первый день месячных",
      progress: cycle.lastPeriodStart ? 86 : 28,
      tone: "bg-[#F4F0FA] text-[#8B6FB3]",
    },
    {
      icon: Activity,
      title: "Симптомы",
      value: `${symptomCount} отметок`,
      detail: logs.length ? `последняя: ${relativeAnalyticsDateLabel(logs[logs.length - 1]?.date ?? "")}` : "добавь боль, настроение или кожу",
      progress: Math.min(100, symptomCount * 12),
      tone: "bg-[#F1E9FF] text-[#7B61C9]",
    },
    {
      icon: Droplets,
      title: "Контекст",
      value: `${water.toFixed(1)} л`,
      detail: `ходьба: ${walkingAnalyticsLabel(walking)}`,
      progress: Math.min(100, Math.round((water / Math.max(1, care.water.target)) * 100)),
      tone: "bg-[#E0F7F9] text-[#249AA4]",
    },
    {
      icon: Moon,
      title: "Сон и энергия",
      value: sleep ? `${sleep} ч` : "нет сна",
      detail: sleepLog ? relativeAnalyticsDateLabel(sleepLog.date) : "отметь сон в трекере",
      progress: sleep ? Math.min(100, Math.round((sleep / 8) * 100)) : 18,
      tone: "bg-[#ECE8F7] text-[#5B4FA0]",
    },
    {
      icon: TrendingUp,
      title: "Вес и тело",
      value: weight ? `${weight} кг` : "не указан",
      detail: weightLog ? relativeAnalyticsDateLabel(weightLog.date) : "можно не заполнять",
      progress: weight ? 72 : 20,
      tone: "bg-[#F1ECF8] text-[#7C5FA8]",
    },
  ];

  return (
    <SectionCard eyebrow="Собранные данные" title="Что попадает в Анализ" delay={8}>
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className={`rounded-[20px] border p-5 ${darkInsetClass}`}>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8D817B]">База Mira</p>
          <h2 className="mt-2 text-3xl font-black leading-tight">{completion}% заполнено</h2>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-[#B7AAA4]">
            Здесь собираются данные из Сегодня, Дневника, Контекста и Профиля. Выводы появляются только как осторожные наблюдения.
          </p>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#342D2A]">
            <div className="h-full rounded-full bg-[#84E600]" style={{ width: `${completion}%` }} />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {[
              ["дней с отметками", `${logs.length}`],
              ["средний цикл", `${cycle.averageLength} дн.`],
              ["до месячных", cycle.daysUntilPeriod < 0 ? `задержка ${Math.abs(cycle.daysUntilPeriod)}` : `${cycle.daysUntilPeriod} дн.`],
              ["для отчёта", "выборочно"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[16px] border border-[#342D2A] bg-[#1D1816] px-3 py-3">
                <p className="text-[10px] font-black uppercase tracking-wide text-[#8D817B]">{label}</p>
                <p className="mt-1 text-sm font-black text-[#F5F0ED]">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {sources.map((source) => (
            <div key={source.title} className={`rounded-[18px] border p-4 ${darkInsetClass}`}>
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#302927] text-[#F9359E]">
                  <source.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-[#F5F0ED]">{source.title}</p>
                      <p className="mt-1 text-xs font-semibold leading-relaxed text-[#B7AAA4]">{source.detail}</p>
                    </div>
                    <p className="shrink-0 text-sm font-black text-[#84E600]">{source.value}</p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#342D2A]">
                    <div className="h-full rounded-full bg-[#84E600]" style={{ width: `${Math.max(8, source.progress)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

function countCondition(logs: DailyLog[], condition: (log: DailyLog) => boolean) {
  return logs.reduce((sum, log) => {
    try {
      return sum + (condition(log) ? 1 : 0);
    } catch {
      return sum;
    }
  }, 0);
}

function getSymptomsFromLogs(logs: DailyLog[]): SymptomPoint[] {
  const counts = new Map<string, number>();
  const add = (name: string, active: boolean) => {
    if (active) counts.set(name, (counts.get(name) ?? 0) + 1);
  };

  logs.forEach((log) => {
    add("Обильность", (log.symptoms.bleeding.amount ?? 0) >= 2);
    add("Боль", (log.symptoms.pain.level ?? 0) >= 1);
    add("Тревога", log.symptoms.mood === "anxious");
    add("Низкая энергия", log.symptoms.energy === "low" || log.symptoms.energy === "exhausted");
    add("Акне", Boolean(log.symptoms.skin.acne));
  });

  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function getRedFlagsFromLogs(logs: DailyLog[], cycle: CycleState) {
  const flags = new Set<string>();

  logs.forEach((log) => {
    if (log.symptoms.bleeding.amount === 3 || log.symptoms.bleeding.pads >= 7) flags.add("Очень обильное кровотечение");
    if (log.symptoms.bleeding.clots === "large") flags.add("Крупные сгустки");
    if (log.symptoms.pain.level >= 4) flags.add("Сильная боль");
    if (log.symptoms.pain.type === "sharp" || log.symptoms.pain.type === "cutting") flags.add("Острая или режущая боль");
    if (log.symptoms.pain.affectedLife === "bedridden") flags.add("Боль мешает встать с кровати");
    if (log.symptoms.energy === "exhausted") flags.add("Сильная слабость");
  });

  if (cycle.currentDay > cycle.averageLength + 7) flags.add("Задержка больше обычного");
  return Array.from(flags);
}

function getSkinPointsFromLogs(logs: DailyLog[]) {
  const grouped = new Map<number, SkinCyclePoint>();

  logs.forEach((log) => {
    const hasSkin = log.symptoms.skin.acne || log.symptoms.skin.dryness || log.symptoms.skin.oiliness || log.symptoms.skin.hairLoss;
    if (!hasSkin) return;
    const current = grouped.get(log.cycleDay) ?? { cycleDay: log.cycleDay, acneCount: 0 };
    if (log.symptoms.skin.acne) current.acneCount += log.symptoms.skin.acneCount ?? 1;
    if (log.symptoms.skin.dryness) current.drynessCount = (current.drynessCount ?? 0) + 1;
    if (log.symptoms.skin.oiliness) current.oilinessCount = (current.oilinessCount ?? 0) + 1;
    if (log.symptoms.skin.hairLoss) current.hairLossCount = (current.hairLossCount ?? 0) + 1;
    grouped.set(log.cycleDay, current);
  });

  return Array.from(grouped.values()).sort((a, b) => b.acneCount - a.acneCount || a.cycleDay - b.cycleDay);
}

function buildDataFromLogs(
  logs: DailyLog[],
  cycle: CycleState,
  period: PeriodKey
): AnalyticsData {
  const periodLogs = getLogsForPeriod(logs, period, cycle);
  const symptoms = getSymptomsFromLogs(periodLogs);
  const redFlags = getRedFlagsFromLogs(periodLogs, cycle);
  const skinPoints = getSkinPointsFromLogs(periodLogs);
  const hasAnyCycleData = Boolean(cycle.lastPeriodStart || cycle.cycles.length > 0 || periodLogs.length > 0);
  const trackedCycles = hasAnyCycleData
    ? Math.max(1, period === "current" ? 1 : Math.min(Number(period), Math.ceil(periodLogs.length / cycle.averageLength)))
    : 0;
  const cycleLengthData =
    cycle.cycles.length > 0
      ? cycle.cycles.slice(-trackedCycles).map((item, index) => ({
          month: getMonthShort(item.startDate, `Ц${index + 1}`),
          length: item.length,
        }))
      : period === "current" || !hasAnyCycleData
        ? []
        : [{ month: "Т", length: cycle.averageLength }];

  const flowData = Array.from({ length: 7 }, (_, index) => {
    const cycleDay = index + 1;
    const dayLogs = periodLogs.filter((log) => log.cycleDay === cycleDay);
    const averagePads = dayLogs.length
      ? Math.round(dayLogs.reduce((sum, log) => sum + log.symptoms.bleeding.pads, 0) / dayLogs.length)
      : 0;
    return { day: `Д${cycleDay}`, count: averagePads };
  });
  const peak = flowData.reduce((max, item) => (item.count > max.count ? item : max), flowData[0] ?? { day: "Д1", count: 0 });
  const normalCount = Math.max(3, Math.round(flowData.reduce((sum, item) => sum + item.count, 0) / Math.max(1, flowData.filter((item) => item.count > 0).length)));

  const stressDelayCount = countCondition(periodLogs, (log) => log.symptoms.context.includes("stress") && log.cycleDay > cycle.averageLength);
  const lowWaterHeadacheCount = countCondition(
    periodLogs,
    (log) => log.selfCare.water > 0 && log.selfCare.water < 1.2 && log.symptoms.pain.location.includes("head")
  );
  const poorSleepLowEnergyCount = countCondition(
    periodLogs,
    (log) => log.symptoms.sleep.quality === "poor" && (log.symptoms.energy === "low" || log.symptoms.energy === "exhausted")
  );

  return {
    cycleLengthData,
    flowData,
    symptoms,
    skinData: skinPoints,
    factors: [
      stressDelayCount > 0 ? `Стресс → Задержка (${stressDelayCount} случая)` : null,
      lowWaterHeadacheCount > 0 ? `Мало воды → Головная боль (${lowWaterHeadacheCount} случаев)` : null,
      poorSleepLowEnergyCount > 0 ? `Плохой сон → Низкая энергия (${poorSleepLowEnergyCount} случаев)` : null,
    ].filter(Boolean) as string[],
    redFlags,
    avgCycle: cycle.averageLength,
    peakDay: peak.count > 0 ? peak.day : undefined,
    peakCount: peak.count || undefined,
    normalCount,
    trackedCycles,
  };
}

function getCycleCaption(points: CyclePoint[]) {
  if (points.length < 2) return "Начни трекать цикл, чтобы увидеть аналитику";
  const lengths = points.map((point) => point.length);
  const spread = Math.max(...lengths) - Math.min(...lengths);
  if (spread > 14) return "🔴 Цикл нестабилен, покажи врачу";
  if (spread > 7) return "🟡 Есть небольшие колебания";
  return "✅ Твой цикл стабилен (28–30 дней)";
}

function getFlowCaption(data: AnalyticsData) {
  if (!data.flowData.length || !data.peakDay || !data.peakCount) return "Начни отмечать обильность, чтобы увидеть пик по дням.";
  if (data.peakCount > 7) return `🔴 Очень обильно: ${data.peakDay}, ${data.peakCount} прокладок/тампонов. Проверь у врача.`;
  if (data.peakCount > 5) return `🟡 Выше обычного: пик — ${data.peakDay} (${data.peakCount} прокладок/тампонов).`;
  return `📌 Пик обильности — ${data.peakDay} (${data.peakCount} прокладок/тампонов). Это в пределах твоей нормы.`;
}

function getConfidencePercent(trackedCycles: number) {
  return Math.min(92, 48 + trackedCycles * 10);
}

function getNotesCount(data: AnalyticsData) {
  const symptomNotes = data.symptoms.reduce((sum, symptom) => sum + symptom.count, 0);
  const flowNotes = data.flowData.reduce((sum, item) => sum + item.count, 0);
  return symptomNotes + flowNotes + data.cycleLengthData.length;
}

function getMoreNotesNeeded(data: AnalyticsData) {
  return Math.max(0, 72 - getNotesCount(data));
}

function getSampleSizeFromText(text: string) {
  const match = text.match(/(\d+)\s*(?:случа|раз|дн)/i);
  return match ? Number(match[1]) : null;
}

function getSampleTone(sampleSize: number | null) {
  if (!sampleSize || sampleSize < 5) return "red";
  if (sampleSize < 10) return "yellow";
  return "green";
}

function getSampleExplanation(sampleSize: number | null) {
  if (!sampleSize || sampleSize < 5) return "Малая выборка: это наблюдение, не вывод.";
  if (sampleSize < 10) return "Первые повторения: стоит подтвердить ещё отметками.";
  return "Связь повторялась достаточно часто, чтобы учитывать её в отчёте.";
}

function getReliability(sampleSize: number) {
  if (sampleSize < 5) {
    return {
      label: "Первые признаки",
      body: "Пока рано делать вывод. Mira показывает это как наблюдение.",
      tone: "yellow" as const,
    };
  }
  if (sampleSize < 10) {
    return {
      label: "Средняя",
      body: "Это повторялось несколько раз, но стоит подтвердить ещё отметками.",
      tone: "pink" as const,
    };
  }
  return {
    label: "Высокая",
    body: "Наблюдение повторялось часто и подходит для отчёта врачу.",
    tone: "green" as const,
  };
}

function softenInsight(sampleSize: number, text: string) {
  if (sampleSize >= 5) return text;
  return `Первые признаки: ${text}`;
}

function getFlowSampleSize(data: AnalyticsData) {
  return data.flowData.reduce((sum, item) => sum + (item.count > 0 ? 1 : 0), 0);
}

function InsightCard({
  noticed,
  why,
  action,
  sampleSize,
  delay = 0,
  detailLabel = "Показать данные",
  children,
}: {
  noticed: string;
  why: string;
  action: string;
  sampleSize: number;
  delay?: number;
  detailLabel?: string;
  children?: React.ReactNode;
}) {
  const reliability = getReliability(sampleSize);

  return (
    <Card
      className={`rounded-[22px] p-6 transition hover:-translate-y-0.5 ${darkCardClass}`}
      style={{ animation: `miraAnalyticsIn 420ms ease ${delay}ms both` }}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <Eyebrow>Что Mira заметила</Eyebrow>
          <h2 className="mt-2 text-2xl font-black leading-tight text-[#F5F0ED]">
            {softenInsight(sampleSize, noticed)}
          </h2>
        </div>
        <StatBadge value={reliability.label} tone={reliability.tone} />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <InsightNote title="Почему это важно" body={why} />
        <InsightNote title="Что сделать" body={action} />
        <InsightNote title="Надёжность" body={reliability.body} />
        <InsightNote title="Основано на" body={`${sampleSize} ${sampleSize === 1 ? "отметке" : sampleSize > 1 && sampleSize < 5 ? "отметках" : "отметках"}`} />
      </div>

      {children && (
        <details className={`mt-4 rounded-[18px] border px-4 py-3 ${darkInsetClass}`}>
          <summary className="cursor-pointer text-sm font-black text-[#84E600]">{detailLabel}</summary>
          <div className="mt-4">{children}</div>
        </details>
      )}
    </Card>
  );
}

function getMainInsight(data: AnalyticsData) {
  if (data.redFlags.length > 0) {
    return `Есть сигнал, который лучше не терпеть: ${data.redFlags[0].toLowerCase()}.`;
  }

  const reliableFactor = data.factors.find((factor) => {
    const sampleSize = getSampleSizeFromText(factor);
    return sampleSize !== null && sampleSize >= 5;
  });

  if (reliableFactor) {
    return `Похоже, повторяется связь: ${reliableFactor.toLowerCase()}.`;
  }

  const topSymptoms = data.symptoms.slice(0, 2).map((item) => item.name);
  if (topSymptoms.length >= 2) {
    return `Похоже, перед месячными у тебя чаще повторяются ${topSymptoms[0].toLowerCase()} и ${topSymptoms[1].toLowerCase()}.`;
  }
  if (topSymptoms.length === 1) {
    return `Похоже, симптом “${topSymptoms[0]}” начинает повторяться в твоём цикле.`;
  }
  return "Mira пока собирает первые данные и скоро покажет, что повторяется.";
}

function getNextAnalyticsAction(data: AnalyticsData, notesNeeded: number) {
  if (data.redFlags.length > 0) return "Сформируй отчёт врачу и добавь туда тревожные симптомы.";
  if (notesNeeded > 0) return `Отметь ещё ${notesNeeded} наблюдений, чтобы Mira точнее отделяла случайность от повторения.`;
  if ((data.peakCount ?? 0) > (data.normalCount ?? 4)) return "Продолжай отмечать обильность в первые 3 дня месячных.";
  if (data.factors.length > 0) return "Проверь одну связь 7 дней подряд: сон, вода или стресс.";
  return "Начни с симптомов, сна и энергии: этого достаточно для первых выводов.";
}

function getMainInsightTitle(data: AnalyticsData, notesCount: number) {
  if (data.redFlags.length > 0) return "Есть сигнал, который стоит вынести отдельно";
  if (notesCount < 5) return "Пока рано искать закономерности";
  if (data.factors.length > 0) return "Mira заметила возможную связь";
  if (data.symptoms.length > 0) return "Mira заметила повтор";
  return "Пока тревожных повторов не видно";
}

function getMainInsightBody(data: AnalyticsData, notesCount: number, notesNeeded: number) {
  if (data.redFlags.length > 0) {
    return `${data.redFlags[0]}. Это не диагноз, но такой факт лучше сохранить и consider discussing this with a qualified clinician.`;
  }
  if (notesCount < 5) {
    return `Нужно ещё ${notesNeeded} отметок, чтобы отделять случайный день от повторяющегося паттерна.`;
  }
  if (data.factors.length > 0) return data.factors[0];
  if (data.symptoms.length > 0) return `${data.symptoms[0].name} встречается чаще других отметок за выбранный период.`;
  return "Продолжай отмечать цикл, боль, сон и настроение. Если появятся повторения, Mira покажет их здесь.";
}

function getPrimaryAnalyticsAction(data: AnalyticsData, notesCount: number) {
  if (data.redFlags.length > 0) return { label: "Собрать отчёт врачу", target: "report" as const };
  if (notesCount < 5) return { label: "Добавить отметку", target: "track" as const };
  return { label: "Собрать отчёт врачу", target: "report" as const };
}

function statusLabel(status: AnalysisTopic["status"]) {
  const labels: Record<AnalysisTopic["status"], string> = {
    empty: "мало данных",
    watch: "наблюдаем",
    repeat: "повторяется",
    doctor: "для врача",
  };
  return labels[status];
}

function statusTone(status: AnalysisTopic["status"]): "pink" | "green" | "yellow" | "red" {
  if (status === "doctor") return "red";
  if (status === "repeat") return "green";
  if (status === "watch") return "yellow";
  return "pink";
}

function buildAnalysisTopics(data: AnalyticsData, notesCount: number): AnalysisTopic[] {
  const symptomTotal = data.symptoms.reduce((sum, symptom) => sum + symptom.count, 0);
  const skinSample = (data.skinData ?? []).reduce(
    (sum, item) => sum + item.acneCount + (item.drynessCount ?? 0) + (item.oilinessCount ?? 0) + (item.hairLossCount ?? 0),
    0
  );
  const topSymptom = data.symptoms[0]?.name;
  const pmsSymptoms = data.symptoms.filter((item) => ["Вздутие", "Тревожность", "Тяга к сладкому", "Слабость"].includes(item.name));
  const pmsCount = pmsSymptoms.reduce((sum, item) => sum + item.count, 0);
  const hasDoctorSignal = data.redFlags.length > 0;

  return [
    {
      id: "cycle",
      title: "Цикл",
      label: "база",
      headline: data.avgCycle ? `Средний цикл около ${data.avgCycle} дней` : "Mira пока собирает длину цикла",
      metric: `${data.trackedCycles} циклов`,
      note: "Длина цикла помогает понимать задержки и прогноз месячных.",
      status: data.cycleLengthData.length >= 3 ? "repeat" : "watch",
      sampleSize: data.cycleLengthData.length,
      icon: CalendarDays,
      chart: "line",
    },
    {
      id: "period",
      title: "Месячные",
      label: "обильность",
      headline: data.peakDay ? `Пик чаще приходится на ${data.peakDay}` : "Пик обильности пока не виден",
      metric: data.peakCount ? `${data.peakCount} отметок` : "нет пика",
      note: "Mira показывает, как меняется обильность по дням месячных.",
      status: (data.peakCount ?? 0) > 7 ? "doctor" : data.peakDay ? "repeat" : "empty",
      sampleSize: getFlowSampleSize(data),
      icon: Waves,
      chart: "bar",
    },
    {
      id: "pms",
      title: "ПМС",
      label: "перед месячными",
      headline: pmsCount > 0 ? `ПМС-похожие отметки встречались ${pmsCount} раз` : "ПМС пока не набрал повторений",
      metric: `${pmsCount}`,
      note: "Смотрим вздутие, тревожность, тягу к сладкому и слабость рядом с фазой.",
      status: pmsCount >= 5 ? "repeat" : pmsCount > 0 ? "watch" : "empty",
      sampleSize: pmsCount,
      icon: CircleDot,
      chart: "rings",
    },
    {
      id: "pain",
      title: "Боль",
      label: "сигналы",
      headline: hasDoctorSignal ? data.redFlags[0] : topSymptom === "Боль" ? "Боль начала повторяться" : "Сильных сигналов боли не видно",
      metric: `${data.redFlags.length} флагов`,
      note: "Если боль сильная или мешает жить, Mira выносит это в блок врача.",
      status: hasDoctorSignal ? "doctor" : topSymptom === "Боль" ? "watch" : "empty",
      sampleSize: data.redFlags.length || data.symptoms.find((item) => item.name === "Боль")?.count || 0,
      icon: HeartPulse,
      chart: "list",
    },
    {
      id: "mood",
      title: "Настроение",
      label: "самочувствие",
      headline: topSymptom ? `Чаще всего повторяется: ${topSymptom.toLowerCase()}` : "Настроение пока без повторений",
      metric: `${symptomTotal} отметок`,
      note: "Mira связывает настроение с фазой, сном и нагрузкой осторожно, без выводов с малой выборкой.",
      status: symptomTotal >= 10 ? "repeat" : symptomTotal > 0 ? "watch" : "empty",
      sampleSize: symptomTotal,
      icon: Smile,
      chart: "bar",
    },
    {
      id: "sleep",
      title: "Сон и энергия",
      label: "ресурс",
      headline: data.factors.find((item) => item.toLowerCase().includes("сон")) ?? "Связь сна и энергии пока собирается",
      metric: `${data.factors.length} связей`,
      note: "Сон и энергия помогают объяснить, почему один и тот же день цикла ощущается по-разному.",
      status: data.factors.some((item) => item.toLowerCase().includes("сон")) ? "repeat" : "watch",
      sampleSize: getSampleSizeFromText(data.factors.find((item) => item.toLowerCase().includes("сон")) ?? "") ?? 0,
      icon: Moon,
      chart: "list",
    },
    {
      id: "skin",
      title: "Кожа и волосы",
      label: "внешние изменения",
      headline: skinSample >= 3 ? getSkinCaption(data.skinData, data.avgCycle).replace("📌 ", "") : "Отметь кожу 3 раза, и Mira покажет связь с циклом",
      metric: `${skinSample} отметок`,
      note: "Акне, сухость, жирность и волосы смотрим рядом с фазой, сном, водой и стрессом.",
      status: skinSample >= 5 ? "repeat" : skinSample > 0 ? "watch" : "empty",
      sampleSize: skinSample,
      icon: Sparkles,
      chart: "dots",
    },
    {
      id: "care",
      title: "Контекст",
      label: "контекст",
      headline: data.factors[0] ? `Возможная связь: ${data.factors[0].replace(/\s*\([^)]*\)/, "").toLowerCase()}` : "Вода, движение и еда пока собирают контекст",
      metric: `${data.factors.length} связей`,
      note: "Контекст не оценивает тебя. Он объясняет, что могло влиять на самочувствие.",
      status: data.factors.length > 0 ? "repeat" : "watch",
      sampleSize: data.factors.reduce((sum, factor) => sum + (getSampleSizeFromText(factor) ?? 0), 0),
      icon: Droplets,
      chart: "list",
    },
    {
      id: "doctor",
      title: "Для врача",
      label: "выгрузка",
      headline: hasDoctorSignal ? "Есть данные, которые стоит вынести на прием" : "Можно собрать спокойный отчет за период",
      metric: `${notesCount} фактов`,
      note: "Выбери период и разделы, личные заметки и секс остаются выключены по умолчанию.",
      status: hasDoctorSignal ? "doctor" : "watch",
      sampleSize: notesCount,
      icon: ShieldAlert,
      chart: "list",
    },
  ];
}

function InsightNote({ title, body }: { title: string; body: string }) {
  return (
    <div className={`rounded-[18px] border px-4 py-3 ${darkInsetClass}`}>
      <p className="text-xs font-black uppercase tracking-wide text-[#8D817B]">{title}</p>
      <p className="mt-1 text-sm font-bold leading-relaxed text-[#F5F0ED]">{body}</p>
    </div>
  );
}

function getSkinCaption(items: SkinCyclePoint[] = [], avgCycle = 29) {
  if (items.length < 3) return "Блок появится после 3 отметок кожи.";
  const hasDoctorPattern = items.some((item) => item.acneCount > 0 && (item.hairLossCount ?? 0) > 0);
  if (hasDoctorPattern) return "📌 Акне и выпадение волос отмечались вместе. Если это повторяется, покажи график врачу.";
  const hasLateCycleAcne = items.some((item) => item.acneCount > 0 && item.cycleDay >= avgCycle - 3);
  if (hasLateCycleAcne) return "📌 Акне чаще всего появляется за 2–3 дня до месячных. Это может быть связано с гормональными изменениями.";
  return "📌 Mira пока собирает связь кожи с циклом. Продолжай отмечать кожу ещё несколько дней.";
}

function AnalyticsCycleDots({ item }: { item: CycleHistoryItem }) {
  const visibleLength = Math.min(Math.max(item.length, 8), 36);
  const dots = Array.from({ length: visibleLength }, (_, index) => {
    const day = index + 1;
    const isPeriod = day <= item.periodLength;
    const isToday = item.isCurrent && day === Math.min(item.length, visibleLength);
    const isFertile = !item.isCurrent && !item.isIrregular && day >= 10 && day <= 14;

    return (
      <span
        key={day}
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${
          isToday || isPeriod
            ? "bg-[#F9359E]"
            : isFertile
              ? "bg-[#84E600]"
              : "bg-[#6A5D57]"
        }`}
      />
    );
  });

  return <div className="mt-3 flex max-w-full gap-1.5 overflow-hidden">{dots}</div>;
}

function CycleHistoryModule({ summary }: { summary: CycleHistorySummary }) {
  const isStable = summary.fluctuationMax - summary.fluctuationMin <= 7;
  const totalNotes = summary.all.reduce((sum, item) => sum + item.noteCount, 0);
  const trendData = [...summary.completed].reverse().concat(summary.current).slice(-8);

  return (
    <SectionCard eyebrow="База циклов" title="История циклов" delay={62}>
      <div id="cycle-history" className="scroll-mt-8" />
      <div className="grid gap-3 md:grid-cols-4">
        {[
          ["Текущий", `${summary.current.length} дн.`],
          ["Средний", `${summary.averageLength} дн.`],
          ["Разброс", `${summary.fluctuationMin}–${summary.fluctuationMax}`],
          ["Отметки", `${totalNotes}`],
        ].map(([label, value]) => (
          <div key={label} className={`rounded-[18px] border px-4 py-3 ${darkInsetClass}`}>
            <p className="text-[11px] font-black uppercase tracking-wide text-[#8D817B]">{label}</p>
            <p className="mt-1 text-xl font-black text-[#F5F0ED]">{value}</p>
          </div>
        ))}
      </div>

      <div className={`mt-4 rounded-[18px] border px-4 py-4 ${darkInsetClass}`}>
        <div className="flex items-start gap-3">
          <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isStable ? "bg-[#252318] text-[#84E600]" : "bg-[#302B1B] text-[#FFB800]"}`}>
            {isStable ? <CheckCircle2 className="h-5 w-5" /> : "!"}
          </span>
          <div>
            <p className={`text-sm font-black ${isStable ? "text-[#1D8A49]" : "text-[#8A6500]"}`}>
              {isStable ? "Длина циклов выглядит стабильной" : "Есть заметные колебания"}
            </p>
            <p className="mt-1 text-sm font-semibold leading-relaxed text-[#B7AAA4]">
              {isStable
                ? "Главная страница показывает короткую выжимку, а здесь хранится вся база для сравнения."
                : "Колебания больше недели лучше сохранить в отчёте врачу, особенно если есть боль, задержки или обильность."}
            </p>
          </div>
        </div>
      </div>

      <div className={`mt-5 overflow-hidden rounded-[20px] border ${darkInsetClass}`}>
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#302927] text-[#F9359E]">
              <CalendarDays className="h-5 w-5" />
            </span>
            <div>
              <p className="text-base font-black text-[#F5F0ED]">Все циклы</p>
              <p className="text-xs font-bold text-[#B7AAA4]">Текущий и завершённые циклы из базы</p>
            </div>
          </div>
          <p className="text-xs font-black uppercase tracking-wide text-[#8D817B]">{summary.all.length} записей</p>
        </div>

        {summary.all.map((item) => (
          <div key={item.id} className="border-t border-[#342D2A] px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-black text-[#F5F0ED]">{item.title}</p>
                  {item.isCurrent && <StatBadge value="сейчас" tone="pink" />}
                  {item.isIrregular && <StatBadge value="колебание" tone="yellow" />}
                </div>
                <p className="mt-1 text-sm font-bold text-[#B7AAA4]">{item.range}</p>
                <AnalyticsCycleDots item={item} />
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[11px] font-black uppercase tracking-wide text-[#8D817B]">месячные</p>
                <p className="mt-1 text-lg font-black text-[#F5F0ED]">{item.periodLength} дн.</p>
                <p className="mt-1 text-xs font-bold text-[#B7AAA4]">{item.noteCount} отметок</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {trendData.length > 1 && (
        <details className={`mt-5 rounded-[18px] border p-4 ${darkInsetClass}`}>
          <summary className="cursor-pointer text-sm font-black text-[#84E600]">Показать мини-динамику</summary>
          <div className="mt-4 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData.map((item, index) => ({ label: item.isCurrent ? "тек." : `${index + 1}`, length: item.length }))} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="#EFE7EC" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: muted, fontSize: 12 }} />
                <YAxis domain={[18, 38]} tickLine={false} axisLine={false} tick={{ fill: muted, fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ border: 0, borderRadius: 16, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
                  formatter={(value) => [`${value} дней`, "Длина цикла"]}
                />
                <Line
                  type="monotone"
                  dataKey="length"
                  stroke={pink}
                  strokeWidth={4}
                  dot={{ r: 4, fill: pink, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: pink, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </details>
      )}
    </SectionCard>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className={`rounded-[20px] border border-dashed p-6 text-center ${darkInsetClass}`}>
      <p className="text-sm font-black text-[#F5F0ED]">{title}</p>
      <p className="mt-2 text-sm font-semibold leading-relaxed text-[#B7AAA4]">{body}</p>
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8D817B]">{children}</p>
  );
}

function StatBadge({
  value,
  trend,
  tone = "pink",
}: {
  value: string;
  trend?: "up" | "down";
  tone?: "pink" | "green" | "yellow" | "red";
}) {
  const toneMap: Record<string, string> = {
    pink: "bg-[#302927] text-[#F9359E]",
    green: "bg-[#252318] text-[#84E600]",
    yellow: "bg-[#302B1B] text-[#FFB800]",
    red: "bg-[#33201F] text-[#FF6B6B]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black ${toneMap[tone]}`}
    >
      {trend === "up" && <TrendingUp className="h-3.5 w-3.5" />}
      {trend === "down" && <TrendingDown className="h-3.5 w-3.5" />}
      {value}
    </span>
  );
}

function SkinCycleBars({ items, avgCycle }: { items?: SkinCyclePoint[]; avgCycle?: number }) {
  if (!items || items.length < 3) return null;

  const topItems = [...items].sort((a, b) => b.acneCount - a.acneCount).slice(0, 5);
  const max = Math.max(...topItems.map((item) => item.acneCount), 1);
  const sampleSize = topItems.reduce(
    (sum, item) => sum + item.acneCount + (item.drynessCount ?? 0) + (item.oilinessCount ?? 0) + (item.hairLossCount ?? 0),
    0
  );

  return (
    <InsightCard
      noticed="Акне чаще появляется в определённые дни цикла"
      why={getSkinCaption(items, avgCycle).replace("📌 ", "")}
      action="Отмечай кожу ещё 7 дней, особенно в конце цикла, чтобы Mira точнее подтвердила связь."
      sampleSize={sampleSize}
      delay={145}
      detailLabel="Показать дни с отметками кожи"
    >
      <div className="space-y-4">
        {topItems.map((item, index) => {
          const isPeak = index === 0;
          return (
            <div key={`${item.cycleDay}-${item.acneCount}`}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-[#1A1A1A]">
                  День {item.cycleDay}: Акне {isPeak ? "(пик)" : ""}
                </p>
                <p className="text-xs font-bold text-[#8E8E93]">{item.acneCount} раз</p>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[#F1ECF8]">
                <div
                  className="h-full rounded-full bg-[#8B6FB3]"
                  style={{ width: `${Math.max(12, (item.acneCount / max) * 100)}%` }}
                />
              </div>
              {(item.hairLossCount ?? 0) > 0 && (
                <p className="mt-1 text-xs font-bold text-[#FF6B6B]">+ выпадение волос: {item.hairLossCount} отметки</p>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-sm font-semibold text-[#8E8E93]">
        Используй это как наблюдение, а не как диагноз. Если симптом повторяется или тревожит, добавь его в отчёт врачу.
      </p>
    </InsightCard>
  );
}

function SectionCard({
  children,
  delay = 0,
  title,
  eyebrow,
}: {
  children: React.ReactNode;
  delay?: number;
  title?: string;
  eyebrow?: string;
}) {
  return (
    <Card
      className={`rounded-[22px] p-6 transition hover:-translate-y-0.5 ${darkCardClass}`}
      style={{ animation: `miraAnalyticsIn 420ms ease ${delay}ms both` }}
    >
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      {title && <h2 className={`text-xl font-black leading-snug text-[#F5F0ED] ${eyebrow ? "mt-2 mb-5" : "mb-5"}`}>{title}</h2>}
      {children}
    </Card>
  );
}

function SymptomBars({ symptoms }: { symptoms: SymptomPoint[] }) {
  if (!symptoms.length) {
    return <EmptyState title="Симптомов пока нет" body="Отметь симптомы 3–5 дней, и Mira покажет самые частые." />;
  }

  const max = Math.max(...symptoms.map((symptom) => symptom.count), 1);

  return (
    <div className="space-y-4">
      {symptoms.slice(0, 5).map((symptom) => (
        <div key={symptom.name}>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-[#F5F0ED]">{symptom.name}</p>
            <p className="text-xs font-bold text-[#8D817B]">{symptom.count} раз</p>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-[#342D2A]">
            <div
              className="h-full rounded-full bg-[#84E600]"
              style={{ width: `${Math.max(10, (symptom.count / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ExportButton({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick?: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-12 flex-1 rounded-[18px] border-[#342D2A] bg-[#251F1D] text-[#F5F0ED] hover:border-[#84E600]/45 hover:bg-[#2A2523]"
      onClick={onClick}
    >
      {icon}
      {label}
    </Button>
  );
}

function TopicMiniVisual({ topic, data }: { topic: AnalysisTopic; data: AnalyticsData }) {
  if (topic.chart === "line") {
    const points = data.cycleLengthData.length ? data.cycleLengthData.slice(-6) : [{ month: "с", length: data.avgCycle ?? 28 }];
    const min = Math.min(...points.map((item) => item.length), 24);
    const max = Math.max(...points.map((item) => item.length), 36);
    return (
      <div className="flex h-14 items-end gap-1.5">
        {points.map((item, index) => (
          <span
            key={`${item.month}-${index}`}
            className="w-full rounded-full bg-[#8B6FB3]/70"
            style={{ height: `${28 + ((item.length - min) / Math.max(1, max - min)) * 26}px` }}
          />
        ))}
      </div>
    );
  }

  if (topic.chart === "bar") {
    const points = topic.id === "period" ? data.flowData : data.symptoms.slice(0, 5).map((item) => ({ day: item.name, count: item.count }));
    const max = Math.max(...points.map((item) => item.count), 1);
    return (
      <div className="flex h-14 items-end gap-1.5">
        {points.slice(0, 7).map((item, index) => (
          <span
            key={`${item.day}-${index}`}
            className="w-full rounded-t-xl bg-[#6EDDE8]"
            style={{ height: `${12 + (item.count / max) * 42}px` }}
          />
        ))}
      </div>
    );
  }

  if (topic.chart === "dots") {
    const points = (data.skinData ?? []).slice(0, 10);
    return (
      <div className="grid h-14 grid-cols-10 content-end gap-1.5">
        {(points.length ? points : Array.from({ length: 10 }, (_, index) => ({ cycleDay: index + 1, acneCount: 0 }))).map((item, index) => (
          <span
            key={`${item.cycleDay}-${index}`}
            className={`h-3 rounded-full ${item.acneCount > 0 ? "bg-[#8B6FB3]" : "bg-[#ECE8EF]"}`}
          />
        ))}
      </div>
    );
  }

  if (topic.chart === "rings") {
    return (
      <div className="flex h-14 items-center gap-2">
        {[0.38, 0.56, 0.72].map((scale, index) => (
          <span
            key={scale}
            className="rounded-full border-[7px] border-[#F1E9FF]"
            style={{
              width: `${32 + index * 10}px`,
              height: `${32 + index * 10}px`,
              borderTopColor: index === 2 ? "#8B6FB3" : "#6EDDE8",
              transform: `rotate(${scale * 180}deg)`,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {[0, 1, 2].map((index) => (
        <div key={index} className="h-3 rounded-full bg-[#F1E9FF]">
          <div className="h-full rounded-full bg-[#8B6FB3]" style={{ width: `${80 - index * 18}%` }} />
        </div>
      ))}
    </div>
  );
}

function AnalysisTopicCard({ topic, data, onOpen }: { topic: AnalysisTopic; data: AnalyticsData; onOpen: () => void }) {
  const Icon = topic.icon;
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group flex min-h-[250px] flex-col rounded-[20px] p-5 text-left transition hover:-translate-y-0.5 active:scale-[0.99] ${darkCardClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#302927] text-[#F9359E]">
          <Icon className="h-5 w-5" />
        </span>
        <StatBadge value={statusLabel(topic.status)} tone={statusTone(topic.status)} />
      </div>
      <div className="mt-4">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8D817B]">{topic.label}</p>
        <h2 className="mt-1 text-xl font-black leading-tight text-[#F5F0ED]">{topic.title}</h2>
        <p className="mt-2 min-h-[44px] text-sm font-bold leading-relaxed text-[#B7AAA4]">{topic.headline}</p>
      </div>
      <div className={`mt-4 rounded-[18px] border p-4 ${darkInsetClass}`}>
        <TopicMiniVisual topic={topic} data={data} />
      </div>
      <div className="mt-auto flex items-end justify-between gap-3 pt-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#8D817B]">Основано на</p>
          <p className="mt-1 text-sm font-black text-[#F5F0ED]">{topic.metric}</p>
        </div>
        <span className="text-sm font-black text-[#84E600] group-hover:underline">Открыть</span>
      </div>
    </button>
  );
}

function TopicDetailChart({ topic, data, chartTick }: { topic: AnalysisTopic; data: AnalyticsData; chartTick: { fill: string; fontSize: number } }) {
  if (topic.id === "cycle") {
    return data.cycleLengthData.length ? (
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.cycleLengthData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="#F0E8EC" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={chartTick} />
            <YAxis domain={[25, 35]} tickLine={false} axisLine={false} tick={chartTick} />
            <Tooltip contentStyle={{ border: 0, borderRadius: 16, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }} formatter={(value) => [`${value} дней`, "Длина цикла"]} />
            <Line type="monotone" dataKey="length" stroke={pink} strokeWidth={4} dot={{ r: 4, fill: pink, strokeWidth: 0 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    ) : <EmptyState title="Нет истории циклов" body="Отметь первый день месячных, чтобы Mira построила график." />;
  }

  if (topic.id === "period") {
    return data.flowData.length ? (
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.flowData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="#F0E8EC" vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} tick={chartTick} />
            <YAxis domain={[0, 7]} tickLine={false} axisLine={false} tick={chartTick} />
            <Tooltip contentStyle={{ border: 0, borderRadius: 16, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }} formatter={(value) => [`${value}`, "Прокладки/тампоны"]} />
            <Bar dataKey="count" fill={pink} radius={[12, 12, 4, 4]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    ) : <EmptyState title="Нет обильности" body="Отмечай обильность в дни месячных, чтобы увидеть пик." />;
  }

  if (topic.id === "skin") {
    return <SkinCycleBars items={data.skinData} avgCycle={data.avgCycle} />;
  }

  return <SymptomBars symptoms={topic.id === "pms" ? data.symptoms.filter((item) => ["Вздутие", "Тревожность", "Тяга к сладкому", "Слабость"].includes(item.name)) : data.symptoms} />;
}

function AnalysisTopicModal({
  topic,
  data,
  chartTick,
  onClose,
  onOpenDoctorReport,
}: {
  topic: AnalysisTopic;
  data: AnalyticsData;
  chartTick: { fill: string; fontSize: number };
  onClose: () => void;
  onOpenDoctorReport?: () => void;
}) {
  const reliability = getReliability(topic.sampleSize);
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/35 p-0 backdrop-blur-sm sm:items-center sm:p-5">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-t-[34px] bg-[#FAF8F5] p-5 shadow-[0_-24px_70px_rgba(0,0,0,0.22)] sm:rounded-[34px] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Eyebrow>{topic.label}</Eyebrow>
            <h2 className="mt-2 text-3xl font-black leading-tight text-[#1A1A1A]">{topic.title}</h2>
            <p className="mt-2 text-sm font-bold leading-relaxed text-[#8E8E93]">{topic.headline}</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#1A1A1A]" aria-label="Закрыть">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="rounded-[28px] border-0 bg-white p-5">
            <p className="mb-4 text-sm font-black text-[#1A1A1A]">Данные</p>
            <TopicDetailChart topic={topic} data={data} chartTick={chartTick} />
          </Card>
          <div className="space-y-3">
            <InsightNote title="Что это значит" body={topic.note} />
            <InsightNote title="Надёжность" body={`${reliability.body} Основано на ${topic.sampleSize} отметках.`} />
            <InsightNote title="Что отметить дальше" body={topic.sampleSize < 5 ? "Отмечай это ещё 3–5 раз, чтобы Mira отделила случайность от повторения." : "Продолжай отмечать это рядом со сном, водой, стрессом и фазой цикла."} />
            <InsightNote title="Схема" body="Факт из Дневника или Контекста → повторение по дням → простое объяснение → при необходимости отчет врачу." />
            {topic.id === "doctor" && (
              <Button type="button" className="h-13 w-full rounded-[20px] bg-[#8B6FB3] text-white hover:bg-[#74599A]" onClick={onOpenDoctorReport}>
                <Stethoscope className="h-4 w-4" />
                Выбрать период и разделы
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SafetyCard({ redFlags, onOpenDoctorReport }: { redFlags: string[]; onOpenDoctorReport?: () => void }) {
  const hasFlags = redFlags.length > 0;

  return (
    <Card
      className={`rounded-[22px] p-6 ${darkCardClass}`}
      style={{ animation: "miraAnalyticsIn 420ms ease 40ms both" }}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#33201F] text-[#FF6B6B]">
          <Stethoscope className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <Eyebrow>Безопасность всегда видна</Eyebrow>
          <h2 className="mt-2 text-xl font-black text-[#F5F0ED]">
            {hasFlags ? "Это лучше обсудить с врачом" : "Когда не стоит терпеть"}
          </h2>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-[#B7AAA4]">
            Mira не ставит диагноз. Она помогает заметить симптомы, которые нельзя игнорировать.
          </p>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {(hasFlags
              ? redFlags
              : ["Резкая или очень сильная боль", "Обморок или сильная слабость", "Очень обильное кровотечение", "Кровь после секса"]
            ).map((flag) => (
              <div
                key={flag}
                className={`flex items-center gap-3 rounded-[18px] border px-4 py-3 text-sm font-bold text-[#F5F0ED] ${darkInsetClass}`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#33201F] text-[#FF6B6B]">
                  !
                </span>
                {flag}
              </div>
            ))}
          </div>
          <Button
            type="button"
            className="mt-5 w-full rounded-[18px] bg-[#FF6B6B] text-white hover:bg-[#EF5D5D] md:w-auto"
            onClick={onOpenDoctorReport}
          >
            📋 Подготовить для врача
          </Button>
        </div>
      </div>
    </Card>
  );
}

function AnalyticsPageComponent({
  datasets,
  onOpenDoctorReport,
}: AnalyticsPageProps) {
  const [period, setPeriod] = useState<PeriodKey>("3");
  const rawLogs = useMiraStore((state) => state.logs.dailyLogs);
  const cycle = useMiraStore((state) => state.cycle);
  const logs = useMemo(() => getSafeLogs(rawLogs), [rawLogs]);
  const realDatasets = useMemo<Partial<Record<PeriodKey, AnalyticsData>>>(() => {
    return periods.reduce((acc, item) => {
      acc[item.value] = buildDataFromLogs(logs, cycle, item.value);
      return acc;
    }, {} as Partial<Record<PeriodKey, AnalyticsData>>);
  }, [cycle, logs]);
  const data = useMemo(() => getDataset(period, datasets ?? realDatasets), [period, datasets, realDatasets]);
  const notesCount = getNotesCount(data);
  const notesNeeded = Math.max(0, 5 - notesCount);
  const topSymptom = data.symptoms[0];
  const hasEnoughData = notesCount >= 5;
  const reliability = getReliability(notesCount);
  const redFlags = data.redFlags;
  const mainAction = getPrimaryAnalyticsAction(data, notesCount);
  const nextAction = getNextAnalyticsAction(data, notesNeeded);
  const coreTopics = buildAnalysisTopics(data, notesCount).filter((topic) => ["cycle", "period", "pain", "mood", "sleep", "doctor"].includes(topic.id));

  function openDoctorReport() {
    if (onOpenDoctorReport) {
      onOpenDoctorReport();
      return;
    }
    if (typeof window !== "undefined") window.location.href = "/report";
  }

  function openTrack() {
    if (typeof window !== "undefined") window.location.href = "/track";
  }

  function handleMainAction() {
    if (mainAction.target === "track") openTrack();
    else openDoctorReport();
  }

  return (
    <main className="min-h-screen bg-[#050505] px-5 py-6 text-[#F5F0ED]">
      <style jsx global>{`
        @keyframes miraAnalyticsIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="mx-auto max-w-3xl space-y-5">
        <header className={`rounded-[22px] p-5 ${darkCardClass}`}>
          <Eyebrow>Анализ</Eyebrow>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#F5F0ED]">Что Mira заметила</h1>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-[#B7AAA4]">
            Наблюдения по твоим отметкам из Трека. Не диагноз.
          </p>
        </header>

        <Tabs value={period} onValueChange={(value) => setPeriod(value as PeriodKey)}>
          <TabsList className={`grid w-full grid-cols-2 gap-1 rounded-[20px] border p-1 md:grid-cols-4 ${darkCardClass}`}>
            {periods.map((item) => (
              <TabsTrigger key={item.value} value={item.value} className="h-11 rounded-[16px] data-[state=active]:bg-[#84E600] data-[state=active]:text-[#11100F]">
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <SectionCard delay={8}>
          <div className="flex flex-col gap-4">
            <div className={`rounded-[20px] border p-5 ${darkInsetClass}`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8D817B]">Главное сейчас</p>
                  <h2 className="mt-2 text-2xl font-black leading-tight text-[#F5F0ED]">
                    {getMainInsightTitle(data, notesCount)}
                  </h2>
                  <p className="mt-3 text-sm font-semibold leading-relaxed text-[#B7AAA4]">
                    {getMainInsightBody(data, notesCount, notesNeeded)}
                  </p>
                </div>
                <StatBadge value={reliability.label} tone={reliability.tone} />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <InsightNote title="Что сделать" body={nextAction} />
                <InsightNote title="Основано на" body={`${notesCount} ${notesCount === 1 ? "факте" : notesCount > 1 && notesCount < 5 ? "фактах" : "фактах"} из Track`} />
              </div>
              <Button type="button" className={`mt-5 h-14 w-full rounded-[18px] text-sm font-black ${limeButtonClass}`} onClick={handleMainAction}>
                {mainAction.target === "track" ? <Activity className="h-4 w-4" /> : <Stethoscope className="h-4 w-4" />}
                {mainAction.label}
              </Button>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="База анализа" delay={12}>
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              ["Дни", `${logs.length}`, "green"],
              ["Отметки", `${notesCount}`, reliability.tone],
              ["Циклы", `${data.trackedCycles}`, "pink"],
              ["Надежность", reliability.label, reliability.tone],
            ].map(([label, value, tone]) => (
              <div key={label} className={`rounded-[18px] border p-4 ${darkInsetClass}`}>
                <p className="text-[10px] font-black uppercase tracking-wide text-[#8D817B]">{label}</p>
                <p className="mt-2 text-2xl font-black text-[#F5F0ED]">{value}</p>
                <div className={`mt-3 h-1.5 rounded-full ${
                  tone === "green" ? "bg-[#84E600]" : tone === "yellow" ? "bg-[#FFB800]" : tone === "red" ? "bg-[#FF6B6B]" : "bg-[#F9359E]"
                }`} />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title={hasEnoughData ? "Повторы по отметкам" : "Пока собираем данные"} delay={16}>
          {topSymptom ? (
            <div className="space-y-3">
              {data.symptoms.slice(0, 3).map((symptom) => (
                <div key={symptom.name} className={`flex items-center justify-between gap-3 rounded-[18px] border p-4 ${darkInsetClass}`}>
                  <span className="text-sm font-black text-[#F5F0ED]">{symptom.name}</span>
                  <span className="rounded-full bg-[#252318] px-3 py-1 text-xs font-black text-[#84E600]">{symptom.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Недостаточно отметок" body={`Нужно ещё ${notesNeeded} для первых повторов.`} />
          )}
        </SectionCard>

        <SectionCard title="MVP-темы" delay={20}>
          <div className="grid gap-3 sm:grid-cols-2">
            {coreTopics.map((topic) => (
              <div key={topic.id} className={`rounded-[18px] border p-4 ${darkInsetClass}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-[#F5F0ED]">{topic.title}</p>
                    <p className="mt-1 text-xs font-semibold leading-relaxed text-[#B7AAA4]">{topic.headline}</p>
                  </div>
                  <StatBadge value={statusLabel(topic.status)} tone={statusTone(topic.status)} />
                </div>
                <p className="mt-3 text-[11px] font-bold text-[#8D817B]">
                  Основано на {topic.sampleSize} {topic.sampleSize === 1 ? "отметке" : "отметках"}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title={redFlags.length ? "Красные флаги" : "Для отчёта"} delay={24}>
          {redFlags.length ? (
            <div className="space-y-2">
              {redFlags.slice(0, 3).map((flag) => (
                <div key={flag} className={`flex items-center gap-3 rounded-[18px] border p-4 ${darkInsetClass}`}>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#33201F] text-sm font-black text-[#FF6B6B]">!</span>
                  <span className="text-sm font-bold text-[#F5F0ED]">{flag}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className={`rounded-[18px] border p-4 ${darkInsetClass}`}>
              <p className="text-sm font-black text-[#F5F0ED]">Можно собрать спокойный отчёт</p>
              <p className="mt-1 text-sm font-semibold text-[#8D817B]">
                {notesCount} фактов можно перенести в Report. Секс и личные заметки останутся выключены по умолчанию.
              </p>
            </div>
          )}
          <Button type="button" className={`mt-4 h-14 w-full rounded-[18px] text-sm font-black ${limeButtonClass}`} onClick={openDoctorReport}>
            <Stethoscope className="h-4 w-4" />
            Собрать отчёт врачу
          </Button>
        </SectionCard>

        <SectionCard title="Что продолжать отмечать" delay={32}>
          <div className="grid gap-2 sm:grid-cols-3">
            {["Месячные", "Боль", "Сон / настроение"].map((item) => (
              <div key={item} className={`rounded-[18px] border px-4 py-3 text-sm font-black text-[#F5F0ED] ${darkInsetClass}`}>
                {item}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </main>
  );
}

export const AnalyticsPage = memo(AnalyticsPageComponent);
AnalyticsPage.displayName = "AnalyticsPage";

export default AnalyticsPage;
