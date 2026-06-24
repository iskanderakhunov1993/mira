"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, Moon, Infinity, Dumbbell, Check, SkipForward, ChevronRight, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCycleDay, getCyclePhase, getPhaseLabel, getCheckIn, addWorkout } from "@/lib/store";
import type { ScreenProps } from "./types";
import type { CyclePhase, ActivityType } from "@/lib/types";

// ── Workout generation ──

type Exercise = {
  name: string;
  duration: number; // seconds
  description: string;
  emoji: string;
};

type WorkoutPlan = {
  title: string;
  activityType: ActivityType;
  totalMinutes: number;
  sections: {
    name: string;
    emoji: string;
    exercises: Exercise[];
  }[];
};

function generateWorkout(phase: CyclePhase, energy: string | undefined, hasCheckIn: boolean): WorkoutPlan {
  if (phase === "menstruation" || energy === "low" || energy === "exhausted") {
    return {
      title: "Мягкая растяжка",
      activityType: "stretching",
      totalMinutes: 15,
      sections: [
        {
          name: "Разминка", emoji: "🌬",
          exercises: [
            { name: "Глубокое дыхание", duration: 60, description: "Вдох 4 сек — задержка 4 сек — выдох 6 сек", emoji: "🌬" },
            { name: "Вращения шеей", duration: 45, description: "Медленные круги в каждую сторону", emoji: "🔄" },
          ]
        },
        {
          name: "Основная часть", emoji: "🧘",
          exercises: [
            { name: "Кошка-корова", duration: 60, description: "Плавные прогибы спины на четвереньках", emoji: "🐱" },
            { name: "Поза ребёнка", duration: 60, description: "Расслабление, руки вперёд, лоб к полу", emoji: "🧒" },
            { name: "Скручивание лёжа", duration: 60, description: "Колени в сторону, плечи прижаты к полу", emoji: "🔄" },
            { name: "Бабочка", duration: 60, description: "Стопы вместе, колени в стороны, наклон вперёд", emoji: "🦋" },
            { name: "Наклон сидя", duration: 60, description: "Ноги прямые, тянемся к стопам", emoji: "🙇" },
          ]
        },
        {
          name: "Заминка", emoji: "😌",
          exercises: [
            { name: "Шавасана", duration: 90, description: "Лёжа на спине, полное расслабление", emoji: "🛌" },
            { name: "Дыхание покоя", duration: 60, description: "Медленное дыхание, отпускаем напряжение", emoji: "🌙" },
          ]
        },
      ]
    };
  }

  if (phase === "ovulation" || energy === "high") {
    return {
      title: "Умеренная силовая",
      activityType: "moderate_strength",
      totalMinutes: 25,
      sections: [
        {
          name: "Разминка", emoji: "🔥",
          exercises: [
            { name: "Марш на месте", duration: 60, description: "Активный шаг с подъёмом коленей", emoji: "🚶" },
            { name: "Круги руками", duration: 45, description: "Большие круги вперёд и назад", emoji: "🔄" },
            { name: "Наклоны в стороны", duration: 45, description: "Растяжка боковой поверхности", emoji: "↔️" },
          ]
        },
        {
          name: "Основная часть", emoji: "💪",
          exercises: [
            { name: "Приседания", duration: 60, description: "15 повторений — спина прямая, колени за носки", emoji: "🏋️" },
            { name: "Выпады назад", duration: 60, description: "12 на каждую ногу — шаг назад, колено к полу", emoji: "🦵" },
            { name: "Отжимания", duration: 60, description: "10–12 повторений, можно с колен", emoji: "💪" },
            { name: "Планка", duration: 45, description: "Держим ровную линию тела", emoji: "🧱" },
            { name: "Ягодичный мост", duration: 60, description: "15 повторений — таз вверх, задержка наверху", emoji: "🍑" },
            { name: "Скалолаз", duration: 45, description: "Поочерёдное подтягивание коленей в планке", emoji: "🧗" },
            { name: "Приседания с паузой", duration: 60, description: "10 повторений — 3 сек внизу", emoji: "⏸️" },
            { name: "Супермен", duration: 45, description: "Лёжа на животе — руки и ноги вверх", emoji: "🦸" },
          ]
        },
        {
          name: "Заминка", emoji: "🧘",
          exercises: [
            { name: "Растяжка квадрицепса", duration: 45, description: "Стоя, стопа к ягодице, каждая нога", emoji: "🦵" },
            { name: "Наклон вперёд", duration: 45, description: "Ноги прямые, тянемся к полу", emoji: "🙇" },
            { name: "Дыхание", duration: 60, description: "Глубокое восстановительное дыхание", emoji: "🌬" },
          ]
        },
      ]
    };
  }

  // Default: light strength (follicular/luteal, normal energy)
  return {
    title: "Лёгкая силовая",
    activityType: "light_strength",
    totalMinutes: 20,
    sections: [
      {
        name: "Разминка", emoji: "🔥",
        exercises: [
          { name: "Марш на месте", duration: 60, description: "Спокойный темп, раскачиваемся", emoji: "🚶" },
          { name: "Вращения тазом", duration: 45, description: "Круговые движения, разогрев суставов", emoji: "🔄" },
        ]
      },
      {
        name: "Основная часть", emoji: "💪",
        exercises: [
          { name: "Приседания", duration: 60, description: "12 повторений — плавно, спина прямая", emoji: "🏋️" },
          { name: "Выпады на месте", duration: 60, description: "10 на каждую ногу", emoji: "🦵" },
          { name: "Отжимания с колен", duration: 50, description: "10 повторений, контролируем спуск", emoji: "💪" },
          { name: "Ягодичный мост", duration: 50, description: "12 повторений с паузой наверху", emoji: "🍑" },
          { name: "Планка", duration: 40, description: "Держим сколько комфортно", emoji: "🧱" },
          { name: "Боковая планка", duration: 40, description: "20 сек на каждую сторону", emoji: "📐" },
        ]
      },
      {
        name: "Заминка", emoji: "🧘",
        exercises: [
          { name: "Поза ребёнка", duration: 45, description: "Расслабление спины", emoji: "🧒" },
          { name: "Растяжка бёдер", duration: 45, description: "Голубь или лёжа, каждая нога", emoji: "🦵" },
          { name: "Глубокое дыхание", duration: 60, description: "Восстановление, 5 глубоких вдохов", emoji: "🌬" },
        ]
      },
    ]
  };
}

