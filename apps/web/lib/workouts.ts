import type { MiraLocalData, CyclePhase, GeneratedWorkout, GeneratedExercise, WorkoutLocation, WorkoutEquipment, WorkoutLog } from "./types";
import { getCyclePhase, getCheckIn, dateKey } from "./store";
import { getCycleNorm } from "./cycleEngine";

type ExercisePool = {
  name: string;
  sets?: number;
  reps?: string;
  duration?: string;
  rest?: string;
  locations: WorkoutLocation[];
  equipment: WorkoutEquipment[];
  intensity: "light" | "moderate" | "intense";
  category: "warmup" | "strength" | "cardio" | "flexibility" | "core" | "cooldown";
};

const exercisePool: ExercisePool[] = [
  // Light
  { name: "Глубокое дыхание 4-7-8", duration: "2 мин", locations: ["home", "gym", "outdoor"], equipment: ["none", "minimal", "full"], intensity: "light", category: "warmup" },
  { name: "Растяжка шеи и плеч", duration: "3 мин", locations: ["home", "gym", "outdoor"], equipment: ["none", "minimal", "full"], intensity: "light", category: "warmup" },
  { name: "Кошка-корова", sets: 2, reps: "10", locations: ["home", "gym"], equipment: ["none", "minimal", "full"], intensity: "light", category: "flexibility" },
  { name: "Поза ребёнка", duration: "1 мин", locations: ["home", "gym"], equipment: ["none", "minimal", "full"], intensity: "light", category: "flexibility" },
  { name: "Мостик ягодичный", sets: 2, reps: "12", locations: ["home", "gym"], equipment: ["none", "minimal", "full"], intensity: "light", category: "strength" },
  { name: "Ходьба на месте", duration: "5 мин", locations: ["home"], equipment: ["none", "minimal"], intensity: "light", category: "cardio" },
  { name: "Прогулка", duration: "15–20 мин", locations: ["outdoor"], equipment: ["none"], intensity: "light", category: "cardio" },
  { name: "Наклоны вперёд стоя", sets: 2, reps: "8", locations: ["home", "gym", "outdoor"], equipment: ["none", "minimal", "full"], intensity: "light", category: "flexibility" },
  { name: "Повороты корпуса сидя", sets: 2, reps: "10 в каждую сторону", locations: ["home", "gym"], equipment: ["none", "minimal", "full"], intensity: "light", category: "flexibility" },

  // Moderate
  { name: "Приседания", sets: 3, reps: "15", locations: ["home", "gym", "outdoor"], equipment: ["none", "minimal", "full"], intensity: "moderate", category: "strength" },
  { name: "Выпады на месте", sets: 3, reps: "12 на ногу", locations: ["home", "gym", "outdoor"], equipment: ["none", "minimal", "full"], intensity: "moderate", category: "strength" },
  { name: "Отжимания (можно с колен)", sets: 3, reps: "10–15", locations: ["home", "gym", "outdoor"], equipment: ["none", "minimal", "full"], intensity: "moderate", category: "strength" },
  { name: "Планка", sets: 3, duration: "30–45 сек", rest: "30 сек", locations: ["home", "gym", "outdoor"], equipment: ["none", "minimal", "full"], intensity: "moderate", category: "core" },
  { name: "Скручивания", sets: 3, reps: "15", locations: ["home", "gym"], equipment: ["none", "minimal", "full"], intensity: "moderate", category: "core" },
  { name: "Прыжки на месте", duration: "3 мин", locations: ["home", "outdoor"], equipment: ["none"], intensity: "moderate", category: "cardio" },
  { name: "Махи ногами назад", sets: 3, reps: "12 на ногу", locations: ["home", "gym"], equipment: ["none", "minimal", "full"], intensity: "moderate", category: "strength" },
  { name: "Берпи (облегчённые)", sets: 3, reps: "8", rest: "45 сек", locations: ["home", "gym", "outdoor"], equipment: ["none", "minimal", "full"], intensity: "moderate", category: "cardio" },

  // Intense
  { name: "Приседания с гантелями", sets: 4, reps: "12", rest: "60 сек", locations: ["gym", "home"], equipment: ["minimal", "full"], intensity: "intense", category: "strength" },
  { name: "Жим гантелей лёжа", sets: 4, reps: "10", rest: "60 сек", locations: ["gym"], equipment: ["full"], intensity: "intense", category: "strength" },
  { name: "Тяга верхнего блока", sets: 3, reps: "12", rest: "60 сек", locations: ["gym"], equipment: ["full"], intensity: "intense", category: "strength" },
  { name: "Выпады с гантелями", sets: 3, reps: "10 на ногу", rest: "60 сек", locations: ["gym", "home"], equipment: ["minimal", "full"], intensity: "intense", category: "strength" },
  { name: "Румынская тяга", sets: 3, reps: "12", rest: "60 сек", locations: ["gym"], equipment: ["full"], intensity: "intense", category: "strength" },
  { name: "Бег", duration: "20–30 мин", locations: ["outdoor", "gym"], equipment: ["none", "full"], intensity: "intense", category: "cardio" },
  { name: "HIIT: 30 сек работа / 15 сек отдых × 8", duration: "6 мин", locations: ["home", "gym", "outdoor"], equipment: ["none", "minimal", "full"], intensity: "intense", category: "cardio" },
  { name: "Jumping Jacks", sets: 3, reps: "20", rest: "30 сек", locations: ["home", "outdoor"], equipment: ["none"], intensity: "intense", category: "cardio" },
];

