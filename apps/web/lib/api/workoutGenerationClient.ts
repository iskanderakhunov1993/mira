import type { AiWorkoutContent, CheckInState, GymState, OnboardingState } from "@/lib/recommendations";

type WorkoutGenerationRequest = {
  profile: Pick<OnboardingState, "trainingPlace" | "level" | "workoutsPerWeek">;
  checkIn: CheckInState;
  gym: GymState;
  cycle: { day: number; phase: string };
  nutrition: { mealsToday: number; summary: string[] };
};

export type WorkoutGenerationResult = {
  workout: AiWorkoutContent;
  source: "ai" | "fallback";
  message?: string;
};

export async function generateWorkoutWithAi(input: WorkoutGenerationRequest): Promise<WorkoutGenerationResult> {
  const response = await fetch("/api/generate-workout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  const body: unknown = await response.json();

  if (!response.ok || !isRecord(body) || !isAiWorkoutContent(body.data) || (body.source !== "ai" && body.source !== "fallback")) {
    throw new Error(isRecord(body) && typeof body.error === "string" ? body.error : "AI-план сейчас недоступен.");
  }

  return {
    workout: body.data,
    source: body.source,
    message: typeof body.message === "string" ? body.message : undefined
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAiWorkoutContent(value: unknown): value is AiWorkoutContent {
  const intensities = new Set(["Низкая", "Низко-средняя", "Средняя", "Средне-высокая"]);
  return isRecord(value) &&
    typeof value.title === "string" && value.title.length > 0 && value.title.length <= 100 &&
    typeof value.intensity === "string" && intensities.has(value.intensity) &&
    typeof value.explanation === "string" && value.explanation.length > 0 && value.explanation.length <= 500 &&
    typeof value.warmup === "string" && value.warmup.length > 0 && value.warmup.length <= 240 &&
    typeof value.cooldown === "string" && value.cooldown.length > 0 && value.cooldown.length <= 240 &&
    Array.isArray(value.factors) && value.factors.length >= 1 && value.factors.length <= 7 && value.factors.every(isShortString) &&
    (value.nutritionSupport === undefined || (typeof value.nutritionSupport === "string" && value.nutritionSupport.length <= 320)) &&
    Array.isArray(value.exercises) && value.exercises.length >= 1 && value.exercises.length <= 5 && value.exercises.every(isExercise);
}

function isShortString(value: unknown): boolean {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}

function isExercise(value: unknown): boolean {
  return isRecord(value) && isShortString(value.name) && isShortString(value.prescription) && isShortString(value.rest) && isShortString(value.cue);
}
