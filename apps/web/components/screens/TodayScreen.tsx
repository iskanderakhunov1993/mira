"use client";

import { motion } from "framer-motion";
import {
  ChevronRight, Heart, Shield, AlertTriangle, Bell,
  Moon, Zap, FileText, BarChart3, HeartPulse, Pill,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getCycleDay, getCyclePhase, getPhaseLabel,
  getDaysUntilPeriod, getCheckIn, getWaterEntry, dateKey,
} from "@/lib/store";
import { getSmartReminders, getRedFlags, getToughDayContent, getIronAlert } from "@/lib/alerts";
import { getVitaminRecommendations } from "@/lib/vitamins";
import { getDayStatus, getQadaStats, haydDuas, type Madhab } from "@/lib/islamic";
import { getAgeConfig } from "@/lib/ageMode";
import { getNormOverallPercent, getNormMap } from "@/lib/insights";
import type { ScreenProps } from "./types";
import type { CyclePhase } from "@/lib/types";

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

function CycleTimeline({ cycleDay, cycleLength, periodLength }: {
  cycleDay: number; cycleLength: number; periodLength: number;
}) {
  const remaining = cycleLength - periodLength;
  const segments = [
    { label: "Менструация", days: periodLength, color: "bg-[#E8A0B8]" },
    { label: "Рост", days: Math.round(remaining * 0.4), color: "bg-[#B8A5D8]" },
    { label: "Пик", days: Math.round(remaining * 0.12), color: "bg-[#D4A0C8]" },
    { label: "Подготовка", days: remaining - Math.round(remaining * 0.4) - Math.round(remaining * 0.12), color: "bg-[#D4CCE6]" },
  ];
  const position = ((cycleDay - 1) / (cycleLength - 1)) * 100;

  return (
    <div className="relative">
      <div className="flex h-3 rounded-full overflow-hidden gap-[2px]">
        {segments.map((seg, i) => (
          <motion.div key={i} className={`${seg.color} rounded-full`} style={{ flex: seg.days }}
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.5, delay: i * 0.1 }} />
        ))}
      </div>
      <motion.div
        className="absolute top-[-4px] h-5 w-5 rounded-full bg-white border-[3px] border-mira-primary shadow-glow"
        style={{ left: `${Math.min(Math.max(position, 3), 97)}%`, transform: "translateX(-50%)" }}
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6, type: "spring" }}
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

function EnergyBar({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-2">
      <Zap className="h-4 w-4 text-white/70" />
      <div className="flex-1 h-2.5 rounded-full bg-white/30 overflow-hidden">
        <motion.div className="h-full rounded-full bg-white/70"
          initial={{ width: 0 }} animate={{ width: `${level}%` }} transition={{ duration: 1, delay: 0.3 }} />
      </div>
      <span className="text-xs font-bold text-white/80">{level}%</span>
    </div>
  );
}

