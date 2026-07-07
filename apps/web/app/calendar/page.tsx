"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen } from "@/components/ui/Screen";
import { LocalHealthRepository } from "@/data/healthRepository";
import { buildCalendarViewModel, dateKey } from "@/features/calendar/model";
import type { Cycle, DailyEntry, HealthSettings, UserProfile } from "@/types/health";
import { createEmptyHealthSnapshot } from "@/data/seed";

type CalendarState = {
  profile: UserProfile | null;
  cycles: Cycle[];
  entries: DailyEntry[];
  settings: HealthSettings;
};

const dayTone = {
  empty: "bg-transparent text-transparent",
  normal: "bg-[var(--mira-token-card-muted)] text-[var(--mira-token-foreground)]",
  today: "bg-[var(--mira-token-primary)] text-[var(--mira-token-primary-contrast)]",
  confirmed_period: "bg-[var(--mira-token-accent)] text-white",
  predicted_period: "border border-dashed border-[var(--mira-token-accent)] bg-[color-mix(in_srgb,var(--mira-token-accent)_10%,var(--mira-token-card))] text-[var(--mira-token-accent)]",
};

function shiftMonth(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export default function CalendarPage() {
  const repository = useMemo(() => new LocalHealthRepository(), []);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<CalendarState>(() => ({
    profile: null,
    cycles: [],
    entries: [],
    settings: createEmptyHealthSnapshot().settings,
  }));
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => dateKey());

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [profile, cycles, entries, settings] = await Promise.all([
        repository.getProfile(),
        repository.listCycles(),
        repository.listDailyEntries(),
        repository.getSettings(),
      ]);
      setState({
        profile: profile.ok ? profile.data : null,
        cycles: cycles.ok ? cycles.data : [],
        entries: entries.ok ? entries.data : [],
        settings: settings.ok ? settings.data : createEmptyHealthSnapshot().settings,
      });
      setLoading(false);
    }

    void load();
  }, [repository]);

  const model = useMemo(
    () => buildCalendarViewModel({ ...state, monthDate, selectedDate }),
    [monthDate, selectedDate, state]
  );

  return (
    <Screen
      title="Календарь"
      eyebrow="Цикл и записи"
      action={
        <Link href="/add" aria-label="Добавить запись">
          <Button icon={<Plus className="h-4 w-4" />}>Добавить</Button>
        </Link>
      }
    >
      {loading ? (
        <div className="space-y-4">
          <div className="h-72 animate-pulse rounded-[8px] bg-[var(--mira-token-card)]" />
          <div className="h-28 animate-pulse rounded-[8px] bg-[var(--mira-token-card)]" />
        </div>
      ) : (
        <>
          <Card className="p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <button
                type="button"
                aria-label="Предыдущий месяц"
                onClick={() => setMonthDate((current) => shiftMonth(current, -1))}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--mira-token-card-muted)]"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-black capitalize">{model.monthLabel}</h2>
              <button
                type="button"
                aria-label="Следующий месяц"
                onClick={() => setMonthDate((current) => shiftMonth(current, 1))}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--mira-token-card-muted)]"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-black text-[var(--mira-token-muted)]">
              {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-1">
              {model.days.map((day, index) => (
                <button
                  key={day.date ?? `empty-${index}`}
                  type="button"
                  disabled={!day.date}
                  aria-label={day.date ? `Выбрать ${day.date}` : "Пустой день"}
                  onClick={() => day.date && setSelectedDate(day.date)}
                  className={`relative flex aspect-square items-center justify-center rounded-[8px] text-sm font-black ${dayTone[day.kind]} ${day.isSelected ? "ring-2 ring-[var(--mira-token-primary)]" : ""}`}
                >
                  {day.dayNumber}
                  {day.hasEntry && <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-current" />}
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Chip tone="accent">месячные</Chip>
              <Chip>прогноз</Chip>
              <Chip tone="success">сегодня</Chip>
            </div>
          </Card>

          <Card className="mt-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-black">Прогноз</h2>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-[var(--mira-token-muted)]">{model.forecast.text}</p>
              </div>
              <Chip>{model.forecast.sampleSize} циклов</Chip>
            </div>
            {model.forecast.medianLength && (
              <p className="mt-3 text-xs font-black uppercase tracking-[0.12em] text-[var(--mira-token-muted)]">
                Медиана: {model.forecast.medianLength} дн. · надёжность: {model.forecast.reliability}
              </p>
            )}
          </Card>

          <Card className="mt-4 p-5">
            <h2 className="text-lg font-black">{model.selectedDay.title}</h2>
            {model.selectedDay.entries.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {model.selectedDay.entries.map((entry) => (
                  <Chip key={entry}>{entry}</Chip>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm font-semibold text-[var(--mira-token-muted)]">В этот день пока нет записей.</p>
            )}
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                ["+ Месячные", "/add"],
                ["+ Самочувствие", "/add"],
                ["+ Симптом", "/add"],
              ].map(([label, href]) => (
                <Link key={label} href={href} className="flex min-h-11 items-center justify-center rounded-[8px] bg-[var(--mira-token-card-muted)] px-2 text-center text-xs font-black">
                  {label}
                </Link>
              ))}
            </div>
          </Card>

          {model.history.length ? (
            <Card className="mt-4 p-5">
              <h2 className="text-lg font-black">Последние циклы</h2>
              <div className="mt-3 space-y-2">
                {model.history.map((cycle) => (
                  <div key={cycle.id} className="flex items-center justify-between rounded-[8px] bg-[var(--mira-token-card-muted)] px-3 py-3">
                    <span className="text-sm font-black">{cycle.startDate}</span>
                    <span className="text-sm font-semibold text-[var(--mira-token-muted)]">{cycle.length ? `${cycle.length} дн.` : "текущий"}</span>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <div className="mt-4">
              <EmptyState
                title="История появится после отметок"
                description="Подтверждённые первые дни месячных важнее прогноза. Начните с одной записи."
                action={
                  <Link href="/add">
                    <Button variant="secondary">Отметить месячные</Button>
                  </Link>
                }
              />
            </div>
          )}
        </>
      )}
    </Screen>
  );
}