// ── Timer hook ──

function useTimer(onComplete: () => void) {
  const [remaining, setRemaining] = useState(0);
  const [total, setTotal] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const start = useCallback((seconds: number) => {
    setRemaining(seconds);
    setTotal(seconds);
    setRunning(true);
  }, []);

  const pause = useCallback(() => setRunning(false), []);
  const resume = useCallback(() => setRunning(true), []);
  const skip = useCallback(() => {
    setRemaining(0);
    setRunning(false);
    onCompleteRef.current();
  }, []);

  useEffect(() => {
    if (!running || remaining <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          setRunning(false);
          setTimeout(() => onCompleteRef.current(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, remaining]);

  const pct = total > 0 ? ((total - remaining) / total) * 100 : 0;
  return { remaining, total, running, pct, start, pause, resume, skip };
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ── Activity options ──

const activityOptions = [
  { icon: "🛌", label: "Отдых", type: "rest" as ActivityType },
  { icon: "🌬", label: "Дыхание", type: "breathing" as ActivityType },
  { icon: "🧘", label: "Растяжка", type: "stretching" as ActivityType },
  { icon: "🚶‍♀️", label: "Прогулка", type: "walk" as ActivityType },
  { icon: "🧘‍♀️", label: "Йога", type: "yoga" as ActivityType },
  { icon: "💪", label: "Лёгкая силовая", type: "light_strength" as ActivityType },
  { icon: "🏋️", label: "Умеренная силовая", type: "moderate_strength" as ActivityType },
  { icon: "🏃‍♀️", label: "Лёгкое кардио", type: "light_cardio" as ActivityType },
];

// ── Main component ──

type ViewMode = "plan" | "active" | "done";

export function WorkoutScreen({ data, persist }: ScreenProps) {
  const profile = data.profile;
  const cycleDay = getCycleDay(profile);
  const cycleLength = profile?.cycleConfig.cycleLength ?? 28;
  const periodLength = profile?.cycleConfig.periodLength ?? 5;
  const phase = getCyclePhase(cycleDay, periodLength, cycleLength);
  const checkIn = getCheckIn(data);

  const hasPain = checkIn?.pain && checkIn.pain.kinds.some(k => k !== "none") && checkIn.pain.level === "strong";
  const isExhausted = checkIn?.energy?.value === "exhausted";
  const poorSleep = checkIn?.sleep?.quality === "bad" || checkIn?.sleep?.quality === "insomnia";
  const shouldRest = hasPain || isExhausted || poorSleep;

  const [view, setView] = useState<ViewMode>("plan");
  const [workout, setWorkout] = useState<WorkoutPlan>(() => generateWorkout(phase, checkIn?.energy?.value, !!checkIn));

  // Flatten exercises for step-by-step
  const allExercises = workout.sections.flatMap(s => s.exercises);
  const [currentIdx, setCurrentIdx] = useState(0);
  const currentExercise = allExercises[currentIdx];

  const [startTime, setStartTime] = useState(0);

  const timer = useTimer(() => {
    // Auto-advance to next exercise
    if (currentIdx < allExercises.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      finishWorkout();
    }
  });

  // Start next exercise timer when currentIdx changes during active mode
  useEffect(() => {
    if (view === "active" && currentExercise) {
      timer.start(currentExercise.duration);
    }
  }, [currentIdx, view]);

  function startWorkout() {
    setCurrentIdx(0);
    setStartTime(Date.now());
    setView("active");
  }

  function finishWorkout() {
    const elapsed = Math.round((Date.now() - startTime) / 60000);
    persist(addWorkout(data, {
      status: "completed",
      activityType: workout.activityType,
      durationMinutes: elapsed || workout.totalMinutes,
      title: workout.title,
    }));
    setView("done");
  }

  function skipWorkout() {
    persist(addWorkout(data, {
      status: "skipped",
      activityType: workout.activityType,
      title: workout.title,
    }));
    setView("plan");
  }

  function makeLighter() {
    setWorkout(generateWorkout("menstruation", "low", true));
  }

  // Get current section info
  function getCurrentSection(): string {
    let count = 0;
    for (const s of workout.sections) {
      count += s.exercises.length;
      if (currentIdx < count) return `${s.emoji} ${s.name}`;
    }
    return "";
  }

  // ── ACTIVE VIEW ──
  if (view === "active" && currentExercise) {
    const progress = ((currentIdx) / allExercises.length) * 100;

    return (
      <div className="flex min-h-[70vh] flex-col">
        {/* Top bar */}
        <div className="mb-6 flex items-center justify-between">
          <button onClick={() => { timer.pause(); setView("plan"); }} className="text-sm text-mira-muted hover:text-mira-primary">
            ← Выйти
          </button>
          <Badge>{currentIdx + 1} / {allExercises.length}</Badge>
          <button onClick={finishWorkout} className="text-sm text-mira-muted hover:text-mira-primary">
            Завершить
          </button>
        </div>

        {/* Overall progress */}
        <div className="mb-2 h-1.5 w-full rounded-full bg-mira-lavender-light">
          <div className="h-full rounded-full bg-mira-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="mb-6 text-xs text-mira-muted">{getCurrentSection()}</p>

        {/* Exercise card */}
        <Card className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center p-8 text-center">
          <span className="text-5xl">{currentExercise.emoji}</span>
          <h2 className="mt-4 text-2xl font-bold text-mira-text">{currentExercise.name}</h2>
          <p className="mt-2 text-sm text-mira-muted">{currentExercise.description}</p>

          {/* Timer circle */}
          <div className="relative mt-8 h-40 w-40">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle cx="50" cy="50" r="44" fill="none" stroke="#EDE8F5" strokeWidth="6" />
              <circle cx="50" cy="50" r="44" fill="none" stroke="#9B8EC4" strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 44}`}
                strokeDashoffset={`${2 * Math.PI * 44 * (1 - timer.pct / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-mira-text">{formatTime(timer.remaining)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-8 flex items-center gap-4">
            {timer.running ? (
              <button onClick={timer.pause} className="flex h-14 w-14 items-center justify-center rounded-full bg-mira-lavender-light text-mira-primary transition hover:bg-mira-lavender">
                <Pause className="h-6 w-6" />
              </button>
            ) : (
              <button onClick={timer.resume} className="flex h-14 w-14 items-center justify-center rounded-full bg-mira-primary text-white shadow-glow transition hover:bg-mira-primary-deep">
                <Play className="h-6 w-6 ml-0.5" />
              </button>
            )}
            <button onClick={timer.skip} className="flex h-10 w-10 items-center justify-center rounded-full border border-mira-lavender/30 text-mira-muted transition hover:bg-mira-lavender-light">
              <SkipForward className="h-4 w-4" />
            </button>
          </div>
        </Card>

        {/* Upcoming */}
        {currentIdx < allExercises.length - 1 && (
          <div className="mt-4 rounded-2xl bg-mira-bg p-3 text-center">
            <span className="text-xs text-mira-muted">Далее: </span>
            <span className="text-xs font-semibold text-mira-text">{allExercises[currentIdx + 1].emoji} {allExercises[currentIdx + 1].name}</span>
          </div>
        )}
      </div>
    );
  }

  // ── DONE VIEW ──
  if (view === "done") {
    const elapsed = Math.round((Date.now() - startTime) / 60000) || workout.totalMinutes;
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-mira-success/15">
          <Check className="h-10 w-10 text-mira-success" />
        </div>
        <h2 className="mt-6 text-3xl font-bold text-mira-text">Отличная работа!</h2>
        <p className="mt-2 text-sm text-mira-muted">{workout.title} · {elapsed} мин</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {workout.sections.map(s => (
            <Badge key={s.name}>{s.emoji} {s.name}</Badge>
          ))}
        </div>
        <Button className="mt-8" size="lg" onClick={() => { setView("plan"); setWorkout(generateWorkout(phase, checkIn?.energy?.value, !!checkIn)); }}>
          <RotateCcw className="h-4 w-4" /> Вернуться
        </Button>
      </div>
    );
  }

  // ── PLAN VIEW ──
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-mira-text">Тренировка</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {shouldRest ? (
          <Card className="border-[#C4B07E]/15 bg-[#F5F0E0]/30 p-6">
            <div className="flex items-center gap-2 mb-1">
              <Moon className="h-5 w-5 text-[#A09060]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Рекомендация</span>
            </div>
            <p className="mt-2 text-lg font-bold text-mira-text">Сегодня лучше отдохнуть</p>
            <p className="mt-2 text-sm text-mira-muted leading-relaxed">
              Можно сделать дыхание, лёгкую растяжку или просто отдохнуть.
            </p>
            <div className="mt-4 rounded-2xl bg-white/60 p-4">
              <p className="mb-2 text-xs font-semibold text-mira-text">Почему:</p>
              <div className="space-y-1.5">
                {hasPain && <ReasonRow text="Сильная боль" warning />}
                {isExhausted && <ReasonRow text="Истощение" warning />}
                {poorSleep && <ReasonRow text={`Сон: ${checkIn?.sleep?.quality === "insomnia" ? "бессонница" : "плохой"}`} warning />}
              </div>
            </div>
            <Button variant="secondary" className="mt-4 w-full" onClick={() => { setWorkout(generateWorkout("menstruation", "low", true)); }}>
              Мягкая тренировка всё равно
            </Button>
          </Card>
        ) : (
          <Card className="border-mira-primary/15 bg-gradient-to-br from-mira-lavender-light/50 to-white p-6">
            <div className="flex items-center gap-2 mb-1">
              <Dumbbell className="h-5 w-5 text-mira-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Тренировка сегодня</span>
            </div>
            <p className="text-2xl font-bold text-mira-text">{workout.totalMinutes} минут</p>
            <p className="text-sm text-mira-primary">{workout.title}</p>

            <div className="mt-4 rounded-2xl bg-white/60 p-4">
              <p className="mb-2 text-xs font-semibold text-mira-text">Почему подходит:</p>
              <div className="space-y-1.5">
                <ReasonRow text={`${getPhaseLabel(phase)} фаза — день ${cycleDay}`} />
                {checkIn?.energy && <ReasonRow text={`Энергия: ${energyL(checkIn.energy.value)}`} />}
                {checkIn?.sleep && <ReasonRow text={`Сон: ${sleepL(checkIn.sleep)}`} />}
                {!hasPain && <ReasonRow text="Боль не отмечена" />}
              </div>
            </div>

            {/* Exercise list preview */}
            <div className="mt-4 space-y-3">
              {workout.sections.map(s => (
                <div key={s.name} className="rounded-2xl bg-white/60 p-3">
                  <p className="mb-2 text-xs font-semibold text-mira-text">{s.emoji} {s.name}</p>
                  <div className="space-y-1">
                    {s.exercises.map((ex, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-mira-muted">{ex.emoji} {ex.name}</span>
                        <span className="text-mira-muted">{formatTime(ex.duration)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button className="w-full" onClick={startWorkout}><Play className="h-4 w-4" /> Начать</Button>
              <Button variant="secondary" className="w-full" onClick={makeLighter}>Сделать легче</Button>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button variant="outline" className="w-full" onClick={() => {}}>Другая активность</Button>
              <Button variant="ghost" className="w-full" onClick={skipWorkout}>Пропустить</Button>
            </div>
          </Card>
        )}

        {/* Activity options */}
        <div>
          <h3 className="mb-3 text-lg font-semibold text-mira-text">Варианты активности</h3>
          <div className="grid grid-cols-2 gap-3">
            {activityOptions.map(a => (
              <button key={a.label} className="flex items-center gap-2 rounded-2xl border border-mira-lavender/20 bg-white p-3 text-sm font-semibold text-mira-text shadow-card transition hover:shadow-soft">
                <span className="text-lg">{a.icon}</span>{a.label}
              </button>
            ))}
          </div>

          <Card className="mt-4 border-mira-primary/10 bg-mira-lavender-light/30 p-4">
            <div className="flex items-center gap-2">
              <Infinity className="h-4 w-4 text-mira-primary" strokeWidth={2.5} />
              <span className="text-xs font-semibold text-mira-primary">Mira подобрала</span>
            </div>
            <p className="mt-2 text-sm text-mira-text">Активность подобрана с учётом вашего состояния, фазы цикла и сна.</p>
            <p className="mt-1 text-[10px] text-mira-muted italic">ориентир · можно изменить</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ReasonRow({ text, warning }: { text: string; warning?: boolean }) {
  return (
    <div className="flex items-start gap-2 text-xs text-mira-muted">
      {warning ? <span className="mt-0.5 text-mira-cycle">⚠</span> : <Check className="mt-0.5 h-3 w-3 shrink-0 text-mira-success" />}
      {text}
    </div>
  );
}

function energyL(v: string) { return ({ exhausted: "истощение", low: "мало сил", normal: "нормально", high: "много сил" } as Record<string, string>)[v] ?? v; }
function sleepL(s: { quality: string; hours?: number }) {
  const q: Record<string, string> = { good: "хороший", normal: "нормальный", bad: "плохой", little: "мало", insomnia: "бессонница" };
  return s.hours ? `${s.hours} ч, ${q[s.quality] ?? s.quality}` : q[s.quality] ?? s.quality;
}
