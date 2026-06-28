"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Brain,
  BriefcaseBusiness,
  BriefcaseMedical,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  FileText,
  Footprints,
  HeartPulse,
  MessageCircleHeart,
  Plus,
  Scale,
  Shirt,
  X,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CountUp } from "@/components/ui/CountUp";
import {
  getLatestWeightEntry,
  getCycleDay, getCyclePhase,
  getDaysUntilPeriod, getCheckIn, getPreviousWeightEntry, getWalkingEntry, getWaterEntry,
} from "@/lib/store";
import { getPeriodForecast } from "@/lib/cycleEngine";
import { getSexCycleInsight, getSmartReminders, getRedFlags, getToughDayContent } from "@/lib/alerts";
import { getVitaminRecommendations } from "@/lib/vitamins";
import { getWorkMode, type WorkMode } from "@/lib/workMode";
import { getMoodPmsCard, type MoodPmsCard } from "@/lib/moodPms";
import { getStreak } from "@/lib/gamification";
import { getDayStatus, getQadaStats, type Madhab } from "@/lib/islamic";
import { getAgeConfig } from "@/lib/ageMode";
import { NormaScanCard } from "./NormaScanCard";
import type { ScreenProps } from "./types";
import type { CyclePhase, DailyCheckIn, MiraLocalData, PeriodKit, PeriodKitItemId } from "@/lib/types";

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
    title: "Замедление", subtitle: "Тело готовится. Будь мягче к себе.",
    energyLevel: 45, moodEmoji: "😐", moodLabel: "переменчиво",
    article: { title: "Почему тянет на сладкое перед месячными?", body: "Во второй половине цикла аппетит у многих меняется. Финики, фрукты с орехами и тёмный шоколад могут быть мягкой заменой.", tag: "Питание" },
    clothing: "Удобная одежда, мягкие ткани. Живот может быть вздут — свободный крой",
    recommendation: "Магний перед сном, йога или прогулка. Не планируй сложных дел.",
    fertility: { level: "Низкая", emoji: "🟢", note: "Фертильность снижается. Но ни один день не является полностью безопасным." },
  },
};

const periodKitItems: Array<{ id: PeriodKitItemId; label: string; hint: string; essential?: boolean }> = [
  { id: "pads", label: "Прокладки", hint: "2-3 штуки в сумку", essential: true },
  { id: "tampons", label: "Тампоны", hint: "Если пользуешься" },
  { id: "cup", label: "Менструальная чаша", hint: "Если это твой вариант" },
  { id: "pain_relief", label: "Обезболивающее", hint: "Только привычное и разрешённое тебе", essential: true },
  { id: "heating_pad", label: "Грелка", hint: "Дома или мини-формат" },
  { id: "wet_wipes", label: "Влажные салфетки", hint: "Для дороги и работы", essential: true },
  { id: "spare_underwear", label: "Запасное бельё", hint: "На всякий случай", essential: true },
  { id: "water", label: "Вода", hint: "Маленькая бутылка", essential: true },
  { id: "snack", label: "Шоколад / перекус", hint: "Что-то маленькое и сытное" },
];

function normalizePeriodKit(kit?: PeriodKit): PeriodKit {
  const checked = new Map((kit?.items ?? []).map((item) => [item.id, item.checked]));
  return {
    updatedAt: kit?.updatedAt,
    items: periodKitItems.map((item) => ({ id: item.id, checked: checked.get(item.id) ?? false })),
  };
}

// ── Apple-style Horizontal Calendar + Tracker ──

