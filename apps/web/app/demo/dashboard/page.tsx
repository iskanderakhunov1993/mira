"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Zap, Moon as MoonIcon, Smile, Droplets, ChevronRight,
  TrendingUp, Heart, Sparkles, GlassWater, Dumbbell,
  FileText, BarChart3, Bell, Pill, Shirt,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { readData, getCycleDay, getCyclePhase, getPhaseLabel, getDaysUntilPeriod } from "@/lib/store";
import type { CyclePhase } from "@/lib/types";

type PhaseInfo = {
  gradient: string;
  emoji: string;
  title: string;
  subtitle: string;
  energyLevel: number;
  moodEmoji: string;
  moodLabel: string;
  article: { title: string; body: string; readTime: string; tag: string };
  clothing: string;
  recommendation: string;
  fertility: { level: string; emoji: string; note: string } | null;
};

const phaseConfig: Record<CyclePhase, PhaseInfo> = {
  menstruation: {
    gradient: "from-[#F5D0D8] via-[#F0C0D0] to-[#E8B0C0]",
    emoji: "🌺",
    title: "Время заботы о себе",
    subtitle: "Энергия ниже — это нормально. Отдыхай.",
    energyLevel: 30,
    moodEmoji: "😌",
    moodLabel: "спокойствие",
    article: {
      title: "Почему болит живот при месячных?",
      body: "Простагландины заставляют матку сокращаться, чтобы обновить слизистую. Чем больше простагландинов — тем сильнее спазмы. Магний и тепло расслабляют мышцы и уменьшают боль.",
      readTime: "1 мин",
      tag: "Биология",
    },
    clothing: "Тёмное удобное бельё, свободные штаны без давления на живот. Никаких светлых джинсов.",
    recommendation: "Тёплый чай, грелка, лёгкая прогулка. Не требуй от себя многого — тело обновляется.",
    fertility: null,
  },
  follicular: {
    gradient: "from-[#E0D4F5] via-[#D8CCF0] to-[#D0C4E8]",
    emoji: "🌱",
    title: "Энергия растёт",
    subtitle: "Хорошее время для новых начинаний.",
    energyLevel: 65,
    moodEmoji: "😊",
    moodLabel: "подъём",
    article: {
      title: "Почему после месячных так хорошо?",
      body: "Эстроген растёт — он улучшает настроение, память и концентрацию. Кожа выглядит лучше, энергии больше. Это биологический подъём, не случайность.",
      readTime: "1 мин",
      tag: "Гормоны",
    },
    clothing: "Носи что хочешь — сейчас лучшие дни для любимых нарядов. Тело чувствует себя хорошо.",
    recommendation: "Силовая тренировка, белок на завтрак, новые начинания. Мышцы восстанавливаются быстрее.",
    fertility: { level: "Средняя", emoji: "🟡", note: "Фертильность растёт. Если не планируешь беременность — помни о контрацепции." },
  },
  ovulation: {
    gradient: "from-[#E8D0F5] via-[#E0C8F0] to-[#D8C0E8]",
    emoji: "✨",
    title: "Лучшие дни цикла",
    subtitle: "Максимум энергии и уверенности.",
    energyLevel: 90,
    moodEmoji: "🤩",
    moodLabel: "отлично",
    article: {
      title: "Что такое овуляция простыми словами?",
      body: "Яйцеклетка выходит из яичника и живёт 12-24 часа. В это время тестостерон даёт уверенность и энергию. Многие замечают повышенное желание общаться и быть активнее.",
      readTime: "2 мин",
      tag: "Биология",
    },
    clothing: "Всё что нравится — сейчас ты сияешь. Хороший день для того платья, которое ждёт в шкафу.",
    recommendation: "Интенсивная тренировка, важные переговоры, свидания. Пик продуктивности — используй!",
    fertility: { level: "Высокая", emoji: "🔴", note: "Максимальная фертильность 24-48 часов. Прогноз не является методом контрацепции." },
  },
  luteal: {
    gradient: "from-[#E8E0F0] via-[#E0D8E8] to-[#D8D0E0]",
    emoji: "🌙",
    title: "Замедление",
    subtitle: "Тело готовится. Будь мягче к себе.",
    energyLevel: 45,
    moodEmoji: "😐",
    moodLabel: "переменчиво",
    article: {
      title: "Почему тянет на сладкое перед месячными?",
      body: "Прогестерон повышает аппетит, а падение серотонина вызывает тягу к быстрым углеводам. Это не слабость — это биохимия. Финики, тёмный шоколад и бананы дадут энергию без скачков сахара.",
      readTime: "1 мин",
      tag: "Питание",
    },
    clothing: "Удобная одежда, мягкие ткани. Живот может быть вздут — выбирай свободный крой.",
    recommendation: "Магний перед сном, ранний отужин, йога или прогулка. Не планируй сложных дел.",
    fertility: { level: "Низкая", emoji: "🟢", note: "Фертильность снижается. Но ни один день цикла не является полностью безопасным." },
  },
};

