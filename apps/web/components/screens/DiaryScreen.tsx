"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  PencilLine,
  Plus,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { dateKey, getCyclePhase, getPhaseLabel, saveCheckIn } from "@/lib/store";
import type { DailyCheckIn, MiraLocalData } from "@/lib/types";
import type { ScreenProps } from "./types";

const weekDays = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

function recentDays(count = 21) {
  const today = new Date();
  return Array.from({ length: count }, (_, index) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (count - 1 - index));
    return {
      key: dateKey(d),
      day: d.getDate(),
      weekDay: weekDays[d.getDay()],
      isToday: dateKey(d) === dateKey(),
    };
  });
}

function getCycleDayForDate(data: MiraLocalData, dayKey: string): number | null {
  const config = data.profile?.cycleConfig;
  if (!config?.periodStart) return null;
  const start = new Date(config.periodStart);
  const d = new Date(dayKey);
  const diff = Math.floor((d.getTime() - start.getTime()) / 86_400_000);
  return ((diff % config.cycleLength) + config.cycleLength) % config.cycleLength + 1;
}

function getPhaseForDate(data: MiraLocalData, dayKey: string) {
  const cycleDay = getCycleDayForDate(data, dayKey);
  if (!cycleDay || !data.profile) return null;
  const { cycleLength, periodLength } = data.profile.cycleConfig;
  return {
    cycleDay,
    label: getPhaseLabel(getCyclePhase(cycleDay, periodLength, cycleLength)),
  };
}

const moodLabel: Record<string, string> = {
  joy: "хорошее",
  normal: "ровное",
  sadness: "грусть",
  anger: "раздражение",
  anxiety: "тревога",
  swings: "перепады",
};

const energyLabel: Record<string, string> = {
  high: "много",
  normal: "нормально",
  low: "низкая",
  exhausted: "нет сил",
};

const sleepLabel: Record<string, string> = {
  good: "хороший",
  normal: "нормальный",
  bad: "плохой",
  little: "мало сна",
  insomnia: "бессонница",
};

const darkCardClass = "border-[#2E2826] bg-[#1D1816] shadow-[0_18px_48px_rgba(0,0,0,0.28)]";
const darkInsetClass = "border-[#342D2A] bg-[#2A2523]";
const limeButtonClass = "bg-[#84E600] text-[#11100F] shadow-[0_12px_30px_rgba(132,230,0,0.20)] hover:bg-[#73CC00]";

function ProgressBar({ value, max = 100, tone = "lime" }: { value: number; max?: number; tone?: "lime" | "pink" | "muted" }) {
  const width = Math.min(100, Math.max(0, (value / max) * 100));
  const color = {
    lime: "bg-[#84E600]",
    pink: "bg-[#F9359E]",
    muted: "bg-[#6A5D57]",
  }[tone];
  return (
    <div className="h-2 overflow-hidden rounded-full bg-[#342D2A]">
      <div className={`h-full rounded-full ${color} transition-all duration-300`} style={{ width: `${width}%` }} />
    </div>
  );
}

