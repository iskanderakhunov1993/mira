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
  Bell,
  Droplets,
  FileText,
  Mail,
  Settings,
  Sparkles,
  Stethoscope,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMiraStore } from "@/store";
import type { CycleState, DailyLog } from "@/store/types";

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

const pink = "#E872A0";
const bg = "#FAF8F5";
const text = "#1A1A1A";
const muted = "#8E8E93";
const green = "#34C759";
const yellow = "#FFB800";
const red = "#FF6B6B";

const periods: Array<{ value: PeriodKey; label: string }> = [
  { value: "current", label: "Текущий цикл" },
  { value: "3", label: "3 цикла" },
  { value: "6", label: "6 циклов" },
  { value: "12", label: "12 циклов" },
];

const mockData: Record<PeriodKey, AnalyticsData> = {
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
    cycleLengthData: [
      { month: "Д", length: 29 },
      { month: "Ф", length: 28 },
      { month: "М", length: 30 },
      { month: "А", length: 29 },
      { month: "М", length: 31 },
      { month: "И", length: 28 },
      { month: "И", length: 30 },
      { month: "А", length: 29 },
      { month: "С", length: 28 },
    ],
    flowData: [
      { day: "Д1", count: 4 },
      { day: "Д2", count: 6 },
      { day: "Д3", count: 5 },
      { day: "Д4", count: 3 },
      { day: "Д5", count: 2 },
      { day: "Д6", count: 1 },
      { day: "Д7", count: 0 },
    ],
    symptoms: [
      { name: "Вздутие", count: 8 },
      { name: "Тревожность", count: 6 },
      { name: "Головная боль", count: 5 },
      { name: "Тяга к сладкому", count: 4 },
      { name: "Слабость", count: 3 },
    ],
    skinData: [
      { cycleDay: 26, acneCount: 5 },
      { cycleDay: 25, acneCount: 3 },
      { cycleDay: 27, acneCount: 2 },
      { cycleDay: 12, acneCount: 1 },
    ],
    factors: [
      "Стресс → Задержка (3 случая)",
      "Мало воды → Головная боль (6 случаев)",
      "Плохой сон → Низкая энергия (5 случаев)",
    ],
    redFlags: ["Обильное кровотечение", "Сильная слабость"],
    periodStart: "14 июля",
    periodEnd: "16 июля",
    avgCycle: 29,
    peakDay: "Д2",
    peakCount: 6,
    normalCount: 4,
    trackedCycles: 3,
  },
  "6": {
    cycleLengthData: [
      { month: "Д", length: 29 },
      { month: "Ф", length: 28 },
      { month: "М", length: 30 },
      { month: "А", length: 33 },
      { month: "М", length: 31 },
      { month: "И", length: 28 },
      { month: "И", length: 30 },
      { month: "А", length: 29 },
      { month: "С", length: 28 },
    ],
    flowData: [
      { day: "Д1", count: 4 },
      { day: "Д2", count: 7 },
      { day: "Д3", count: 5 },
      { day: "Д4", count: 3 },
      { day: "Д5", count: 2 },
      { day: "Д6", count: 1 },
      { day: "Д7", count: 1 },
    ],
    symptoms: [
      { name: "Вздутие", count: 14 },
      { name: "Тревожность", count: 11 },
      { name: "Головная боль", count: 9 },
      { name: "Слабость", count: 8 },
      { name: "Боль внизу живота", count: 7 },
    ],
    skinData: [
      { cycleDay: 26, acneCount: 8, oilinessCount: 4 },
      { cycleDay: 25, acneCount: 5 },
      { cycleDay: 27, acneCount: 4 },
      { cycleDay: 12, acneCount: 2 },
      { cycleDay: 28, acneCount: 2, hairLossCount: 1 },
    ],
    factors: [
      "Стресс → Задержка (4 случая)",
      "Мало воды → Головная боль (9 случаев)",
      "Плохой сон → Слабость (8 случаев)",
    ],
    redFlags: ["Обильное кровотечение", "Сильная слабость"],
    periodStart: "14 июля",
    periodEnd: "17 июля",
    avgCycle: 30,
    peakDay: "Д2",
    peakCount: 7,
    normalCount: 4,
    trackedCycles: 6,
  },
  "12": {
    cycleLengthData: [
      { month: "Д", length: 29 },
      { month: "Ф", length: 28 },
      { month: "М", length: 30 },
      { month: "А", length: 35 },
      { month: "М", length: 31 },
      { month: "И", length: 28 },
      { month: "И", length: 30 },
      { month: "А", length: 29 },
      { month: "С", length: 28 },
    ],
    flowData: [
      { day: "Д1", count: 4 },
      { day: "Д2", count: 8 },
      { day: "Д3", count: 6 },
      { day: "Д4", count: 4 },
      { day: "Д5", count: 2 },
      { day: "Д6", count: 1 },
      { day: "Д7", count: 1 },
    ],
    symptoms: [
      { name: "Вздутие", count: 24 },
      { name: "Тревожность", count: 19 },
      { name: "Головная боль", count: 16 },
      { name: "Слабость", count: 14 },
      { name: "Тяга к сладкому", count: 12 },
    ],
    skinData: [
      { cycleDay: 26, acneCount: 12, oilinessCount: 6 },
      { cycleDay: 25, acneCount: 8 },
      { cycleDay: 27, acneCount: 6 },
      { cycleDay: 12, acneCount: 3 },
      { cycleDay: 28, acneCount: 4, hairLossCount: 2 },
    ],
    factors: [
      "Стресс → Задержка (6 случаев)",
      "Мало воды → Головная боль (16 случаев)",
      "Плохой сон → Низкая энергия (14 случаев)",
    ],
    redFlags: ["Обильное кровотечение", "Сильная слабость"],
    periodStart: "14 июля",
    periodEnd: "17 июля",
    avgCycle: 30,
    peakDay: "Д2",
    peakCount: 8,
    normalCount: 4,
    trackedCycles: 12,
  },
};

