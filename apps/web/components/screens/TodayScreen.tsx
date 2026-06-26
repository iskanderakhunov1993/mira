"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getCycleDay, getCyclePhase,
  getDaysUntilPeriod, getCheckIn, getWaterEntry,
} from "@/lib/store";
import { getPeriodForecast } from "@/lib/cycleEngine";
import { getSmartReminders, getRedFlags, getToughDayContent } from "@/lib/alerts";
import { getVitaminRecommendations } from "@/lib/vitamins";
import { getDayStatus, getQadaStats, type Madhab } from "@/lib/islamic";
import { getAgeConfig } from "@/lib/ageMode";
import { getHealthSummary, statusMeta } from "@/lib/healthScore";
import { GardenCard } from "./GardenCard";
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

const phaseConfig: Record<CyclePhase, PhaseInfo> = {
  menstruation: {
    emoji: "🌺", gradient: "from-[#F5D0D8] via-[#F0C0D0] to-[#E8B0C0]",
    title: "Время заботы о себе", subtitle: "Энергия ниже — это нормально. Отдыхай.",
    energyLevel: 30, moodEmoji: "😌", moodLabel: "спокойствие",
    article: { title: "Почему болит живот при месячных?", body: "Простагландины заставляют матку сокращаться. Магний и тепло расслабляют мышцы и уменьшают боль.", tag: "Биология" },
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
    article: { title: "Почему тянет на сладкое перед месячными?", body: "Прогестерон повышает аппетит, падение серотонина вызывает тягу к углеводам. Финики и тёмный шоколад помогут.", tag: "Питание" },
    clothing: "Удобная одежда, мягкие ткани. Живот может быть вздут — свободный крой",
    recommendation: "Магний перед сном, йога или прогулка. Не планируй сложных дел.",
    fertility: { level: "Низкая", emoji: "🟢", note: "Фертильность снижается. Но ни один день не является полностью безопасным." },
  },
};

// ── Apple-style Horizontal Calendar + Tracker ──

