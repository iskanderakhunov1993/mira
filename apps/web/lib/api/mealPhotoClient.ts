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
  const formData = new FormData();
  formData.append("image", image);
  formData.append("context", JSON.stringify({ ...context, imageName: image.name }));

  try {
    const response = await fetch("/api/analyze-meal", { method: "POST", body: formData });
    const body: unknown = await response.json();

    if (response.ok && isRecord(body) && isMealEnvelope(body)) {
      return {
        analysis: body.data,
        source: body.source,
        message: typeof body.message === "string" ? body.message : undefined
      };
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

function isMealEnvelope(value: Record<string, unknown>): value is AiEnvelope<AnalyzeMealOutput> & { message?: unknown } {
  return isMealAnalysisOutput(value.data) && (value.source === "ai" || value.source === "demo" || value.source === "fallback");
}
