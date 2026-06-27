"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  BookOpen,
  CalendarDays,
  Droplets,
  Dumbbell,
  FileText,
  Footprints,
  Moon,
  PencilLine,
  Plus,
  Sparkles,
  Utensils,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { dateKey, getCyclePhase, getPhaseLabel, saveCheckIn } from "@/lib/store";
import type { DailyCheckIn, MiraLocalData } from "@/lib/types";
import type { ScreenProps } from "./types";

const weekDays = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

const moodLabels: Record<string, string> = {
  normal: "спокойно",
  joy: "радость",
  sadness: "грусть",
  anger: "раздражение",
  anxiety: "тревога",
  swings: "перепады",
};

const energyLabels: Record<string, string> = {
  exhausted: "истощение",
  low: "низкая",
  normal: "обычная",
  high: "высокая",
};

const sleepLabels: Record<string, string> = {
  good: "хороший",
  normal: "обычный",
  bad: "плохой",
  little: "мало сна",
  insomnia: "бессонница",
};

const periodLabels: Record<string, string> = {
  light: "скудные",
  moderate: "умеренные",
  heavy: "обильные",
  very_heavy: "очень обильные",
};

const painLabels: Record<string, string> = {
  light: "лёгкая",
  medium: "средняя",
  strong: "сильная",
};

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

function checkInItems(checkIn: DailyCheckIn | undefined) {
  if (!checkIn) return [];

  const items: { key: string; icon: typeof Sparkles; label: string; value: string }[] = [];
  if (checkIn.period) {
    items.push({
      key: "period",
      icon: CalendarDays,
      label: "Месячные",
      value: periodLabels[checkIn.period.intensity] ?? "отмечены",
    });
  }
  if (checkIn.pain && checkIn.pain.kinds.some((kind) => kind !== "none")) {
    items.push({
      key: "pain",
      icon: Activity,
      label: "Боль",
      value: painLabels[checkIn.pain.level ?? "light"] ?? "отмечена",
    });
  }
  if (checkIn.mood) {
    items.push({
      key: "mood",
      icon: Sparkles,
      label: "Настроение",
      value: moodLabels[checkIn.mood.value] ?? checkIn.mood.value,
    });
  }
  if (checkIn.energy) {
    items.push({
      key: "energy",
      icon: Zap,
      label: "Энергия",
      value: energyLabels[checkIn.energy.value] ?? checkIn.energy.value,
    });
  }
  if (checkIn.sleep) {
    items.push({
      key: "sleep",
      icon: Moon,
      label: "Сон",
      value: sleepLabels[checkIn.sleep.quality] ?? checkIn.sleep.quality,
    });
  }
  if (checkIn.pms && checkIn.pms.symptoms.length > 0) {
    items.push({
      key: "pms",
      icon: PencilLine,
      label: "ПМС",
      value: checkIn.pms.symptoms.slice(0, 2).join(", "),
    });
  }
  if (checkIn.meals && checkIn.meals.length > 0) {
    items.push({
      key: "meals",
      icon: Utensils,
      label: "Питание",
      value: `${checkIn.meals.length} отметки`,
    });
  }
  if (checkIn.note?.text) {
    items.push({
      key: "note",
      icon: PencilLine,
      label: "Заметка",
      value: checkIn.note.text,
    });
  }
  if (checkIn.badEpisodes && checkIn.badEpisodes.length > 0) {
    const lastEpisode = checkIn.badEpisodes[checkIn.badEpisodes.length - 1];
    items.push({
      key: "bad",
      icon: Activity,
      label: "Мне плохо",
      value: `${checkIn.badEpisodes.length} эпизод · ${lastEpisode.summary}`,
    });
  }

  return items;
}