function getIntensityForPhase(phase: CyclePhase, energy: string | null, hasPain: boolean): "light" | "moderate" | "intense" {
  if (hasPain) return "light";
  if (energy === "exhausted") return "light";
  if (energy === "low") return phase === "menstruation" ? "light" : "moderate";
  if (energy === "high") return phase === "ovulation" || phase === "follicular" ? "intense" : "moderate";
  const map: Record<CyclePhase, "light" | "moderate" | "intense"> = {
    menstruation: "light",
    follicular: "moderate",
    ovulation: "intense",
    luteal: "moderate",
  };
  return map[phase];
}

const phaseNotes: Record<CyclePhase, Record<string, string>> = {
  menstruation: {
    light: "Менструальная фаза — время восстановления. Мягкие движения могут быть комфортнее при спазмах.",
    moderate: "Если чувствуешь силы — лёгкая активность допустима. Слушай тело.",
    intense: "Не рекомендуем интенсив в менструальную фазу. Мы снизили нагрузку.",
  },
  follicular: {
    light: "Фолликулярная фаза — энергия растёт. Если чувствуешь готовность, можно больше.",
    moderate: "Часто это удачное время для прогресса, если самочувствие хорошее.",
    intense: "Если чувствуешь силы, можно выбрать более интенсивную тренировку.",
  },
  ovulation: {
    light: "Овуляция — пик энергии. Лёгкая тренировка по твоему запросу.",
    moderate: "Если энергии хватает, можно выбрать более активную тренировку.",
    intense: "Интенсивный вариант подходит только при хорошем самочувствии.",
  },
  luteal: {
    light: "Лютеиновая фаза — энергия снижается. Мягкая активность — мудрый выбор.",
    moderate: "Умеренная нагрузка. Не требуй от себя рекордов — сейчас не время.",
    intense: "Мы немного снизили интенсивность для лютеиновой фазы.",
  },
};

