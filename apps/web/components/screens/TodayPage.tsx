"use client";

import React, { memo, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Edit3,
  Info,
  Plus,
  Siren,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMiraStore, type CycleState, type DailyLog } from "@/store";
import { SymptomsModal } from "./SymptomsModal";

type SymptomColor = "red" | "yellow" | "blue" | "green";
type CalendarDayType = "period" | "pms" | "normal" | "note" | "empty";

type TodaySymptom = {
  type: string;
  label: string;
  value?: string;
  color: SymptomColor;
};

type CalendarDay = {
  date: number | null;
  type: CalendarDayType;
};

export type TodayData = {
  date: string;
  cycleDay: number;
  phase: string;
  daysUntilPeriod: number;
  symptoms: TodaySymptom[];
  advice: string;
  recommendations: string[];
  calendar: {
    month: string;
    days: CalendarDay[];
    note?: string;
  };
};

type TodayStatus = ReturnType<typeof getTodayStatus>;

type FirstPattern = {
  isReady: boolean;
  title: string;
  body: string;
  why: string;
  next: string;
  sample: string;
};

type TodayPageProps = {
  data?: TodayData;
  onPain?: () => void;
  onPeriod?: () => void;
  onCheckIn?: () => void;
  onAnalyticsCycles?: () => void;
};

type CycleHistoryItem = {
  id: string;
  title: string;
  range: string;
  length: number;
  periodLength: number;
  isCurrent?: boolean;
  isIrregular?: boolean;
};

type CycleSummary = {
  shouldShow: boolean;
  current: CycleHistoryItem;
  history: CycleHistoryItem[];
  previousCycleLength: number;
  previousPeriodLength: number;
  fluctuationMin: number;
  fluctuationMax: number;
};

const mockTodayData: TodayData = {
  date: "30 июня",
  cycleDay: 15,
  phase: "Лютеиновая",
  daysUntilPeriod: 3,
  symptoms: [
    { type: "pain", label: "Боль 3/5", value: "спазмы", color: "yellow" },
    { type: "energy", label: "Низкая энергия", color: "blue" },
    { type: "mood", label: "Раздражительность", color: "yellow" },
  ],
  advice: "Сегодня лучше снизить нагрузку, пить воду и держать аптечку под рукой.",
  recommendations: ["Пить воду", "Снизить нагрузку", "Подготовить аптечку"],
  calendar: {
    month: "Июнь 2026",
    days: [
      ...Array.from({ length: 4 }, () => ({ date: null, type: "empty" as const })),
      ...Array.from({ length: 30 }, (_, index) => {
        const date = index + 1;
        if ([1, 2, 3, 4, 30].includes(date)) return { date, type: "period" as const };
        if ([27, 28, 29].includes(date)) return { date, type: "pms" as const };
        if (date === 18) return { date, type: "note" as const };
        return { date, type: "normal" as const };
      }),
      ...Array.from({ length: 8 }, () => ({ date: null, type: "empty" as const })),
    ],
    note: '30 июня: "Спазмы мешали работать."',
  },
};

const calendarTone: Record<CalendarDayType, string> = {
  period: "bg-[#F9359E] text-white",
  pms: "bg-[#84E600]/18 text-[#84E600]",
  normal: "bg-[#2A2523] text-[#B7AAA4]",
  note: "bg-[#332A30] text-[#F9359E]",
  empty: "bg-transparent text-transparent",
};

const darkCardClass = "border-[#2E2826] bg-[#1D1816] shadow-[0_18px_48px_rgba(0,0,0,0.28)]";
const darkInsetClass = "border-[#342D2A] bg-[#2A2523]";
const limeButtonClass = "bg-[#84E600] text-[#11100F] shadow-[0_12px_30px_rgba(132,230,0,0.20)] hover:bg-[#73CC00]";

function SectionCard({ title, children, delay = 0 }: { title?: string; children: React.ReactNode; delay?: number }) {
  return (
    <Card
      className="mira-card rounded-[30px] border-0 p-5 transition hover:-translate-y-0.5 hover:shadow-[0_26px_70px_rgba(76,66,126,0.14)]"
      style={{ animation: `miraTodayIn 420ms ease ${delay}ms both` }}
    >
      {title && <h2 className="mb-4 text-lg font-black text-[#1A1A1A]">{title}</h2>}
      {children}
    </Card>
  );
}

function RingStat({
  value,
  label,
  sublabel,
  percentage,
}: {
  value: string;
  label: string;
  sublabel: string;
  percentage: number;
}) {
  const size = 176;
  const stroke = 13;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.max(0, percentage));
  const dash = circumference * (pct / 100);

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-4xl font-black leading-none text-white">{value}</p>
        <p className="mt-1 text-xs font-bold uppercase tracking-wide text-white/80">{label}</p>
        <p className="mt-0.5 text-[11px] font-semibold text-white/70">{sublabel}</p>
      </div>
    </div>
  );
}

