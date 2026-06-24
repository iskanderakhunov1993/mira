"use client";

import { motion } from "framer-motion";
import { ChevronRight, Salad, Dumbbell, Sparkles, Play, Infinity, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CycleWheel } from "./CycleWheel";
import { getCycleDay, getCyclePhase, getPhaseLabel, getDaysUntilPeriod, getCheckIn, getIslamicEntry, countQadaDays, dateKey } from "@/lib/store";
import { getTipForToday } from "@/lib/tips";
import type { ScreenProps } from "./types";

function formatDate(): string {
  return new Date().toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    weekday: "long",
  });
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "Доброй ночи";
  if (h < 12) return "Доброе утро";
  if (h < 18) return "Добрый день";
  return "Добрый вечер";
}

const phaseHints: Record<string, string> = {
  menstruation: "Время отдыха",
  follicular: "Энергия растёт",
  ovulation: "Пик энергии",
  luteal: "Замедление",
};

export function TodayScreen({ data, navigate, onCheckIn }: ScreenProps) {
  const profile = data.profile;
  const cycleDay = getCycleDay(profile);
  const cycleLength = profile?.cycleConfig.cycleLength ?? 28;
  const periodLength = profile?.cycleConfig.periodLength ?? 5;
  const phase = getCyclePhase(cycleDay, periodLength, cycleLength);
  const daysUntil = getDaysUntilPeriod(profile);
  const checkIn = getCheckIn(data);
  const name = profile?.name ?? "Mira";
  const isIslamic = profile?.additionalMode === "islam";
  const islamicEntry = isIslamic ? getIslamicEntry(data) : undefined;
  const qadaDays = isIslamic ? countQadaDays(data) : 0;

  const tip = getTipForToday(phase, checkIn ?? undefined);
  const trackedItems: { color: string; text: string }[] = [];
  if (checkIn?.mood) trackedItems.push({ color: "bg-[#B8A5D8]", text: `Настроение: ${moodLabel(checkIn.mood.value)}` });
  if (checkIn?.energy) trackedItems.push({ color: "bg-[#C4B07E]", text: `Энергия: ${energyLabel(checkIn.energy.value)}` });
  if (checkIn?.sleep) trackedItems.push({ color: "bg-[#7E8EC4]", text: `Сон: ${sleepLabel(checkIn.sleep)}` });

  const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
  const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-mira-muted">{getGreeting()}</p>
          <p className="text-2xl font-bold text-mira-text">Привет, {name}</p>
        </div>
        <Badge>{formatDate()}</Badge>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Main column */}
        <div className="space-y-4">
          {/* Cycle card */}
          <Card className="border-mira-cycle/15 bg-gradient-to-br from-mira-rose-light/80 to-mira-lavender-light/80 p-6">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
              <CycleWheel
                size={160}
                cycleDay={cycleDay}
                phase={phase}
                cycleLength={cycleLength}
                periodLength={periodLength}
                daysUntilPeriod={daysUntil}
              />
              <div className="text-center sm:text-left">
                <p className="text-xl font-bold text-mira-text">День {cycleDay}</p>
                <p className="text-sm font-semibold text-mira-primary">{getPhaseLabel(phase)} фаза</p>
                <p className="mt-1 text-sm text-mira-muted">
                  {daysUntil > 0 ? `Следующие месячные ~через ${daysUntil} дн.` : "Период начинается"}
                </p>
                <Badge className="mt-2 border-[#B8A5D8]/30 bg-[#EDE8F5] text-[#9B8EC4]">
                  {phaseHints[phase]}
                </Badge>
              </div>
            </div>
          </Card>

          {/* CTA */}
          <Button className="w-full" size="lg" onClick={onCheckIn}>
            Отследить сегодня <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Mini cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Nutrition */}
            <Card
              className="cursor-pointer border-mira-success/15 bg-[#E0F5E8]/30 p-4 transition hover:shadow-soft"
              onClick={() => navigate("nutrition")}
            >
              <div className="flex items-center gap-2">
                <Salad className="h-4 w-4 text-mira-success" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Питание сегодня</span>
              </div>
              <p className="mt-3 text-xl font-bold text-mira-text">—</p>
              <p className="mt-1 text-xs text-mira-muted">Нажмите чтобы добавить</p>
            </Card>

            {/* Workout */}
            <Card
              className="cursor-pointer border-mira-primary/15 bg-mira-lavender-light/30 p-4 transition hover:shadow-soft"
              onClick={() => navigate("workout")}
            >
              <div className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-mira-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Тренировка</span>
              </div>
              <p className="mt-3 text-xl font-bold text-mira-text">—</p>
              <p className="mt-1 text-xs text-mira-primary">Подберём по состоянию</p>
            </Card>
          </div>
        </div>

        {/* Right column (desktop) */}
        <div className="space-y-4">
          {/* Tip card */}
          <Card className="border-[#C4B07E]/15 bg-[#F5F0E0]/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#C4B07E]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#A09060]">Полезное сегодня</span>
              </div>
              <span className="rounded-full bg-[#C4B07E]/10 px-2 py-0.5 text-[10px] font-semibold text-[#A09060]">{tip.tag}</span>
            </div>
            <p className="mt-3 text-sm font-semibold text-mira-text">{tip.title}</p>
            <p className="mt-1.5 text-xs text-mira-muted leading-relaxed">{tip.body}</p>
            <p className="mt-2 text-[10px] text-[#A09060]">{tip.readTime} чтения</p>
          </Card>

          {/* Tracked today */}
          {trackedItems.length > 0 && (
            <Card className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Сегодня отмечено</p>
              <div className="mt-3 space-y-2.5">
                {trackedItems.map(item => (
                  <div key={item.text} className="flex items-center gap-2 text-sm">
                    <span className={`h-2 w-2 rounded-full ${item.color}`} />
                    <span className="text-mira-text">{item.text}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Islamic mode card */}
          {isIslamic && (
            <Card className="cursor-pointer border-mira-primary/15 bg-mira-lavender-light/30 p-4 transition hover:shadow-soft" onClick={() => navigate("diary")}>
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4 text-mira-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-mira-primary">Исламский режим</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-lg font-bold text-mira-text">
                  {islamicEntry?.hayd ? "Хайд" : islamicEntry?.nifas ? "Нифас" : islamicEntry?.purity ? "Чистота" : "Не отмечено"}
                </span>
              </div>
              {qadaDays > 0 && (
                <p className="mt-1 text-xs text-mira-muted">К восполнению: {qadaDays} дн.</p>
              )}
              {islamicEntry?.fasting && (
                <Badge className="mt-2">
                  {islamicEntry.fasting === "fasted" ? "Пост ✓" : islamicEntry.fasting === "missed" ? "Пропуск" : islamicEntry.fasting === "makeup" ? "Каза" : "Освобождена"}
                </Badge>
              )}
            </Card>
          )}

          {/* AI recommendation */}
          <Card className="border-mira-primary/10 bg-mira-lavender-light/30 p-4">
            <div className="flex items-center gap-2">
              <Infinity className="h-4 w-4 text-mira-primary" strokeWidth={2.5} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-mira-primary">Рекомендация</span>
            </div>
            <p className="mt-2 text-sm text-mira-text">
              Сегодня можно добавить белок и фрукты: йогурт, яйца или ягоды.
            </p>
            <p className="mt-1 text-xs text-mira-muted italic">Mira подобрала · ориентир</p>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

function moodLabel(v: string): string {
  const m: Record<string, string> = { normal: "нормально", joy: "радость", sadness: "грусть", anger: "злость", anxiety: "тревога", swings: "перепады" };
  return m[v] ?? v;
}

function energyLabel(v: string): string {
  const m: Record<string, string> = { exhausted: "истощение", low: "мало сил", normal: "нормально", high: "много сил" };
  return m[v] ?? v;
}

function sleepLabel(s: { quality: string; hours?: number }): string {
  const q: Record<string, string> = { good: "хороший", normal: "нормальный", bad: "плохой", little: "мало", insomnia: "бессонница" };
  const label = q[s.quality] ?? s.quality;
  return s.hours ? `${s.hours} ч, ${label}` : label;
}
