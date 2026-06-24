"use client";

import { Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CycleWheel } from "./CycleWheel";
import { getCycleDay, getCyclePhase, getPhaseLabel, getDaysUntilPeriod, dateKey } from "@/lib/store";
import type { ScreenProps } from "./types";
import type { CyclePhase } from "@/lib/types";

function getPhaseForDay(dayOfMonth: number, today: Date, cycleDay: number, periodLength: number, cycleLength: number): CyclePhase | null {
  const diff = dayOfMonth - today.getDate();
  const cd = cycleDay + diff;
  if (cd < 1 || cd > cycleLength) {
    const wrapped = ((cd - 1) % cycleLength + cycleLength) % cycleLength + 1;
    return getCyclePhase(wrapped, periodLength, cycleLength);
  }
  return getCyclePhase(cd, periodLength, cycleLength);
}

const phaseColors: Record<CyclePhase, string> = {
  menstruation: "bg-[#E8A0B8]/30 text-[#C47E9B]",
  follicular: "bg-[#B8A5D8]/20 text-[#9B8EC4]",
  ovulation: "bg-[#D4A0C8]/25 text-[#B07EA8]",
  luteal: "bg-[#D4CCE6]/30 text-mira-muted",
};

const phaseDots: Record<CyclePhase, string> = {
  menstruation: "bg-[#E8A0B8]",
  follicular: "bg-[#B8A5D8]",
  ovulation: "bg-[#D4A0C8]",
  luteal: "bg-[#D4CCE6]",
};

export function CycleScreen({ data }: ScreenProps) {
  const profile = data.profile;
  const cycleDay = getCycleDay(profile);
  const cycleLength = profile?.cycleConfig.cycleLength ?? 28;
  const periodLength = profile?.cycleConfig.periodLength ?? 5;
  const phase = getCyclePhase(cycleDay, periodLength, cycleLength);
  const daysUntil = getDaysUntilPeriod(profile);

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const monthName = today.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
  const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-mira-text">Цикл</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <Card className="p-6">
            <p className="mb-4 text-lg font-bold capitalize text-mira-text">{monthName}</p>
            <div className="grid grid-cols-7 gap-1 text-center">
              {weekDays.map(d => (
                <span key={d} className="pb-2 text-xs font-semibold text-mira-muted">{d}</span>
              ))}
              {Array.from({ length: offset }, (_, i) => <span key={`e-${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const isToday = day === today.getDate();
                const dayPhase = getPhaseForDay(day, today, cycleDay, periodLength, cycleLength);
                const dayKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const hasCheckIn = !!data.checkIns[dayKey];
                const islamicDay = data.islamicEntries?.[dayKey];
                const hasIslamic = islamicDay?.hayd || islamicDay?.nifas || islamicDay?.ghusl;

                return (
                  <button key={day} className={`relative rounded-xl py-2 text-sm font-semibold transition ${
                    isToday
                      ? "bg-mira-primary text-white shadow-glow"
                      : dayPhase
                        ? phaseColors[dayPhase]
                        : "text-mira-text hover:bg-mira-lavender-light"
                  }`}>
                    {day}
                    {(hasCheckIn || hasIslamic) && !isToday && (
                      <span className={`absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${
                        islamicDay?.hayd ? "bg-[#C47E9B]" : dayPhase ? phaseDots[dayPhase] : "bg-mira-primary"
                      }`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Phase legend */}
            <div className="mt-4 flex flex-wrap gap-3">
              {(["menstruation", "follicular", "ovulation", "luteal"] as CyclePhase[]).map(p => (
                <div key={p} className="flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${phaseDots[p]}`} />
                  <span className="text-[10px] text-mira-muted">{getPhaseLabel(p)}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Day summary */}
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-mira-primary" />
              <div>
                <p className="text-sm font-semibold text-mira-text">Сегодня — день {cycleDay}</p>
                <p className="text-xs text-mira-muted">{getPhaseLabel(phase)} фаза · {daysUntil > 0 ? `~${daysUntil} дн. до месячных` : "Период начинается"}</p>
              </div>
            </div>
            {data.checkIns[dateKey()] && (
              <div className="mt-3 space-y-1.5">
                {data.checkIns[dateKey()].mood && (
                  <Badge className="mr-1.5">{moodL(data.checkIns[dateKey()].mood!.value)}</Badge>
                )}
                {data.checkIns[dateKey()].energy && (
                  <Badge className="mr-1.5">{energyL(data.checkIns[dateKey()].energy!.value)}</Badge>
                )}
                {data.checkIns[dateKey()].period && (
                  <Badge className="border-[#E8A0B8]/30 bg-[#F5E0EA] text-[#C47E9B]">Месячные</Badge>
                )}
              </div>
            )}
          </Card>
        </div>

        <div className="flex flex-col items-center">
          <CycleWheel size={200} cycleDay={cycleDay} phase={phase} cycleLength={cycleLength} periodLength={periodLength} daysUntilPeriod={daysUntil} />
          <div className="mt-4 space-y-2">
            {(["menstruation", "follicular", "ovulation", "luteal"] as CyclePhase[]).map(p => (
              <div key={p} className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${phaseDots[p]}`} />
                <span className="text-xs text-mira-muted">{getPhaseLabel(p)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function moodL(v: string) { return ({ normal: "Нормально", joy: "Радость", sadness: "Грусть", anger: "Злость", anxiety: "Тревога", swings: "Перепады" } as Record<string, string>)[v] ?? v; }
function energyL(v: string) { return ({ exhausted: "Истощение", low: "Мало сил", normal: "Нормально", high: "Много сил" } as Record<string, string>)[v] ?? v; }
