"use client";

import React, { memo, useMemo, useState } from "react";
import { CalendarDays, HeartPulse, Plus, Siren, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMiraStore, type DailyLog } from "@/store";

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

type TodayData = {
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

type FactAction = {
  fact: string;
  action: string;
  tone: SymptomColor;
};

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
  onCare?: () => void;
  onReport?: () => void;
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

const symptomTone: Record<SymptomColor, string> = {
  red: "bg-[#FFF0F0] text-[#FF6B6B]",
  yellow: "bg-[#FFF7DE] text-[#8A6500]",
  blue: "bg-[#EEF5FF] text-[#3478C7]",
  green: "bg-[#EDFAF1] text-[#34A853]",
};

const calendarTone: Record<CalendarDayType, string> = {
  period: "bg-[#E872A0] text-white",
  pms: "bg-[#FFB800]/18 text-[#A57400]",
  normal: "bg-[#EDFAF1] text-[#2F8E47]",
  note: "bg-[#F1E9FF] text-[#7B61C9]",
  empty: "bg-transparent text-transparent",
};

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

function getFactActions(data: TodayData, status: ReturnType<typeof getTodayStatus>): FactAction[] {
  if (data.symptoms.length === 0) {
    return [
      {
        fact: status.title,
        action: "Отметь симптомы или настроение, если что-то изменилось.",
        tone: "green",
      },
    ];
  }

  return data.symptoms.slice(0, 3).map((symptom, index) => {
    const defaultAction = status.actions[index] ?? data.recommendations[index] ?? data.advice;
    const actionByType: Record<string, string> = {
      pain: "Снизь нагрузку, выпей воды и открой “Мне больно”, если боль усиливается.",
      energy: "Не ставь тяжёлые дела подряд, оставь окно на отдых.",
      mood: "Не принимай резких решений, лучше выбрать спокойные задачи.",
      blood: "Следи за обильностью и добавь факт в отчёт врачу, если это выше обычного.",
    };

    return {
      fact: `${symptom.label}${symptom.value ? `: ${symptom.value}` : ""}`,
      action: actionByType[symptom.type] ?? defaultAction,
      tone: symptom.color,
    };
  });
}

function getCareProgress() {
  const items = [
    { label: "Вода", done: true, value: "1.5 / 2 л" },
    { label: "Ходьба", done: true, value: "немного" },
    { label: "Питание", done: false, value: "не отмечено" },
    { label: "Вес", done: false, value: "не отмечен" },
  ];
  const done = items.filter((item) => item.done).length;
  return { items, done, total: items.length, percent: Math.round((done / items.length) * 100) };
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
    primary: "bg-[#E872A0] text-white hover:bg-[#D95F8E]",
    white: "bg-white text-[#202033] hover:bg-white/90",
  }[tone];

  return (
    <Button type="button" className={`h-13 rounded-2xl font-black ${className}`} onClick={onClick}>
      {children}
    </Button>
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
          ["bg-[#E872A0]", "Месячные"],
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

function TodayPageComponent({ data = mockTodayData, onPain, onPeriod, onCheckIn, onCare, onReport }: TodayPageProps) {
  const [painOpen, setPainOpen] = useState(false);
  const storeLogs = useMiraStore((state) => state.logs.dailyLogs);
  const status = useMemo(() => getTodayStatus(data), [data]);
  const factActions = useMemo(() => getFactActions(data, status), [data, status]);
  const careProgress = useMemo(() => getCareProgress(), []);
  const firstPattern = useMemo(() => buildFirstPattern(getSafeDailyLogs(storeLogs)), [storeLogs]);

  function openPain() {
    if (onPain) {
      onPain();
      return;
    }
    setPainOpen(true);
  }

  function openReport() {
    if (onReport) {
      onReport();
      return;
    }
    if (typeof window !== "undefined") window.location.href = "/report";
  }

  return (
    <main className="mira-screen px-5 py-6 text-[#202033]">
      <style jsx global>{`
        @keyframes miraTodayIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="mx-auto max-w-5xl">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#E872A0]">Сегодня</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-[#1A1A1A]">
              Mira показывает <span className="text-[#E872A0]">главное</span>
            </h1>
            <p className="mt-2 text-sm font-semibold text-[#8E8E93]">{status.period}</p>
          </div>
          <div className="mira-card flex shrink-0 items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black text-[#202033]">
            <CalendarDays className="h-4 w-4 text-[#E872A0]" />
            {data.date}
          </div>
        </header>

        <div className="mt-6">
          <CalendarSection data={data.calendar} delay={0} />
        </div>

        <Card
          className="mira-gradient-cycle mt-6 overflow-hidden rounded-[34px] border-0 p-6 shadow-[0_28px_72px_rgba(232,114,160,0.25)] sm:p-8"
          style={{ animation: "miraTodayIn 420ms ease 30ms both" }}
        >
          <div className="grid gap-6 lg:grid-cols-[1fr_210px] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/75">Что со мной сегодня</p>
              <h2 className="mt-2 max-w-2xl text-3xl font-black leading-tight text-white">{status.title}</h2>
              <p className="mt-4 max-w-2xl text-sm font-semibold leading-relaxed text-white/80">{status.body}</p>
              {status.note && <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-white/75">{status.note}</p>}
              {status.needsMedicalWarning && (
                <p className="mt-3 max-w-2xl rounded-2xl bg-white/16 px-4 py-3 text-sm font-black leading-relaxed text-white">
                  Если есть резкая боль, обморок, очень обильное кровотечение или сильная слабость — лучше обратиться за медицинской помощью.
                </p>
              )}
            </div>
            <RingStat value={status.ringValue} label={status.ringLabel} sublabel={status.ringSubLabel} percentage={status.progress} />
          </div>
        </Card>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <QuickAction tone="danger" onClick={openPain}>
            <Siren className="h-4 w-4" />
            Мне больно
          </QuickAction>
          <QuickAction onClick={onPeriod}>🩸 Месячные</QuickAction>
          <QuickAction tone="primary" onClick={onCheckIn}>
            <Plus className="h-4 w-4" />
            Симптом
          </QuickAction>
          <QuickAction onClick={openReport}>📋 Отчёт врачу</QuickAction>
        </div>

        <Card className="mt-4 rounded-[28px] border-0 bg-[#FFF0F0] p-5 shadow-[0_18px_42px_rgba(255,107,107,0.12)]">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[#FF6B6B]">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black text-[#1A1A1A]">Когда срочно за помощью</p>
              <p className="mt-1 text-sm font-semibold leading-relaxed text-[#8E8E93]">
                Резкая боль, обморок, очень обильное кровотечение, кровь после секса или сильная слабость — это повод обратиться к врачу.
              </p>
            </div>
          </div>
        </Card>

        <FirstPatternCard insight={firstPattern} />

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="space-y-6">
            <SectionCard title="Сегодня: факт → действие" delay={40}>
              <div className="space-y-3">
                {factActions.map((item, index) => (
                  <div key={`${item.fact}-${index}`} className="rounded-2xl bg-[#FAF8F5] p-4">
                    <div className="flex items-start gap-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${symptomTone[item.tone]}`}>Факт</span>
                      <div>
                        <p className="text-sm font-black text-[#1A1A1A]">{item.fact}</p>
                        <p className="mt-1 text-sm font-semibold leading-relaxed text-[#8E8E93]">{item.action}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <p className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#1A1A1A] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                  {data.advice}
                </p>
              </div>
            </SectionCard>

            <SectionCard title="Настроение и ПМС" delay={100}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-[#FAF8F5] px-4 py-3">
                  <p className="text-xs font-black uppercase tracking-wide text-[#8E8E93]">Настроение</p>
                  <p className="mt-1 text-lg font-black text-[#1A1A1A]">Может быть раздражительность</p>
                </div>
                <div className="rounded-2xl bg-[#FAF8F5] px-4 py-3">
                  <p className="text-xs font-black uppercase tracking-wide text-[#8E8E93]">ПМС</p>
                  <p className="mt-1 text-lg font-black text-[#1A1A1A]">Следи за энергией и тягой к сладкому</p>
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="space-y-6">
            <SectionCard title="Забота сегодня" delay={130}>
              <div className="mb-4 rounded-2xl bg-[#FAF8F5] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-[#1A1A1A]">
                    {careProgress.done} из {careProgress.total} отмечено
                  </p>
                  <p className="text-xs font-black text-[#E872A0]">{careProgress.percent}%</p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-[#E872A0]" style={{ width: `${careProgress.percent}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {careProgress.items.map((item) => (
                  <div key={item.label} className="rounded-2xl bg-[#FAF8F5] px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-black uppercase tracking-wide text-[#8E8E93]">{item.label}</p>
                      <span className={`text-sm font-black ${item.done ? "text-[#34A853]" : "text-[#8E8E93]"}`}>
                        {item.done ? "✓" : "○"}
                      </span>
                    </div>
                    <p className="mt-1 text-lg font-black text-[#1A1A1A]">{item.value}</p>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" className="mt-4 w-full rounded-2xl bg-white" onClick={onCare}>
                Открыть заботу
              </Button>
            </SectionCard>

          </div>
        </div>
      </div>

      <PainDialog open={painOpen} onClose={() => setPainOpen(false)} onSave={onCheckIn} />
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
            className="rounded-2xl bg-[#E872A0] text-white hover:bg-[#D95F8E]"
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