const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function CycleCalendar({ cycleLength, periodLength, checkIns, periodStart, onCheckIn }: {
  cycleLength: number; periodLength: number;
  checkIns: Record<string, DailyCheckIn>; periodStart: string;
  onCheckIn?: (date?: string) => void;
}) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const todayStr = today.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + (i - 3));
    const key = d.toISOString().slice(0, 10);
    return {
      date: d, day: d.getDate(),
      weekDay: dayNames[(d.getDay() + 6) % 7],
      isToday: key === todayKey, key,
    };
  });

  function getPhaseColor(date: Date): string {
    if (!periodStart) return "#D4CCE6";
    const start = new Date(periodStart);
    const diff = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
    const cd = ((diff % cycleLength) + cycleLength) % cycleLength + 1;
    const remaining = cycleLength - periodLength;
    const follEnd = periodLength + Math.round(remaining * 0.4);
    const ovulEnd = follEnd + Math.round(remaining * 0.12);
    if (cd <= periodLength) return "#E8A0B8";
    if (cd <= follEnd) return "#B8A5D8";
    if (cd <= ovulEnd) return "#D4A0C8";
    return "#D4CCE6";
  }

  const activeKey = selectedKey ?? todayKey;

  return (
    <div>
      {/* Date header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold capitalize text-mira-text">
            {selectedKey && selectedKey !== todayKey
              ? new Date(selectedKey).toLocaleDateString("ru-RU", { day: "numeric", month: "long", weekday: "short" })
              : todayStr
            }
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSelectedKey(null)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-mira-lavender/30 bg-white text-mira-muted transition hover:border-mira-primary/30 hover:text-mira-primary"
          aria-label="Вернуться к сегодняшнему дню"
        >
          <CalendarDays className="h-4 w-4" />
        </button>
      </div>

      {/* Pills row — full width, equal spacing */}
      <div className="grid grid-cols-7 gap-1.5 mb-5">
        {days.map((d, i) => {
          const phaseColor = getPhaseColor(d.date);
          const hasData = !!checkIns[d.key];
          const isFuture = d.date > today;
          const isSelected = d.key === activeKey;

          return (
            <motion.button
              key={d.key}
              onClick={() => {
                setSelectedKey(d.key === todayKey ? null : d.key);
              }}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.03, type: "spring", stiffness: 250 }}
              className="flex flex-col items-center gap-1"
            >
              <span className={`text-xs font-semibold ${isSelected ? "text-mira-primary" : "text-mira-muted"}`}>
                {d.weekDay}
              </span>
              {isSelected && <span className="text-[8px] text-mira-primary leading-none">▼</span>}
              {!isSelected && <span className="h-[10px]" />}
              <div className={`relative w-full flex items-center justify-center rounded-[20px] h-16 transition-all ${
                isSelected ? "ring-[2.5px] ring-mira-primary shadow-glow" : ""
              }`} style={{
                background: isFuture ? "#EDE8F5" : isSelected ? phaseColor : `${phaseColor}40`,
              }}>
                <span className={`text-base font-bold ${
                  isSelected ? "text-white" : isFuture ? "text-mira-muted/40" : "text-mira-text"
                }`}>{d.day}</span>
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

// ── График-волна: энергия/гормоны по циклу ──

function CycleWaveChart({ cycleDay, cycleLength, periodLength }: {
  cycleDay: number; cycleLength: number; periodLength: number;
}) {
  const w = 300, h = 70;
  // кривая энергии по дню цикла (низко в менструацию, пик в овуляцию, спад в лютеин)
  const pts = Array.from({ length: cycleLength }, (_, i) => {
    const p = (i + 1) / cycleLength;
    const periodEnd = periodLength / cycleLength;
    const ovul = (periodLength + (cycleLength - periodLength) * 0.4) / cycleLength;
    let v: number;
    if (p <= periodEnd) v = 22 + (p / periodEnd) * 8;
    else if (p <= ovul) v = 30 + ((p - periodEnd) / (ovul - periodEnd)) * 62;
    else if (p <= ovul + 0.06) v = 92;
    else v = 88 - ((p - ovul - 0.06) / (1 - ovul - 0.06)) * 62;
    return Math.max(12, Math.min(95, v));
  });
  const sx = w / (pts.length - 1);
  // сглаживание Безье
  const path = pts.map((v, i) => {
    const x = i * sx, y = h - (v / 100) * h;
    if (i === 0) return `M ${x.toFixed(1)} ${y.toFixed(1)}`;
    const px = (i - 1) * sx, py = h - (pts[i - 1] / 100) * h;
    return `C ${(px + sx * 0.4).toFixed(1)} ${py.toFixed(1)} ${(x - sx * 0.4).toFixed(1)} ${y.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
  const idx = Math.min(cycleDay - 1, pts.length - 1);
  const tx = idx * sx, ty = h - (pts[idx] / 100) * h;

  return (
    <svg viewBox={`-6 -6 ${w + 12} ${h + 16}`} className="w-full" style={{ height: h }}>
      <defs>
        <linearGradient id="wave" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#E8A0B8" /><stop offset="40%" stopColor="#B8A5D8" />
          <stop offset="55%" stopColor="#D4A0C8" /><stop offset="100%" stopColor="#D4CCE6" />
        </linearGradient>
        <linearGradient id="waveFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" /><stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L ${w} ${h + 6} L 0 ${h + 6} Z`} fill="url(#waveFill)" />
      <motion.path d={path} fill="none" stroke="url(#wave)" strokeWidth="3" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: "easeOut" }} />
      <motion.circle cx={tx} cy={ty} r="6" fill="white" stroke="#9B8EC4" strokeWidth="3"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8, type: "spring" }} />
      <circle cx={tx} cy={ty} r="2.5" fill="#9B8EC4" />
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

function CareSummaryCard({ data, phase, daysUntil, onOpen }: { data: MiraLocalData; phase: CyclePhase; daysUntil: number; onOpen: () => void }) {
  const checkIn = getCheckIn(data);
  const meals = checkIn?.meals ?? [];
  const water = getWaterEntry(data);
  const walking = getWalkingEntry(data);
  const latestWeight = getLatestWeightEntry(data);
  const today = new Date().toISOString().slice(0, 10);
  const todayWorkout = data.workouts.find(workout => workout.date === today);
  const waterMl = water.glasses * 250;
  const waterGoalMl = water.goal * 250;
  const stepsPct = Math.min(100, Math.round((walking.steps / walking.goal) * 100));
  const careScore = Math.round((
    Math.min(100, (waterMl / Math.max(waterGoalMl, 1)) * 100) +
    Math.min(100, (walking.steps / Math.max(walking.goal, 1)) * 100) +
    Math.min(100, meals.length * 34) +
    (todayWorkout ? 100 : phase === "menstruation" || daysUntil <= 2 ? 70 : 35)
  ) / 4);
  const careText = careScore >= 75
    ? "База дня закрыта хорошо: вода, движение и питание уже дают Mira материал для выводов."
    : careScore >= 45
      ? "Есть часть данных. Добавь недостающие пункты, чтобы аналитика точнее связала заботу с самочувствием."
      : "Сегодня мало данных по заботе. Внеси воду, еду, шаги или вес — Mira учтёт это в аналитике.";

  return (
    <Card className="cursor-pointer p-4 transition active:scale-[0.99]" onClick={onOpen}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Забота сегодня</p>
          <p className="mt-1 text-base font-bold leading-snug text-mira-text">{careText}</p>
        </div>
        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-mira-lavender-light text-mira-primary">
          <span className="text-lg font-black">{careScore}%</span>
          <span className="text-[8px] font-bold uppercase">база</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <CareMetric label="Вода" value={`${(waterMl / 1000).toFixed(1)} / ${(waterGoalMl / 1000).toFixed(1)} л`} status={waterMl >= waterGoalMl ? "готово" : "добавить"} />
        <CareMetric label="Шаги" value={`${walking.steps.toLocaleString("ru-RU")} / ${walking.goal.toLocaleString("ru-RU")}`} status={`${stepsPct}%`} />
        <CareMetric label="Питание" value={`${meals.length} приём${meals.length === 1 ? "" : meals.length >= 2 && meals.length <= 4 ? "а" : "ов"}`} status={meals.length > 0 ? "учтено" : "пусто"} />
        <CareMetric label="Тренировка" value={todayWorkout ? todayWorkout.title : phase === "menstruation" || daysUntil <= 2 ? "мягкий режим" : "по самочувствию"} status={todayWorkout ? "записано" : "план"} />
        <CareMetric label="Вес" value={latestWeight ? `${latestWeight.weight.toFixed(1)} кг` : "нет замера"} status={latestWeight ? "тренд" : "добавить"} />
        <CareMetric label="Аналитика" value="всё связано" status="Mira" />
      </div>

      <Button className="mt-4 w-full" variant="outline" onClick={(event) => { event.stopPropagation(); onOpen(); }}>
        Внести данные в Заботе
      </Button>
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

function FirstAidCard({ data, persist, daysUntil, phase }: { data: MiraLocalData; persist: (data: MiraLocalData) => void; daysUntil: number; phase: CyclePhase }) {
  const prep = getPeriodPrep(daysUntil, phase);
  const [open, setOpen] = useState(false);
  const kit = normalizePeriodKit(data.periodKit);
  const readyCount = kit.items.filter((item) => item.checked).length;
  const readyTotal = kit.items.length;
  const essentialTotal = periodKitItems.filter((item) => item.essential).length;
  const essentialReady = periodKitItems.filter((item) => item.essential && kit.items.find((kitItem) => kitItem.id === item.id)?.checked).length;
  const isClose = phase === "menstruation" || daysUntil <= 3;

  function toggleKitItem(id: PeriodKitItemId) {
    const nextKit = normalizePeriodKit(data.periodKit);
    persist({
      ...data,
      periodKit: {
        updatedAt: new Date().toISOString(),
        items: nextKit.items.map((item) => item.id === id ? { ...item, checked: !item.checked } : item),
      },
    });
  }

  function resetKit() {
    persist({
      ...data,
      periodKit: {
        updatedAt: new Date().toISOString(),
        items: normalizePeriodKit(data.periodKit).items.map((item) => ({ ...item, checked: false })),
      },
    });
  }

  return (
    <>
    <Card
      className={`min-h-[154px] cursor-pointer p-3.5 transition active:scale-[0.99] ${prep.tone}`}
      onClick={() => setOpen(true)}
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
    </Card>
    {open && (
      <div className="fixed inset-0 z-50">
        <button
          type="button"
          aria-label="Закрыть аптечку"
          className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        />
        <div className="absolute inset-x-4 bottom-4 max-h-[86vh] overflow-y-auto rounded-2xl bg-white p-4 shadow-soft md:left-1/2 md:top-1/2 md:bottom-auto md:w-[460px] md:-translate-x-1/2 md:-translate-y-1/2">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-mira-cycle">Аптечка месячных</p>
              <h2 className="mt-1 text-xl font-bold text-mira-text">Моя аптечка</h2>
              <p className="mt-1 text-sm leading-relaxed text-mira-muted">
                Отметь, что уже есть дома или в сумке. За 1-3 дня до месячных Mira напомнит проверить запас.
              </p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 text-mira-muted hover:bg-mira-lavender-light">
              <X className="h-5 w-5" />
            </button>
          </div>

          {isClose && readyCount < readyTotal && (
            <div className="mb-3 rounded-lg border border-mira-cycle/20 bg-[#F8E8EE]/55 p-3">
              <p className="text-sm font-bold text-mira-text">Скоро месячные. Проверь, есть ли всё в аптечке.</p>
              <p className="mt-1 text-xs leading-relaxed text-mira-muted">
                Главное сейчас: средства гигиены, запасное бельё, вода и то, что обычно помогает тебе при боли.
              </p>
            </div>
          )}

          <div className="mb-4 rounded-lg border border-mira-lavender/20 bg-mira-bg p-3">
            <div className="mb-2 flex items-center justify-between text-xs font-bold text-mira-text">
              <span>Готовность</span>
              <span>{readyCount}/{readyTotal}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-mira-cycle transition-all" style={{ width: `${Math.round((readyCount / readyTotal) * 100)}%` }} />
            </div>
          </div>

          <div className="space-y-2">
            {periodKitItems.map((item) => {
              const checked = kit.items.find((kitItem) => kitItem.id === item.id)?.checked ?? false;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleKitItem(item.id)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition active:scale-[0.99] ${
                    checked ? "border-mira-success/25 bg-[#E0F5E8]/45" : item.essential ? "border-mira-cycle/15 bg-[#F8E8EE]/25" : "border-mira-lavender/20 bg-white"
                  }`}
                >
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                    checked ? "border-mira-success bg-mira-success text-white" : "border-mira-lavender bg-white text-transparent"
                  }`}>
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-mira-text">{item.label}</span>
                    <span className="block text-xs leading-relaxed text-mira-muted">{item.hint}</span>
                  </span>
                  {item.essential && <span className="rounded-full bg-white/70 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-mira-cycle">важно</span>}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex gap-2">
            <Button className="flex-1" onClick={() => setOpen(false)}>Готово</Button>
            <button
              type="button"
              onClick={resetKit}
              className="rounded-lg border border-mira-lavender/25 px-3 text-xs font-bold text-mira-muted transition hover:bg-mira-lavender-light"
            >
              Сбросить
            </button>
          </div>
        </div>
      </div>
    )}
    </>
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

function WorkModeCard({ mode, onOpen }: { mode: WorkMode; onOpen: () => void }) {
  const toneClass = {
    green: "border-mira-success/15 bg-[#E0F5E8]/25",
    lavender: "border-mira-primary/10 bg-mira-lavender-light/25",
    warm: "border-[#C4B07E]/15 bg-[#F5F0E0]/35",
    rose: "border-mira-cycle/15 bg-[#F8E8EE]/40",
  }[mode.tone];

  const iconClass = {
    green: "text-mira-success",
    lavender: "text-mira-primary",
    warm: "text-[#9A7A35]",
    rose: "text-mira-cycle",
  }[mode.tone];

  const focusScore = mode.kind === "deep" ? 82 : mode.kind === "steady" ? 62 : 38;
  const focusLabel = mode.kind === "deep" ? "Фокус" : mode.kind === "steady" ? "Ровный темп" : "Беречь силы";

  return (
    <Card className={`cursor-pointer p-3.5 transition active:scale-[0.99] ${toneClass}`} onClick={onOpen}>
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/70">
          <BriefcaseBusiness className={`h-5 w-5 ${iconClass}`} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Работа</p>
          <p className="mt-0.5 truncate text-sm font-bold leading-snug text-mira-text">{focusLabel}: {mode.label}</p>
          <p className="mt-0.5 truncate text-xs text-mira-muted">{mode.bestFor.slice(0, 2).join(" · ")}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-black leading-none text-mira-text">{focusScore}%</p>
          <p className="mt-0.5 text-[10px] font-semibold text-mira-muted">ресурс</p>
        </div>
        <ChevronRight className={`h-4 w-4 shrink-0 ${iconClass}`} />
      </div>
    </Card>
  );
}

function MoodPmsCard({ card, onJournal }: { card: MoodPmsCard; onJournal?: () => void }) {
  const toneClass = card.tone === "alert"
    ? "border-mira-cycle/20 bg-[#F8E8EE]/45"
    : card.tone === "sensitive"
      ? "border-[#C4B07E]/15 bg-[#F5F0E0]/35"
      : "border-mira-primary/10 bg-mira-lavender-light/20";

  const iconClass = card.tone === "alert"
    ? "text-mira-cycle"
    : card.tone === "sensitive"
      ? "text-[#9A7A35]"
      : "text-mira-primary";

  return (
    <Card className={`p-4 ${toneClass}`}>
      <div className="mb-3 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/70">
          <Brain className={`h-5 w-5 ${iconClass}`} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Настроение и ПМС</p>
          <p className="mt-0.5 text-sm font-bold leading-snug text-mira-text">{card.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-mira-muted">{card.body}</p>
        </div>
      </div>

      <div className="mb-3 rounded-xl bg-white/70 px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">{card.label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-mira-text">{card.pmsForecast}</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl bg-white/70 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">{card.practice.title}</p>
          <div className="mt-1 space-y-1">
            {card.practice.steps.map((step) => (
              <p key={step} className="text-xs leading-snug text-mira-text">{step}</p>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={onJournal}
          className="rounded-xl bg-white/70 px-3 py-2 text-left transition active:scale-[0.99]"
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Дневник эмоций</p>
          <p className="mt-0.5 text-xs leading-relaxed text-mira-text">{card.journalPrompt}</p>
        </button>
      </div>

      <div className="mt-2 rounded-xl bg-white/70 px-3 py-2">
        <div className="mb-1 flex items-center gap-1.5">
          <MessageCircleHeart className="h-3.5 w-3.5 text-mira-primary" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Как сказать партнёру</p>
        </div>
        <p className="text-xs leading-relaxed text-mira-text">{card.partnerTip}</p>
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

export function TodayScreen({ data, persist, navigate, onCheckIn, onBadState, onDelayCheck }: ScreenProps) {
  const profile = data.profile;
  const cycleDay = getCycleDay(profile);
  const cycleLength = profile?.cycleConfig.cycleLength ?? 28;
  const periodLength = profile?.cycleConfig.periodLength ?? 5;
  const phase = getCyclePhase(cycleDay, periodLength, cycleLength);
  const daysUntil = getDaysUntilPeriod(profile);
  const delayDays = Math.max(0, cycleDay - cycleLength);
  const checkIn = getCheckIn(data);
  const name = profile?.name ?? "Mira";
  const streak = getStreak(data);

  const isIslamic = profile?.additionalMode === "islam";
  const ageConfig = getAgeConfig(profile?.age);
  const islamicStatus = isIslamic ? getDayStatus(data, (profile?.madhab ?? "hanafi") as Madhab) : null;
  const qadaStats = isIslamic ? getQadaStats(data) : null;


  const config = phaseConfig[phase];
  const toughDay = getToughDayContent(data);
  const redFlags = getRedFlags(data);
  const sexInsight = getSexCycleInsight(data);
  const reminders = getSmartReminders(data);
  const vitaminCard = getVitaminRecommendations(data);
  const forecast = getPeriodForecast(profile);

  // «Сегодня важное» — один блок по приоритету
  const reminder = reminders[0];
  const important =
    toughDay
      ? { emoji: "🤍", title: toughDay.greeting, body: toughDay.tips[0], tone: "rose" as const }
      : redFlags.length > 0
        ? { emoji: "⚠️", title: redFlags[0].title, body: redFlags[0].body.split(".")[0] + ".", tone: "rose" as const }
        : reminder
          ? { emoji: reminder.type === "clothing" ? "👗" : reminder.type === "firstaid" ? "💊" : reminder.type === "delay" ? "⚠️" : "🔔", title: reminder.title, body: reminder.body, tone: "warm" as const }
          : { emoji: "💡", title: "Совет на сегодня", body: config.recommendation, tone: "lavender" as const };

  const importantBg =
    important.tone === "rose" ? "border-mira-cycle/15 bg-[#F8E8EE]/40"
      : important.tone === "warm" ? "border-[#C4B07E]/15 bg-[#F5F0E0]/30"
        : "border-mira-primary/10 bg-[#EDE8F5]/30";

  const shorten = (text: string, max: number) =>
    text.length > max ? `${text.slice(0, Math.max(0, max - 3)).trim()}...` : text;
  const firstSentence = (text: string) => {
    const sentence = text.split(".")[0]?.trim();
    return sentence ? `${sentence}.` : text;
  };
  const vitaminRec = vitaminCard?.recs[0];
  const vitaminTitle = vitaminRec ? `${vitaminRec.name} ${vitaminRec.dose}` : "Поддержка";
  const vitaminBody = vitaminRec ? firstSentence(vitaminRec.how) : "Пока специальных подсказок нет.";
  const workMode = getWorkMode(phase, checkIn);
  const moodPmsCard = getMoodPmsCard(phase, daysUntil, checkIn);

  const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 22 } } };

  return (
    <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.07 } } }}>

      {/* Header — avatar / brand / diary */}
      <motion.div variants={fadeUp} className="flex items-center justify-between mb-4">
        <button onClick={() => navigate("profile")}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-mira-lavender/25 bg-white text-mira-primary shadow-card transition active:scale-[0.98]"
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
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-mira-lavender/30 bg-white text-mira-muted shadow-card transition hover:border-mira-primary/30 hover:text-mira-primary active:scale-[0.98]"
          aria-label="Открыть дневник">
          <CalendarDays className="h-5 w-5" />
        </button>
      </motion.div>

      {/* Calendar pills */}
      <motion.div variants={fadeUp} className="mb-4">
        <CycleCalendar
          cycleLength={cycleLength} periodLength={periodLength}
          checkIns={data.checkIns} periodStart={profile?.cycleConfig.periodStart ?? ""}
          onCheckIn={onCheckIn}
        />
      </motion.div>

      {/* Phase hero with wave graph */}
      <motion.div variants={fadeUp} className="mb-4">
        <Card className={`border-0 bg-gradient-to-br ${config.gradient} p-5 shadow-[0_12px_30px_rgba(45,38,64,0.08)]`}>
          <div className="mb-1 flex items-start justify-between gap-4">
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-mira-text/55">Сегодня</p>
              <p className="text-xl font-bold text-mira-text">{config.title}</p>
              <p className="text-sm text-mira-text/70">{config.subtitle}</p>
            </div>
            <span className="rounded-lg bg-white/40 px-3 py-2 text-sm font-bold text-mira-text">День {cycleDay}</span>
          </div>

          <CycleWaveChart cycleDay={cycleDay} cycleLength={cycleLength} periodLength={periodLength} />

          <div className="mt-1 flex items-center justify-between">
            {isIslamic && islamicStatus ? (
              <span className="rounded-lg bg-white/35 px-3 py-1 text-xs font-bold text-mira-text">
                {islamicStatus.status === "hayd" ? "Хайд" : islamicStatus.status === "purity" ? "Чистота" : islamicStatus.status === "istihada" ? "Истихада" : "—"}
              </span>
            ) : (
              <span className="text-xs text-mira-text/60">Месячные {forecast.text}</span>
            )}
          </div>

          <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
            <Button onClick={() => onCheckIn?.()} className="bg-white text-mira-primary shadow-none hover:bg-white/90">
              {checkIn ? <CheckCircle2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {checkIn ? "Обновить отметку" : "Отметить состояние"}
            </Button>
            <Button variant="outline" onClick={() => navigate("report")} className="border-white/50 bg-white/35 text-mira-text hover:bg-white/60">
              <FileText className="h-4 w-4" />
            </Button>
          </div>
          <button
            type="button"
            onClick={() => onBadState?.()}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-mira-cycle/15 bg-white/45 px-4 py-2.5 text-sm font-bold text-mira-cycle transition hover:bg-white/65 active:scale-[0.98]"
          >
            <HeartPulse className="h-4 w-4" />
            Мне плохо
          </button>
        </Card>
      </motion.div>

      {delayDays > 0 && (
        <motion.div variants={fadeUp} className="mb-4">
          <Card className="border-mira-cycle/20 bg-[#F8E8EE]/45 p-4">
            <div className="mb-3 flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/70 text-base">?</span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-mira-cycle">Задержка {delayDays} дн.</p>
                <p className="text-sm font-bold text-mira-text">Разобраться с задержкой</p>
                <p className="mt-1 text-xs leading-relaxed text-mira-muted">
                  Ответь на пару вопросов: секс, защита, стресс, болезнь, перелёты, лекарства и обычная нерегулярность.
                </p>
              </div>
            </div>
            <Button className="w-full bg-white text-mira-cycle shadow-none hover:bg-white/90" onClick={() => onDelayCheck?.()}>
              Разобраться с задержкой
            </Button>
          </Card>
        </motion.div>
      )}

      {/* Мой ритм — что Mira уже понимает по отметкам */}
      <motion.div variants={fadeUp} className="mb-4">
        <NormaScanCard
          data={data}
          onOpenAnalytics={() => navigate("analytics")}
          onOpenReport={() => navigate("report")}
          onCheckIn={() => onCheckIn?.()}
        />
      </motion.div>

      {/* Сегодня важное + поддержка */}
      <motion.div variants={fadeUp} className="mb-4 grid grid-cols-2 gap-3">
        <Card className={`min-h-[128px] p-3 ${importantBg}`}>
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/60 text-base">
              {important.emoji}
            </span>
            <p className="text-[10px] font-bold uppercase leading-tight tracking-widest text-mira-muted">Сегодня важное</p>
          </div>
          <p className="text-[13px] font-bold leading-snug text-mira-text">{shorten(important.title, 42)}</p>
          <p className="mt-1 text-[11px] leading-snug text-mira-muted">{shorten(important.body, 70)}</p>
          {redFlags.length > 0 && !toughDay && (
            <button onClick={() => navigate("report")}
              className="mt-2 inline-flex items-center gap-1 rounded-lg bg-mira-cycle/15 px-2.5 py-1.5 text-[11px] font-semibold text-mira-cycle transition active:scale-95">
              <FileText className="h-3 w-3" /> Отчёт
            </button>
          )}
        </Card>

        <Card className="min-h-[128px] cursor-pointer border-mira-success/10 bg-[#E0F5E8]/25 p-3 transition active:scale-[0.99]" onClick={() => navigate("care")}>
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/70 text-base">
              {vitaminRec ? vitaminRec.icon : "🌿"}
            </span>
            <p className="text-[10px] font-bold uppercase leading-tight tracking-widest text-mira-success">Витамины</p>
          </div>
          <p className="text-[13px] font-bold leading-snug text-mira-text">{shorten(vitaminTitle, 38)}</p>
          <p className="mt-1 text-[11px] leading-snug text-mira-muted">{shorten(vitaminBody, 70)}</p>
        </Card>
      </motion.div>

      <motion.div variants={fadeUp} className="mb-4">
        <WorkModeCard mode={workMode} onOpen={() => navigate("analytics")} />
      </motion.div>

      <motion.div variants={fadeUp} className="mb-4">
        <MoodPmsCard card={moodPmsCard} onJournal={() => navigate("diary")} />
      </motion.div>

      {sexInsight && (
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

      {/* Islamic: qada (если есть) */}
      {isIslamic && qadaStats && qadaStats.remaining > 0 && (
        <motion.div variants={fadeUp} className="mb-4">
          <Card className="p-3.5 flex items-center gap-3 border-mira-primary/10 bg-mira-lavender-light/20 cursor-pointer" onClick={() => navigate("islamic")}>
            <span className="text-lg">🕌</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-mira-text">Каза-посты: {qadaStats.remaining} дн.</p>
              <p className="text-[10px] text-mira-muted">Пн и чт — сунна</p>
            </div>
            <ChevronRight className="h-4 w-4 text-mira-muted" />
          </Card>
        </motion.div>
      )}

      {/* Забота — главная показывает выжимку, ввод остаётся на странице Забота */}
      <motion.div variants={fadeUp} className="mb-4 grid gap-3">
        <CareSummaryCard data={data} phase={phase} daysUntil={daysUntil} onOpen={() => navigate("care")} />
        <div className="grid grid-cols-2 gap-3">
        <FirstAidCard data={data} persist={persist} daysUntil={daysUntil} phase={phase} />
        <ClothingCard daysUntil={daysUntil} phase={phase} />
        </div>
      </motion.div>

    </motion.div>
  );
}
