"use client";

import React, { memo, useMemo, useState } from "react";
import { CalendarDays, HeartPulse, Plus, Siren } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
    note: "Если появятся сильная боль, обморок или очень обильное кровотечение — лучше обратиться за медицинской помощью.",
    ringValue: `${data.cycleDay}`,
    ringLabel: "день цикла",
    ringSubLabel: data.phase,
    progress: Math.min(100, Math.round((data.cycleDay / 28) * 100)),
    actions: ["Отметить симптомы", "Снизить нагрузку, если энергии мало", "Подготовить аптечку, если месячные скоро"],
  };
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

function TodayPageComponent({ data = mockTodayData, onPain, onPeriod, onCheckIn, onCare, onReport }: TodayPageProps) {
  const [painOpen, setPainOpen] = useState(false);
  const status = useMemo(() => getTodayStatus(data), [data]);

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

        <Card
          className="mira-gradient-cycle mt-6 overflow-hidden rounded-[34px] border-0 p-6 shadow-[0_28px_72px_rgba(232,114,160,0.25)] sm:p-8"
          style={{ animation: "miraTodayIn 420ms ease 0ms both" }}
        >
          <div className="grid gap-6 lg:grid-cols-[1fr_210px] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/75">Что со мной сегодня</p>
              <h2 className="mt-2 max-w-2xl text-3xl font-black leading-tight text-white">{status.title}</h2>
              <p className="mt-4 max-w-2xl text-sm font-semibold leading-relaxed text-white/80">{status.body}</p>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-white/75">{status.note}</p>
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

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="space-y-6">
            <SectionCard title="Что сделать сегодня" delay={40}>
              <div className="space-y-3">
                {status.actions.map((action, index) => (
                  <div key={action} className="flex gap-3 rounded-2xl bg-[#FAF8F5] px-4 py-3 text-sm font-bold text-[#1A1A1A]">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-[#E872A0] shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                      {index + 1}
                    </span>
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            {data.symptoms.length > 0 && (
              <SectionCard title="Важное" delay={70}>
                <div className="space-y-3">
                  {data.symptoms.slice(0, 3).map((symptom) => (
                    <div key={symptom.type} className={`rounded-2xl px-4 py-3 text-sm font-bold ${symptomTone[symptom.color]}`}>
                      {symptom.label}{symptom.value ? ` (${symptom.value})` : ""}
                    </div>
                  ))}
                  <p className="rounded-2xl bg-[#FAF8F5] px-4 py-3 text-sm font-semibold text-[#1A1A1A]">{data.advice}</p>
                </div>
              </SectionCard>
            )}

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
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#FAF8F5] px-4 py-3">
                  <p className="text-xs font-black uppercase tracking-wide text-[#8E8E93]">Вода</p>
                  <p className="mt-1 text-lg font-black text-[#1A1A1A]">1.5 / 2 л</p>
                </div>
                <div className="rounded-2xl bg-[#FAF8F5] px-4 py-3">
                  <p className="text-xs font-black uppercase tracking-wide text-[#8E8E93]">Ходьба</p>
                  <p className="mt-1 text-lg font-black text-[#1A1A1A]">немного</p>
                </div>
              </div>
              <Button type="button" variant="outline" className="mt-4 w-full rounded-2xl bg-white" onClick={onCare}>
                Открыть заботу
              </Button>
            </SectionCard>

            <SectionCard title="Аптечка и одежда" delay={160}>
              <div className="space-y-3">
                <div className="rounded-2xl bg-[#FFF0F5] px-4 py-3 text-sm font-bold text-[#1A1A1A]">
                  Проверь прокладки/тампоны и обезболивающее, если месячные скоро.
                </div>
                <div className="rounded-2xl bg-[#F1E9FF] px-4 py-3 text-sm font-bold text-[#1A1A1A]">
                  На случай начала месячных лучше выбрать тёмную или удобную одежду.
                </div>
              </div>
            </SectionCard>

            <SectionCard title={`📅 ${data.calendar.month}`} delay={190}>
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-black text-[#8E8E93]">
                {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => <div key={day}>{day}</div>)}
              </div>
              <div className="mt-3 grid grid-cols-7 gap-2">
                {data.calendar.days.slice(0, 42).map((day, index) => (
                  <div
                    key={`${day.date ?? "empty"}-${index}`}
                    className={`flex aspect-square items-center justify-center rounded-2xl text-sm font-black ${calendarTone[day.type]}`}
                  >
                    {day.date}
                  </div>
                ))}
              </div>
              {data.calendar.note && (
                <p className="mt-3 rounded-2xl bg-[#FAF8F5] px-4 py-3 text-sm font-semibold text-[#1A1A1A]">📝 {data.calendar.note}</p>
              )}
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
