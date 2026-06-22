import { NextResponse } from "next/server";
import {
  createDemoMealAnalysis,
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

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
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
    if (!(image instanceof File)) return NextResponse.json({ error: "Нужно выбрать фото блюда." }, { status: 400 });
    if (!allowedImageTypes.has(image.type)) {
      return NextResponse.json({ error: "Поддерживаются JPEG, PNG и WebP." }, { status: 415 });
    }
    if (image.size > maxImageBytes) return NextResponse.json({ error: "Фото должно быть меньше 8 МБ." }, { status: 413 });

    const contextRaw = formData.get("context");
    const context = typeof contextRaw === "string" ? JSON.parse(contextRaw) : {};
    const parsed = parseAnalyzeMealInput(context);
    if (!parsed.success) return NextResponse.json({ error: "Контекст фото некорректен." }, { status: 400 });

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MEAL_MODEL ?? "gpt-4.1-mini",
        store: false,
        input: [
          {
            role: "system",
            content: "You analyze a single meal photo for Mira, a wellbeing app. Return only an approximate visual estimate, never exact nutrition facts. Identify visible foods conservatively. Give calorie and macro ranges wide enough to reflect uncertain portions, oils, sauces, hidden ingredients, and perspective. Never shame food, give dieting advice, diagnose health conditions, or claim the image proves what the person ate. Confidence reflects visual certainty, not nutritional truth. Do not describe the person's body. Respond in Russian."
          },
          {
            role: "user",
            content: [
              { type: "input_text", text: `Analyze this meal photo. Self-reported energy: ${parsed.data.energy ?? "not provided"}/10. Symptoms: ${parsed.data.symptoms?.join(", ") || "not provided"}. Return an approximate meal estimate using the schema.` },
              { type: "input_image", image_url: `data:${image.type};base64,${Buffer.from(await image.arrayBuffer()).toString("base64")}`, detail: "high" }
            ]
          }
        ],
        text: { format: { type: "json_schema", name: "mira_meal_analysis", strict: true, schema: mealAnalysisSchema } }
      })
    });

    const result: unknown = await response.json();
    if (!response.ok) {
      console.error("OpenAI meal analysis error", result);
      return NextResponse.json({ error: "AI-сервис временно недоступен. Попробуй чуть позже." }, { status: 502 });
    }

    const outputText = readOutputText(result);
    const analysis: unknown = outputText ? JSON.parse(outputText) : null;
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
