import { NextResponse } from "next/server";
import {
  createDemoMealAnalysis,
  type AnalyzeMealOutput,
  isMealAnalysisOutput,
  parseAnalyzeMealInput
} from "../../../../../shared/ai-contracts";

export const runtime = "nodejs";

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxImageBytes = 8 * 1024 * 1024;
const requestLimit = 20;
const requestWindowMs = 24 * 60 * 60 * 1000;
const requestCounts = new Map<string, { count: number; resetAt: number }>();

const mealAnalysisSchema = {
  type: "object",
  additionalProperties: false,
  required: ["foods", "calories", "macros", "confidence", "uncertaintyFactors", "note"],
  properties: {
    foods: { type: "array", minItems: 1, maxItems: 10, items: { type: "string", minLength: 1, maxLength: 80 } },
    calories: rangeSchema(5000),
    macros: {
      type: "object",
      additionalProperties: false,
      required: ["protein", "carbs", "fat"],
      properties: { protein: rangeSchema(500), carbs: rangeSchema(500), fat: rangeSchema(500) }
    },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    uncertaintyFactors: { type: "array", minItems: 1, maxItems: 5, items: { type: "string", minLength: 1, maxLength: 120 } },
    note: { type: "string", minLength: 1, maxLength: 300 }
  }
};

function rangeSchema(maximum: number) {
  return {
    type: "object",
    additionalProperties: false,
    required: ["min", "max"],
    properties: {
      min: { type: "integer", minimum: 0, maximum },
      max: { type: "integer", minimum: 0, maximum }
    }
  };
}

function isWithinLimit(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const key = forwarded?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const existing = requestCounts.get(key);
  if (!existing || existing.resetAt <= now) {
    requestCounts.set(key, { count: 1, resetAt: now + requestWindowMs });
    return true;
  }
  if (existing.count >= requestLimit) return false;
  existing.count += 1;
  return true;
}

function readOutputText(response: unknown) {
  if (!isObject(response) || !Array.isArray(response.output)) return "";
  return response.output
    .flatMap((item) => (isObject(item) && Array.isArray(item.content) ? item.content : []))
    .filter((item) => isObject(item) && item.type === "output_text" && typeof item.text === "string")
    .map((item) => item.text as string)
    .join("");
}

