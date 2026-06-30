"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Brain,
  BriefcaseMedical,
  CalendarDays,
  Footprints,
  Scale,
  Shirt,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CountUp } from "@/components/ui/CountUp";
import {
  getLatestWeightEntry,
  getCyclePhase,
  getCheckIn, getPreviousWeightEntry, getWalkingEntry, getWaterEntry,
} from "@/lib/store";
import { getCycleNorm, getPeriodForecast } from "@/lib/cycleEngine";
import { getSexCycleInsight, getSmartReminders, getRedFlags, getToughDayContent } from "@/lib/alerts";
import { getMoodPmsCard, type MoodPmsCard } from "@/lib/moodPms";
import { getStreak } from "@/lib/gamification";
import { normalizePeriodKit, periodKitItems } from "@/lib/periodKit";
import type { ScreenProps } from "./types";
import type { CyclePhase, DailyCheckIn, MiraLocalData } from "@/lib/types";

type PhaseInfo = {
  emoji: string;
  gradient: string;
  title: string;
  subtitle: string;
  energyLevel: number;
  moodEmoji: string;
  moodLabel: string;
  article: { title: string; body: string; tag: string };
  clothing: string;
  recommendation: string;
  fertility: { level: string; emoji: string; note: string } | null;
};

const phaseNames: Record<CyclePhase, string> = {
  menstruation: "Месячные",
  follicular: "После месячных",
  ovulation: "Овуляция",
  luteal: "Перед месячными",
};

const phaseConfig: Record<CyclePhase, PhaseInfo> = {
  menstruation: {
    emoji: "🌺", gradient: "from-[#F5D0D8] via-[#F0C0D0] to-[#E8B0C0]",
    title: "Время заботы о себе", subtitle: "Энергия может быть ниже. Отдыхай.",
    energyLevel: 30, moodEmoji: "😌", moodLabel: "спокойствие",
    article: { title: "Почему болит живот при месячных?", body: "Матка сокращается, и у некоторых это ощущается как спазмы. Тепло и мягкий режим могут поддержать.", tag: "Биология" },
    clothing: "Тёмное удобное бельё, свободные штаны без давления на живот",
    recommendation: "Тёплый чай, грелка, лёгкая прогулка. Не требуй от себя многого.",
    fertility: null,
  },
  follicular: {
    emoji: "🌱", gradient: "from-[#E0D4F5] via-[#D8CCF0] to-[#D0C4E8]",
    title: "Энергия растёт", subtitle: "Хорошее время для новых начинаний.",
    energyLevel: 65, moodEmoji: "😊", moodLabel: "подъём",
    article: { title: "Почему после месячных так хорошо?", body: "Эстроген растёт — улучшает настроение, память и концентрацию. Кожа выглядит лучше. Это биологический подъём.", tag: "Гормоны" },
    clothing: "Носи что хочешь — сейчас лучшие дни для любимых нарядов",
    recommendation: "Силовая тренировка, белок на завтрак, новые начинания.",
    fertility: { level: "Средняя", emoji: "🟡", note: "Фертильность растёт. Помни о контрацепции." },
  },
  ovulation: {
    emoji: "✨", gradient: "from-[#E8D0F5] via-[#E0C8F0] to-[#D8C0E8]",
    title: "Лучшие дни цикла", subtitle: "Максимум энергии и уверенности.",
    energyLevel: 90, moodEmoji: "🤩", moodLabel: "отлично",
    article: { title: "Что такое овуляция простыми словами?", body: "Яйцеклетка выходит из яичника и живёт 12-24 часа. Тестостерон даёт уверенность и энергию.", tag: "Биология" },
    clothing: "Всё что нравится — сейчас ты сияешь",
    recommendation: "Интенсивная тренировка, важные переговоры. Пик продуктивности!",
    fertility: { level: "Высокая", emoji: "🔴", note: "Максимальная фертильность 24-48 часов. Не является методом контрацепции." },
  },
  luteal: {
    emoji: "🌙", gradient: "from-[#E8E0F0] via-[#E0D8E8] to-[#D8D0E0]",
    title: "Ожидание месячных", subtitle: "Лютеиновая фаза: тело готовится. Будь мягче к себе.",
    energyLevel: 45, moodEmoji: "😐", moodLabel: "переменчиво",
    article: { title: "Почему тянет на сладкое перед месячными?", body: "Во второй половине цикла аппетит у многих меняется. Финики, фрукты с орехами и тёмный шоколад могут быть мягкой заменой.", tag: "Питание" },
    clothing: "Удобная одежда, мягкие ткани. Живот может быть вздут — свободный крой",
    recommendation: "Магний перед сном, йога или прогулка. Не планируй сложных дел.",
    fertility: { level: "Низкая", emoji: "🟢", note: "Фертильность снижается. Но ни один день не является полностью безопасным." },
  },
};

