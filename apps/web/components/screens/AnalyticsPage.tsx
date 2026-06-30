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
import { Bell, FileText, Mail, Settings, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    cycleLengthData: [
      { month: "И", length: 29 },
      { month: "А", length: 28 },
      { month: "С", length: 30 },
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
      { name: "Вздутие", count: 3 },
      { name: "Тревожность", count: 2 },
      { name: "Головная боль", count: 1 },
    ],
    skinData: [
      { cycleDay: 26, acneCount: 2 },
      { cycleDay: 12, acneCount: 1 },
    ],
    factors: ["Мало воды → Головная боль (2 случая)"],
    redFlags: ["Обильное кровотечение"],
    periodStart: "14 июля",
    periodEnd: "16 июля",
    avgCycle: 29,
    peakDay: "Д2",
    peakCount: 6,
    normalCount: 4,
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
    <div className="rounded-2xl border border-dashed border-[#E8DDE3] bg-[#FAF8F5] p-6 text-center">
      <p className="text-sm font-black text-[#1A1A1A]">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-[#8E8E93]">{body}</p>
    </div>
  );
}

function SkinCycleBars({ items, avgCycle }: { items?: SkinCyclePoint[]; avgCycle?: number }) {
  if (!items || items.length < 3) return null;

  const topItems = [...items].sort((a, b) => b.acneCount - a.acneCount).slice(0, 5);
  const max = Math.max(...topItems.map((item) => item.acneCount), 1);

  return (
    <SectionCard title="🧴 Кожа и цикл" delay={145}>
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
      <p className="mt-4 rounded-2xl bg-[#FAF8F5] px-4 py-3 text-sm font-bold leading-relaxed text-[#1A1A1A]">
        {getSkinCaption(items, avgCycle)}
      </p>
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
}: {
  children: React.ReactNode;
  delay?: number;
  title?: string;
}) {
  return (
    <Card
      className="rounded-2xl border-0 bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(0,0,0,0.07)]"
      style={{ animation: `miraAnalyticsIn 420ms ease ${delay}ms both` }}
    >
      {title && <h2 className="mb-5 text-lg font-black text-[#1A1A1A]">{title}</h2>}
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
      className="h-12 flex-1 rounded-2xl border-[#E8DDE3] bg-white text-[#1A1A1A] hover:border-[#E872A0]/50 hover:bg-[#FFF4F8]"
      onClick={onClick}
    >
      {icon}
      {label}
    </Button>
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
  const data = useMemo(() => getDataset(period, datasets), [period, datasets]);
  const hasEnoughForForecast = data.trackedCycles >= 2;
  const chartTick = { fill: muted, fontSize: 12 };

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
    <main className="min-h-screen bg-[#FAF8F5] px-5 py-6 text-[#1A1A1A]">
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
            <h1 className="text-3xl font-black tracking-tight text-[#1A1A1A]">📊 Аналитика</h1>
            <p className="mt-1 text-sm leading-relaxed text-[#8E8E93]">
              Mira показывает, что повторяется в цикле, симптомах и самочувствии.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#1A1A1A] shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
              aria-label="Уведомления"
            >
              <Bell className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#1A1A1A] shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
              aria-label="Настройки"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Переключатель периода */}
        <Tabs value={period} onValueChange={(value) => setPeriod(value as PeriodKey)} className="mt-6">
          <TabsList className="grid w-full grid-cols-2 gap-1 rounded-2xl bg-white p-1 shadow-[0_4px_12px_rgba(0,0,0,0.05)] md:grid-cols-4">
            {periods.map((item) => (
              <TabsTrigger key={item.value} value={item.value} className="h-11">
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="mt-6 space-y-6">
          {/* Прогноз */}
          <SectionCard delay={20}>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFF0F5] text-2xl">🔮</div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-widest text-[#8E8E93]">Прогноз</p>
                {hasEnoughForForecast ? (
                  <>
                    <h2 className="mt-2 text-2xl font-black text-[#1A1A1A]">
                      📅 {data.periodStart}–{data.periodEnd} <span className="text-base text-[#8E8E93]">(через 4 дня)</span>
                    </h2>
                    <div className="mt-4 space-y-2 text-sm leading-relaxed text-[#1A1A1A]">
                      <p>📌 Симптомы за 3 дня до: {data.symptoms.slice(0, 2).map((item) => item.name).join(", ") || "пока мало данных"}</p>
                      <p>💡 Совет: начни пить больше воды за 2 дня до</p>
                    </div>
                  </>
                ) : (
                  <EmptyState
                    title="Недостаточно данных для прогноза"
                    body="Нужно больше данных. Продолжай отмечать дни, и Mira начнёт строить прогноз."
                  />
                )}
              </div>
            </div>
          </SectionCard>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Длина цикла */}
            <SectionCard title="Длина цикла" delay={70}>
              {data.cycleLengthData.length ? (
                <>
                  <div className="h-64">
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
                  <p className="mt-4 rounded-2xl bg-[#FAF8F5] px-4 py-3 text-sm font-bold text-[#1A1A1A]">
                    {getCycleCaption(data.cycleLengthData)}
                  </p>
                </>
              ) : (
                <EmptyState title="Начни трекать цикл" body="Добавь даты месячных, чтобы увидеть длину цикла." />
              )}
            </SectionCard>

            {/* Обильность */}
            <SectionCard title="Обильность по дням" delay={120}>
              {data.flowData.length ? (
                <>
                  <div className="h-64">
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
                  <p className="mt-4 rounded-2xl bg-[#FAF8F5] px-4 py-3 text-sm font-bold text-[#1A1A1A]">
                    {getFlowCaption(data)}
                  </p>
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
              <SectionCard title="Факторы влияния" delay={170}>
                <div className="space-y-3">
                  {data.factors.slice(0, 3).map((factor) => (
                    <div key={factor} className="rounded-2xl bg-[#FAF8F5] px-4 py-3 text-sm font-bold text-[#1A1A1A]">
                      📉 {factor}
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Частые симптомы */}
            <SectionCard title="Частые симптомы" delay={220}>
              <SymptomBars symptoms={data.symptoms} />
            </SectionCard>
          </div>

          {/* Красные флаги */}
          {data.redFlags.length > 0 && (
            <SectionCard delay={270}>
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFF0F0] text-[#FF6B6B]">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-black text-[#1A1A1A]">🩺 Когда обратиться к врачу</h2>
                  <ul className="mt-4 space-y-2">
                    {data.redFlags.map((flag) => (
                      <li key={flag} className="text-sm font-bold text-[#1A1A1A]">✅ {flag}</li>
                    ))}
                  </ul>
                  <p className="mt-4 text-sm leading-relaxed text-[#8E8E93]">
                    📖 “Обильные месячные: когда это норма, а когда к врачу” →{" "}
                    <button type="button" className="font-bold text-[#E872A0]">Читать</button>
                  </p>
                  <Button
                    type="button"
                    className="mt-5 w-full rounded-2xl bg-[#E872A0] text-white hover:bg-[#D95F8E]"
                    onClick={onOpenDoctorReport}
                  >
                    📋 Открыть отчёт для врача
                  </Button>
                </div>
              </div>
            </SectionCard>
          )}

          {/* Фразы для врача */}
          <SectionCard title="Фразы для врача" delay={320}>
            <div className="space-y-3">
              {doctorPhrases.map((phrase, index) => (
                <div key={phrase} className="rounded-2xl bg-[#FAF8F5] px-4 py-3 text-sm font-semibold leading-relaxed text-[#1A1A1A]">
                  {index + 1}. {phrase}
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Экспорт */}
          <SectionCard delay={370}>
            <div className="grid gap-3 md:grid-cols-3">
              <ExportButton label="PDF" icon={<FileText className="h-4 w-4" />} onClick={onExportPdf} />
              <ExportButton label="TXT" icon={<FileText className="h-4 w-4" />} onClick={onExportTxt} />
              <ExportButton label="Отправить себе" icon={<Mail className="h-4 w-4" />} onClick={onSendToSelf} />
            </div>
            <p className="mt-4 rounded-2xl bg-[#FAF8F5] px-4 py-3 text-sm font-bold text-[#8E8E93]">
              🔒 Личные заметки скрыты.
            </p>
          </SectionCard>

          <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
            <div className="rounded-2xl bg-white px-3 py-2 text-[#34C759]">Норма</div>
            <div className="rounded-2xl bg-white px-3 py-2 text-[#FFB800]">Внимание</div>
            <div className="rounded-2xl bg-white px-3 py-2 text-[#FF6B6B]">К врачу</div>
          </div>
        </div>
      </div>
    </main>
  );
}

export const AnalyticsPage = memo(AnalyticsPageComponent);
AnalyticsPage.displayName = "AnalyticsPage";

export default AnalyticsPage;