function getTodayStatus(data: TodayData) {
  const isDelay = data.daysUntilPeriod < 0;
  const delayDays = Math.abs(data.daysUntilPeriod);

  if (isDelay) {
    return {
      title: `Задержка ${delayDays} ${delayDays === 1 ? "день" : "дней"}`,
      period: "Период: ожидание месячных",
      body: "Это может быть связано со стрессом, болезнью, перелётом, лекарствами, нерегулярным циклом или беременностью.",
      note: "Mira не ставит диагноз, но поможет сохранить факты и понять, что обсудить с врачом.",
      needsMedicalWarning: true,
      ringValue: `${delayDays}`,
      ringLabel: "задержка",
      ringSubLabel: "дней",
      progress: 100,
      actions: [
        "Отметить симптомы",
        "Сделать тест, если была вероятность беременности",
        "Обратиться к врачу, если есть сильная боль, обморок или очень обильное кровотечение",
      ],
    };
  }

  return {
    title: `${data.cycleDay}-й день цикла`,
    period: `${data.phase} фаза | До месячных: ${data.daysUntilPeriod} дня`,
    body: "Mira показывает только главное на сегодня: состояние цикла, важные сигналы и что подготовить.",
    note: "",
    needsMedicalWarning: data.symptoms.some((symptom) => symptom.color === "red"),
    ringValue: `${data.cycleDay}`,
    ringLabel: "день цикла",
    ringSubLabel: data.phase,
    progress: Math.min(100, Math.round((data.cycleDay / 28) * 100)),
    actions: ["Отметить симптомы", "Снизить нагрузку, если энергии мало", "Подготовить аптечку, если месячные скоро"],
  };
}

function getWeekStripDays(data: TodayData) {
  const today = Number.parseInt(data.date, 10) || 1;
  const weekdays = ["П", "В", "С", "Ч", "П", "С", "В"];
  return Array.from({ length: 7 }, (_, index) => {
    const offset = index - 2;
    const date = today + offset;
    return {
      weekday: index === 2 ? "Сегодня" : weekdays[index],
      date,
      isToday: index === 2,
      isPeriod: index <= 2,
    };
  });
}

function isDailyLog(log: unknown): log is DailyLog {
  if (!log || typeof log !== "object") return false;
  const value = log as Partial<DailyLog>;
  return typeof value.date === "string" && typeof value.cycleDay === "number" && !!value.symptoms && typeof value.symptoms === "object";
}

function getSafeDailyLogs(logs: unknown): DailyLog[] {
  if (!Array.isArray(logs)) return [];
  return logs.filter(isDailyLog);
}

function formatCount(count: number) {
  if (count === 1) return "1 отметка";
  if (count > 1 && count < 5) return `${count} отметки`;
  return `${count} отметок`;
}