const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function CycleCalendar({ cycleLength, periodLength, checkIns, periodStart }: {
  cycleLength: number;
  periodLength: number;
  checkIns: Record<string, DailyCheckIn>;
  periodStart: string;
}) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const todayStr = today.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(date.getDate() + (index - 3));
    const key = date.toISOString().slice(0, 10);
    return {
      date,
      day: date.getDate(),
      weekDay: dayNames[(date.getDay() + 6) % 7],
      key,
    };
  });

  function getPhaseColor(date: Date): string {
    if (!periodStart) return "#D4CCE6";
    const start = new Date(periodStart);
    const diff = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
    const cycleDayForDate = ((diff % cycleLength) + cycleLength) % cycleLength + 1;
    const remaining = cycleLength - periodLength;
    const follicularEnd = periodLength + Math.round(remaining * 0.4);
    const ovulationEnd = follicularEnd + Math.round(remaining * 0.12);
    if (cycleDayForDate <= periodLength) return "#E8A0B8";
    if (cycleDayForDate <= follicularEnd) return "#B8A5D8";
    if (cycleDayForDate <= ovulationEnd) return "#D4A0C8";
    return "#D4CCE6";
  }

  const activeKey = selectedKey ?? todayKey;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold capitalize text-mira-text">
          {selectedKey && selectedKey !== todayKey
            ? new Date(`${selectedKey}T00:00:00`).toLocaleDateString("ru-RU", { day: "numeric", month: "long", weekday: "short" })
            : todayStr}
        </p>
        <button
          type="button"
          onClick={() => setSelectedKey(null)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-mira-lavender/30 bg-white text-mira-muted transition hover:border-mira-primary/30 hover:text-mira-primary"
          aria-label="Вернуться к сегодняшнему дню"
        >
          <CalendarDays className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-5 grid grid-cols-7 gap-1.5">
        {days.map((day, index) => {
          const phaseColor = getPhaseColor(day.date);
          const hasData = Boolean(checkIns[day.key]);
          const isFuture = day.date > today;
          const isSelected = day.key === activeKey;

          return (
            <motion.button
              key={day.key}
              type="button"
              onClick={() => setSelectedKey(day.key === todayKey ? null : day.key)}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.03, type: "spring", stiffness: 250 }}
              className="flex flex-col items-center gap-1"
            >
              <span className={`text-xs font-semibold ${isSelected ? "text-mira-primary" : "text-mira-muted"}`}>
                {day.weekDay}
              </span>
              {isSelected ? <span className="text-[8px] leading-none text-mira-primary">▼</span> : <span className="h-[10px]" />}
              <div
                className={`relative flex h-16 w-full items-center justify-center rounded-[20px] transition-all ${
                  isSelected ? "ring-[2.5px] ring-mira-primary shadow-glow" : ""
                }`}
                style={{ background: isFuture ? "#EDE8F5" : isSelected ? phaseColor : `${phaseColor}40` }}
              >
                <span className={`text-base font-bold ${isSelected ? "text-white" : isFuture ? "text-mira-muted/40" : "text-mira-text"}`}>
                  {day.day}
                </span>
                {hasData && (
                  <span className={`absolute bottom-1.5 h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : "bg-mira-primary"}`} />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function CycleWaveChart({ cycleDay, cycleLength, periodLength }: {
  cycleDay: number;
  cycleLength: number;
  periodLength: number;
}) {
  const width = 300;
  const height = 70;
  const points = Array.from({ length: cycleLength }, (_, index) => {
    const progress = (index + 1) / cycleLength;
    const periodEnd = periodLength / cycleLength;
    const ovulation = (periodLength + (cycleLength - periodLength) * 0.4) / cycleLength;
    let value: number;
    if (progress <= periodEnd) value = 22 + (progress / periodEnd) * 8;
    else if (progress <= ovulation) value = 30 + ((progress - periodEnd) / (ovulation - periodEnd)) * 62;
    else if (progress <= ovulation + 0.06) value = 92;
    else value = 88 - ((progress - ovulation - 0.06) / (1 - ovulation - 0.06)) * 62;
    return Math.max(12, Math.min(95, value));
  });
  const stepX = width / (points.length - 1);
  const path = points.map((value, index) => {
    const x = index * stepX;
    const y = height - (value / 100) * height;
    if (index === 0) return `M ${x.toFixed(1)} ${y.toFixed(1)}`;
    const prevX = (index - 1) * stepX;
    const prevY = height - (points[index - 1] / 100) * height;
    return `C ${(prevX + stepX * 0.4).toFixed(1)} ${prevY.toFixed(1)} ${(x - stepX * 0.4).toFixed(1)} ${y.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
  const pointIndex = Math.min(cycleDay - 1, points.length - 1);
  const markerX = pointIndex * stepX;
  const markerY = height - (points[pointIndex] / 100) * height;

  return (
    <svg viewBox={`-6 -6 ${width + 12} ${height + 16}`} className="w-full" style={{ height }} aria-hidden="true">
      <defs>
        <linearGradient id="wave" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#E8A0B8" />
          <stop offset="40%" stopColor="#B8A5D8" />
          <stop offset="55%" stopColor="#D4A0C8" />
          <stop offset="100%" stopColor="#D4CCE6" />
        </linearGradient>
        <linearGradient id="waveFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L ${width} ${height + 6} L 0 ${height + 6} Z`} fill="url(#waveFill)" />
      <motion.path
        d={path}
        fill="none"
        stroke="url(#wave)"
        strokeLinecap="round"
        strokeWidth="3"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease: "easeOut" }}
      />
      <motion.circle
        cx={markerX}
        cy={markerY}
        r="6"
        fill="white"
        stroke="#9B8EC4"
        strokeWidth="3"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8, type: "spring" }}
      />
      <circle cx={markerX} cy={markerY} r="2.5" fill="#9B8EC4" />
    </svg>
  );
}

// ── Кольцо калорий + КБЖУ ──

function NutritionRing({ data, phase, onOpen }: { data: MiraLocalData; phase: CyclePhase; onOpen: () => void }) {
  const meals = getCheckIn(data)?.meals ?? [];
  const sizeKcal: Record<string, number> = { small: 300, medium: 500, large: 750 };
  const eaten = meals.reduce((sum, m) => {
    const base = sizeKcal[m.size] ?? 450;
    return sum + (m.type === "snack" ? base * 0.5 : base);
  }, 0);
  const goal = phase === "luteal" ? 2150 : phase === "menstruation" ? 2050 : 2000;
  const pct = Math.min(100, Math.round((eaten / goal) * 100));
  const r = 30, c = 2 * Math.PI * r;

  return (
    <Card className="tap p-3.5" onClick={onOpen}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted mb-2">🍽️ Питание</p>
      <div className="flex items-center gap-3">
        <div className="relative h-[72px] w-[72px] shrink-0">
          <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90">
            <circle cx="36" cy="36" r={r} fill="none" stroke="#EDE8F5" strokeWidth="6" />
            <motion.circle cx="36" cy="36" r={r} fill="none" stroke="#7BAF8D" strokeWidth="6" strokeLinecap="round"
              initial={{ strokeDasharray: `0 ${c}` }}
              animate={{ strokeDasharray: `${(pct / 100) * c} ${c - (pct / 100) * c}` }}
              transition={{ duration: 0.9 }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-bold text-mira-text leading-none"><CountUp value={eaten} /></span>
            <span className="text-[8px] text-mira-muted">из {goal}</span>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-mira-text mb-1.5">Цель ~{goal} ккал</p>
          {[
            { l: "Б", pct: 30, color: "#C47E9B" },
            { l: "Ж", pct: 30, color: "#C4B07E" },
            { l: "У", pct: 40, color: "#7BAF8D" },
          ].map(m => (
            <div key={m.l} className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[9px] font-bold w-2.5 text-mira-muted">{m.l}</span>
              <div className="flex-1 h-1.5 rounded-full bg-mira-lavender-light overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${m.pct}%`, background: m.color }} />
              </div>
              <span className="text-[8px] text-mira-muted w-6 text-right">{m.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ── Бутылка воды ──

function WaterBottle({ data, onOpen }: { data: MiraLocalData; onOpen: () => void }) {
  const entry = getWaterEntry(data);
  const ml = entry.glasses * 250;
  const goalMl = entry.goal * 250;
  const fillPct = Math.min(100, (ml / goalMl) * 100);

  return (
    <Card className="tap p-3.5" onClick={onOpen}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted mb-2">💧 Вода</p>
      <div className="flex items-center gap-3">
        <div className="relative h-[72px] w-9 shrink-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-1.5 bg-[#7BAF8D]/40 rounded-t" />
          <div className="absolute top-1.5 inset-x-0 bottom-0 rounded-[10px] rounded-t-md border-2 border-[#7BAF8D]/30 overflow-hidden bg-[#E0F5E8]/20">
            <motion.div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#7BAF8D] to-[#A0D4B0]"
              initial={{ height: 0 }} animate={{ height: `${fillPct}%` }} transition={{ duration: 0.7 }} />
          </div>
        </div>
        <div className="flex-1">
          <p className="text-lg font-bold text-mira-text leading-none"><CountUp value={ml / 1000} decimals={2} /> <span className="text-xs font-normal text-mira-muted">л</span></p>
          <p className="text-[10px] text-mira-muted mt-0.5">из {(goalMl / 1000).toFixed(1)} л</p>
          {ml >= goalMl
            ? <p className="text-[10px] text-mira-success font-semibold mt-1">Цель достигнута 💧</p>
            : <p className="text-[10px] text-mira-primary font-semibold mt-1">+ добавить стакан</p>}
        </div>
      </div>
    </Card>
  );
}

function WalkingCard({ data, onOpen }: { data: MiraLocalData; onOpen: () => void }) {
  const entry = getWalkingEntry(data);
  const progress = Math.min(100, Math.round((entry.steps / entry.goal) * 100));
  const km = entry.steps * 0.0007;

  return (
    <Card className="cursor-pointer p-3.5 transition active:scale-[0.99]" onClick={onOpen}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Ходьба</p>
          <p className="mt-1 text-lg font-bold leading-none text-mira-text">
            <CountUp value={entry.steps} /> <span className="text-xs font-normal text-mira-muted">шагов</span>
          </p>
          <p className="mt-1 text-[10px] text-mira-muted">~{km.toFixed(1)} км · цель {entry.goal}</p>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E0F5E8] text-mira-success">
          <Footprints className="h-5 w-5" />
        </span>
      </div>

      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between text-[10px] font-semibold text-mira-muted">
          <span>Прогресс дня</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-mira-lavender-light">
          <div className="h-full rounded-full bg-mira-success transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <p className="text-[10px] font-semibold text-mira-success">Ввести в Заботе</p>
    </Card>
  );
}

function WeightCard({ data, onOpen, daysUntil, phase }: { data: MiraLocalData; onOpen: () => void; daysUntil: number; phase: CyclePhase }) {
  const latest = getLatestWeightEntry(data);
  const today = new Date().toISOString().slice(0, 10);
  const todayWeight = data.weightLog?.[today]?.weight;
  const previous = getPreviousWeightEntry(data, latest?.date);
  const entries = Object.values(data.weightLog ?? {})
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7);

  const currentWeight = todayWeight ?? latest?.weight ?? data.profile?.weight;
  const delta = currentWeight && previous ? Math.round((currentWeight - previous.weight) * 10) / 10 : null;
  const hasPremenstrualFluid = phase === "luteal" && daysUntil <= 7;
  const minWeight = entries.length ? Math.min(...entries.map((entry) => entry.weight)) : currentWeight ?? 0;
  const maxWeight = entries.length ? Math.max(...entries.map((entry) => entry.weight)) : currentWeight ?? 1;
  const spread = Math.max(0.4, maxWeight - minWeight);

  return (
    <Card className="cursor-pointer p-3.5 transition active:scale-[0.99]" onClick={onOpen}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Вес</p>
          <p className="mt-1 text-lg font-bold leading-none text-mira-text">
            {currentWeight ? (
              <>
                <CountUp value={currentWeight} decimals={1} /> <span className="text-xs font-normal text-mira-muted">кг</span>
              </>
            ) : (
              <span className="text-sm">Добавь первый замер</span>
            )}
          </p>
          <p className={`mt-1 text-[10px] font-semibold ${delta === null ? "text-mira-muted" : Math.abs(delta) <= 0.3 ? "text-mira-success" : "text-mira-primary"}`}>
            {delta === null
              ? "Mira покажет тренд после 2 замеров"
              : delta === 0
                ? "без изменений"
                : `${delta > 0 ? "+" : ""}${delta.toFixed(1)} кг к прошлому замеру`}
          </p>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-mira-lavender-light text-mira-primary">
          <Scale className="h-5 w-5" />
        </span>
      </div>

      {entries.length >= 2 && (
        <div className="mb-3 flex h-12 items-end gap-1 rounded-lg bg-mira-bg px-2 py-2">
          {entries.map((entry) => {
            const height = 22 + ((entry.weight - minWeight) / spread) * 22;
            return (
              <div key={entry.date} className="flex flex-1 items-end">
                <span
                  className={`w-full rounded-full ${entry.date === today ? "bg-mira-primary" : "bg-mira-lavender"}`}
                  style={{ height }}
                  title={`${entry.weight} кг`}
                />
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[10px] leading-snug text-mira-muted">
        {hasPremenstrualFluid
          ? "Перед месячными вес может временно расти из-за задержки жидкости. Смотри тренд, а не один день."
          : "Ввод веса — на странице Забота."}
      </p>
    </Card>
  );
}

function CareSummaryCard({ data, onOpen }: { data: MiraLocalData; onOpen: () => void }) {
  const checkIn = getCheckIn(data);
  const meals = checkIn?.meals ?? [];
  const water = getWaterEntry(data);
  const walking = getWalkingEntry(data);
  const latestWeight = getLatestWeightEntry(data);
  const waterMl = water.glasses * 250;
  const waterGoalMl = water.goal * 250;
  const stepsPct = Math.min(100, Math.round((walking.steps / walking.goal) * 100));
  const stepsStatus = walking.steps <= 0 ? "добавить" : stepsPct >= 70 ? "хорошо" : "мало";
  const filledItems = [
    water.glasses > 0,
    walking.steps > 0,
    meals.length > 0,
    Boolean(latestWeight),
  ].filter(Boolean).length;
  const careText = filledItems >= 3
    ? "Mira уже учла основные данные заботы за сегодня."
    : filledItems > 0
      ? "Есть часть данных. Добавь недостающее в разделе Забота."
      : "Сегодня пока мало данных по заботе. Добавь воду, еду, шаги или вес.";

  return (
    <Card className="cursor-pointer p-4 transition active:scale-[0.99]" onClick={onOpen}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Что уже учтено сегодня</p>
          <p className="mt-1 text-base font-bold leading-snug text-mira-text">{careText}</p>
        </div>
        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-mira-lavender-light text-mira-primary">
          <span className="text-lg font-black">{filledItems}/4</span>
          <span className="text-[8px] font-bold uppercase">учтено</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <CareMetric label="Вода" value={`${(waterMl / 1000).toFixed(1)} / ${(waterGoalMl / 1000).toFixed(1)} л`} status={waterMl >= waterGoalMl ? "готово" : "добавить"} />
        <CareMetric label="Шаги" value={`${walking.steps.toLocaleString("ru-RU")} / ${walking.goal.toLocaleString("ru-RU")}`} status={stepsStatus} />
        <CareMetric label="Питание" value={`${meals.length} приём${meals.length === 1 ? "" : meals.length >= 2 && meals.length <= 4 ? "а" : "ов"}`} status={meals.length > 0 ? "учтено" : "пусто"} />
        <CareMetric label="Вес" value={latestWeight ? `${latestWeight.weight.toFixed(1)} кг` : "нет замера"} status={latestWeight ? "тренд" : "добавить"} />
      </div>

      <p className="mt-4 text-[11px] font-semibold text-mira-primary">Вода, шаги, питание и вес помогают Mira искать связи</p>
    </Card>
  );
}

function CareMetric({ label, value, status }: { label: string; value: string; status: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-mira-bg px-3 py-2.5">
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">{label}</p>
        <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-bold text-mira-primary">{status}</span>
      </div>
      <p className="truncate text-xs font-bold text-mira-text">{value}</p>
    </div>
  );
}

function MiraMascot({
  mood,
  size = 84,
}: {
  mood: "curious" | "happy" | "caring" | "attentive";
  size?: number;
}) {
  const isHappy = mood === "happy";
  const isCaring = mood === "caring";
  const isAttentive = mood === "attentive";
  const body = isHappy ? "#CDEFD9" : isCaring ? "#F7D6E4" : isAttentive ? "#FFE8B8" : "#E6DCF7";
  const accent = isHappy ? "#61B77B" : isCaring ? "#D983A4" : isAttentive ? "#E09B3D" : "#9B83D3";

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} aria-hidden="true">
      <div className="absolute inset-2 rounded-full opacity-40 blur-xl" style={{ background: accent }} />
      <svg viewBox="0 0 120 120" className="relative h-full w-full drop-shadow-[0_14px_24px_rgba(45,38,64,0.12)]">
        <path d="M60 10C78 10 94 24 96 43C111 49 115 70 102 83C100 103 82 113 60 113C38 113 20 103 18 83C5 70 9 49 24 43C26 24 42 10 60 10Z" fill={body} />
        <path d="M33 45C27 40 24 33 27 28C35 30 41 36 42 44" fill="#fff" opacity="0.75" />
        <path d="M87 45C93 40 96 33 93 28C85 30 79 36 78 44" fill="#fff" opacity="0.75" />
        <circle cx="44" cy="58" r="6" fill="#332B46" />
        <circle cx="76" cy="58" r="6" fill="#332B46" />
        <circle cx="41" cy="55" r="2" fill="#fff" />
        <circle cx="73" cy="55" r="2" fill="#fff" />
        {isHappy ? (
          <path d="M45 76C51 85 69 85 75 76" fill="none" stroke="#332B46" strokeWidth="5" strokeLinecap="round" />
        ) : isAttentive ? (
          <path d="M50 78C56 75 64 75 70 78" fill="none" stroke="#332B46" strokeWidth="5" strokeLinecap="round" />
        ) : (
          <path d="M50 76C56 80 64 80 70 76" fill="none" stroke="#332B46" strokeWidth="5" strokeLinecap="round" />
        )}
        <path d="M60 30C60 30 66 21 74 21C81 21 86 26 86 32C86 38 81 43 74 43C66 43 60 30 60 30ZM60 30C60 30 54 43 46 43C39 43 34 38 34 32C34 26 39 21 46 21C54 21 60 30 60 30Z" fill="none" stroke={accent} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function MiraMascotCard({
  state,
  completed,
  onCheckIn,
  onCare,
}: {
  state: "empty" | "partial" | "ready" | "care";
  completed: number;
  onCheckIn?: () => void;
  onCare: () => void;
}) {
  const copy = {
    empty: {
      mood: "curious" as const,
      title: "Mira пока не знает, как ты сегодня",
      body: "Помоги ей одной короткой отметкой. Даже 20 секунд уже делают советы точнее.",
      status: "0/4",
      action: "Помочь Mira",
    },
    partial: {
      mood: "caring" as const,
      title: "Mira уже чуть лучше понимает день",
      body: "Есть первые данные. Можно добавить ещё сон, боль, воду или настроение, если есть силы.",
      status: `${completed}/4`,
      action: "Добавить ещё",
    },
    ready: {
      mood: "happy" as const,
      title: "Mira довольна: день понятен",
      body: "Сегодня достаточно данных, чтобы связать самочувствие с циклом и заботой без лишних вопросов.",
      status: `${completed}/4`,
      action: "Открыть заботу",
    },
    care: {
      mood: "attentive" as const,
      title: "Mira просит немного контекста",
      body: "Состояние уже есть. Добавь воду, шаги или питание, чтобы понять, что может влиять на самочувствие.",
      status: `${completed}/4`,
      action: "Добавить заботу",
    },
  }[state];

  return (
    <Card className="overflow-hidden border border-white/70 bg-gradient-to-br from-[#FFFDFB] via-[#FFF4F7] to-[#F5EFFA] p-4 shadow-[0_18px_44px_rgba(73,50,82,0.08)]">
      <div className="flex items-center gap-4">
        <MiraMascot mood={copy.mood} />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Mira сегодня</p>
            <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-black text-mira-primary shadow-sm">{copy.status}</span>
          </div>
          <p className="text-base font-black leading-tight text-mira-text">{copy.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-mira-muted">{copy.body}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" className="rounded-full" onClick={state === "ready" || state === "care" ? onCare : onCheckIn}>
              {copy.action}
            </Button>
            {state !== "empty" && (
              <Button size="sm" variant="outline" className="rounded-full bg-white/75" onClick={onCheckIn}>
                Добавить в дневник
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function TodayFact({ label, value, light = false }: { label: string; value: string; light?: boolean }) {
  return (
    <div className={`rounded-[20px] border px-3 py-2.5 shadow-[0_8px_18px_rgba(73,50,82,0.04)] ${
      light ? "border-white/25 bg-white/18 backdrop-blur-md" : "border-white/70 bg-white/65"
    }`}>
      <p className={`text-[10px] font-bold uppercase tracking-widest ${light ? "text-white/68" : "text-mira-muted"}`}>{label}</p>
      <p className={`mt-1 text-sm font-black leading-tight ${light ? "text-white" : "text-mira-text"}`}>{value}</p>
    </div>
  );
}

function TodayActionCard({
  title,
  body,
  onClick,
  tone = "default",
}: {
  title: string;
  body: string;
  onClick?: () => void;
  tone?: "default" | "urgent" | "soft";
}) {
  const toneClass = tone === "urgent"
    ? "border-mira-cycle/20 bg-[#FFF2F5] text-mira-cycle"
    : tone === "soft"
      ? "border-[#E6C79E]/25 bg-[#FFF8ED] text-[#8A6B24]"
      : "border-mira-primary/12 bg-[#FFFCF8] text-mira-primary";

  const Comp = onClick ? "button" : "div";

  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`w-full rounded-[22px] border p-3 text-left shadow-[0_10px_24px_rgba(73,50,82,0.05)] transition hover:-translate-y-0.5 active:scale-[0.99] ${toneClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black leading-tight text-mira-text">{title}</p>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-mira-muted">{body}</p>
        </div>
        {onClick && <span className="mt-0.5 text-base leading-none">›</span>}
      </div>
    </Comp>
  );
}

function QuickActionButton({
  label,
  onClick,
  tone = "default",
}: {
  label: string;
  onClick?: () => void;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-12 rounded-[22px] px-3 py-2 text-sm font-black shadow-[0_10px_22px_rgba(73,50,82,0.055)] transition hover:-translate-y-0.5 active:scale-[0.98] ${
        tone === "danger"
          ? "bg-mira-cycle text-white"
          : "border border-white/70 bg-[#FFFCF8] text-mira-text"
      }`}
    >
      {label}
    </button>
  );
}

function getPeriodPrep(daysUntil: number, phase: CyclePhase) {
  if (phase === "menstruation") {
    return {
      level: 4,
      tone: "border-mira-cycle/25 bg-[#F8E8EE]/70",
      accent: "text-mira-cycle",
      fill: "bg-mira-cycle",
      status: "Критические дни",
      firstAidTitle: "Носи с собой прокладки",
      firstAidBody: "Прокладки, влажные салфетки, запасное бельё и привычное средство от боли, если тебе его можно.",
      clothingTitle: "Тёмная одежда",
      clothingBody: "Сегодня лучше тёмные джинсы или чёрная одежда, мягкий пояс и удобное бельё.",
    };
  }

  if (daysUntil <= 1) {
    return {
      level: 4,
      tone: "border-mira-cycle/25 bg-[#F8E8EE]/65",
      accent: "text-mira-cycle",
      fill: "bg-mira-cycle",
      status: "Очень близко",
      firstAidTitle: "Положи прокладки в сумку",
      firstAidBody: "Добавь прокладки, салфетки и маленький пакет. Лучше быть готовой заранее.",
      clothingTitle: "Тёмные джинсы",
      clothingBody: "Выбери тёмные джинсы или чёрный низ. Так спокойнее, если месячные начнутся сегодня.",
    };
  }

  if (daysUntil <= 3) {
    return {
      level: 3,
      tone: "border-[#C47E9B]/20 bg-[#F8E8EE]/45",
      accent: "text-mira-cycle",
      fill: "bg-mira-cycle",
      status: `Через ${daysUntil} дн.`,
      firstAidTitle: "Аптечку уже стоит собрать",
      firstAidBody: "Прокладки, салфетки, вода и то, что обычно помогает тебе при спазмах.",
      clothingTitle: "Комфортный низ",
      clothingBody: "Лучше джинсы или брюки без сильного давления на живот, цвет — тёмный.",
    };
  }

  if (daysUntil <= 7) {
    return {
      level: 2,
      tone: "border-[#C4B07E]/20 bg-[#F5F0E0]/40",
      accent: "text-[#9A7B2F]",
      fill: "bg-[#C4B07E]",
      status: `Через ${daysUntil} дн.`,
      firstAidTitle: "Проверь запас",
      firstAidBody: "Посмотри, есть ли прокладки дома и одна-две штуки в сумке.",
      clothingTitle: "Джинсы свободнее",
      clothingBody: "Сегодня подойдут джинсы без давления или мягкие брюки. Тёмный низ — спокойный запасной вариант.",
    };
  }

  return {
    level: 1,
    tone: "border-mira-lavender/20 bg-white",
    accent: "text-mira-muted",
    fill: "bg-mira-lavender",
    status: "Спокойный день",
    firstAidTitle: "Базовая аптечка",
    firstAidBody: "Держи дома запас прокладок, салфетки и то, что обычно помогает тебе в первые дни.",
    clothingTitle: "Джинсы или мягкий низ",
    clothingBody: "Сегодня можно надеть джинсы или комфортный низ. Если хочется перестраховаться — выбирай тёмный цвет.",
  };
}

function FirstAidCard({ data, daysUntil, phase, onOpen }: { data: MiraLocalData; daysUntil: number; phase: CyclePhase; onOpen: () => void }) {
  const prep = getPeriodPrep(daysUntil, phase);
  const kit = normalizePeriodKit(data.periodKit);
  const readyCount = kit.items.filter((item) => item.checked).length;
  const readyTotal = kit.items.length;
  const essentialTotal = periodKitItems.filter((item) => item.essential).length;
  const essentialReady = periodKitItems.filter((item) => item.essential && kit.items.find((kitItem) => kitItem.id === item.id)?.checked).length;
  const isClose = phase === "menstruation" || daysUntil <= 3;

  return (
    <Card
      className={`min-h-[154px] cursor-pointer p-3.5 transition active:scale-[0.99] ${prep.tone}`}
      onClick={onOpen}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`text-[10px] font-bold uppercase tracking-widest ${prep.accent}`}>Моя аптечка</p>
          <p className="mt-1 text-sm font-bold leading-snug text-mira-text">{prep.firstAidTitle}</p>
        </div>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/70">
          <BriefcaseMedical className={`h-4 w-4 ${prep.accent}`} />
        </span>
      </div>
      <p className="min-h-[48px] text-[11px] leading-snug text-mira-muted">
        {isClose && essentialReady < essentialTotal
          ? "Скоро месячные. Проверь главное: прокладки, салфетки, бельё, вода и привычное средство от боли."
          : prep.firstAidBody}
      </p>
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[10px] font-semibold text-mira-muted">
          <span>{readyCount === readyTotal ? "Аптечка готова" : prep.status}</span>
          <span>{readyCount}/{readyTotal}</span>
        </div>
        <div className="grid grid-cols-9 gap-1">
          {kit.items.map((item) => (
            <span
              key={item.id}
              className={`h-1.5 rounded-full ${item.checked ? prep.fill : "bg-mira-lavender-light"}`}
            />
          ))}
        </div>
      </div>
      <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-mira-muted">Открыть в Заботе</p>
    </Card>
  );
}

function ClothingCard({ daysUntil, phase }: { daysUntil: number; phase: CyclePhase }) {
  const prep = getPeriodPrep(daysUntil, phase);
  return (
    <Card className={`min-h-[154px] p-3.5 ${prep.tone}`}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`text-[10px] font-bold uppercase tracking-widest ${prep.accent}`}>Одежда</p>
          <p className="mt-1 text-sm font-bold leading-snug text-mira-text">{prep.clothingTitle}</p>
        </div>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/70">
          <Shirt className={`h-4 w-4 ${prep.accent}`} />
        </span>
      </div>
      <p className="text-[11px] leading-snug text-mira-muted">{prep.clothingBody}</p>
      <div className="mt-3 rounded-lg bg-white/60 px-2.5 py-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Сегодня</p>
        <p className="mt-0.5 text-[11px] font-semibold text-mira-text">
          {prep.level >= 3 ? "Тёмный низ + удобное бельё" : "Джинсы или тёмный низ"}
        </p>
      </div>
    </Card>
  );
}

function MoodPmsCard({ card, onJournal }: { card: MoodPmsCard; onJournal?: () => void }) {
  const toneClass = card.tone === "alert"
    ? "border-mira-cycle/15 bg-[#FFF4F7]"
    : card.tone === "sensitive"
      ? "border-[#C4B07E]/15 bg-[#FFF9EA]"
      : "border-mira-primary/10 bg-white";

  const iconClass = card.tone === "alert"
    ? "text-mira-cycle"
    : card.tone === "sensitive"
      ? "text-[#9A7A35]"
      : "text-mira-primary";

  return (
    <Card className={`p-4 shadow-[0_12px_32px_rgba(45,38,64,0.05)] ${toneClass}`}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white">
          <Brain className={`h-5 w-5 ${iconClass}`} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Настроение и ПМС</p>
          <p className="mt-0.5 text-sm font-bold leading-snug text-mira-text">{card.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-mira-muted">{card.body}</p>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_0.8fr]">
        <div className="rounded-2xl bg-white px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">{card.label}</p>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-mira-text">{card.pmsForecast}</p>
        </div>
        <button
          type="button"
          onClick={onJournal}
          className="rounded-2xl bg-white px-3 py-2.5 text-left transition hover:-translate-y-0.5 active:scale-[0.99]"
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">{card.practice.title}</p>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-mira-text">{card.practice.steps[0]}</p>
        </button>
      </div>

      {card.heavyWarning && (
        <div className="mt-2 flex items-start gap-2 rounded-xl border border-mira-cycle/15 bg-white/75 px-3 py-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-mira-cycle" />
          <p className="text-xs leading-relaxed text-mira-cycle">{card.heavyWarning}</p>
        </div>
      )}
    </Card>
  );
}

export function TodayScreen({ data, navigate, onBadState, onDelayCheck, onCheckIn }: ScreenProps) {
  const profile = data.profile;
  const norm = getCycleNorm(profile);
  const cycleDay = norm.cycleDay;
  const cycleLength = norm.cycleLength;
  const periodLength = profile?.cycleConfig.periodLength ?? 5;
  const phase = getCyclePhase(cycleDay, periodLength, cycleLength);
  const daysUntil = norm.daysUntilPeriod;
  const delayDays = norm.delayDays;
  const checkIn = getCheckIn(data);
  const name = profile?.name ?? "Mira";
  const streak = getStreak(data);
  const config = phaseConfig[phase];
  const toughDay = getToughDayContent(data);
  const redFlags = getRedFlags(data);
  const sexInsight = getSexCycleInsight(data);
  const reminders = getSmartReminders(data);
  const forecast = getPeriodForecast(profile);
  const waterEntry = getWaterEntry(data);
  const walkingEntry = getWalkingEntry(data);
  const latestWeight = getLatestWeightEntry(data);
  const hasDiarySignal = Boolean(
    checkIn?.period ||
    checkIn?.pain ||
    checkIn?.mood ||
    checkIn?.energy ||
    checkIn?.sleep ||
    checkIn?.badEpisodes?.length ||
    checkIn?.note?.text
  );
  const hasCareSignal = waterEntry.glasses > 0 || walkingEntry.steps > 0 || Boolean(checkIn?.meals?.length) || Boolean(latestWeight);
  const mascotCompleted = [
    hasDiarySignal,
    waterEntry.glasses > 0,
    Boolean(checkIn?.meals?.length),
    walkingEntry.steps > 0 || Boolean(latestWeight),
  ].filter(Boolean).length;
  const mascotState =
    redFlags.length > 0 || norm.isDelayed
      ? "care"
      : mascotCompleted >= 3
        ? "ready"
        : hasDiarySignal && !hasCareSignal
          ? "care"
          : mascotCompleted > 0
            ? "partial"
            : "empty";

  // «Сегодня важное» — один блок по приоритету
  const reminder = reminders[0];
  const important =
    norm.isDelayed
      ? { emoji: "?", title: "Сохрани факты по задержке", body: "Отметь симптомы, проверь вероятность беременности и обратись к врачу при сильной боли, обмороке или очень обильном кровотечении.", tone: "rose" as const }
      : toughDay
      ? { emoji: "🤍", title: toughDay.greeting, body: toughDay.tips[0], tone: "rose" as const }
      : redFlags.length > 0
        ? { emoji: "⚠️", title: redFlags[0].title, body: redFlags[0].body.split(".")[0] + ".", tone: "rose" as const }
        : reminder
          ? { emoji: reminder.type === "clothing" ? "👗" : reminder.type === "firstaid" ? "💊" : reminder.type === "delay" ? "⚠️" : "🔔", title: reminder.title, body: reminder.body, tone: "warm" as const }
          : { emoji: "💡", title: "Совет на сегодня", body: config.recommendation, tone: "lavender" as const };

  const moodPmsCard = getMoodPmsCard(phase, daysUntil, checkIn);
  const showSexInsight = sexInsight && sexInsight.tone !== "neutral";
  const todayAnswer = norm.isDelayed
    ? `Сегодня задержка ${delayDays} дн. Лучше разобраться с причинами и подготовить аптечку.`
    : `Сегодня ${cycleDay}-й день цикла. Mira подскажет, что важно и что подготовить.`;
  const mainTitle = norm.isDelayed
    ? `Задержка ${delayDays} дн.`
    : phase === "menstruation"
      ? "Идут месячные"
      : phase === "luteal"
        ? "Скоро месячные"
        : config.title;
  const mainBody = norm.isDelayed
    ? "Это может быть связано со стрессом, болезнью, перелётом, лекарствами, нерегулярным циклом или беременностью.\n\nMira не ставит диагноз, но поможет сохранить факты и понять, что обсудить с врачом."
    : phase === "menstruation"
      ? "Сегодня лучше снизить нагрузку, следить за болью и держать под рукой аптечку."
      : phase === "luteal"
        ? "В этой фазе чаще бывают ПМС, тяга к сладкому, усталость или раздражительность. Это повод быть мягче к себе."
        : todayAnswer;
  const primaryAction = redFlags.length > 0
    ? { label: "Мне плохо", onClick: onBadState, tone: "danger" as const }
    : norm.isDelayed
      ? { label: "Разобраться с задержкой", onClick: onDelayCheck, tone: "danger" as const }
      : { label: "Открыть дневник", onClick: () => navigate("diary"), tone: "primary" as const };
  const planItems = redFlags.length > 0
    ? [
      { title: "Не терпеть симптом", body: "Нажми “Мне плохо”, если боль сильная, есть слабость, обильное кровотечение или тревожный симптом.", action: onBadState, tone: "urgent" as const },
      { title: "Добавить в дневник", body: "Если симптом повторяется, его можно показать врачу.", action: () => navigate("report"), tone: "soft" as const },
      { title: "Снизить нагрузку", body: "Сегодня лучше выбрать спокойный режим и больше воды.", tone: "default" as const },
    ]
    : norm.isDelayed
      ? [
        { title: "Отметить симптомы", body: "Сохрани боль, слабость, тошноту, настроение или необычные выделения.", action: onCheckIn, tone: "default" as const },
        { title: "Сделать тест", body: "Если была вероятность беременности, лучше сделать тест по инструкции и сохранить результат.", action: onDelayCheck, tone: "soft" as const },
        { title: "Обратиться к врачу", body: "Если есть сильная боль, обморок или очень обильное кровотечение, не жди.", action: onBadState, tone: "urgent" as const },
      ]
      : [
        { title: "Посмотри настроение", body: moodPmsCard.pmsForecast, action: () => navigate("diary"), tone: "default" as const },
        { title: "Проверь заботу", body: "Вода, шаги, питание и вес вводятся в разделе Забота.", action: () => navigate("care"), tone: "soft" as const },
        { title: "Подготовься заранее", body: daysUntil <= 3 ? "Месячные близко: проверь аптечку и одежду." : "Если день спокойный, просто следи за самочувствием.", action: () => openCareTab(5), tone: "default" as const },
      ];

  const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 22 } } };

  function openCareTab(tabIndex: number) {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("mira-care-tab", String(tabIndex));
    }
    navigate("care");
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.07 } } }}>

      {/* Header — avatar / brand / diary */}
      <motion.div variants={fadeUp} className="flex items-center justify-between mb-4">
        <button onClick={() => navigate("profile")}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/70 bg-[#FFFCF8] text-mira-primary shadow-card transition active:scale-[0.98]"
          aria-label="Открыть профиль">
          {name ? <span className="text-sm font-bold">{name.charAt(0).toUpperCase()}</span> : <UserRound className="h-5 w-5" />}
        </button>
        <div className="flex flex-col items-center text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-mira-text">Mira</p>
          {streak.current > 0 && (
            <span className="text-[11px] font-semibold text-mira-primary">серия {streak.current}</span>
          )}
        </div>
        <button onClick={() => navigate("diary")}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/70 bg-[#FFFCF8] text-mira-muted shadow-card transition hover:border-mira-primary/30 hover:text-mira-primary active:scale-[0.98]"
          aria-label="Открыть дневник">
          <CalendarDays className="h-5 w-5" />
        </button>
      </motion.div>

      <motion.div variants={fadeUp} className="mb-4">
        <Card className="border border-white/70 bg-gradient-to-br from-[#FFFDFB] via-[#FFF6F8] to-[#F4EEFA] p-4 shadow-[0_18px_44px_rgba(73,50,82,0.08)]">
          <CycleCalendar
            cycleLength={cycleLength}
            periodLength={periodLength}
            checkIns={data.checkIns}
            periodStart={profile?.cycleConfig.periodStart ?? ""}
          />
          <div className="rounded-[28px] border border-white/65 bg-gradient-to-br from-[#FF7F8D] via-[#FF9567] to-[#D764D8] p-4 text-white shadow-[0_18px_36px_rgba(218,102,158,0.22)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">График цикла</p>
                <p className="mt-1 text-sm font-black text-white">
                  {norm.isDelayed ? "Ожидание месячных" : phaseNames[phase]}
                </p>
              </div>
              <span className="rounded-full bg-white/24 px-3 py-1 text-[10px] font-black text-white shadow-sm backdrop-blur-md">
                {norm.isDelayed ? `+${delayDays} дн.` : `${cycleDay}/${cycleLength}`}
              </span>
            </div>
            <CycleWaveChart cycleDay={cycleDay} cycleLength={cycleLength} periodLength={periodLength} />
          </div>
        </Card>
      </motion.div>

      {/* Главный ответ дня */}
      <motion.div variants={fadeUp} className="mb-4">
        <Card className="relative overflow-hidden border border-white/70 bg-gradient-to-br from-[#FF7891] via-[#FF9867] to-[#D95FDB] p-5 text-white shadow-[0_24px_58px_rgba(218,102,158,0.28)]">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0)_42%,rgba(255,255,255,0.16)_100%)]" />
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-sm font-semibold text-white/78">{norm.isDelayed ? "Задержка" : phase === "menstruation" ? "Месячные" : "Цикл"}</p>
                <h1 className="text-[34px] font-black leading-none text-white">{mainTitle}</h1>
                <p className="mt-3 max-w-[420px] whitespace-pre-line text-sm font-semibold leading-relaxed text-white/82">{mainBody}</p>
              </div>
              <span className="shrink-0 rounded-full bg-white/25 px-3 py-2 text-sm font-black text-white shadow-sm backdrop-blur-md">
                {norm.isDelayed ? `${delayDays} дн.` : `${cycleDay}/${cycleLength}`}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <TodayFact light label="День" value={norm.isDelayed ? "задержка" : `${cycleDay} из ${cycleLength}`} />
              <TodayFact light label={norm.isDelayed ? "Период" : "Фаза"} value={norm.isDelayed ? "Ожидание месячных" : phaseNames[phase]} />
              <TodayFact light label={norm.isDelayed ? "Прогноз" : "Месячные"} value={norm.isDelayed ? "идёт задержка" : forecast.text} />
            </div>

            {!norm.isDelayed && (
              <div className="rounded-[26px] border border-white/25 bg-white/18 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-md">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Важно сегодня</p>
                <p className="mt-1 text-base font-black leading-snug text-white">{important.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-white/80">{important.body}</p>
                <Button
                  className={`mt-4 w-full rounded-full border border-white/45 shadow-none ${
                    primaryAction.tone === "danger"
                      ? "bg-white text-mira-cycle hover:bg-white/92"
                      : "bg-white text-mira-primary hover:bg-white/92"
                  }`}
                  onClick={primaryAction.onClick}
                >
                  {primaryAction.label}
                </Button>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      <motion.div variants={fadeUp} className="mb-4">
        <MiraMascotCard
          state={mascotState}
          completed={mascotCompleted}
          onCheckIn={onCheckIn}
          onCare={() => navigate("care")}
        />
      </motion.div>

      <motion.div variants={fadeUp} className="mb-4">
        <Card className="border border-white/70 bg-gradient-to-br from-[#FFFDFB] to-[#FFF7ED] p-4 shadow-[0_16px_38px_rgba(73,50,82,0.075)]">
          <div className="mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Что сделать сегодня</p>
            <p className="mt-1 text-base font-black text-mira-text">Три главных действия</p>
          </div>
          <div className="grid gap-2">
            {planItems.map((item, index) => (
              <TodayActionCard
                key={item.title}
                title={`${index + 1}. ${item.title}`}
                body={item.body}
                tone={item.tone}
                onClick={item.action}
              />
            ))}
          </div>
        </Card>
      </motion.div>

      <motion.div variants={fadeUp} className="mb-4">
        <Card className="border border-white/70 bg-gradient-to-br from-[#FFFDFB] to-[#F7F1FF] p-4 shadow-[0_16px_38px_rgba(73,50,82,0.075)]">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-mira-muted">Быстрые кнопки</p>
          <div className="grid grid-cols-2 gap-2">
            <QuickActionButton label="Мне плохо" tone="danger" onClick={onBadState} />
            <QuickActionButton label="Отметить месячные" onClick={onCheckIn} />
            <QuickActionButton label="Добавить симптом" onClick={onCheckIn} />
            <QuickActionButton label="Открыть отчёт врачу" onClick={() => navigate("report")} />
          </div>
        </Card>
      </motion.div>

      {!norm.isDelayed && (
        <motion.div variants={fadeUp} className="mb-4">
          <MoodPmsCard card={moodPmsCard} onJournal={() => navigate("diary")} />
        </motion.div>
      )}

      {showSexInsight && (
        <motion.div variants={fadeUp} className="mb-4">
          <Card className={`p-3.5 ${
            sexInsight.tone === "alert"
              ? "border-mira-cycle/20 bg-[#F8E8EE]/45"
              : sexInsight.tone === "watch"
                ? "border-[#C4B07E]/20 bg-[#F5F0E0]/40"
                : "border-mira-lavender/20 bg-white"
          }`}>
            <div className="mb-2 flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/70 text-base">❤️</span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Секс и цикл</p>
                <p className="mt-0.5 text-sm font-bold leading-snug text-mira-text">{sexInsight.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-mira-muted">{sexInsight.body}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-white/70 px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Риск</p>
                <p className="mt-1 text-xs font-semibold text-mira-text">{sexInsight.riskLabel}</p>
              </div>
              <div className="rounded-lg bg-white/70 px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Что дальше</p>
                <p className="mt-1 text-xs font-semibold text-mira-text">{sexInsight.nextStep}</p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Забота — главная показывает выжимку, ввод остаётся на странице Забота */}
      <motion.div variants={fadeUp} className="mb-4 grid gap-3">
        <CareSummaryCard data={data} onOpen={() => navigate("care")} />
        <div className="grid grid-cols-2 gap-3">
          <FirstAidCard data={data} daysUntil={daysUntil} phase={phase} onOpen={() => openCareTab(5)} />
          <ClothingCard daysUntil={daysUntil} phase={phase} />
        </div>
      </motion.div>

    </motion.div>
  );
}
