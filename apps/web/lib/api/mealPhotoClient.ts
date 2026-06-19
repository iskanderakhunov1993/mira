import {
  createDemoMealAnalysis,
  isMealAnalysisOutput,
  isRecord,
  type AiEnvelope,
  type AnalyzeMealInput,
  type AnalyzeMealOutput
} from "../../../../shared/ai-contracts";

export type MealPhotoAnalysisResult = {
  analysis: AnalyzeMealOutput;
  source: "ai" | "demo" | "fallback";
  message?: string;
};

export async function analyzeMealPhoto(
  image: File,
  context: Omit<AnalyzeMealInput, "imageName">
): Promise<MealPhotoAnalysisResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return {
      analysis: createDemoMealAnalysis(),
      source: "demo",
      message: "AI-анализ пока не настроен, поэтому показан пример приблизительной оценки."
    };
  }

  const formData = new FormData();
  formData.append("image", image);
  formData.append("context", JSON.stringify({ ...context, imageName: image.name }));

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/analyze-meal`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`
      },
      body: formData
    });
    const body: unknown = await response.json();

    if (response.ok && isRecord(body) && isMealEnvelope(body)) {
      return { analysis: body.data, source: body.source };
    }

    return {
      analysis: createDemoMealAnalysis(),
      source: "fallback",
      message: "AI-сервис сейчас недоступен, поэтому показана примерная оценка."
    };
  } catch {
    return {
      analysis: createDemoMealAnalysis(),
      source: "fallback",
      message: "Не удалось связаться с AI-сервисом, поэтому показана примерная оценка."
    };
  }
}

function isMealEnvelope(value: Record<string, unknown>): value is AiEnvelope<AnalyzeMealOutput> {
  return isMealAnalysisOutput(value.data) && (value.source === "ai" || value.source === "demo" || value.source === "fallback");
}