export function TodayScreen({ data, navigate, onCheckIn }: ScreenProps) {
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
  const reminders = getSmartReminders(data);
  const redFlags = getRedFlags(data);
  const toughDay = getToughDayContent(data);
  const ironAlert = getIronAlert(data);
  const vitaminCard = getVitaminRecommendations(data);
  const normPercent = getNormOverallPercent(data);
  const normMap = getNormMap(data);

  const daysRange = daysUntil > 2
    ? `через ${daysUntil - 2}–${daysUntil + 2} дней`
    : daysUntil > 0 ? `через ${daysUntil} дн.` : "ожидаются сегодня";

  const quickButtons = isIslamic || !ageConfig.showSex
    ? [{ l: "✅", t: "Всё ок" }, { l: "😣", t: "Боль" }, { l: "😴", t: "Плохой сон" }, { l: "😤", t: "ПМС" }]
    : [{ l: "✅", t: "Всё ок" }, { l: "😣", t: "Боль" }, { l: "😴", t: "Плохой сон" }, { l: "😤", t: "ПМС" }, { l: "❤️", t: "Секс" }];

  const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

  return (
    <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.06 } } }}>

      {/* Tough day */}
      {toughDay && (
        <motion.div variants={fadeUp} className="mb-4">
          <Card className="border-mira-cycle/20 bg-gradient-to-br from-mira-rose-light/40 to-white p-5">
            <p className="text-lg font-bold text-mira-text mb-2">{toughDay.greeting}</p>
            <div className="space-y-1.5">
              {toughDay.tips.map(t => (
                <p key={t} className="text-sm text-mira-text flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-mira-success" />{t}</p>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Reminders */}
      {reminders.slice(0, 3).map((r, i) => (
        <motion.div key={i} variants={fadeUp} className="mb-3">
          <Card className={`p-3.5 flex items-center gap-3 ${r.type === "delay" ? "border-[#C47E7E]/15 bg-[#F5E0E0]/15" : "border-[#C4B07E]/15 bg-[#F5F0E0]/15"}`}>
            <span className="text-lg">{r.type === "clothing" ? "👗" : r.type === "firstaid" ? "💊" : r.type === "delay" ? "⚠️" : "🔔"}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-mira-text">{r.title}</p>
              <p className="text-[10px] text-mira-muted">{r.body}</p>
            </div>
          </Card>
        </motion.div>
      ))}

      {/* Red flags */}
      {redFlags.length > 0 && (
        <motion.div variants={fadeUp} className="mb-4">
          <Card className="border-[#C47E7E]/15 bg-[#FFF5F5] p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-[#C47E7E]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#C47E7E]">Обрати внимание</span>
            </div>
            {redFlags.slice(0, 2).map((f, i) => (
              <p key={i} className="text-xs text-mira-text mb-1"><span className="font-semibold">{f.title}</span> — {f.body.split(".")[0]}.</p>
            ))}
          </Card>
        </motion.div>
      )}

      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between mb-5">
        <div>
          <p className="text-sm text-mira-muted">{new Date().getHours() < 12 ? "Доброе утро" : new Date().getHours() < 18 ? "Добрый день" : "Добрый вечер"}</p>
          <p className="text-2xl font-bold text-mira-text">{name}</p>
        </div>
        <Badge>День {cycleDay}</Badge>
      </motion.div>

      {/* Timeline */}
      <motion.div variants={fadeUp} className="mb-5">
        <Card className="p-5">
          <CycleTimeline cycleDay={cycleDay} cycleLength={cycleLength} periodLength={periodLength} />
        </Card>
      </motion.div>

      {/* Status card */}
      <motion.div variants={fadeUp} className="mb-5">
        <Card className={`p-5 bg-gradient-to-br ${config.gradient} border-0`}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{config.emoji}</span>
            <div>
              <p className="text-lg font-bold text-mira-text">{config.title}</p>
              <p className="text-sm text-mira-text/70">{config.subtitle}</p>
            </div>
          </div>
          <p className="text-xs text-mira-text/60 mb-3">Месячные {daysRange}</p>
          <EnergyBar level={config.energyLevel} />
          {isIslamic && islamicStatus && (
            <div className="mt-3 flex items-center gap-2 bg-white/30 rounded-full px-3 py-1.5 w-fit">
              <Moon className="h-3.5 w-3.5 text-mira-text/70" />
              <span className="text-xs font-bold text-mira-text">
                {islamicStatus.status === "hayd" ? "Хайд" : islamicStatus.status === "purity" ? "Чистота" : islamicStatus.status === "istihada" ? "Истихада" : ""}
              </span>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Metrics */}
      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-2 mb-5">
        <Card className="p-3 text-center">
          <span className="text-xl">{config.moodEmoji}</span>
          <p className="text-[10px] text-mira-muted mt-1">{config.moodLabel}</p>
        </Card>
        <Card className="p-3 text-center">
          <span className="text-xl">😴</span>
          <p className="text-[10px] text-mira-muted mt-1">{checkIn?.sleep?.hours ? `${checkIn.sleep.hours}ч сна` : "сон"}</p>
        </Card>
        <Card className="p-3 text-center">
          <span className="text-xl">🍶</span>
          <p className="text-[10px] text-mira-muted mt-1">{waterEntry.glasses * 250} мл</p>
        </Card>
      </motion.div>

      {/* Grouped: Article + Recommendation + Clothing + Vitamin + Fertility */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 mb-5">
        {/* Article — full width */}
        <Card className="p-3.5 col-span-2 border-0 bg-gradient-to-br from-white to-[#F8F5FE]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-mira-primary">📖 Полезное</span>
            <Badge className="text-[9px] py-0.5">{config.article.tag}</Badge>
          </div>
          <p className="text-sm font-bold text-mira-text mb-0.5">{config.article.title}</p>
          <p className="text-xs text-mira-muted leading-relaxed">{config.article.body}</p>
        </Card>

        {/* Recommendation */}
        <Card className="p-3.5 border-mira-primary/10 bg-[#EDE8F5]/15">
          <span className="text-lg">💡</span>
          <p className="text-xs font-semibold text-mira-text mt-1.5 leading-relaxed">{config.recommendation.split(".")[0]}.</p>
        </Card>

        {/* Clothing */}
        <Card className="p-3.5 border-[#C4B07E]/10 bg-[#F5F0E0]/15">
          <span className="text-lg">👗</span>
          <p className="text-xs text-mira-text mt-1.5 leading-relaxed">{config.clothing.split(".")[0]}.</p>
        </Card>

        {/* Vitamin */}
        {vitaminCard && vitaminCard.recs.length > 0 && (
          <Card className="p-3.5 border-mira-success/10 bg-[#E0F5E8]/15">
            <span className="text-lg">{vitaminCard.recs[0].icon}</span>
            <p className="text-xs font-bold text-mira-text mt-1.5">{vitaminCard.recs[0].name} {vitaminCard.recs[0].dose}</p>
            <p className="text-[10px] text-mira-success">{vitaminCard.recs[0].how.split(".")[0]}.</p>
          </Card>
        )}

        {/* Fertility */}
        {config.fertility && !isIslamic && ageConfig.showFertility && (
          <Card className={`p-3.5 ${config.fertility.level === "Высокая" ? "border-[#C47E7E]/15 bg-[#F5E0E0]/10" : ""}`}>
            <span className="text-lg">{config.fertility.emoji}</span>
            <p className="text-xs font-bold text-mira-text mt-1.5">Фертильность: {config.fertility.level}</p>
            <p className="text-[10px] text-mira-muted">{config.fertility.note.split(".")[0]}.</p>
          </Card>
        )}

        {/* Iron alert — full width */}
        {ironAlert && (
          <Card className="p-3.5 border-[#C4887E]/10 bg-[#FFF5F0] col-span-2">
            <div className="flex items-center gap-3">
              <span className="text-lg">🩸</span>
              <div className="flex-1">
                <p className="text-xs font-bold text-mira-text">{ironAlert.title}</p>
                <p className="text-[10px] text-mira-muted">{ironAlert.body.split(".")[0]}.</p>
              </div>
            </div>
          </Card>
        )}
      </motion.div>

      {/* Islamic blocks */}
      {isIslamic && (
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 mb-5">
          {qadaStats && qadaStats.remaining > 0 && (
            <Card className="p-3.5 border-mira-primary/10 bg-mira-lavender-light/15 cursor-pointer" onClick={() => navigate("islamic")}>
              <span className="text-lg">🕌</span>
              <p className="text-xs font-bold text-mira-text mt-1.5">Каза: {qadaStats.remaining} дн.</p>
              <p className="text-[10px] text-mira-muted">Пн и чт — сунна</p>
            </Card>
          )}
          {islamicStatus?.status === "hayd" && (
            <Card className="p-3.5 border-mira-primary/10 text-center">
              <p className="text-[9px] font-bold uppercase tracking-widest text-mira-primary mb-1">Зикр дня</p>
              <p className="text-sm font-bold text-mira-text leading-relaxed" dir="rtl">
                {haydDuas[new Date().getDate() % haydDuas.length].arabic}
              </p>
              <p className="text-[10px] text-mira-primary mt-1">{haydDuas[new Date().getDate() % haydDuas.length].transliteration}</p>
            </Card>
          )}
        </motion.div>
      )}

      {/* Norm */}
      <motion.div variants={fadeUp} className="mb-5">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-mira-text">📊 Твоя норма</span>
            <span className="text-lg font-bold text-mira-primary">{normPercent}%</span>
          </div>
          <div className="h-2 rounded-full bg-mira-lavender-light overflow-hidden">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-mira-primary to-mira-cycle"
              initial={{ width: 0 }} animate={{ width: `${normPercent}%` }} transition={{ duration: 1, delay: 0.3 }} />
          </div>
          <div className="flex justify-between mt-2">
            {normMap.map(cat => (
              <div key={cat.id} className="flex flex-col items-center gap-0.5">
                <div className="h-1 w-5 rounded-full bg-mira-lavender-light overflow-hidden">
                  <div className="h-full rounded-full bg-mira-primary" style={{ width: `${cat.percent}%` }} />
                </div>
                <span className="text-[8px] text-mira-muted">{cat.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* CTA + Quick buttons */}
      <motion.div variants={fadeUp} className="mb-4">
        <Button className="w-full mb-3" size="lg" onClick={onCheckIn}>
          + Отметить за 10 секунд <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="flex flex-wrap gap-2 justify-center">
          {quickButtons.map(b => (
            <button key={b.t} onClick={onCheckIn}
              className="flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur-sm px-3.5 py-2 text-xs font-semibold text-mira-text shadow-card transition hover:shadow-card-hover active:scale-95">
              <span>{b.l}</span>{b.t}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Shortcuts */}
      <motion.div variants={fadeUp} className="grid grid-cols-4 gap-2 mb-3">
        {[
          { emoji: "💊", label: "Витамины", page: "care" as const },
          { emoji: "🍶", label: `${waterEntry.glasses * 250} мл`, page: "care" as const },
          { emoji: "🍽️", label: "Еда", page: "care" as const },
          { emoji: "🏋️", label: "Тренировка", page: "care" as const },
        ].map(s => (
          <Card key={s.label} className="p-2.5 flex flex-col items-center gap-1 cursor-pointer hover:shadow-card-hover transition-all hover:translate-y-[-1px] active:scale-95" onClick={() => navigate(s.page)}>
            <span className="text-base">{s.emoji}</span>
            <span className="text-[9px] font-semibold text-mira-text">{s.label}</span>
          </Card>
        ))}
      </motion.div>
      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-2">
        {[
          { icon: HeartPulse, label: "Забота", page: "care" as const, color: "text-mira-primary" },
          { icon: BarChart3, label: "Аналитика", page: "analytics" as const, color: "text-[#9B8EC4]" },
          { icon: FileText, label: "Отчёт", page: "report" as const, color: "text-[#C4B07E]" },
        ].map(s => (
          <Card key={s.label} className="p-2.5 flex flex-col items-center gap-1 cursor-pointer hover:shadow-card-hover transition-all active:scale-95" onClick={() => navigate(s.page)}>
            <s.icon className={`h-4 w-4 ${s.color}`} />
            <span className="text-[9px] font-semibold text-mira-text">{s.label}</span>
          </Card>
        ))}
      </motion.div>
    </motion.div>
  );
}