function readGeminiOutputText(response: unknown) {
  if (!isObject(response) || !Array.isArray(response.candidates)) return "";
  return response.candidates
    .flatMap((candidate) => (isObject(candidate) && isObject(candidate.content) && Array.isArray(candidate.content.parts) ? candidate.content.parts : []))
    .filter((part) => isObject(part) && typeof part.text === "string")
    .map((part) => part.text as string)
    .join("");
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUploadedImage(value: FormDataEntryValue | null): value is File {
  return typeof value === "object" && value !== null && "arrayBuffer" in value && "size" in value && "type" in value;
}

const mealSystemPrompt =
  "You analyze a single meal photo for Mira, a wellbeing app. Return only an approximate visual estimate, never exact nutrition facts. Identify visible foods conservatively. Give calorie and macro ranges wide enough to reflect uncertain portions, oils, sauces, hidden ingredients, and perspective. Never shame food, give dieting advice, diagnose health conditions, or claim the image proves what the person ate. Confidence reflects visual certainty, not nutritional truth. Do not describe the person's body. Respond in Russian.";

function mealPrompt(energy: number | undefined, symptoms: string[] | undefined) {
  return `Analyze this meal photo. Self-reported energy: ${energy ?? "not provided"}/10. Symptoms: ${symptoms?.join(", ") || "not provided"}. Return JSON only with fields foods, calories {min,max}, macros {protein {min,max}, carbs {min,max}, fat {min,max}}, confidence, uncertaintyFactors, note.`;
}

export async function POST(request: Request) {
  const ollamaModel = process.env.OLLAMA_MEAL_MODEL;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const openAiApiKey = process.env.OPENAI_API_KEY;
  if (!ollamaModel && !geminiApiKey && !openAiApiKey) {
    return NextResponse.json({
      data: createDemoMealAnalysis(),
      source: "demo",
      message: "AI-анализ ещё не подключён, поэтому показан пример приблизительной оценки."
    });
  }

  if (!isWithinLimit(request)) {
    return NextResponse.json({ error: "Дневной лимит анализа фото достигнут. Попробуй завтра или добавь приём пищи вручную." }, { status: 429 });
  }

  try {
    const formData = await request.formData();
    const image = formData.get("image");
    if (!isUploadedImage(image)) return NextResponse.json({ error: "Нужно выбрать фото блюда." }, { status: 400 });
    if (!allowedImageTypes.has(image.type)) {
      return NextResponse.json({ error: "Поддерживаются JPEG, PNG и WebP." }, { status: 415 });
    }
    if (image.size > maxImageBytes) return NextResponse.json({ error: "Фото должно быть меньше 8 МБ." }, { status: 413 });

    const contextRaw = formData.get("context");
    const context = typeof contextRaw === "string" ? JSON.parse(contextRaw) : {};
    const parsed = parseAnalyzeMealInput(context);
    if (!parsed.success) return NextResponse.json({ error: "Контекст фото некорректен." }, { status: 400 });

    const imageBase64 = Buffer.from(await image.arrayBuffer()).toString("base64");
    const { outputText } = ollamaModel
      ? await analyzeWithOllama(ollamaModel, imageBase64, parsed.data)
      : geminiApiKey
        ? await analyzeWithGemini(geminiApiKey, image.type, imageBase64, parsed.data)
        : await analyzeWithOpenAi(openAiApiKey!, image.type, imageBase64, parsed.data);
    const analysis: unknown = outputText ? JSON.parse(outputText) : null;
    if (!isMealAnalysisOutput(analysis) && ollamaModel) {
      console.warn("Ollama meal analysis needs an experimental fallback", analysis);
      return NextResponse.json({
        data: createExperimentalMealAnalysis(),
        source: "ai",
        message: "Экспериментальная локальная оценка: модель не смогла уверенно распознать состав блюда, поэтому диапазоны намеренно широкие."
      });
    }
    if (!isMealAnalysisOutput(analysis)) {
      console.error("Invalid meal analysis response", analysis);
      return NextResponse.json({ error: "AI-сервис вернул неполный результат. Попробуй другое фото." }, { status: 502 });
    }

    return NextResponse.json({ data: analysis, source: "ai" });
  } catch (error) {
    console.error("Meal analysis failed", error);
    return NextResponse.json({ error: "Не удалось проанализировать фото. Попробуй ещё раз или добавь приём пищи вручную." }, { status: 500 });
  }
}

function createExperimentalMealAnalysis(): AnalyzeMealOutput {
  return {
    foods: ["Блюдо на фото"],
    calories: { min: 250, max: 850 },
    macros: {
      protein: { min: 5, max: 45 },
      carbs: { min: 15, max: 110 },
      fat: { min: 5, max: 45 }
    },
    confidence: 0.2,
    uncertaintyFactors: ["локальная экспериментальная модель", "состав и размер порции", "масло, соус и скрытые ингредиенты"],
    note: "Экспериментальная оценка по фото. Используй её только как очень грубый ориентир, а не как точный подсчёт."
  };
}

async function analyzeWithOllama(model: string, imageBase64: string, context: { energy?: number; symptoms?: string[] }) {
  const response = await fetch(`${process.env.OLLAMA_URL ?? "http://127.0.0.1:11434"}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt: `${mealSystemPrompt}\n\n${mealPrompt(context.energy, context.symptoms)}`,
      images: [imageBase64],
      format: "json",
      stream: false,
      options: { temperature: 0.1 }
    }),
    signal: AbortSignal.timeout(180_000)
  });
  const result: unknown = await response.json();
  if (!response.ok || !isObject(result) || typeof result.response !== "string") {
    console.error("Ollama meal analysis error", result);
    throw new Error("Ollama meal analysis is unavailable");
  }
  return { outputText: result.response };
}

async function analyzeWithGemini(apiKey: string, mimeType: string, imageBase64: string, context: { energy?: number; symptoms?: string[] }) {
  const model = process.env.GEMINI_MEAL_MODEL ?? "gemini-3.5-flash";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: mealSystemPrompt }] },
      contents: [{ role: "user", parts: [{ text: mealPrompt(context.energy, context.symptoms) }, { inlineData: { mimeType, data: imageBase64 } }] }],
      generationConfig: { responseMimeType: "application/json" }
    })
  });
  const result: unknown = await response.json();
  if (!response.ok) {
    console.error("Gemini meal analysis error", result);
    throw new Error("Gemini meal analysis is unavailable");
  }
  return { result, outputText: readGeminiOutputText(result) };
}

async function analyzeWithOpenAi(apiKey: string, mimeType: string, imageBase64: string, context: { energy?: number; symptoms?: string[] }) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_MEAL_MODEL ?? "gpt-4.1-mini",
      store: false,
      input: [
        { role: "system", content: mealSystemPrompt },
        { role: "user", content: [{ type: "input_text", text: mealPrompt(context.energy, context.symptoms) }, { type: "input_image", image_url: `data:${mimeType};base64,${imageBase64}`, detail: "high" }] }
      ],
      text: { format: { type: "json_schema", name: "mira_meal_analysis", strict: true, schema: mealAnalysisSchema } }
    })
  });
  const result: unknown = await response.json();
  if (!response.ok) {
    console.error("OpenAI meal analysis error", result);
    throw new Error("OpenAI meal analysis is unavailable");
  }
  return { result, outputText: readOutputText(result) };
}
