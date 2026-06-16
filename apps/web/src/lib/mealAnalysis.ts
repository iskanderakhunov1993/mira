import type {
  MealAnalysisResponse,
  MealVisionAnalysis
} from "../types";

export const demoMealAnalysis: MealVisionAnalysis = {
  isFood: true,
  dishName: "Боул с курицей, крупой и овощами",
  items: [
    {
      name: "Курица",
      estimatedPortion: "120–150 г",
      confidence: 0.88
    },
    {
      name: "Крупа",
      estimatedPortion: "140–180 г",
      confidence: 0.72
    },
    {
      name: "Овощи и соус",
      estimatedPortion: "180–230 г",
      confidence: 0.81
    }
  ],
  calories: { min: 540, max: 650 },
  macrosG: {
    protein: { min: 38, max: 46 },
    carbs: { min: 55, max: 70 },
    fat: { min: 15, max: 22 }
  },
  confidence: 0.86,
  uncertainFactors: ["Количество масла", "Состав и объём соуса"],
  followUpQuestion: "Соус и масло уже добавлены в блюдо?",
  notes:
    "Оценка основана на видимой порции. Для более точного результата сфотографируй блюдо сверху."
};

const wait = (milliseconds: number) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

export async function analyzeMealImage(
  image: File | null
): Promise<MealAnalysisResponse> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!image || !supabaseUrl || !anonKey) {
    await wait(1200);
    return { analysis: demoMealAnalysis, source: "demo" };
  }

  const body = new FormData();
  body.append("image", image);

  const response = await fetch(
    `${supabaseUrl}/functions/v1/analyze-meal`,
    {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`
      },
      body
    }
  );

  const payload = (await response.json()) as
    | { analysis: MealVisionAnalysis }
    | { error?: string };

  if (!response.ok || !("analysis" in payload)) {
    throw new Error(
      "error" in payload && payload.error
        ? payload.error
        : "Не удалось проанализировать фото"
    );
  }

  return { analysis: payload.analysis, source: "ai" };
}