function getDataset(period: PeriodKey, datasets?: Partial<Record<PeriodKey, AnalyticsData>>) {
  return datasets?.[period] ?? mockData[period];
}

function getMonthShort(date: string, fallback: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toLocaleDateString("ru-RU", { month: "short" }).slice(0, 1).toUpperCase();
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
  const trackedCycles = Math.max(1, period === "current" ? 1 : Math.min(Number(period), Math.ceil(periodLogs.length / cycle.averageLength)));
  const cycleLengthData =
    cycle.cycles.length > 0
      ? cycle.cycles.slice(-trackedCycles).map((item, index) => ({
          month: getMonthShort(item.startDate, `Ц${index + 1}`),
          length: item.length,
        }))
      : period === "current"
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

function InsightNote({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[20px] bg-[#FAF8F5] px-4 py-3">
      <p className="text-xs font-black uppercase tracking-wide text-[#8E8E93]">{title}</p>
      <p className="mt-1 text-sm font-bold leading-relaxed text-[#1A1A1A]">{body}</p>
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

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-[#E8DDE3] bg-[#FAF8F5] p-6 text-center">
      <p className="text-sm font-black text-[#1A1A1A]">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-[#8E8E93]">{body}</p>
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8E8E93]">{children}</p>
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
    pink: "bg-[#FFF0F5] text-[#E872A0]",
    green: "bg-[#EAFBF0] text-[#34C759]",
    yellow: "bg-[#FFF7E5] text-[#B97900]",
    red: "bg-[#FFF0F0] text-[#FF6B6B]",
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

  return (
    <SectionCard eyebrow="Что повторяется" title="Когда чаще всего появляется акне" delay={145}>
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
              <div className="h-3 overflow-hidden rounded-full bg-[#F5EDF1]">
                <div
                  className="h-full rounded-full bg-[#E872A0]"
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
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <InsightNote title="Что это значит" body={getSkinCaption(items, avgCycle).replace("📌 ", "")} />
        <InsightNote title="Что сделать" body="Отмечай кожу ещё 7 дней, особенно в конце цикла, чтобы Mira точнее подтвердила связь." />
      </div>
      <p className="mt-3 text-sm font-semibold text-[#8E8E93]">
        📖 Статья: <a className="font-black text-[#E872A0]" href="/article/acne">Почему перед месячными выскакивают прыщи</a>
      </p>
    </SectionCard>
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
      className="mira-card rounded-[30px] border-0 p-6 transition hover:-translate-y-0.5 hover:shadow-[0_26px_70px_rgba(76,66,126,0.14)]"
      style={{ animation: `miraAnalyticsIn 420ms ease ${delay}ms both` }}
    >
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      {title && <h2 className={`text-xl font-black leading-snug text-[#1A1A1A] ${eyebrow ? "mt-2 mb-5" : "mb-5"}`}>{title}</h2>}
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
            <p className="text-sm font-bold text-[#1A1A1A]">{symptom.name}</p>
            <p className="text-xs font-bold text-[#8E8E93]">{symptom.count} раз</p>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-[#F5EDF1]">
            <div
              className="h-full rounded-full bg-[#E872A0]"
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
      className="h-12 flex-1 rounded-[20px] border-[#E8DDE3] bg-white text-[#1A1A1A] hover:border-[#E872A0]/50 hover:bg-[#FFF4F8]"
      onClick={onClick}
    >
      {icon}
      {label}
    </Button>
  );
}

function SafetyCard({ redFlags, onOpenDoctorReport }: { redFlags: string[]; onOpenDoctorReport?: () => void }) {
  const hasFlags = redFlags.length > 0;

  return (
    <Card
      className={`rounded-[30px] border-0 p-6 shadow-[0_22px_56px_rgba(255,107,107,0.12)] ${
        hasFlags ? "bg-[#FFF0F0]" : "bg-white"
      }`}
      style={{ animation: "miraAnalyticsIn 420ms ease 40ms both" }}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#FF6B6B] shadow-[0_6px_20px_rgba(255,107,107,0.12)]">
          <Stethoscope className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <Eyebrow>Безопасность всегда видна</Eyebrow>
          <h2 className="mt-2 text-xl font-black text-[#1A1A1A]">
            {hasFlags ? "Это лучше обсудить с врачом" : "Когда не стоит терпеть"}
          </h2>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-[#8E8E93]">
            Mira не ставит диагноз. Она помогает заметить симптомы, которые нельзя игнорировать.
          </p>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {(hasFlags
              ? redFlags
              : ["Резкая или очень сильная боль", "Обморок или сильная слабость", "Очень обильное кровотечение", "Кровь после секса"]
            ).map((flag) => (
              <div
                key={flag}
                className="flex items-center gap-3 rounded-[20px] bg-white px-4 py-3 text-sm font-bold text-[#1A1A1A]"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FFF0F0] text-[#FF6B6B]">
                  !
                </span>
                {flag}
              </div>
            ))}
          </div>
          <Button
            type="button"
            className="mt-5 w-full rounded-[20px] bg-[#FF6B6B] text-white hover:bg-[#EF5D5D] md:w-auto"
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
  onExportPdf,
  onExportTxt,
  onSendToSelf,
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
  const hasEnoughForForecast = data.trackedCycles >= 2;
  const chartTick = { fill: muted, fontSize: 12 };
  const confidence = getConfidencePercent(data.trackedCycles);
  const notesCount = getNotesCount(data);
  const notesNeeded = getMoreNotesNeeded(data);
  const mainInsight = getMainInsight(data);
  const nextAction = getNextAnalyticsAction(data, notesNeeded);
  const isCurrentEducational = period === "current" && getNotesCount(data) < 8;

  const doctorPhrases = useMemo(() => {
    const cyclesText = data.trackedCycles === 1 ? "1 месяц" : `${data.trackedCycles} месяца`;
    return [
      `"Я трекаю цикл ${cyclesText}. Вот данные."`,
      data.peakDay && data.peakCount
        ? `"В ${data.peakDay} у меня ${data.peakCount} прокладок/тампонов, обычно норма около ${data.normalCount ?? 4}."`
        : `"Я пока не вижу пик обильности, но хочу показать записи."`,
      data.symptoms[0]
        ? `"Чаще всего повторяется симптом: ${data.symptoms[0].name} (${data.symptoms[0].count} раз)."`
        : `"Я хочу обсудить симптомы, которые начала отмечать."`,
    ];
  }, [data]);

  return (
    <main className="mira-screen px-5 py-6 text-[#202033]">
      <style jsx global>{`
        @keyframes miraAnalyticsIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div className="mx-auto max-w-6xl">
        {/* Хедер */}
        <header className="flex items-center justify-between gap-4">
          <div>
            <Eyebrow>Личная аналитика</Eyebrow>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-[#202033]">Аналитика</h1>
            <p className="mt-1 text-sm leading-relaxed text-[#8E8E93]">
              Mira показывает, что повторяется в цикле, симптомах и самочувствии.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="mira-card flex h-11 w-11 items-center justify-center rounded-2xl text-[#202033]"
              aria-label="Уведомления"
            >
              <Bell className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="mira-card flex h-11 w-11 items-center justify-center rounded-2xl text-[#202033]"
              aria-label="Настройки"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Переключатель периода */}
        <Tabs value={period} onValueChange={(value) => setPeriod(value as PeriodKey)} className="mt-6">
          <TabsList className="mira-card grid w-full grid-cols-2 gap-1 rounded-[24px] p-1 md:grid-cols-4">
            {periods.map((item) => (
              <TabsTrigger key={item.value} value={item.value} className="h-11">
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="mt-6 space-y-6">
          {/* Прогноз */}
          <Card className="mira-gradient-health overflow-hidden rounded-[34px] border-0 p-6 text-white shadow-[0_28px_72px_rgba(122,101,242,0.26)]" style={{ animation: "miraAnalyticsIn 420ms ease 20ms both" }}>
            <div className="grid gap-6 lg:grid-cols-[1fr_220px] lg:items-center">
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/70">Что Mira заметила</p>
                {hasEnoughForForecast ? (
                  <>
                    <h2 className="mt-2 text-3xl font-black leading-tight text-white">{mainInsight}</h2>
                    <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-white/78">
                      Это помогает заранее снизить нагрузку, подготовить заботу и понять, что стоит показать врачу.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white/18 px-3 py-1 text-xs font-black text-white">
                        месячные: {data.periodStart}–{data.periodEnd}
                      </span>
                      <span className="rounded-full bg-white/18 px-3 py-1 text-xs font-black text-white">через 4 дня</span>
                      <span className="rounded-full bg-white/18 px-3 py-1 text-xs font-black text-white">
                        {confidence}% уверенность
                      </span>
                    </div>
                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      <div className="rounded-[22px] bg-white/16 p-4 backdrop-blur">
                        <p className="text-xs font-bold uppercase tracking-wide text-white/65">Насколько надёжно</p>
                        <p className="mt-1 text-sm font-black text-white">
                          Основано на {data.trackedCycles} циклах и {notesCount} отметках.
                        </p>
                      </div>
                      <div className="rounded-[22px] bg-white/16 p-4 backdrop-blur">
                        <p className="text-xs font-bold uppercase tracking-wide text-white/65">Что сделать дальше</p>
                        <p className="mt-1 text-sm font-black text-white">{nextAction}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <EmptyState
                    title="Недостаточно данных для прогноза"
                    body="Нужно больше данных. Продолжай отмечать дни, и Mira начнёт строить прогноз."
                  />
                )}
              </div>
              <div className="mx-auto flex h-[190px] w-[190px] items-center justify-center rounded-full bg-white/14 p-4 backdrop-blur">
                <div className="flex h-full w-full flex-col items-center justify-center rounded-full border-[12px] border-white/35 text-center">
                  <Sparkles className="mb-2 h-7 w-7 text-[#DFFBFF]" />
                  <p className="text-4xl font-black leading-none">{confidence}%</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wide text-white/70">уверенность</p>
                </div>
              </div>
            </div>
          </Card>

          <SafetyCard redFlags={data.redFlags} onOpenDoctorReport={onOpenDoctorReport} />

          {isCurrentEducational && (
            <SectionCard eyebrow="Текущий цикл" title="Пока мало данных для выводов" delay={48}>
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  ["Что это значит", "Mira видит только текущие отметки. Это ещё не закономерность."],
                  ["Что сделать", "Добавь месячные, боль, настроение, сон или заботу 3–5 дней."],
                  ["Что получишь", "После первых отметок появятся честные выводы: что повторяется и что показать врачу."],
                ].map(([title, body]) => (
                  <div key={title} className="rounded-[22px] bg-[#FAF8F5] p-4">
                    <p className="text-sm font-black text-[#1A1A1A]">{title}</p>
                    <p className="mt-1 text-xs font-semibold leading-relaxed text-[#8E8E93]">{body}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          <SectionCard eyebrow="Что делать дальше" title="3 простых шага" delay={55}>
            <div className="grid gap-3 md:grid-cols-3">
              {[
                ["1", "Отмечай состояние", "3–5 дней подряд достаточно, чтобы Mira нашла первые повторения."],
                ["2", "Смотри, что повторяется", "Симптомы важнее отдельных графиков: Mira объяснит, почему это может быть важно."],
                ["3", "Покажи врачу факты", "Если есть боль, обильность или задержки, открой отчёт и выбери, что включить."],
              ].map(([number, title, body]) => (
                <div key={number} className="rounded-[22px] bg-[#FAF8F5] p-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-black text-[#E872A0] shadow-[0_2px_8px_rgba(0,0,0,0.06)]">{number}</span>
                  <p className="mt-3 text-sm font-black text-[#1A1A1A]">{title}</p>
                  <p className="mt-1 text-xs font-semibold leading-relaxed text-[#8E8E93]">{body}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Длина цикла */}
            <SectionCard eyebrow="Как обычно у тебя" delay={70}>
              {data.cycleLengthData.length ? (
                <>
                  <h2 className="text-xl font-black leading-snug text-[#1A1A1A]">
                    Твой средний цикл —{" "}
                    <span className="text-[#E872A0]">{data.avgCycle ?? "—"} дней</span>
                  </h2>
                  <div className="mt-4 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.cycleLengthData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                        <CartesianGrid stroke="#F0E8EC" vertical={false} />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={chartTick} />
                        <YAxis domain={[25, 35]} tickLine={false} axisLine={false} tick={chartTick} />
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
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <InsightNote title="Что это значит" body={getCycleCaption(data.cycleLengthData).replace("✅ ", "").replace("🟡 ", "").replace("🔴 ", "")} />
                    <InsightNote title="Что сделать" body="Продолжай отмечать первый день месячных, чтобы Mira точнее считала задержки и прогноз." />
                  </div>
                </>
              ) : (
                <EmptyState title="Начни трекать цикл" body="Добавь даты месячных, чтобы увидеть длину цикла." />
              )}
            </SectionCard>

            {/* Обильность */}
            <SectionCard eyebrow="Что повторяется" delay={120}>
              {data.flowData.length ? (
                <>
                  <h2 className="text-xl font-black leading-snug text-[#1A1A1A]">
                    Пик обильности —{" "}
                    <span className="text-[#E872A0]">{data.peakDay ?? "—"}</span>
                  </h2>
                  <div className="mt-4 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.flowData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                        <CartesianGrid stroke="#F0E8EC" vertical={false} />
                        <XAxis dataKey="day" tickLine={false} axisLine={false} tick={chartTick} />
                        <YAxis domain={[0, 7]} tickLine={false} axisLine={false} tick={chartTick} />
                        <Tooltip
                          contentStyle={{ border: 0, borderRadius: 16, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
                          formatter={(value) => [`${value}`, "Прокладки/тампоны"]}
                        />
                        <Bar dataKey="count" fill={pink} radius={[12, 12, 4, 4]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
                    <InsightNote title="Что это значит" body={getFlowCaption(data).replace("📌 ", "").replace("🟡 ", "").replace("🔴 ", "")} />
                    <div className="flex min-w-[88px] items-center justify-center rounded-[20px] bg-[#FAF8F5] px-4 py-3">
                      {data.peakCount !== undefined && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-black text-[#E872A0] shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                          <Droplets className="h-3.5 w-3.5" />
                          {data.peakCount}
                        </span>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <InsightNote title="Что сделать" body="Если пик обильности растёт или мешает жить, добавь эти данные в отчёт врачу." />
                    </div>
                  </div>
                </>
              ) : (
                <EmptyState title="Нет данных об обильности" body="Отмечай обильность в дни месячных." />
              )}
            </SectionCard>
          </div>

          <SkinCycleBars items={data.skinData} avgCycle={data.avgCycle} />

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Факторы влияния */}
            {data.factors.length > 0 && (
              <SectionCard eyebrow="Что влияет на самочувствие" title="Что может ухудшать состояние" delay={170}>
                <div className="space-y-3">
                  {data.factors.slice(0, 3).map((factor) => {
                    const sampleSize = getSampleSizeFromText(factor);
                    const tone = getSampleTone(sampleSize) as "green" | "yellow" | "red";

                    return (
                      <div key={factor} className="rounded-[20px] bg-[#FAF8F5] px-4 py-3">
                        <div className="flex items-start gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-base shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                            📉
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-bold text-[#1A1A1A]">{factor}</p>
                              <StatBadge value={sampleSize ? `n=${sampleSize}` : "n мало"} tone={tone} />
                            </div>
                            <p className="mt-1 text-xs font-semibold leading-relaxed text-[#8E8E93]">
                              {getSampleExplanation(sampleSize)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            )}

            {/* Частые симптомы */}
            <SectionCard eyebrow="Что повторяется" title="Частые симптомы" delay={220}>
              <SymptomBars symptoms={data.symptoms} />
            </SectionCard>
          </div>

          {/* Отчёт врачу */}
          <Card
            className="overflow-hidden rounded-[34px] border-0 bg-white p-0 shadow-[0_28px_72px_rgba(232,114,160,0.18)]"
            style={{ animation: "miraAnalyticsIn 420ms ease 320ms both" }}
          >
            <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="mira-gradient-cycle p-6 text-white">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/70">Главная польза аналитики</p>
                <h2 className="mt-2 text-3xl font-black leading-tight">Подготовить визит к врачу</h2>
                <p className="mt-3 text-sm font-semibold leading-relaxed text-white/78">
                  Mira переводит отметки в факты: даты, повторы, обильность, симптомы и вопросы врачу.
                </p>
                <div className="mt-5 grid gap-3">
                  <div className="rounded-[22px] bg-white/16 p-4 backdrop-blur">
                    <p className="text-xs font-bold uppercase tracking-wide text-white/65">Что включено</p>
                    <p className="mt-1 text-sm font-black text-white">
                      {data.trackedCycles} циклов, {notesCount} отметок, {data.redFlags.length || "нет"} тревожных сигналов.
                    </p>
                  </div>
                  <div className="rounded-[22px] bg-white/16 p-4 backdrop-blur">
                    <p className="text-xs font-bold uppercase tracking-wide text-white/65">Приватность</p>
                    <p className="mt-1 text-sm font-black text-white">Личные заметки скрыты, пока ты сама их не включишь.</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <Eyebrow>Фразы для врача</Eyebrow>
                <div className="mt-4 space-y-3">
                  {doctorPhrases.map((phrase, index) => (
                    <div
                      key={phrase}
                      className="flex items-start gap-3 rounded-[20px] bg-[#FAF8F5] px-4 py-3 text-sm font-semibold leading-relaxed text-[#1A1A1A]"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-[#E872A0] shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                        {index + 1}
                      </span>
                      {phrase}
                    </div>
                  ))}
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <ExportButton label="PDF" icon={<FileText className="h-4 w-4" />} onClick={onExportPdf} />
                  <ExportButton label="TXT" icon={<FileText className="h-4 w-4" />} onClick={onExportTxt} />
                  <ExportButton label="Отправить себе" icon={<Mail className="h-4 w-4" />} onClick={onSendToSelf} />
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
            <div className="rounded-2xl bg-white px-3 py-2 text-[#34C759] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">Норма</div>
            <div className="rounded-2xl bg-white px-3 py-2 text-[#B97900] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">Внимание</div>
            <div className="rounded-2xl bg-white px-3 py-2 text-[#FF6B6B] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">К врачу</div>
          </div>
        </div>
      </div>
    </main>
  );
}

export const AnalyticsPage = memo(AnalyticsPageComponent);
AnalyticsPage.displayName = "AnalyticsPage";

export default AnalyticsPage;