function formatCycleDate(date: string | null) {
  if (!date) return "дата не указана";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "дата не указана";
  return parsed.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

function formatCycleRange(startDate: string | null, endDate?: string | null) {
  const start = formatCycleDate(startDate);
  if (!endDate) return `Начался ${start}`;
  return `${start} – ${formatCycleDate(endDate)}`;
}

function buildCycleSummary(cycle: CycleState, currentDay: number, totalCycles: number): CycleSummary {
  const completedCycles = cycle.cycles.filter((item) => item.endDate).slice(-3);

  const history = completedCycles.length > 0
    ? completedCycles
        .map((item) => ({
          id: item.id,
          title: `${item.length} ${item.length === 1 ? "день" : item.length < 5 ? "дня" : "дней"}`,
          range: formatCycleRange(item.startDate, item.endDate),
          length: item.length,
          periodLength: item.periodLength,
          isIrregular: Math.abs(item.length - cycle.averageLength) > 7,
        }))
        .reverse()
    : [];

  const lengths = history.map((item) => item.length);
  const current: CycleHistoryItem = {
    id: "current-cycle",
    title: `Текущий цикл: ${currentDay} ${currentDay === 1 ? "день" : currentDay < 5 ? "дня" : "дней"}`,
    range: formatCycleRange(cycle.lastPeriodStart),
    length: currentDay,
    periodLength: cycle.periodLength,
    isCurrent: true,
  };

  return {
    shouldShow: Boolean(cycle.lastPeriodStart || history.length > 0 || totalCycles > 0),
    current,
    history,
    previousCycleLength: history[0]?.length ?? 0,
    previousPeriodLength: history[0]?.periodLength ?? cycle.periodLength,
    fluctuationMin: lengths.length ? Math.min(...lengths) : currentDay,
    fluctuationMax: lengths.length ? Math.max(...lengths) : currentDay,
  };
}

function CycleDots({ length, periodLength, isCurrent = false, isIrregular = false }: { length: number; periodLength: number; isCurrent?: boolean; isIrregular?: boolean }) {
  const dots = Array.from({ length: Math.min(Math.max(length, 8), 30) }, (_, index) => {
    const day = index + 1;
    const isPeriod = day <= periodLength;
    const isFertile = !isCurrent && !isIrregular && day >= 9 && day <= 12;
    const isToday = isCurrent && day === Math.min(length, 30);
    return (
      <span
        key={day}
        className={`h-3 w-3 shrink-0 rounded-full ${
          isToday || isPeriod
            ? "bg-[#7C5FA8]"
            : isFertile
              ? "bg-[#56C9C3]"
              : "bg-[#E5E5E5]"
        }`}
      />
    );
  });

  return <div className="mt-3 flex max-w-full gap-1.5 overflow-hidden">{dots}</div>;
}

function CycleHistoryRow({ item }: { item: CycleHistoryItem }) {
  return (
    <button type="button" className="w-full border-t border-[#EFEFEF] px-5 py-4 text-left transition hover:bg-[#FAF8F5]">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xl font-black text-[#1A1A1A]">{item.title}</p>
          <p className="mt-1 text-sm font-bold text-[#8E8E93]">{item.range}</p>
        </div>
        <ChevronRight className="h-7 w-7 shrink-0 text-[#C6C6C6]" />
      </div>
      <CycleDots length={item.length} periodLength={item.periodLength} isCurrent={item.isCurrent} isIrregular={item.isIrregular} />
    </button>
  );
}

function MyCyclesBlock({ summary, onOpenStats, onOpenAnalytics }: { summary: CycleSummary; onOpenStats: () => void; onOpenAnalytics: () => void }) {
  if (!summary.shouldShow) {
    return (
      <section className="mt-6">
        <h2 className="text-3xl font-black tracking-tight text-[#1A1A1A]">Мои циклы</h2>
        <Card className="mira-card mt-4 rounded-[30px] border-0 p-5 shadow-[0_18px_48px_rgba(39,34,52,0.08)]">
          <p className="text-xl font-black text-[#1A1A1A]">История пока пустая</p>
          <p className="mt-2 text-sm font-bold leading-relaxed text-[#8E8E93]">
            Отметь первый день месячных в Track, и Mira начнёт считать цикл без демо-данных.
          </p>
        </Card>
      </section>
    );
  }

  return (
    <section className="mt-6">
      <h2 className="text-3xl font-black tracking-tight text-[#1A1A1A]">Мои циклы</h2>
      <Card className="mira-card mt-4 overflow-hidden rounded-[30px] border-0 p-0 shadow-[0_18px_48px_rgba(39,34,52,0.08)]">
        <div className="flex items-center justify-between gap-4 px-5 py-5">
          <button type="button" className="min-w-0 text-left" onClick={onOpenStats}>
            <p className="text-xl font-black text-[#1A1A1A]">История циклов</p>
            <p className="mt-1 text-sm font-bold text-[#8E8E93]">Длина, месячные и колебания</p>
          </button>
          <button type="button" className="flex shrink-0 items-center gap-1 text-lg font-bold text-[#8E8E93]" onClick={onOpenAnalytics}>
            Смотреть все
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
        <CycleHistoryRow item={summary.current} />
        {summary.history.length > 0 ? (
          summary.history.slice(0, 2).map((item) => (
            <CycleHistoryRow key={item.id} item={item} />
          ))
        ) : (
          <div className="border-t border-[#EFEFEF] px-5 py-4">
            <p className="text-sm font-bold text-[#8E8E93]">Завершённых циклов пока нет. Следующие месячные добавят историю.</p>
          </div>
        )}
      </Card>
    </section>
  );
}

function CycleDynamicsCard({ summary, onOpenAnalytics }: { summary: CycleSummary; onOpenAnalytics: () => void }) {
  if (!summary.shouldShow || summary.history.length === 0) {
    return (
      <Card className="mira-card mt-6 rounded-[30px] border-0 p-5 shadow-[0_20px_54px_rgba(39,34,52,0.09)]">
        <h2 className="text-2xl font-black text-[#1A1A1A]">Динамика цикла</h2>
        <p className="mt-2 text-sm font-bold leading-relaxed text-[#8E8E93]">
          Динамика появится после двух завершённых циклов. Сейчас Mira показывает только текущий день.
        </p>
        <Button type="button" className="mt-5 h-12 w-full rounded-full bg-[#7C5FA8] text-base font-black text-white hover:bg-[#694E91]" onClick={onOpenAnalytics}>
          Открыть аналитику
        </Button>
      </Card>
    );
  }

  const cycles = [...summary.history].reverse().concat(summary.current).slice(-6);
  const minValue = 18;
  const maxValue = 38;
  const normalMin = 21;
  const normalMax = 35;
  const chartLeft = 12;
  const chartRight = 92;
  const chartTop = 14;
  const chartBottom = 76;
  const toY = (value: number) => chartBottom - ((Math.min(maxValue, Math.max(minValue, value)) - minValue) / (maxValue - minValue)) * (chartBottom - chartTop);
  const points = cycles.map((item, index) => ({
    x: chartLeft + (cycles.length === 1 ? 0 : (index / (cycles.length - 1)) * (chartRight - chartLeft)),
    y: toY(item.length),
    value: item.length,
    label: item.isCurrent ? "тек." : `${index + 1}`,
    isOutlier: item.length < normalMin || item.length > normalMax,
  }));
  const path = points
    .map((point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      const prev = points[index - 1];
      const midX = (prev.x + point.x) / 2;
      return `C ${midX} ${prev.y}, ${midX} ${point.y}, ${point.x} ${point.y}`;
    })
    .join(" ");
  const normalTop = toY(normalMax);
  const normalBottom = toY(normalMin);
  const isStable = summary.fluctuationMax - summary.fluctuationMin <= 7;
  const latest = summary.current.length;

  return (
    <Card className="mira-card mt-6 overflow-hidden rounded-[30px] border-0 p-0 shadow-[0_20px_54px_rgba(39,34,52,0.09)]">
      <div className="flex items-start justify-between gap-4 px-5 py-5">
        <div>
          <h2 className="text-2xl font-black text-[#1A1A1A]">Динамика цикла</h2>
          <p className="mt-1 text-sm font-bold text-[#8E8E93]">Последние циклы и текущий день</p>
        </div>
        <button type="button" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F3F3F3] text-[#A8A8A8]" onClick={onOpenAnalytics}>
          <Info className="h-5 w-5" />
        </button>
      </div>

      <div className="border-t border-[#EFEFEF] px-5 pt-5">
        <div className="grid grid-cols-3 gap-2">
          {[
            ["Текущий", `${latest} дн.`],
            ["Разброс", `${summary.fluctuationMin}–${summary.fluctuationMax}`],
            ["Норма", "21–35"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-[#FAF8F5] px-3 py-3">
              <p className="text-[11px] font-black uppercase text-[#8E8E93]">{label}</p>
              <p className="mt-1 text-lg font-black text-[#1A1A1A]">{value}</p>
            </div>
          ))}
        </div>

        <div className="relative mt-5 h-[280px] overflow-hidden rounded-[26px] bg-[linear-gradient(180deg,#FFFFFF_0%,#FAFBFC_100%)]">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="График динамики цикла">
            <defs>
              <linearGradient id="cycleLineGradient" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#9FA7B5" />
                <stop offset="55%" stopColor="#7C5FA8" />
                <stop offset="100%" stopColor="#7B61C9" />
              </linearGradient>
              <filter id="cycleDotShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#2A2440" floodOpacity="0.18" />
              </filter>
            </defs>
            <rect x="8" y={normalTop} width="86" height={normalBottom - normalTop} rx="3" fill="#EEF1F5" />
            {[chartLeft, 28, 44, 60, 76, chartRight].map((x) => (
              <line key={`v-${x}`} x1={x} x2={x} y1="10" y2="84" stroke="#ECEEF2" strokeWidth="0.45" />
            ))}
            {[chartTop, normalTop, (normalTop + normalBottom) / 2, normalBottom, chartBottom].map((y) => (
              <line key={`h-${y}`} x1="8" x2="94" y1={y} y2={y} stroke="#ECEEF2" strokeWidth="0.45" />
            ))}
            <text x="10" y={normalTop - 3} className="fill-[#8E8E93] text-[4px] font-black">35 дн.</text>
            <text x="10" y={normalBottom + 6} className="fill-[#8E8E93] text-[4px] font-black">21 дн.</text>
            <text x="42" y={normalTop + 7} className="fill-[#8E8E93] text-[5px] font-black">ЗОНА НОРМЫ</text>
            <path d={path} fill="none" stroke="url(#cycleLineGradient)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
            {points.map((point) => (
              <g key={`${point.x}-${point.y}-${point.value}`} filter={point.isOutlier ? "url(#cycleDotShadow)" : undefined}>
                {point.isOutlier && <circle cx={point.x} cy={point.y} r="8.5" fill="#FFB800" opacity="0.18" />}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={point.isOutlier ? "3.6" : "3"}
                  fill={point.isOutlier ? "#FFB800" : "#5D6A7F"}
                  stroke="white"
                  strokeWidth="1.4"
                />
                <text x={point.x - 3.8} y={point.y - 6.8} className="fill-[#1A1A1A] text-[4.2px] font-black">{point.value}</text>
              </g>
            ))}
          </svg>
          <div className="absolute bottom-4 left-5 right-5 flex justify-between">
            {points.map((point) => (
              <span key={`label-${point.x}`} className="min-w-8 rounded-full bg-[#E5E5E5] px-2 py-1 text-center text-[10px] font-black text-[#8E8E93]">
                {point.label}
              </span>
            ))}
          </div>
        </div>

        <div className={`mt-5 rounded-[24px] px-4 py-4 ${isStable ? "bg-[#EDFAF1]" : "bg-[#FFF7DE]"}`}>
          <p className={`text-sm font-black ${isStable ? "text-[#1D8A49]" : "text-[#8A6500]"}`}>
            {isStable ? "Цикл выглядит стабильным" : "Есть заметные колебания"}
          </p>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-[#1A1A1A]">
            {isStable
              ? "Длина последних циклов близка друг к другу. Продолжай отмечать месячные, чтобы прогноз стал точнее."
              : "Разброс длины цикла больше недели. Это не диагноз, но такие данные полезно сохранить для аналитики и врача."}
          </p>
        </div>

        <Button type="button" className="my-5 h-13 w-full rounded-full bg-[#7C5FA8] text-base font-black text-white hover:bg-[#694E91]" onClick={onOpenAnalytics}>
          Смотреть динамику в аналитике
        </Button>
      </div>
    </Card>
  );
}

function CycleStatsModal({ open, summary, onClose, onOpenAnalytics }: { open: boolean; summary: CycleSummary; onClose: () => void; onOpenAnalytics: () => void }) {
  if (!open) return null;

  const stats = [
    {
      label: "Длина предыдущего цикла",
      value: `${summary.previousCycleLength} дней`,
      status: "НОРМА",
      tone: "green" as const,
    },
    {
      label: "Длина предыдущих месячных",
      value: `${summary.previousPeriodLength} дней`,
      status: summary.previousPeriodLength > 7 ? "НЕ НОРМА" : "НОРМА",
      tone: summary.previousPeriodLength > 7 ? "yellow" as const : "green" as const,
    },
    {
      label: "Колебания длины цикла",
      value: `${summary.fluctuationMin}–${summary.fluctuationMax} дней`,
      status: summary.fluctuationMax - summary.fluctuationMin > 7 ? "НЕРЕГУЛЯРНЫЙ" : "СТАБИЛЬНЫЙ",
      tone: summary.fluctuationMax - summary.fluctuationMin > 7 ? "yellow" as const : "green" as const,
    },
  ];

  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center bg-black/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-5">
      <div className="w-full max-w-xl overflow-hidden rounded-t-[34px] bg-white shadow-[0_-24px_70px_rgba(0,0,0,0.24)] sm:rounded-[34px]">
        <div className="flex items-center justify-between px-6 py-5">
          <div>
            <p className="text-3xl font-black text-[#1A1A1A]">Мои циклы</p>
            <p className="mt-1 text-sm font-bold text-[#8E8E93]">Краткая статистика по последним циклам</p>
          </div>
          <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F3F3F3]" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-y border-[#EFEFEF]">
          {stats.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-4 border-b border-[#EFEFEF] px-6 py-5 last:border-b-0">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-base font-bold text-[#8E8E93]">{item.label}</p>
                  <Info className="h-5 w-5 text-[#B8B8B8]" />
                </div>
                <p className="mt-1 text-2xl font-black text-[#1A1A1A]">{item.value}</p>
              </div>
              <div className={`flex shrink-0 items-center gap-2 text-sm font-black ${item.tone === "green" ? "text-[#1BBE69]" : "text-[#F6A600]"}`}>
                {item.tone === "green" ? <CheckCircle2 className="h-6 w-6" /> : <TriangleAlert className="h-6 w-6" />}
                {item.status}
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-5">
          <p className="text-xl font-black text-[#1A1A1A]">Что это даёт</p>
          <div className="mt-4 rounded-[28px] bg-[#F3F3F3] px-5 py-4 text-lg font-bold leading-relaxed text-[#1A1A1A]">
            Mira сравнивает длину цикла, месячные, симптомы и настроение. Так проще понять, что повторяется, и подготовить факты для врача.
          </div>
          <Button type="button" className="mt-5 h-13 w-full rounded-full bg-[#7C5FA8] text-base font-black text-white hover:bg-[#694E91]" onClick={onOpenAnalytics}>
            Смотреть аналитику циклов
          </Button>
          <p className="mt-4 text-xs font-bold uppercase tracking-wide text-[#B8B8B8]">
            Mira не ставит диагноз и не заменяет консультацию врача.
          </p>
        </div>
      </div>
    </div>
  );
}

function buildFirstPattern(logs: DailyLog[]): FirstPattern {
  const sortedLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const sampleCount = sortedLogs.length;

  if (sampleCount < 3) {
    const needed = 3 - sampleCount;
    return {
      isReady: false,
      title: "Mira учится понимать твой цикл",
      body: `Ещё ${formatCount(needed)} — и Mira сможет заметить первый повтор.`,
      why: "Пока рано делать выводы: нужно хотя бы 3 дня с отметками.",
      next: "Нажми «Отслеживать» и добавь воду, настроение или симптом за сегодня.",
      sample: `${formatCount(sampleCount)} сейчас`,
    };
  }

  const lowEnergyCount = sortedLogs.filter((log) => ["low", "exhausted"].includes(log.symptoms.energy ?? "")).length;
  const anxiousMoodCount = sortedLogs.filter((log) => ["anxious", "irritable", "low"].includes(log.symptoms.mood ?? "")).length;
  const painCount = sortedLogs.filter((log) => (log.symptoms.pain?.level ?? 0) >= 3).length;
  const poorSleepCount = sortedLogs.filter((log) => log.symptoms.sleep?.quality === "poor").length;

  const candidates = [
    {
      count: painCount,
      title: "Mira уже видит: боль повторяется",
      body: "Боль 3/5 и выше встречалась несколько раз. Это стоит продолжать отмечать, чтобы понять дни и силу боли.",
      why: "Если боль повторяется по циклам, врачу проще увидеть закономерность, а тебе — подготовиться заранее.",
      next: "Следующие 7 дней отмечай боль по шкале 1–5 и добавляй, что помогло.",
    },
    {
      count: lowEnergyCount,
      title: "Mira уже видит: энергия иногда падает",
      body: "Низкая энергия встречалась в нескольких отметках. Пока это первый сигнал, не окончательный вывод.",
      why: "Так можно понять, связано ли состояние со сном, ПМС, нагрузкой или питанием.",
      next: "Отмечай сон и энергию ещё неделю, чтобы Mira сравнила их между собой.",
    },
    {
      count: anxiousMoodCount,
      title: "Mira уже видит: настроение меняется",
      body: "Тревога, раздражительность или низкое настроение появились в нескольких отметках.",
      why: "Это помогает меньше винить себя и заранее снижать нагрузку в сложные дни.",
      next: "Отмечай настроение каждый день до следующих месячных.",
    },
    {
      count: poorSleepCount,
      title: "Mira уже видит: сон может влиять на день",
      body: "Плохой сон встречался в нескольких отметках. Mira будет смотреть, совпадает ли он с низкой энергией.",
      why: "Связь сна и самочувствия часто становится первым полезным паттерном.",
      next: "Добавляй качество сна и энергию утром ещё 7 дней.",
    },
  ].sort((a, b) => b.count - a.count);

  const top = candidates[0];
  if (!top || top.count < 2) {
    return {
      isReady: true,
      title: "Mira уже может искать первые повторы",
      body: "Данных стало достаточно для старта, но устойчивого повторения пока не видно.",
      why: "Это нормально: первые закономерности обычно появляются после 5–7 отметок.",
      next: "Продолжай отмечать состояние коротко: симптом, энергия, сон или настроение.",
      sample: formatCount(sampleCount),
    };
  }

  return {
    isReady: true,
    title: top.title,
    body: top.body,
    why: top.why,
    next: top.next,
    sample: `${formatCount(sampleCount)}, совпадений: ${top.count}`,
  };
}

function FirstPatternCard({ insight }: { insight: FirstPattern }) {
  return (
    <Card
      className="mira-card mt-4 overflow-hidden rounded-[30px] border-0 p-5 shadow-[0_22px_58px_rgba(76,66,126,0.12)]"
      style={{ animation: "miraTodayIn 420ms ease 70ms both" }}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F1E9FF] text-[#7B61C9] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8E8E93]">Первая польза</p>
            <h2 className="mt-1 text-xl font-black text-[#1A1A1A]">{insight.title}</h2>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-[#8E8E93]">{insight.body}</p>
          </div>
        </div>
        <div className={`shrink-0 rounded-2xl px-4 py-3 text-sm font-black ${insight.isReady ? "bg-[#EDFAF1] text-[#2F8E47]" : "bg-[#FFF7DE] text-[#8A6500]"}`}>
          {insight.sample}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl bg-[#FAF8F5] px-4 py-3">
          <p className="text-xs font-black uppercase tracking-wide text-[#8E8E93]">Почему важно</p>
          <p className="mt-1 text-sm font-bold leading-relaxed text-[#1A1A1A]">{insight.why}</p>
        </div>
        <div className="rounded-2xl bg-[#FAF8F5] px-4 py-3">
          <p className="text-xs font-black uppercase tracking-wide text-[#8E8E93]">Что дальше</p>
          <p className="mt-1 text-sm font-bold leading-relaxed text-[#1A1A1A]">{insight.next}</p>
        </div>
      </div>
    </Card>
  );
}

function QuickAction({
  children,
  tone = "white",
  onClick,
}: {
  children: React.ReactNode;
  tone?: "danger" | "primary" | "white";
  onClick?: () => void;
}) {
  const className = {
    danger: "bg-[#FF6B6B] text-white hover:bg-[#F25353]",
    primary: "bg-[#8B6FB3] text-white hover:bg-[#74599A]",
    white: "bg-white text-[#202033] hover:bg-white/90",
  }[tone];

  return (
    <Button type="button" className={`h-13 rounded-2xl font-black ${className}`} onClick={onClick}>
      {children}
    </Button>
  );
}

function CircleAction({
  label,
  icon,
  active = false,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className={`flex min-w-0 flex-1 flex-col items-start gap-3 rounded-[18px] border p-4 text-left transition hover:-translate-y-0.5 active:scale-[0.99] ${
        active ? "border-[#84E600]/35 bg-[#252318]" : "border-[#342D2A] bg-[#251F1D]"
      }`}
      onClick={onClick}
    >
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-2xl transition ${
          active ? "bg-[#84E600] text-[#11100F]" : "bg-[#302927] text-[#F9359E]"
        }`}
      >
        {icon}
      </span>
      <span className="text-sm font-black leading-tight text-[#F5F0ED]">{label}</span>
    </button>
  );
}

function CompactCyclesLink({ summary, onOpenAnalytics }: { summary: CycleSummary; onOpenAnalytics: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpenAnalytics}
      className={`mt-4 flex w-full items-center justify-between gap-4 rounded-[22px] border px-5 py-4 text-left transition hover:-translate-y-0.5 active:scale-[0.99] ${darkCardClass}`}
    >
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8D817B]">Мои циклы</p>
        <p className="mt-1 truncate text-lg font-black text-[#F5F0ED]">{summary.current.title}</p>
        <p className="mt-1 truncate text-sm font-bold text-[#8D817B]">История и динамика в аналитике</p>
      </div>
      <div className="flex shrink-0 items-center gap-2 rounded-full bg-[#84E600] px-3 py-2 text-sm font-black text-[#11100F]">
        Открыть
        <ChevronRight className="h-4 w-4" />
      </div>
    </button>
  );
}

function MetricCard({
  label,
  value,
  detail,
  accent = "lime",
}: {
  label: string;
  value: string;
  detail: string;
  accent?: "lime" | "pink" | "muted";
}) {
  const accentClass = {
    lime: "bg-[#84E600]",
    pink: "bg-[#F9359E]",
    muted: "bg-[#6A5D57]",
  }[accent];

  return (
    <Card className={`rounded-[20px] p-4 ${darkCardClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8D817B]">{label}</p>
          <p className="mt-2 text-2xl font-black leading-none text-[#F5F0ED]">{value}</p>
        </div>
        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${accentClass}`} />
      </div>
      <p className="mt-3 text-xs font-semibold leading-relaxed text-[#B7AAA4]">{detail}</p>
    </Card>
  );
}

function TodayDashboardStrip({ data, status }: { data: TodayData; status: TodayStatus }) {
  const symptomCount = data.symptoms.length;
  const nextPeriod = data.daysUntilPeriod < 0 ? "проверь задержку" : `${data.daysUntilPeriod} дня`;

  return (
    <div className="mt-4 grid gap-3 md:grid-cols-3">
      <MetricCard
        label="До месячных"
        value={nextPeriod}
        detail={data.daysUntilPeriod < 0 ? "Сохрани факты и обсуди тревожные симптомы с врачом." : "Прогноз станет точнее после новых отметок."}
        accent={data.daysUntilPeriod < 0 ? "pink" : "lime"}
      />
      <MetricCard
        label="Отметки"
        value={`${symptomCount}`}
        detail={symptomCount ? "Есть симптомы за сегодня, Mira сравнит их с циклом." : "Добавь симптомы, настроение или боль за сегодня."}
        accent="pink"
      />
      <MetricCard
        label="Фаза"
        value={status.ringSubLabel}
        detail="Mira показывает осторожные подсказки, не диагнозы."
        accent="muted"
      />
    </div>
  );
}

function FloStyleHero({
  data,
  status,
  onPain,
  onPeriod,
  onCheckIn,
}: {
  data: TodayData;
  status: TodayStatus;
  onPain: () => void;
  onPeriod?: () => void;
  onCheckIn?: () => void;
}) {
  const weekDays = getWeekStripDays(data);

  return (
    <section className="space-y-4">
      <Card className={`rounded-[22px] p-4 ${darkCardClass}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8D817B]">Сегодня</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-[#F5F0ED]">{data.date}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#84E600] px-3 py-1.5 text-xs font-black text-[#11100F]">онлайн</span>
            <button type="button" className={`flex h-10 w-10 items-center justify-center rounded-2xl border text-[#F5F0ED] ${darkInsetClass}`}>
              <CalendarDays className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className={`mt-5 grid grid-cols-7 gap-1.5 rounded-[18px] border p-2 text-center ${darkInsetClass}`}>
          {weekDays.map((day) => (
            <div
              key={`${day.weekday}-${day.date}`}
              className={`flex min-h-[72px] flex-col items-center justify-center rounded-[14px] transition ${
                day.isToday ? "bg-[#84E600] text-[#11100F]" : "bg-transparent"
              }`}
            >
              <p className={`text-[10px] font-black uppercase tracking-wide ${day.isToday ? "text-[#11100F]" : "text-[#8D817B]"}`}>
                {day.weekday}
              </p>
              <div
                className={`mt-1 flex h-9 w-9 items-center justify-center rounded-full text-base font-black ${
                  day.isToday
                    ? "bg-[#11100F] text-[#84E600]"
                    : day.isPeriod
                      ? "text-[#F9359E]"
                      : "text-[#F5F0ED]"
                }`}
              >
                {day.date}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className={`overflow-hidden rounded-[24px] p-5 ${darkCardClass}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8D817B]">
              {data.daysUntilPeriod < 0 ? "Задержка" : "Текущий цикл"}
            </p>
            <h2 className="mt-2 text-4xl font-black leading-none tracking-tight text-[#F5F0ED] sm:text-5xl">{status.title}</h2>
            <p className="mt-3 text-sm font-bold leading-relaxed text-[#B7AAA4]">{status.period}</p>
          </div>
          <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-[20px] bg-[#F9359E] text-white shadow-[0_12px_30px_rgba(249,53,158,0.22)] sm:flex">
            <Sparkles className="h-7 w-7" />
          </div>
        </div>

        <div className={`mt-5 rounded-[18px] border px-4 py-3 ${darkInsetClass}`}>
          <p className="text-sm font-bold leading-relaxed text-[#F5F0ED]">{status.body}</p>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <CircleAction label="Месячные" active icon={<Edit3 className="h-5 w-5" />} onClick={onPeriod} />
          <CircleAction label="Симптомы" icon={<Plus className="h-5 w-5" />} onClick={onCheckIn} />
          <CircleAction label="Мне плохо" icon={<Siren className="h-5 w-5" />} onClick={onPain} />
        </div>
      </Card>
    </section>
  );
}

function CalendarSection({ data, delay = 0 }: { data: TodayData["calendar"]; delay?: number }) {
  return (
    <SectionCard title={`📅 ${data.month}`} delay={delay}>
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-black text-[#8E8E93]">
        {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => <div key={day}>{day}</div>)}
      </div>
      <div className="mt-3 grid grid-cols-7 gap-2">
        {data.days.slice(0, 42).map((day, index) => (
          <div
            key={`${day.date ?? "empty"}-${index}`}
            className={`flex aspect-square items-center justify-center rounded-2xl text-sm font-black ${calendarTone[day.type]}`}
          >
            {day.date}
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold text-[#8E8E93] md:grid-cols-4">
        {[
          ["bg-[#8B6FB3]", "Месячные"],
          ["bg-[#FFB800]/40", "ПМС"],
          ["bg-[#EDFAF1]", "Обычный день"],
          ["bg-[#F1E9FF]", "Есть заметка"],
        ].map(([color, label]) => (
          <div key={label} className="flex items-center gap-2 rounded-2xl bg-[#FAF8F5] px-3 py-2">
            <span className={`h-3 w-3 rounded-full ${color}`} />
            {label}
          </div>
        ))}
      </div>
      {data.note && (
        <p className="mt-3 rounded-2xl bg-[#FAF8F5] px-4 py-3 text-sm font-semibold text-[#1A1A1A]">📝 {data.note}</p>
      )}
    </SectionCard>
  );
}

function TodayPageComponent({ data = mockTodayData, onPain, onPeriod, onCheckIn, onAnalyticsCycles }: TodayPageProps) {
  const [painOpen, setPainOpen] = useState(false);
  const [symptomsOpen, setSymptomsOpen] = useState(false);
  const [symptomsInitialCategory, setSymptomsInitialCategory] = useState<string | undefined>(undefined);
  const cycle = useMiraStore((state) => state.cycle);
  const totalCycles = useMiraStore((state) => state.user.totalCycles);
  const status = useMemo(() => getTodayStatus(data), [data]);
  const cycleSummary = useMemo(() => buildCycleSummary(cycle, data.cycleDay, totalCycles), [cycle, data.cycleDay, totalCycles]);

  function openPain() {
    if (onPain) {
      onPain();
      return;
    }
    setPainOpen(true);
  }

  function openSymptoms(initialCategory?: string) {
    setSymptomsInitialCategory(initialCategory);
    setSymptomsOpen(true);
  }

  function openAnalyticsCycles() {
    if (onAnalyticsCycles) {
      onAnalyticsCycles();
      return;
    }
    if (typeof window !== "undefined") window.location.href = "/analysis#cycle-history";
  }

  return (
    <main className="min-h-screen bg-[#050505] px-5 py-6 text-[#F5F0ED]">
      <style jsx global>{`
        @keyframes miraTodayIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="mx-auto max-w-5xl">
        <FloStyleHero
          data={data}
          status={status}
          onPain={openPain}
          onPeriod={onPeriod}
          onCheckIn={() => {
            if (onCheckIn) {
              onCheckIn();
              return;
            }
            openSymptoms();
          }}
        />

        <TodayDashboardStrip data={data} status={status} />
        <CompactCyclesLink summary={cycleSummary} onOpenAnalytics={openAnalyticsCycles} />
      </div>

      <PainDialog open={painOpen} onClose={() => setPainOpen(false)} onSave={onCheckIn} />
      <SymptomsModal
        open={symptomsOpen}
        initialCategoryTitle={symptomsInitialCategory}
        onClose={() => {
          setSymptomsOpen(false);
          setSymptomsInitialCategory(undefined);
        }}
      />
    </main>
  );
}

function PainDialog({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave?: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-[0_22px_60px_rgba(0,0,0,0.18)]">
        <h2 className="text-xl font-black text-[#1A1A1A]">Что случилось?</h2>
        <div className="mt-4 space-y-3">
          {["Сильная боль", "Очень обильные месячные", "Задержка", "Слабость / нет сил"].map((item) => (
            <button key={item} type="button" className="w-full rounded-2xl bg-[#FAF8F5] px-4 py-3 text-left text-sm font-bold text-[#1A1A1A]">
              {item}
            </button>
          ))}
        </div>
        <p className="mt-4 rounded-2xl bg-[#FFF7DE] px-4 py-3 text-sm font-bold leading-relaxed text-[#8A6500]">
          Если боль резкая, есть обморок, очень обильное кровотечение или сильная слабость — лучше обратиться за медицинской помощью.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button type="button" variant="outline" className="rounded-2xl" onClick={onClose}>Закрыть</Button>
          <Button
            type="button"
            className="rounded-2xl bg-[#8B6FB3] text-white hover:bg-[#74599A]"
            onClick={() => {
              onSave?.();
              onClose();
            }}
          >
            Сохранить
          </Button>
        </div>
      </div>
    </div>
  );
}

export const TodayPage = memo(TodayPageComponent);
TodayPage.displayName = "TodayPage";

export default TodayPage;