export function generateWorkout(
  data: MiraLocalData,
  location: WorkoutLocation,
  equipment: WorkoutEquipment,
): GeneratedWorkout {
  const profile = data.profile;
  const norm = getCycleNorm(profile);
  const cycleDay = norm.isDelayed ? norm.cycleLength : norm.cycleDay;
  const cycleLength = norm.cycleLength;
  const periodLength = profile?.cycleConfig.periodLength ?? 5;
  const phase = getCyclePhase(cycleDay, periodLength, cycleLength);
  const checkIn = getCheckIn(data);
  const energy = checkIn?.energy?.value ?? null;
  const hasPain = checkIn?.pain?.level === "strong" || checkIn?.pain?.level === "medium";

  let intensity = getIntensityForPhase(phase, energy, hasPain);
  if (phase === "menstruation" && intensity === "intense") intensity = "moderate";
  if (hasPain && intensity !== "light") intensity = "light";

  const available = exercisePool.filter(e =>
    e.locations.includes(location) &&
    e.equipment.includes(equipment) &&
    (e.intensity === intensity || (intensity === "moderate" && e.intensity === "light") || (intensity === "intense" && e.intensity !== "light"))
  );

  const warmupPool = available.filter(e => e.category === "warmup" || (e.category === "flexibility" && e.intensity === "light"));
  const mainPool = available.filter(e => e.category === "strength" || e.category === "cardio" || e.category === "core");
  const cooldownPool = available.filter(e => e.category === "flexibility");

  function pick(pool: ExercisePool[], count: number): GeneratedExercise[] {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map(e => ({
      name: e.name,
      sets: e.sets,
      reps: e.reps,
      duration: e.duration,
      rest: e.rest,
    }));
  }

  const exerciseCount = intensity === "light" ? 4 : intensity === "moderate" ? 5 : 6;
  const exercises = pick(mainPool, exerciseCount);

  const durations: Record<string, string> = { light: "15–20 мин", moderate: "25–35 мин", intense: "35–45 мин" };
  const titles: Record<string, string[]> = {
    light: ["Мягкая тренировка", "Восстановительная", "Лёгкая активность"],
    moderate: ["Тренировка средней интенсивности", "Сбалансированная тренировка", "Функциональная"],
    intense: ["Силовая тренировка", "Интенсивная тренировка", "Полная нагрузка"],
  };

  const titleArr = titles[intensity];
  const title = titleArr[Math.floor(Math.random() * titleArr.length)];

  return {
    id: `w-${Date.now()}`,
    title,
    duration: durations[intensity],
    intensity,
    exercises,
    warmup: warmupPool.length > 0 ? warmupPool[0].name + (warmupPool[0].duration ? ` (${warmupPool[0].duration})` : "") : "Разминка 3 минуты",
    cooldown: cooldownPool.length > 0 ? cooldownPool[0].name + (cooldownPool[0].duration ? ` (${cooldownPool[0].duration})` : "") : "Растяжка 3 минуты",
    phaseNote: phaseNotes[phase][intensity] ?? "",
  };
}

// ── Workout analytics ──

export function getWorkoutStats(data: MiraLocalData): {
  total: number;
  completed: number;
  completionRate: number;
  lastWorkoutDaysAgo: number | null;
  nextRecommendedIn: number;
} {
  const workouts = data.workouts;
  const total = workouts.length;
  const completed = workouts.filter(w => w.status === "completed").length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  let lastWorkoutDaysAgo: number | null = null;
  if (workouts.length > 0) {
    const sorted = [...workouts].sort((a, b) => b.date.localeCompare(a.date));
    const last = new Date(sorted[0].date);
    const today = new Date();
    lastWorkoutDaysAgo = Math.floor((today.getTime() - last.getTime()) / 86_400_000);
  }

  let nextRecommendedIn = 1;
  if (lastWorkoutDaysAgo === null) {
    nextRecommendedIn = 0;
  } else if (lastWorkoutDaysAgo >= 3) {
    nextRecommendedIn = 0;
  } else {
    const profile = data.profile;
    const norm = getCycleNorm(profile);
    const cycleDay = norm.isDelayed ? norm.cycleLength : norm.cycleDay;
    const phase = getCyclePhase(cycleDay, profile?.cycleConfig.periodLength ?? 5, norm.cycleLength);
    if (phase === "menstruation") {
      nextRecommendedIn = Math.max(0, 3 - lastWorkoutDaysAgo);
    } else if (phase === "follicular" || phase === "ovulation") {
      nextRecommendedIn = Math.max(0, 2 - lastWorkoutDaysAgo);
    } else {
      nextRecommendedIn = Math.max(0, 2 - lastWorkoutDaysAgo);
    }
  }

  return { total, completed, completionRate, lastWorkoutDaysAgo, nextRecommendedIn };
}
