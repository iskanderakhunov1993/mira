import {
  createEnvelope,
  isMealAnalysisOutput,
  parseAnalyzeMealInput
} from "../../../shared/ai-contracts.ts";
import { jsonResponse, optionsResponse, recordAiRun } from "../_shared/ai-stub.ts";

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxImageBytes = 8 * 1024 * 1024;

const mealAnalysisSchema = {
  type: "object",
  additionalProperties: false,
  required: ["foods", "calories", "macros", "confidence", "uncertaintyFactors", "note"],
  properties: {
    foods: {
      type: "array",
      minItems: 1,
      maxItems: 10,
      items: { type: "string", minLength: 1, maxLength: 80 }
    },
    calories: {
      type: "object",
      additionalProperties: false,
      required: ["min", "max"],
      properties: {
        min: { type: "integer", minimum: 0, maximum: 5000 },
        max: { type: "integer", minimum: 0, maximum: 5000 }
      }
    },
    macros: {
      type: "object",
      additionalProperties: false,
      required: ["protein", "carbs", "fat"],
      properties: {
        protein: rangeSchema(),
        carbs: rangeSchema(),
        fat: rangeSchema()
      }
    },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    uncertaintyFactors: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: { type: "string", minLength: 1, maxLength: 120 }
    },
    note: { type: "string", minLength: 1, maxLength: 300 }
  }
};

function rangeSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["min", "max"],
    properties: {
      min: { type: "integer", minimum: 0, maximum: 500 },
      max: { type: "integer", minimum: 0, maximum: 500 }
    }
  };
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
  return btoa(binary);
}

function readOutputText(response: {
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
}) {
  return (response.output ?? [])
    .flatMap((item) => item.content ?? [])
    .filter((content) => content.type === "output_text")
    .map((content) => content.text ?? "")
    .join("");
}

async function getAuthenticatedUserId(request: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const authorization = request.headers.get("authorization");
  if (!supabaseUrl || !anonKey || !authorization) return null;

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: authorization, apikey: anonKey }
    });
    if (!response.ok) return null;
    const user = await response.json();
    return typeof user.id === "string" ? user.id : null;
  } catch {
    return null;
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return optionsResponse();
  if (request.method !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return jsonResponse(503, { error: "AI meal analysis is not configured" });

  try {
    const formData = await request.formData();
    const image = formData.get("image");
    if (!(image instanceof File)) return jsonResponse(400, { error: "Image is required" });
    if (!allowedImageTypes.has(image.type)) {
      return jsonResponse(415, { error: "Supported image formats: JPEG, PNG, WebP" });
    }
    if (image.size > maxImageBytes) return jsonResponse(413, { error: "Image must be smaller than 8 MB" });

    const contextRaw = formData.get("context");
    const contextValue = typeof contextRaw === "string" ? JSON.parse(contextRaw) : {};
    const parsed = parseAnalyzeMealInput(contextValue);
    if (!parsed.success) return jsonResponse(400, { error: parsed.error });

    const imageUrl = `data:${image.type};base64,${bytesToBase64(new Uint8Array(await image.arrayBuffer()))}`;
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: Deno.env.get("OPENAI_MEAL_MODEL") ?? "gpt-5.4-mini",
        store: false,
        reasoning: { effort: "low" },
        input: [
          {
            role: "system",
            content:
              "You analyze a single meal photo for Mira, a wellbeing app. Return only an approximate visual estimate, never exact nutrition facts. Identify visible foods conservatively. Give calorie and macro ranges wide enough to reflect uncertain portions, oils, sauces, hidden ingredients, and perspective. Never shame food, give dieting advice, diagnose health conditions, or claim the image proves what the person ate. Confidence reflects visual certainty, not nutritional truth. Do not describe the person's body. Respond in Russian."
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Analyze this meal photo. Self-reported energy: ${parsed.data.energy ?? "not provided"}/10. Symptoms: ${parsed.data.symptoms?.join(", ") || "not provided"}. Return an approximate meal estimate using the schema.`
              },
              { type: "input_image", image_url: imageUrl, detail: "high" }
            ]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "mira_meal_analysis",
            strict: true,
            schema: mealAnalysisSchema
          }
        }
      })
    });
    const result = await response.json();
    if (!response.ok) {
      console.error("OpenAI meal analysis error", result);
      return jsonResponse(502, { error: "AI meal analysis is temporarily unavailable" });
    }

    const outputText = readOutputText(result);
    if (!outputText) return jsonResponse(502, { error: "AI meal analysis returned no structured result" });
    const analysis: unknown = JSON.parse(outputText);
    if (!isMealAnalysisOutput(analysis)) {
      console.error("AI meal analysis did not match schema", analysis);
      return jsonResponse(502, { error: "AI meal analysis returned an invalid result" });
    }

    const envelope = createEnvelope("analyze-meal", analysis, "ai");
    await recordAiRun(envelope, await getAuthenticatedUserId(request));
    return jsonResponse(200, envelope);
  } catch (error) {
    console.error("Meal analysis failed", error);
    return jsonResponse(500, { error: "Could not analyze meal image" });
  }
});