function StatTile({ label, value, tone = "lime" }: { label: string; value: string; tone?: "lime" | "pink" | "muted" }) {
  const dot = { lime: "bg-[#84E600]", pink: "bg-[#F9359E]", muted: "bg-[#6A5D57]" }[tone];
  return (
    <div className={`rounded-[16px] border px-3 py-3 ${darkInsetClass}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#8D817B]">{label}</p>
        <span className={`mt-0.5 h-2 w-2 rounded-full ${dot}`} />
      </div>
      <p className="mt-2 line-clamp-1 text-sm font-black text-[#F5F0ED]">{value}</p>
    </div>
  );
}

export function DiaryScreen({ data, persist, onCheckIn }: ScreenProps) {
  const [selectedDay, setSelectedDay] = useState(dateKey());
  const [diaryText, setDiaryText] = useState("");
  const [savedNote, setSavedNote] = useState(false);
  const days = useMemo(() => recentDays(21), []);
  const selectedCheckIn = data.checkIns[selectedDay];
  const phase = getPhaseForDate(data, selectedDay);
  const checkIns = Object.values(data.checkIns);
  const diaryEntries = checkIns
    .filter((entry) => entry.note?.text)
    .sort((a, b) => b.date.localeCompare(a.date));
  const summaryCount = [
    selectedCheckIn?.period,
    selectedCheckIn?.pain?.level,
    selectedCheckIn?.mood?.value,
    selectedCheckIn?.energy?.value,
    selectedCheckIn?.sleep?.quality,
    selectedCheckIn?.note?.text,
  ].filter(Boolean).length;

  useEffect(() => {
    setDiaryText(selectedCheckIn?.note?.text ?? "");
    setSavedNote(false);
  }, [selectedDay, selectedCheckIn?.note?.text]);

  function saveDiaryNote() {
    const text = diaryText.trim();
    const existing = data.checkIns[selectedDay];
    const nextCheckIn: DailyCheckIn = {
      ...(existing ?? {}),
      date: selectedDay,
      savedAt: new Date().toISOString(),
      ...(text ? { note: { text } } : { note: undefined }),
    };
    persist(saveCheckIn(data, nextCheckIn));
    setSavedNote(true);
    window.setTimeout(() => setSavedNote(false), 1800);
  }

  return (
    <div className="text-[#F5F0ED]">
      <header className={`mb-5 rounded-[22px] p-5 ${darkCardClass}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8D817B]">Track</p>
            <h1 className="mt-1 text-[34px] font-black tracking-tight text-[#F5F0ED]">Отслеживать</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-[#B7AAA4]">
              Медицинские отметки: месячные, симптомы, боль, настроение, сон, секс и личные заметки.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onCheckIn?.(selectedDay)}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] ${limeButtonClass}`}
            aria-label="Добавить отметку"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </header>

      <Card className={`mb-5 rounded-[20px] p-4 ${darkCardClass}`}>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#302927] text-[#F9359E]">
            <Shield className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-black text-[#F5F0ED]">Что было в этот день?</p>
            <p className="mt-1 text-xs font-semibold leading-relaxed text-[#B7AAA4]">
              Симптомы попадут в Анализ. Личная заметка видна только тебе и не попадёт в отчёт врачу по умолчанию.
            </p>
          </div>
        </div>
      </Card>

      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8D817B]">Календарь цикла</p>
          <p className="text-sm font-black text-[#F5F0ED]">Выбери день для записи</p>
        </div>
        <CalendarDays className="h-5 w-5 text-[#8D817B]" />
      </div>

      <div className="mb-5 grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const hasData = !!data.checkIns[day.key] || !!data.waterLog?.[day.key] || (data.walkingLog?.[day.key]?.steps ?? 0) > 0 || data.workouts.some((w) => w.date === day.key);
          const hasNote = !!data.checkIns[day.key]?.note?.text;
          const isSelected = day.key === selectedDay;
          const dayPhase = getPhaseForDate(data, day.key);
          return (
            <button
              key={day.key}
              onClick={() => setSelectedDay(day.key)}
              className={`min-h-[76px] rounded-[16px] border p-1.5 text-center transition active:scale-[0.98] ${
                isSelected
                  ? "border-[#84E600]/40 bg-[#84E600] text-[#11100F] shadow-[0_12px_28px_rgba(132,230,0,0.18)]"
                  : day.isToday
                    ? "border-[#84E600]/25 bg-[#252318] text-[#F5F0ED]"
                    : "border-[#342D2A] bg-[#1D1816] text-[#8D817B]"
              }`}
            >
              <span className="block text-[10px] font-semibold">{day.weekDay}</span>
              <span className="mt-1 block text-base font-bold">{day.day}</span>
              <span className="mt-0.5 block text-[9px] font-semibold opacity-70">
                {dayPhase ? `${dayPhase.cycleDay} дц` : "—"}
              </span>
              <span className="mt-1 flex items-center justify-center gap-1">
                <span className={`block h-1.5 w-1.5 rounded-full ${hasData ? (isSelected ? "bg-[#11100F]" : "bg-[#84E600]") : "bg-transparent"}`} />
                <span className={`block h-1.5 w-1.5 rounded-full ${hasNote ? (isSelected ? "bg-[#11100F]" : "bg-[#F9359E]") : "bg-transparent"}`} />
              </span>
            </button>
          );
        })}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 px-1 text-[10px] font-semibold text-[#8D817B]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#84E600]" />
          отметки дня
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#F9359E]" />
          личная запись
        </span>
      </div>

      <Card className={`mb-5 rounded-[20px] p-5 ${darkCardClass}`}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8D817B]">Сводка дня</p>
            <p className="text-lg font-black text-[#F5F0ED]">
              {new Date(selectedDay).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
            </p>
            <p className="text-xs font-semibold text-[#B7AAA4]">
              {phase ? `${phase.cycleDay}-й день цикла` : "День без привязки к циклу"}
            </p>
          </div>
          <div className="min-w-[120px]">
            <div className="mb-2 flex items-center justify-between text-[10px] font-black text-[#8D817B]">
              <span>заполнено</span>
              <span className="text-[#84E600]">{Math.round((summaryCount / 6) * 100)}%</span>
            </div>
            <ProgressBar value={summaryCount} max={6} />
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <StatTile label="Месячные" value={selectedCheckIn?.period ? "есть" : "нет"} tone={selectedCheckIn?.period ? "pink" : "muted"} />
          <StatTile label="Боль" value={selectedCheckIn?.pain?.level ? selectedCheckIn.pain.level : "нет"} tone={selectedCheckIn?.pain?.level ? "pink" : "muted"} />
          <StatTile label="Настроение" value={selectedCheckIn?.mood?.value ? moodLabel[selectedCheckIn.mood.value] ?? selectedCheckIn.mood.value : "нет"} tone="lime" />
          <StatTile label="Энергия" value={selectedCheckIn?.energy?.value ? energyLabel[selectedCheckIn.energy.value] ?? selectedCheckIn.energy.value : "нет"} tone="lime" />
          <StatTile label="Сон" value={selectedCheckIn?.sleep?.quality ? sleepLabel[selectedCheckIn.sleep.quality] ?? selectedCheckIn.sleep.quality : "нет"} tone="muted" />
          <StatTile label="Заметка" value={selectedCheckIn?.note?.text ? "есть" : "нет"} tone={selectedCheckIn?.note?.text ? "pink" : "muted"} />
        </div>

        <div className="mt-4">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#8D817B]">Быстрые действия</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <DiaryQuickButton label="Месячные" onClick={() => onCheckIn?.(selectedDay)} />
            <DiaryQuickButton label="Симптомы" onClick={() => onCheckIn?.(selectedDay)} />
            <DiaryQuickButton label="Настроение / сон" onClick={() => onCheckIn?.(selectedDay)} />
            <DiaryQuickButton label="Секс" onClick={() => onCheckIn?.(selectedDay)} />
            <DiaryQuickButton label="Заметка" onClick={() => document.getElementById("diary-note")?.focus()} />
          </div>
        </div>
      </Card>

      <Card className={`mb-5 rounded-[20px] p-5 ${darkCardClass}`}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#F9359E]">Личная запись</p>
            <p className="text-lg font-black text-[#F5F0ED]">
              {new Date(selectedDay).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
            </p>
            <p className="text-xs font-semibold text-[#B7AAA4]">
              {phase ? `${phase.cycleDay}-й день цикла · ${phase.label.toLowerCase()} фаза` : "День без привязки к циклу"}
            </p>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#302927] text-[#F9359E]">
            <PencilLine className="h-5 w-5" />
          </span>
        </div>
        <textarea
          id="diary-note"
          value={diaryText}
          onChange={(event) => setDiaryText(event.target.value)}
          placeholder="Что сегодня происходило? Настроение, мысли, стресс, боль, важные события..."
          rows={5}
          className="w-full resize-none rounded-[18px] border border-[#342D2A] bg-[#2A2523] p-4 text-sm font-semibold leading-relaxed text-[#F5F0ED] outline-none transition placeholder:text-[#6A5D57] focus:border-[#84E600]/45 focus:ring-4 focus:ring-[#84E600]/10"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold leading-snug text-[#8D817B]">
            Эта запись останется в выбранном дне и будет видна в истории цикла.
          </p>
          <Button size="sm" className={limeButtonClass} onClick={saveDiaryNote}>
            {savedNote ? "Сохранено" : "Сохранить"}
          </Button>
        </div>
      </Card>

      <Card className={`mb-5 rounded-[20px] p-5 ${darkCardClass}`}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-[#F5F0ED]">Записи по циклу</p>
            <p className="text-xs font-semibold text-[#B7AAA4]">Последние личные заметки с привязкой к дню цикла</p>
          </div>
          <BookOpen className="h-5 w-5 text-[#8D817B]" />
        </div>
        {diaryEntries.length === 0 ? (
          <div className={`rounded-[18px] border border-dashed p-4 text-center ${darkInsetClass}`}>
            <p className="text-sm font-black text-[#F5F0ED]">Пока нет личных записей</p>
            <p className="mt-1 text-xs font-semibold text-[#B7AAA4]">Добавь заметку или отметь состояние 3–5 дней, и Mira начнёт видеть первые повторения.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {diaryEntries.slice(0, 5).map((entry) => {
              const entryPhase = getPhaseForDate(data, entry.date);
              return (
                <button
                  key={entry.date}
                  onClick={() => setSelectedDay(entry.date)}
                  className={`w-full rounded-[16px] border px-3 py-2.5 text-left transition hover:bg-[#302927] active:scale-[0.99] ${darkInsetClass}`}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-xs font-black text-[#F5F0ED]">
                      {new Date(entry.date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                    </p>
                    <span className="shrink-0 text-[10px] font-black text-[#84E600]">
                      {entryPhase ? `${entryPhase.cycleDay} дц` : "без цикла"}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-xs font-semibold leading-snug text-[#B7AAA4]">{entry.note?.text}</p>
                </button>
              );
            })}
          </div>
        )}
      </Card>

    </div>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className={`rounded-2xl border px-3 py-2 ${darkInsetClass}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#8D817B]">{label}</p>
      <p className="mt-1 text-xs font-semibold text-[#F5F0ED]">{value}</p>
    </div>
  );
}

function DiaryQuickButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-11 rounded-2xl border border-[#342D2A] bg-[#251F1D] px-3 py-2 text-xs font-black text-[#F5F0ED] transition hover:-translate-y-0.5 hover:border-[#84E600]/35 hover:bg-[#2A2523] active:scale-[0.98]"
    >
      {label}
    </button>
  );
}