function EnergyBar({ level, color }: { level: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <Zap className="h-4 w-4 text-mira-primary" />
      <div className="flex-1 h-2.5 rounded-full bg-white/40 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${level}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
        />
      </div>
      <span className="text-xs font-bold text-white/80">{level}%</span>
    </div>
  );
}

function CycleTimeline({ cycleDay, cycleLength, periodLength, phase }: {
  cycleDay: number;
  cycleLength: number;
  periodLength: number;
  phase: CyclePhase;
}) {
  const segments = [
    { label: "Менструация", days: periodLength, color: "bg-[#E8A0B8]" },
    { label: "Рост", days: Math.round((cycleLength - periodLength) * 0.4), color: "bg-[#B8A5D8]" },
    { label: "Пик", days: Math.round((cycleLength - periodLength) * 0.12), color: "bg-[#D4A0C8]" },
    { label: "Подготовка", days: cycleLength - periodLength - Math.round((cycleLength - periodLength) * 0.4) - Math.round((cycleLength - periodLength) * 0.12), color: "bg-[#D4CCE6]" },
  ];

  const position = ((cycleDay - 1) / (cycleLength - 1)) * 100;

  return (
    <div className="relative">
      <div className="flex h-3 rounded-full overflow-hidden gap-[2px]">
        {segments.map((seg, i) => (
          <motion.div
            key={i}
            className={`${seg.color} rounded-full`}
            style={{ flex: seg.days }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          />
        ))}
      </div>
      <motion.div
        className="absolute top-[-4px] h-5 w-5 rounded-full bg-white border-[3px] border-mira-primary shadow-glow"
        style={{ left: `${position}%`, transform: "translateX(-50%)" }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.6, type: "spring" }}
      />
      <div className="flex justify-between mt-2">
        {segments.map((seg, i) => (
          <span key={i} className="text-[9px] text-mira-muted font-medium" style={{ flex: seg.days, textAlign: "center" }}>
            {seg.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function DashboardDemo() {
  const [variant, setVariant] = useState<1 | 2 | 3>(1);
  const [ready, setReady] = useState(false);
  const [cycleDay, setCycleDay] = useState(15);
  const [phase, setPhase] = useState<CyclePhase>("ovulation");
  const [daysUntil, setDaysUntil] = useState(13);
  const [name, setName] = useState("Влада");
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);

  useEffect(() => {
    const data = readData();
    if (data.profile) {
      setCycleDay(getCycleDay(data.profile));
      const cd = getCycleDay(data.profile);
      setPhase(getCyclePhase(cd, data.profile.cycleConfig.periodLength, data.profile.cycleConfig.cycleLength));
      setDaysUntil(getDaysUntilPeriod(data.profile));
      setName(data.profile.name);
      setCycleLength(data.profile.cycleConfig.cycleLength);
      setPeriodLength(data.profile.cycleConfig.periodLength);
    }
    setReady(true);
  }, []);

  if (!ready) return null;

  const config = phaseConfig[phase];
  const daysRange = daysUntil > 2 ? `через ${daysUntil - 2}–${daysUntil + 2} дней` : daysUntil > 0 ? `через ${daysUntil} дн.` : "сегодня";

  return (
    <div className="min-h-screen bg-mira-bg px-4 py-6">
      <div className="mx-auto max-w-md">
        {/* Variant switcher */}
        <div className="mb-6 flex gap-2 rounded-2xl bg-white p-1.5 shadow-card">
          {[1, 2, 3].map(v => (
            <button key={v} onClick={() => setVariant(v as 1 | 2 | 3)}
              className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
                variant === v ? "bg-mira-primary text-white shadow-glow" : "text-mira-muted"
              }`}>
              Вариант {v}
            </button>
          ))}
        </div>

        {/* ═══════ VARIANT 1: Timeline ═══════ */}
        {variant === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-mira-muted">Привет</p>
                <p className="text-2xl font-bold text-mira-text">{name}</p>
              </div>
              <Badge>День {cycleDay}</Badge>
            </div>

            {/* Timeline */}
            <Card className="p-5">
              <CycleTimeline cycleDay={cycleDay} cycleLength={cycleLength} periodLength={periodLength} phase={phase} />
            </Card>

            {/* Status card */}
            <Card className={`p-5 bg-gradient-to-br ${config.gradient} border-0`}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{config.emoji}</span>
                <div>
                  <p className="text-lg font-bold text-mira-text">{config.title}</p>
                  <p className="text-sm text-mira-text/70">{config.subtitle}</p>
                </div>
              </div>
              <p className="text-xs text-mira-text/60 mb-3">Месячные {daysRange}</p>
              <EnergyBar level={config.energyLevel} color="bg-white/70" />
            </Card>

            {/* Metrics row */}
            <div className="grid grid-cols-3 gap-2">
              <Card className="p-3 text-center">
                <span className="text-xl">{config.moodEmoji}</span>
                <p className="text-[10px] text-mira-muted mt-1">{config.moodLabel}</p>
              </Card>
              <Card className="p-3 text-center">
                <span className="text-xl">😴</span>
                <p className="text-[10px] text-mira-muted mt-1">7ч сна</p>
              </Card>
              <Card className="p-3 text-center">
                <span className="text-xl">💧</span>
                <p className="text-[10px] text-mira-muted mt-1">3/8 стак.</p>
              </Card>
            </div>

            {/* Article of the day */}
            <Card className="p-4 border-0 bg-gradient-to-br from-white to-[#F8F5FE]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📖</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-mira-primary">Полезное сегодня</span>
                </div>
                <Badge className="text-[10px]">{config.article.tag}</Badge>
              </div>
              <p className="text-sm font-bold text-mira-text mb-1">{config.article.title}</p>
              <p className="text-xs text-mira-muted leading-relaxed">{config.article.body}</p>
              <p className="text-[10px] text-mira-primary mt-2">{config.article.readTime} чтения</p>
            </Card>

            {/* Recommendation */}
            <Card className="p-3.5 flex items-center gap-3 border-mira-primary/10 bg-[#EDE8F5]/30">
              <span className="text-lg">💡</span>
              <p className="text-sm text-mira-text flex-1">{config.recommendation}</p>
            </Card>

            {/* Clothing */}
            <Card className="p-3.5 flex items-center gap-3 border-[#C4B07E]/10 bg-[#F5F0E0]/20">
              <span className="text-lg">👗</span>
              <p className="text-xs text-mira-text flex-1">{config.clothing}</p>
            </Card>

            {/* Fertility warning */}
            {config.fertility && (
              <Card className={`p-3.5 flex items-center gap-3 ${config.fertility.level === "Высокая" ? "border-[#C47E7E]/15 bg-[#F5E0E0]/20" : "border-mira-lavender/10 bg-mira-bg/50"}`}>
                <span className="text-lg">{config.fertility.emoji}</span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-mira-text">Фертильность: {config.fertility.level}</p>
                  <p className="text-[10px] text-mira-muted">{config.fertility.note}</p>
                </div>
              </Card>
            )}

            {/* Vitamin one-liner */}
            <Card className="p-3.5 flex items-center gap-3 border-mira-success/15 bg-[#E0F5E8]/30">
              <span className="text-lg">💊</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-mira-text">Цинк 15мг</p>
                <p className="text-[10px] text-mira-muted">С едой. Не с кальцием.</p>
              </div>
            </Card>

            {/* Norm progress */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📊</span>
                  <span className="text-sm font-bold text-mira-text">Твоя норма</span>
                </div>
                <span className="text-lg font-bold text-mira-primary">47%</span>
              </div>
              <div className="h-2.5 rounded-full bg-mira-lavender-light overflow-hidden">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-mira-primary to-mira-cycle"
                  initial={{ width: 0 }} animate={{ width: "47%" }} transition={{ duration: 1, delay: 0.3 }} />
              </div>
              <div className="flex justify-between mt-2">
                {["Цикл", "Боль", "Сон", "Настроение", "Энергия"].map((cat, i) => (
                  <div key={cat} className="flex flex-col items-center gap-1">
                    <div className="h-1 w-6 rounded-full bg-mira-lavender-light overflow-hidden">
                      <div className="h-full rounded-full bg-mira-primary" style={{ width: `${[60, 30, 45, 50, 40][i]}%` }} />
                    </div>
                    <span className="text-[8px] text-mira-muted">{cat}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* CTA */}
            <Button className="w-full" size="lg">
              + Отметить за 10 секунд <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Mini cards row */}
            <div className="grid grid-cols-4 gap-2">
              <Card className="p-3 flex flex-col items-center gap-1 cursor-pointer hover:shadow-card-hover transition-all hover:translate-y-[-2px]">
                <Pill className="h-5 w-5 text-mira-success" />
                <span className="text-[10px] font-semibold text-mira-text">Витамины</span>
              </Card>
              <Card className="p-3 flex flex-col items-center gap-1 cursor-pointer hover:shadow-card-hover transition-all hover:translate-y-[-2px]">
                <GlassWater className="h-5 w-5 text-[#7E8EC4]" />
                <span className="text-[10px] font-semibold text-mira-text">3/8</span>
              </Card>
              <Card className="p-3 flex flex-col items-center gap-1 cursor-pointer hover:shadow-card-hover transition-all hover:translate-y-[-2px]">
                <span className="text-lg">🍽️</span>
                <span className="text-[10px] font-semibold text-mira-text">Еда</span>
              </Card>
              <Card className="p-3 flex flex-col items-center gap-1 cursor-pointer hover:shadow-card-hover transition-all hover:translate-y-[-2px]">
                <Shirt className="h-5 w-5 text-mira-cycle" />
                <span className="text-[10px] font-semibold text-mira-text">Всё ок</span>
              </Card>
            </div>

            {/* Shortcuts */}
            <div className="grid grid-cols-3 gap-2">
              <Card className="p-3 flex flex-col items-center gap-1 cursor-pointer hover:shadow-card-hover transition-all">
                <Heart className="h-5 w-5 text-mira-primary" />
                <span className="text-[10px] font-semibold text-mira-text">Забота</span>
              </Card>
              <Card className="p-3 flex flex-col items-center gap-1 cursor-pointer hover:shadow-card-hover transition-all">
                <BarChart3 className="h-5 w-5 text-[#9B8EC4]" />
                <span className="text-[10px] font-semibold text-mira-text">Аналитика</span>
              </Card>
              <Card className="p-3 flex flex-col items-center gap-1 cursor-pointer hover:shadow-card-hover transition-all">
                <FileText className="h-5 w-5 text-[#C4B07E]" />
                <span className="text-[10px] font-semibold text-mira-text">Отчёт</span>
              </Card>
            </div>
          </motion.div>
        )}

        {/* ═══════ VARIANT 2: Card of the Day ═══════ */}
        {variant === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <p className="text-sm text-mira-muted">Привет, {name}</p>

            {/* Hero card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 150, damping: 15 }}
            >
              <div className={`rounded-[2rem] bg-gradient-to-br ${config.gradient} p-6 shadow-[0_8px_40px_rgba(155,142,196,0.2)]`}>
                <div className="flex items-center justify-between mb-6">
                  <Badge className="bg-white/30 border-white/20 text-mira-text">День {cycleDay} из {cycleLength}</Badge>
                  <span className="text-2xl">{config.emoji}</span>
                </div>

                <p className="text-3xl font-bold text-mira-text mb-1">{config.title}</p>
                <p className="text-sm text-mira-text/70 mb-6">{config.subtitle}</p>

                {/* Inline metrics */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1.5 bg-white/30 rounded-full px-3 py-1.5">
                    <Zap className="h-3.5 w-3.5 text-mira-text/70" />
                    <span className="text-xs font-bold text-mira-text">{config.energyLevel}%</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/30 rounded-full px-3 py-1.5">
                    <span className="text-sm">{config.moodEmoji}</span>
                    <span className="text-xs font-bold text-mira-text">{config.moodLabel}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/30 rounded-full px-3 py-1.5">
                    <MoonIcon className="h-3.5 w-3.5 text-mira-text/70" />
                    <span className="text-xs font-bold text-mira-text">7ч</span>
                  </div>
                </div>

                <p className="text-xs text-mira-text/50">Месячные {daysRange}</p>
              </div>
            </motion.div>

            {/* Mini cards row */}
            <div className="grid grid-cols-4 gap-2">
              <Card className="p-3 flex flex-col items-center gap-1 cursor-pointer hover:shadow-card-hover transition-all hover:translate-y-[-2px]">
                <Pill className="h-5 w-5 text-mira-success" />
                <span className="text-[10px] font-semibold text-mira-text">Витамины</span>
              </Card>
              <Card className="p-3 flex flex-col items-center gap-1 cursor-pointer hover:shadow-card-hover transition-all hover:translate-y-[-2px]">
                <GlassWater className="h-5 w-5 text-[#7E8EC4]" />
                <span className="text-[10px] font-semibold text-mira-text">3/8</span>
              </Card>
              <Card className="p-3 flex flex-col items-center gap-1 cursor-pointer hover:shadow-card-hover transition-all hover:translate-y-[-2px]">
                <span className="text-lg">🍽️</span>
                <span className="text-[10px] font-semibold text-mira-text">Еда</span>
              </Card>
              <Card className="p-3 flex flex-col items-center gap-1 cursor-pointer hover:shadow-card-hover transition-all hover:translate-y-[-2px]">
                <Shirt className="h-5 w-5 text-mira-cycle" />
                <span className="text-[10px] font-semibold text-mira-text">Всё ок</span>
              </Card>
            </div>

            {/* Article */}
            <Card className="p-4 border-0 bg-gradient-to-br from-white to-[#F8F5FE]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">📖</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-mira-primary">Полезное</span>
                <Badge className="ml-auto text-[10px]">{config.article.tag}</Badge>
              </div>
              <p className="text-sm font-bold text-mira-text mb-1">{config.article.title}</p>
              <p className="text-xs text-mira-muted leading-relaxed">{config.article.body}</p>
            </Card>

            {/* Clothing + Recommendation row */}
            <div className="grid grid-cols-2 gap-2">
              <Card className="p-3">
                <span className="text-lg">👗</span>
                <p className="text-[10px] text-mira-muted mt-1 leading-relaxed">{config.clothing.split(".")[0]}.</p>
              </Card>
              <Card className="p-3">
                <span className="text-lg">💡</span>
                <p className="text-[10px] text-mira-muted mt-1 leading-relaxed">{config.recommendation.split(".")[0]}.</p>
              </Card>
            </div>

            {/* Fertility */}
            {config.fertility && (
              <Card className={`p-3 flex items-center gap-3 ${config.fertility.level === "Высокая" ? "border-[#C47E7E]/15 bg-[#F5E0E0]/20" : ""}`}>
                <span className="text-lg">{config.fertility.emoji}</span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-mira-text">Фертильность: {config.fertility.level}</p>
                  <p className="text-[10px] text-mira-muted">{config.fertility.note}</p>
                </div>
              </Card>
            )}

            {/* Norm */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">📊 Твоя норма</span>
                <span className="text-sm font-bold text-mira-primary">47%</span>
              </div>
              <div className="h-2 rounded-full bg-mira-lavender-light overflow-hidden">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-mira-primary to-mira-cycle"
                  initial={{ width: 0 }} animate={{ width: "47%" }} transition={{ duration: 1 }} />
              </div>
            </Card>

            {/* CTA */}
            <Button className="w-full" size="lg">
              + Отметить состояние
            </Button>

            {/* Shortcuts */}
            <div className="grid grid-cols-3 gap-2">
              <Card className="p-3 flex flex-col items-center gap-1 cursor-pointer hover:shadow-card-hover transition-all">
                <Heart className="h-5 w-5 text-mira-primary" />
                <span className="text-[10px] font-semibold text-mira-text">Забота</span>
              </Card>
              <Card className="p-3 flex flex-col items-center gap-1 cursor-pointer hover:shadow-card-hover transition-all">
                <BarChart3 className="h-5 w-5 text-[#9B8EC4]" />
                <span className="text-[10px] font-semibold text-mira-text">Аналитика</span>
              </Card>
              <Card className="p-3 flex flex-col items-center gap-1 cursor-pointer hover:shadow-card-hover transition-all">
                <FileText className="h-5 w-5 text-[#C4B07E]" />
                <span className="text-[10px] font-semibold text-mira-text">Отчёт</span>
              </Card>
            </div>
          </motion.div>
        )}

        {/* ═══════ VARIANT 3: Stories-style ═══════ */}
        {variant === 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            {/* Story 1: Main card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className={`rounded-[2rem] bg-gradient-to-br ${config.gradient} p-8 min-h-[280px] flex flex-col justify-between shadow-[0_8px_40px_rgba(155,142,196,0.2)]`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-mira-text/60">Привет, {name}</p>
                  <Badge className="bg-white/30 border-white/20 text-mira-text">{new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}</Badge>
                </div>

                <div>
                  <p className="text-sm text-mira-text/50 mb-1">День {cycleDay}</p>
                  <p className="text-4xl font-bold text-mira-text mb-2">{config.title}</p>
                  <p className="text-base text-mira-text/70">{config.subtitle}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-white/30 rounded-full px-3 py-2">
                    <Zap className="h-4 w-4 text-mira-text/70" />
                    <span className="text-sm font-bold text-mira-text">{config.energyLevel}%</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/30 rounded-full px-3 py-2">
                    <span className="text-lg">{config.moodEmoji}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/30 rounded-full px-3 py-2">
                    <Droplets className="h-4 w-4 text-mira-text/70" />
                    <span className="text-sm font-bold text-mira-text">3/8</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Story 2: Vitamin */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="p-5 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E0F5E8] shadow-inner-glow">
                  <Pill className="h-6 w-6 text-mira-success" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-mira-text">Цинк 15мг</p>
                  <p className="text-xs text-mira-muted">С едой. Не принимай с кальцием.</p>
                </div>
                <ChevronRight className="h-4 w-4 text-mira-lavender" />
              </Card>
            </motion.div>

            {/* Story 3: Norm progress */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-mira-text">Твоя норма</p>
                  <span className="text-lg font-bold text-mira-primary">47%</span>
                </div>
                <div className="h-2 rounded-full bg-mira-lavender-light overflow-hidden">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-mira-primary to-mira-cycle"
                    initial={{ width: 0 }} animate={{ width: "47%" }} transition={{ duration: 1, delay: 0.5 }} />
                </div>
                <p className="text-xs text-mira-muted mt-2">Ещё 15 дней до предварительной нормы</p>
              </Card>
            </motion.div>

            {/* Story 4: Article */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="p-5 border-0 bg-gradient-to-br from-white to-[#F8F5FE]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📖</span>
                  <Badge className="text-[10px]">{config.article.tag}</Badge>
                </div>
                <p className="text-base font-bold text-mira-text mb-2">{config.article.title}</p>
                <p className="text-sm text-mira-muted leading-relaxed">{config.article.body}</p>
              </Card>
            </motion.div>

            {/* Story 5: Clothing + Recommendation */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-4">
                  <span className="text-2xl">👗</span>
                  <p className="text-xs font-semibold text-mira-text mt-2">{config.clothing.split(".")[0]}.</p>
                </Card>
                <Card className="p-4">
                  <span className="text-2xl">💡</span>
                  <p className="text-xs font-semibold text-mira-text mt-2">{config.recommendation.split(".")[0]}.</p>
                </Card>
              </div>
            </motion.div>

            {/* Story 6: Fertility */}
            {config.fertility && (
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                <Card className={`p-4 flex items-center gap-3 ${config.fertility.level === "Высокая" ? "border-[#C47E7E]/20 bg-[#F5E0E0]/20" : ""}`}>
                  <span className="text-2xl">{config.fertility.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-mira-text">Фертильность: {config.fertility.level}</p>
                    <p className="text-xs text-mira-muted">{config.fertility.note}</p>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Story 7: Prediction */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
              <Card className="p-4 border-mira-primary/10">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🔔</span>
                  <p className="text-sm font-bold text-mira-text">Месячные {daysRange}</p>
                </div>
                <p className="text-xs text-mira-muted">По твоим данным за 2 цикла</p>
              </Card>
            </motion.div>

            {/* Story 8: CTA */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Button className="w-full" size="lg">
                + Отметить за 10 секунд
              </Button>
              <div className="flex flex-wrap gap-2 justify-center mt-3">
                {["Всё ок", "Боль", "Плохой сон", "ПМС"].map(b => (
                  <button key={b} className="rounded-full bg-white/80 backdrop-blur-sm px-4 py-2 text-xs font-semibold text-mira-text shadow-card transition hover:shadow-card-hover active:scale-95">
                    {b}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