const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function CycleCalendar({ cycleDay, cycleLength, periodLength, checkIns, periodStart, onCheckIn, persist, data }: {
  cycleDay: number; cycleLength: number; periodLength: number;
  checkIns: Record<string, DailyCheckIn>; periodStart: string;
  onCheckIn?: (date?: string) => void;
  persist: (data: any) => void;
  data: any;
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
  const activeCheckIn = checkIns[activeKey];
  const activeDate = new Date(activeKey);
  const isFutureActive = activeDate > today;

  return (
    <div>
      {/* Date header */}
      <div className="flex items-center justify-center mb-3">
        <p className="text-sm font-semibold text-mira-text capitalize">
          {selectedKey && selectedKey !== todayKey
            ? new Date(selectedKey).toLocaleDateString("ru-RU", { day: "numeric", month: "long", weekday: "short" })
            : `Сегодня, ${todayStr}`
          }
        </p>
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
                if (!isFuture && onCheckIn) onCheckIn(d.key);
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

// ── Мини-светофор здоровья ──

function MiniHealthStrip({ data, onOpen }: { data: MiraLocalData; onOpen: () => void }) {
  const summary = getHealthSummary(data);
  const hero = statusMeta[summary.overall];
  const real = summary.metrics.filter(m => m.status !== "nodata");
  return (
    <Card className="p-4 cursor-pointer" onClick={onOpen} style={{ background: `linear-gradient(135deg, ${hero.bg}, white)` }}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">
          {summary.overall === "ok" ? "✅" : summary.overall === "watch" ? "🟡" : summary.overall === "concern" ? "🔴" : "📊"}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-mira-text">{summary.headline}</p>
          <p className="text-[11px] text-mira-muted truncate">{summary.subtext}</p>
        </div>
        {/* цветные точки по метрикам */}
        <div className="flex items-center gap-1.5 shrink-0">
          {real.slice(0, 5).map(m => (
            <span key={m.id} className="h-2.5 w-2.5 rounded-full" style={{ background: statusMeta[m.status].color }} title={m.label} />
          ))}
          <ChevronRight className="h-4 w-4 text-mira-muted ml-0.5" />
        </div>
      </div>
    </Card>
  );
}

// ── Кольцо калорий + КБЖУ ──

function NutritionRing({ data, phase, onOpen }: { data: MiraLocalData; phase: CyclePhase; onOpen: () => void }) {
  const meals = getCheckIn(data)?.meals ?? [];
  // оценка съеденного: по размеру приёма пищи
  const sizeKcal: Record<string, number> = { small: 300, medium: 500, large: 750 };
  const eaten = meals.reduce((sum, m) => {
    const base = sizeKcal[m.size] ?? 450;
    return sum + (m.type === "snack" ? base * 0.5 : base);
  }, 0);
  // цель: базово 2000, в лютеиновую фазу чуть выше (прогестерон ↑ аппетит)
  const goal = phase === "luteal" ? 2150 : phase === "menstruation" ? 2050 : 2000;
  const pct = Math.min(100, Math.round((eaten / goal) * 100));
  const r = 30, c = 2 * Math.PI * r;

  return (
    <Card className="p-3.5 cursor-pointer" onClick={onOpen}>
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
            <span className="text-sm font-bold text-mira-text leading-none">{eaten}</span>
            <span className="text-[8px] text-mira-muted">из {goal}</span>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-mira-text mb-1.5">Цель ~{goal} ккал</p>
          {/* КБЖУ — рекомендуемый баланс */}
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
    <Card className="p-3.5 cursor-pointer" onClick={onOpen}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted mb-2">💧 Вода</p>
      <div className="flex items-center gap-3">
        {/* Бутылка */}
        <div className="relative h-[72px] w-9 shrink-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-1.5 bg-[#7BAF8D]/40 rounded-t" />
          <div className="absolute top-1.5 inset-x-0 bottom-0 rounded-[10px] rounded-t-md border-2 border-[#7BAF8D]/30 overflow-hidden bg-[#E0F5E8]/20">
            <motion.div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#7BAF8D] to-[#A0D4B0]"
              initial={{ height: 0 }} animate={{ height: `${fillPct}%` }} transition={{ duration: 0.7 }} />
          </div>
        </div>
        <div className="flex-1">
          <p className="text-lg font-bold text-mira-text leading-none">{(ml / 1000).toFixed(2)} <span className="text-xs font-normal text-mira-muted">л</span></p>
          <p className="text-[10px] text-mira-muted mt-0.5">из {(goalMl / 1000).toFixed(1)} л</p>
          {ml >= goalMl
            ? <p className="text-[10px] text-mira-success font-semibold mt-1">Цель достигнута 💧</p>
            : <p className="text-[10px] text-mira-primary font-semibold mt-1">+ добавить стакан</p>}
        </div>
      </div>
    </Card>
  );
}

export function TodayScreen({ data, persist, navigate, onCheckIn }: ScreenProps) {
  const [hintDismissed, setHintDismissed] = useState(
    typeof window !== "undefined" && localStorage.getItem("mira:hint-today") === "done"
  );
  const dismissHint = () => { localStorage.setItem("mira:hint-today", "done"); setHintDismissed(true); };

  const profile = data.profile;
  const cycleDay = getCycleDay(profile);
  const cycleLength = profile?.cycleConfig.cycleLength ?? 28;
  const periodLength = profile?.cycleConfig.periodLength ?? 5;
  const phase = getCyclePhase(cycleDay, periodLength, cycleLength);
  const daysUntil = getDaysUntilPeriod(profile);
  const checkIn = getCheckIn(data);
  const name = profile?.name ?? "Моя Норма";
  const waterEntry = getWaterEntry(data);

  const isIslamic = profile?.additionalMode === "islam";
  const ageConfig = getAgeConfig(profile?.age);
  const islamicStatus = isIslamic ? getDayStatus(data, (profile?.madhab ?? "hanafi") as Madhab) : null;
  const qadaStats = isIslamic ? getQadaStats(data) : null;


  const config = phaseConfig[phase];
  const toughDay = getToughDayContent(data);
  const redFlags = getRedFlags(data);
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

  const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

  return (
    <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.07 } } }}>

      {/* Header — avatar / date / calendar */}
      <motion.div variants={fadeUp} className="flex items-center justify-between mb-4">
        <button onClick={() => navigate("profile")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-mira-rose-light to-mira-lavender-light text-base font-bold text-mira-primary shadow-card transition active:scale-95">
          {name.charAt(0).toUpperCase()}
        </button>
        <p className="text-sm font-semibold text-mira-text">
          {new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
        </p>
        <button onClick={() => navigate("analytics")}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-mira-lavender/30 bg-white text-mira-muted shadow-card transition hover:border-mira-primary/30 active:scale-95">
          <span className="text-lg">📅</span>
        </button>
      </motion.div>

      {/* Первая подсказка (один раз) */}
      {!hintDismissed && (
        <motion.div variants={fadeUp} className="mb-4">
          <Card className="p-4 border-mira-primary/15 bg-mira-lavender-light/30">
            <div className="flex items-start gap-3">
              <span className="text-xl">👋</span>
              <div className="flex-1">
                <p className="text-sm font-bold text-mira-text">Как это работает</p>
                <p className="text-xs text-mira-muted mt-1 leading-relaxed">
                  Каждый день жми <span className="font-semibold text-mira-primary">«Отметить состояние»</span> — 10 секунд.
                  Я покажу, что происходит с телом, и <span className="font-semibold text-mira-primary">светофор</span> подскажет, всё ли в норме. Сад растёт с каждым днём 🌱
                </p>
                <button onClick={dismissHint} className="mt-2 text-xs font-semibold text-mira-primary">Понятно ✓</button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Calendar pills */}
      <motion.div variants={fadeUp} className="mb-5">
        <CycleCalendar
          cycleDay={cycleDay} cycleLength={cycleLength} periodLength={periodLength}
          checkIns={data.checkIns} periodStart={profile?.cycleConfig.periodStart ?? ""}
          onCheckIn={onCheckIn} persist={persist} data={data}
        />
      </motion.div>

      {/* Сад здоровья + дневной ритуал */}
      <motion.div variants={fadeUp} className="mb-4">
        <GardenCard data={data} onCheckIn={onCheckIn} />
      </motion.div>

      {/* Phase hero with wave graph */}
      <motion.div variants={fadeUp} className="mb-4">
        <Card className={`p-5 bg-gradient-to-br ${config.gradient} border-0`}>
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-xl font-bold text-mira-text">{config.title}</p>
              <p className="text-sm text-mira-text/70">{config.subtitle}</p>
            </div>
            <span className="text-3xl">{config.emoji}</span>
          </div>

          <CycleWaveChart cycleDay={cycleDay} cycleLength={cycleLength} periodLength={periodLength} />

          <div className="flex items-center justify-between mt-1">
            <span className="rounded-full bg-white/35 px-3 py-1 text-xs font-bold text-mira-text">День {cycleDay}</span>
            {isIslamic && islamicStatus ? (
              <span className="rounded-full bg-white/35 px-3 py-1 text-xs font-bold text-mira-text">
                {islamicStatus.status === "hayd" ? "Хайд" : islamicStatus.status === "purity" ? "Чистота" : islamicStatus.status === "istihada" ? "Истихада" : "—"}
              </span>
            ) : (
              <span className="text-xs text-mira-text/60">Месячные {forecast.text}</span>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Health traffic light */}
      <motion.div variants={fadeUp} className="mb-4">
        <MiniHealthStrip data={data} onOpen={() => navigate("analytics")} />
      </motion.div>

      {/* Сегодня важное — один блок */}
      <motion.div variants={fadeUp} className="mb-4">
        <Card className={`p-4 flex items-start gap-3 ${importantBg}`}>
          <span className="text-xl shrink-0">{important.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted mb-0.5">Сегодня важное</p>
            <p className="text-sm font-semibold text-mira-text">{important.title}</p>
            <p className="text-xs text-mira-muted mt-0.5">{important.body}</p>
            {/* #4 Проактивный отчёт врачу при красных флагах */}
            {redFlags.length > 0 && !toughDay && (
              <button onClick={() => navigate("report")}
                className="mt-2 inline-flex items-center gap-1 rounded-full bg-mira-cycle/15 px-3 py-1.5 text-xs font-semibold text-mira-cycle transition active:scale-95">
                📋 Собрать отчёт для врача <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Питание + Вода */}
      <motion.div variants={fadeUp} className="mb-4 grid grid-cols-2 gap-3">
        <NutritionRing data={data} phase={phase} onOpen={() => navigate("care")} />
        <WaterBottle data={data} onOpen={() => navigate("care")} />
      </motion.div>

      {/* Vitamin one-liner (если есть) */}
      {vitaminCard && vitaminCard.recs.length > 0 && (
        <motion.div variants={fadeUp} className="mb-4">
          <Card className="p-3.5 flex items-center gap-3 border-mira-success/10 bg-[#E0F5E8]/20">
            <span className="text-lg">{vitaminCard.recs[0].icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-mira-text">{vitaminCard.recs[0].name} {vitaminCard.recs[0].dose}</p>
              <p className="text-[10px] text-mira-success">{vitaminCard.recs[0].how.split(".")[0]}.</p>
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

      {/* CTA */}
      <motion.div variants={fadeUp}>
        <Button className="w-full" size="lg" onClick={() => onCheckIn?.()}>
          + Отметить состояние <ChevronRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
}