export function DiaryScreen({ data, persist, navigate, onCheckIn }: ScreenProps) {
  const [selectedDay, setSelectedDay] = useState(dateKey());
  const [diaryText, setDiaryText] = useState("");
  const [savedNote, setSavedNote] = useState(false);
  const days = useMemo(() => recentDays(21), []);
  const selectedCheckIn = data.checkIns[selectedDay];
  const selectedItems = checkInItems(selectedCheckIn);
  const water = data.waterLog?.[selectedDay];
  const walking = data.walkingLog?.[selectedDay];
  const workouts = data.workouts.filter((workout) => workout.date === selectedDay);
  const phase = getPhaseForDate(data, selectedDay);
  const checkIns = Object.values(data.checkIns);
  const diaryEntries = checkIns
    .filter((entry) => entry.note?.text)
    .sort((a, b) => b.date.localeCompare(a.date));

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

  const last30 = checkIns.filter((entry) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return entry.date >= dateKey(cutoff);
  });
  const painDays = last30.filter((entry) => entry.pain && entry.pain.kinds.some((kind) => kind !== "none")).length;
  const heavyDays = last30.filter((entry) => entry.period?.intensity === "heavy" || entry.period?.intensity === "very_heavy").length;
  const badSleepDays = last30.filter((entry) => entry.sleep?.quality === "bad" || entry.sleep?.quality === "insomnia").length;
  const walkingDays = Object.values(data.walkingLog ?? {}).filter((entry) => entry.date >= dateKey(new Date(Date.now() - 30 * 86_400_000)) && entry.steps > 0).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-mira-text">Мой личный дневник</h1>
        <p className="mt-1 text-sm text-mira-muted">Записи сохраняются в день цикла и помогают вспомнить контекст</p>
      </div>

      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Календарь цикла</p>
          <p className="text-sm font-semibold text-mira-text">Выбери день для записи</p>
        </div>
        <CalendarDays className="h-5 w-5 text-mira-muted" />
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
              className={`min-h-[76px] rounded-lg border p-1.5 text-center transition active:scale-[0.98] ${
                isSelected
                  ? "border-mira-primary bg-mira-primary text-white shadow-glow"
                  : day.isToday
                    ? "border-mira-primary/30 bg-white text-mira-text"
                    : "border-mira-lavender/20 bg-white/70 text-mira-muted"
              }`}
            >
              <span className="block text-[10px] font-semibold">{day.weekDay}</span>
              <span className="mt-1 block text-base font-bold">{day.day}</span>
              <span className="mt-0.5 block text-[9px] font-semibold opacity-70">
                {dayPhase ? `${dayPhase.cycleDay} дц` : "—"}
              </span>
              <span className="mt-1 flex items-center justify-center gap-1">
                <span className={`block h-1.5 w-1.5 rounded-full ${hasData ? (isSelected ? "bg-white" : "bg-mira-primary") : "bg-transparent"}`} />
                <span className={`block h-1.5 w-1.5 rounded-full ${hasNote ? (isSelected ? "bg-white" : "bg-mira-success") : "bg-transparent"}`} />
              </span>
            </button>
          );
        })}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 px-1 text-[10px] font-semibold text-mira-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-mira-primary" />
          отметки дня
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-mira-success" />
          личная запись
        </span>
      </div>

      <Card className="mb-5 border-mira-primary/10 bg-mira-lavender-light/20 p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-mira-primary">Личная запись</p>
            <p className="text-sm font-bold text-mira-text">
              {new Date(selectedDay).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
            </p>
            <p className="text-xs text-mira-muted">
              {phase ? `${phase.cycleDay}-й день цикла · ${phase.label.toLowerCase()} фаза` : "День без привязки к циклу"}
            </p>
          </div>
          <PencilLine className="h-5 w-5 shrink-0 text-mira-primary" />
        </div>
        <textarea
          value={diaryText}
          onChange={(event) => setDiaryText(event.target.value)}
          placeholder="Что сегодня происходило? Настроение, мысли, стресс, боль, важные события..."
          rows={5}
          className="w-full resize-none rounded-lg border border-mira-lavender/30 bg-white p-3 text-sm leading-relaxed text-mira-text outline-none transition placeholder:text-mira-muted focus:border-mira-primary/50 focus:ring-4 focus:ring-mira-primary/10"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-[11px] leading-snug text-mira-muted">
            Эта запись останется в выбранном дне и будет видна в истории цикла.
          </p>
          <Button size="sm" onClick={saveDiaryNote}>
            {savedNote ? "Сохранено" : "Сохранить"}
          </Button>
        </div>
      </Card>

      <Card className="mb-5 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-mira-text">
              {new Date(selectedDay).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
            </p>
            <p className="text-xs text-mira-muted">
              {phase ? `${phase.cycleDay}-й день · ${phase.label.toLowerCase()} фаза` : "День без привязки к циклу"}
            </p>
          </div>
          <Button size="sm" onClick={() => onCheckIn?.(selectedDay)}>
            <Plus className="h-4 w-4" /> Отметить
          </Button>
        </div>

        {selectedItems.length === 0 && !water && !walking && workouts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-mira-lavender/40 bg-mira-bg p-4 text-center">
            <p className="text-sm font-semibold text-mira-text">В этот день пока пусто</p>
            <p className="mt-1 text-xs text-mira-muted">Добавь хотя бы одну отметку, чтобы день попал в аналитику и отчёт.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.key} className="flex items-center gap-3 rounded-2xl bg-mira-bg px-3 py-2.5">
                  <Icon className="h-4 w-4 shrink-0 text-mira-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-mira-text">{item.label}</p>
                    <p className="truncate text-xs text-mira-muted">{item.value}</p>
                  </div>
                </div>
              );
            })}
            {water && (
              <div className="flex items-center gap-3 rounded-2xl bg-mira-bg px-3 py-2.5">
                <Droplets className="h-4 w-4 shrink-0 text-mira-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-mira-text">Вода</p>
                  <p className="text-xs text-mira-muted">{water.glasses} из {water.goal} стаканов</p>
                </div>
              </div>
            )}
            {walking && walking.steps > 0 && (
              <div className="flex items-center gap-3 rounded-2xl bg-mira-bg px-3 py-2.5">
                <Footprints className="h-4 w-4 shrink-0 text-mira-success" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-mira-text">Ходьба</p>
                  <p className="text-xs text-mira-muted">{walking.steps} шагов из {walking.goal}</p>
                </div>
              </div>
            )}
            {workouts.map((workout) => (
              <div key={workout.id} className="flex items-center gap-3 rounded-2xl bg-mira-bg px-3 py-2.5">
                <Dumbbell className="h-4 w-4 shrink-0 text-mira-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-mira-text">{workout.title}</p>
                  <p className="text-xs text-mira-muted">{workout.status === "completed" ? "выполнено" : workout.status === "lighter" ? "облегчено" : "пропущено"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="mb-5 p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-mira-text">Записи по циклу</p>
            <p className="text-xs text-mira-muted">Последние личные заметки с привязкой к дню цикла</p>
          </div>
          <BookOpen className="h-5 w-5 text-mira-muted" />
        </div>
        {diaryEntries.length === 0 ? (
          <div className="rounded-lg border border-dashed border-mira-lavender/40 bg-mira-bg p-4 text-center">
            <p className="text-sm font-semibold text-mira-text">Пока нет личных записей</p>
            <p className="mt-1 text-xs text-mira-muted">Напиши пару строк выше — день сразу появится здесь.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {diaryEntries.slice(0, 5).map((entry) => {
              const entryPhase = getPhaseForDate(data, entry.date);
              return (
                <button
                  key={entry.date}
                  onClick={() => setSelectedDay(entry.date)}
                  className="w-full rounded-lg bg-mira-bg px-3 py-2.5 text-left transition hover:bg-mira-lavender-light/40 active:scale-[0.99]"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-mira-text">
                      {new Date(entry.date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                    </p>
                    <span className="shrink-0 text-[10px] font-semibold text-mira-primary">
                      {entryPhase ? `${entryPhase.cycleDay} дц` : "без цикла"}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-xs leading-snug text-mira-muted">{entry.note?.text}</p>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="mb-5 p-5">
        <p className="mb-3 text-sm font-bold text-mira-text">Что уже видно за 30 дней</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Отметок", value: last30.length },
            { label: "Боль", value: painDays },
            { label: "Ходьба", value: walkingDays },
            { label: "Плохой сон", value: badSleepDays },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl bg-mira-bg p-3 text-center">
              <p className="text-xl font-bold text-mira-text">{item.value}</p>
              <p className="text-[10px] text-mira-muted">{item.label}</p>
            </div>
          ))}
        </div>
        {heavyDays > 0 && (
          <p className="mt-3 rounded-2xl bg-[#F8E8EE]/50 px-3 py-2 text-xs text-mira-cycle">
            Обильные месячные отмечены {heavyDays} раз. Это полезно вынести в отчёт врачу.
          </p>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={() => navigate("analytics")}>
          <BarChart3 className="h-4 w-4" /> Аналитика
        </Button>
        <Button variant="outline" onClick={() => navigate("report")}>
          <FileText className="h-4 w-4" /> Отчёт врачу
        </Button>
      </div>
    </div>
  );
}
