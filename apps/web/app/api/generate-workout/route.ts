import { NextResponse } from "next/server";
import type { AiWorkoutContent } from "@/lib/recommendations";

export const runtime = "nodejs";

const requestLimit = 40;
const requestWindowMs = 24 * 60 * 60 * 1000;
const requestCounts = new Map<string, { count: number; resetAt: number }>();
const intensityValues = new Set<AiWorkoutContent["intensity"]>(["Низкая", "Низко-средняя", "Средняя", "Средне-высокая"]);
const timeValues = new Set(["12 мин", "25 мин", "40 мин"]);
const sleepValues = new Set(["Плохо", "Нормально", "Хорошо"]);
const workloadValues = new Set(["Лёгкая", "Обычная", "Высокая"]);
const trainingPlaces = new Set(["Дом", "Зал"]);
const levels = new Set(["Новичок", "Средний", "Продвинутый"]);
const gymEnergyValues = new Set(["Много энергии", "Нормально", "Устала"]);
const goals = new Set(["Ноги и ягодицы", "Всё тело", "Мягкое кардио", "Просто подвигаться"]);

type WorkoutGenerationInput = {
  profile: { trainingPlace: "Зал" | "Дом"; level: "Новичок" | "Средний" | "Продвинутый"; workoutsPerWeek: number };
  checkIn: {
    energy: number;
    sleep: "Плохо" | "Нормально" | "Хорошо";
    stress: number;
    mood: number;
    painLevel: number;
    painAreas: string[];
    workload: "Лёгкая" | "Обычная" | "Высокая";
    symptoms: string[];
    note: string;
  };
  gym: { energy: "Много энергии" | "Нормально" | "Устала"; time: "12 мин" | "25 мин" | "40 мин"; goal: "Ноги и ягодицы" | "Всё тело" | "Мягкое кардио" | "Просто подвигаться" };
  cycle: { day: number; phase: string };
  nutrition: { mealsToday: number; summary: string[] };
};

export async function POST(request: Request) {
  if (!isWithinLimit(request)) {
    return NextResponse.json({ error: "Лимит генераций на сегодня достигнут. Попробуй позже." }, { status: 429 });
  }

  try {
    const parsed = parseInput(await request.json() as unknown);
    if (!parsed.success) return NextResponse.json({ error: "Контекст тренировки некорректен." }, { status: 400 });

    if (parsed.data.checkIn.painLevel >= 5) {
      return NextResponse.json({
        data: createRecoveryWorkout(parsed.data),
        source: "fallback",
        message: "При заметной боли Mira не генерирует силовую тренировку. Выбран восстановительный режим."
      });
    }

    const apiKey = process.env.YANDEX_API_KEY;
    const folderId = process.env.YANDEX_FOLDER_ID;
    if (!apiKey || !folderId) {
      return NextResponse.json({ error: "AI-тренировки ещё не подключены на сервере." }, { status: 503 });
    }

    const response = await fetch("https://llm.api.cloud.yandex.net/foundationModels/v1/completion", {
      method: "POST",
      headers: { Authorization: `Api-Key ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        modelUri: `gpt://${folderId}/${process.env.YANDEX_TEXT_MODEL ?? "yandexgpt/latest"}`,
        completionOptions: { stream: false, temperature: 0.2, maxTokens: "1400" },
        messages: [{ role: "user", text: buildPrompt(parsed.data) }]
      }),
      signal: AbortSignal.timeout(45_000)
    });
    const result: unknown = await response.json();
    const workout = parseAiWorkout(readYandexFoundationText(result));
    if (!response.ok || !isAiWorkoutContent(workout)) {
      console.error("Yandex workout generation error", result);
      return NextResponse.json({ error: "AI вернул неполный план. Попробуй собрать тренировку ещё раз." }, { status: 502 });
    }

    return NextResponse.json({ data: workout, source: "ai" });
  } catch (error) {
    console.error("Workout generation failed", error);
    return NextResponse.json({ error: "Не удалось собрать AI-план. Можно использовать локальный расчёт." }, { status: 500 });
  }
}

function buildPrompt(input: WorkoutGenerationInput): string {
  return [
    "Ты - бережный AI-коуч Mira. Составь одну персональную тренировку на русском языке по данным ниже. Это не медицинская рекомендация.",
    "ЖЁСТКИЕ ПРАВИЛА БЕЗОПАСНОСТИ: никогда не предлагай тренироваться через боль. При боли, усталости, плохом сне, высоком стрессе, спазмах или головной боли выбирай низкоударные комфортные движения и явно напоминай остановиться при усилении ощущений. Не ставь диагнозов, не обещай результатов, не советуй лекарства или добавки. Фаза цикла - только мягкий контекст; самоощущение, боль и сон важнее. Не используй стыдящий или агрессивный фитнес-язык.",
    "Верни ТОЛЬКО валидный JSON без markdown с полями title, intensity, explanation, factors, nutritionSupport, warmup, exercises, cooldown.",
    "intensity допускает только: Низкая, Низко-средняя, Средняя, Средне-высокая. factors: 3-6 коротких факторов. В exercises каждый объект: name, prescription, rest, cue. Для 12 мин сделай 2 упражнения, для 25 мин - 3, для 40 мин - 4. Не больше 5 упражнений. title до 100 символов; explanation до 500; warmup и cooldown до 240; nutritionSupport необязательно, до 320.",
    `Тренировка проходит: ${input.profile.trainingPlace}.`,
    "КОНТЕКСТ ПОЛЬЗОВАТЕЛЯ:",
    JSON.stringify(input)
  ].join("\n\n");
}

function createRecoveryWorkout(input: WorkoutGenerationInput): AiWorkoutContent {
  return {
    title: "Восстановление без силовой нагрузки",
    intensity: "Низкая",
    explanation: "Ты отметила заметную боль. Сегодня Mira предлагает только комфортное движение и паузу от силовой нагрузки. Остановись, если ощущения усиливаются.",
    factors: [`Боль: ${input.checkIn.painLevel}/10`, `Сон: ${input.checkIn.sleep.toLowerCase()}`, `Фаза: ${input.cycle.phase.toLowerCase()}`],
    nutritionSupport: input.nutrition.mealsToday === 0 ? "Перед движением оцени, нужна ли тебе привычная еда или пауза. Это не правило, а бережный выбор." : undefined,
    warmup: "2 минуты спокойного дыхания в удобном положении",
    exercises: [
      { name: "Мягкие движения стоп", prescription: "2 × 8-10", rest: "30 сек", cue: "Двигайся медленно и только в комфортной амплитуде." },
      { name: "Неспешная прогулка", prescription: "5-10 минут", rest: "По самочувствию", cue: "Сохраняй разговорный темп и остановись при усилении боли." }
    ],
    cooldown: "Спокойный выдох и отдых"
  };
}

function parseInput(value: unknown): { success: true; data: WorkoutGenerationInput } | { success: false } {
  if (!isRecord(value) || !isRecord(value.profile) || !isRecord(value.checkIn) || !isRecord(value.gym) || !isRecord(value.cycle) || !isRecord(value.nutrition)) return { success: false };
  const { profile, checkIn, gym, cycle, nutrition } = value;
  if (
    !trainingPlaces.has(profile.trainingPlace as string) || !levels.has(profile.level as string) || !isNumber(profile.workoutsPerWeek, 0, 7) ||
    !isNumber(checkIn.energy, 1, 10) || !sleepValues.has(checkIn.sleep as string) || !isNumber(checkIn.stress, 1, 10) || !isNumber(checkIn.mood, 1, 10) || !isNumber(checkIn.painLevel, 0, 10) || !workloadValues.has(checkIn.workload as string) || !isStringArray(checkIn.painAreas, 12, 60) || !isStringArray(checkIn.symptoms, 12, 60) || typeof checkIn.note !== "string" || checkIn.note.length > 280 ||
    !gymEnergyValues.has(gym.energy as string) || !timeValues.has(gym.time as string) || !goals.has(gym.goal as string) ||
    !isNumber(cycle.day, 1, 60) || typeof cycle.phase !== "string" || cycle.phase.length > 80 ||
    !isNumber(nutrition.mealsToday, 0, 20) || !isStringArray(nutrition.summary, 5, 160)
  ) return { success: false };
  return { success: true, data: value as WorkoutGenerationInput };
}

function isWithinLimit(request: Request): boolean {
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const previous = requestCounts.get(key);
  if (!previous || previous.resetAt <= now) {
    requestCounts.set(key, { count: 1, resetAt: now + requestWindowMs });
    return true;
  }
  if (previous.count >= requestLimit) return false;
  previous.count += 1;
  return true;
}

function parseAiWorkout(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  try {
    return JSON.parse(fenced?.[1] ?? trimmed);
  } catch {
    return null;
  }
}

function readYandexFoundationText(value: unknown): string {
  if (!isRecord(value) || !isRecord(value.result) || !Array.isArray(value.result.alternatives)) return "";
  const first = value.result.alternatives[0];
  return isRecord(first) && isRecord(first.message) && typeof first.message.text === "string" ? first.message.text : "";
}

function isAiWorkoutContent(value: unknown): value is AiWorkoutContent {
  return isRecord(value) &&
    typeof value.title === "string" && value.title.length > 0 && value.title.length <= 100 &&
    typeof value.intensity === "string" && intensityValues.has(value.intensity as AiWorkoutContent["intensity"]) &&
    typeof value.explanation === "string" && value.explanation.length > 0 && value.explanation.length <= 500 &&
    typeof value.warmup === "string" && value.warmup.length > 0 && value.warmup.length <= 240 &&
    typeof value.cooldown === "string" && value.cooldown.length > 0 && value.cooldown.length <= 240 &&
    Array.isArray(value.factors) && value.factors.length >= 1 && value.factors.length <= 7 && value.factors.every((item) => typeof item === "string" && item.length > 0 && item.length <= 120) &&
    (value.nutritionSupport === undefined || (typeof value.nutritionSupport === "string" && value.nutritionSupport.length <= 320)) &&
    Array.isArray(value.exercises) && value.exercises.length >= 1 && value.exercises.length <= 5 && value.exercises.every(isExercise);
}

function isExercise(value: unknown): boolean {
  return isRecord(value) && [value.name, value.prescription, value.rest, value.cue].every((item) => typeof item === "string" && item.length > 0 && item.length <= 160);
}

function isStringArray(value: unknown, maxItems: number, maxLength: number): value is string[] {
  return Array.isArray(value) && value.length <= maxItems && value.every((item) => typeof item === "string" && item.length <= maxLength);
}

function isNumber(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
