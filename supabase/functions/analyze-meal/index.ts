const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const jsonHeaders = {
  ...corsHeaders,
  "Content-Type": "application/json"
};

const allowedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp"
]);

const nutritionRangeSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    min: { type: "number", minimum: 0 },
    max: { type: "number", minimum: 0 }
  },
  required: ["min", "max"]
};

const mealAnalysisSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    isFood: { type: "boolean" },
    dishName: { type: "string" },
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          estimatedPortion: { type: "string" },
          confidence: { type: "number", minimum: 0, maximum: 1 }
        },
        required: ["name", "estimatedPortion", "confidence"]
      }
    },
    calories: nutritionRangeSchema,
    macrosG: {
      type: "object",
      additionalProperties: false,
      properties: {
        protein: nutritionRangeSchema,
        carbs: nutritionRangeSchema,
        fat: nutritionRangeSchema
      },
      required: ["protein", "carbs", "fat"]
    },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    uncertainFactors: {
      type: "array",
      items: { type: "string" }
    },
    followUpQuestion: {
      anyOf: [{ type: "string" }, { type: "null" }]
    },
    notes: { type: "string" }
  },
  required: [
    "isFood",
    "dishName",
    "items",
    "calories",
    "macrosG",
    "confidence",
    "uncertainFactors",
    "followUpQuestion",
    "notes"
  ]
};

function respond(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: jsonHeaders
  });
}

function bytesToBase64(bytes: Uint8Array) {
  const chunkSize = 0x8000;
  let binary = "";

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, offset + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function readOutputText(response: {
  output?: Array<{
    content?: Array<{ type?: string; text?: string }>;
  }>;
}) {
  return (response.output ?? [])
    .flatMap((item) => item.content ?? [])
    .filter((content) => content.type === "output_text")
    .map((content) => content.text ?? "")
    .join("");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return respond(405, { error: "Method not allowed" });
  }

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    return respond(500, { error: "OPENAI_API_KEY is not configured" });
  }

  try {
    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File)) {
      return respond(400, { error: "Добавьте фотографию блюда" });
    }

    if (!allowedImageTypes.has(image.type)) {
      return respond(415, {
        error: "Поддерживаются изображения JPEG, PNG и WebP"
      });
    }

    if (image.size > 8 * 1024 * 1024) {
      return respond(413, { error: "Фото должно быть меньше 8 МБ" });
    }

    const imageBytes = new Uint8Array(await image.arrayBuffer());
    const imageUrl = `data:${image.type};base64,${bytesToBase64(imageBytes)}`;

    const openAIResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-5.4-mini",
        store: false,
        reasoning: { effort: "low" },
        input: [
          {
            role: "system",
            content:
              "You are Ayla's food photo estimator. Return only the requested structured data. Estimate visible food conservatively and use ranges. Never imply laboratory precision. Account for uncertainty from oil, sauces, preparation method, hidden ingredients, and portion scale. If the image is not food, set isFood=false, use zero ranges, and explain briefly. Respond in Russian. Do not provide medical advice."
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text:
                  "Analyze this meal photo. Identify visible components, estimate portions, calories and protein/carbohydrate/fat ranges, then state confidence and the most important uncertainties. Ask at most one short follow-up question only when it would materially improve the estimate."
              },
              {
                type: "input_image",
                image_url: imageUrl,
                detail: "high"
              }
            ]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "meal_analysis",
            strict: true,
            schema: mealAnalysisSchema
          }
        }
      })
    });

    const openAIResult = await openAIResponse.json();

    if (!openAIResponse.ok) {
      console.error("OpenAI error", openAIResult);
      return respond(502, { error: "AI-сервис временно недоступен" });
    }

    const outputText = readOutputText(openAIResult);
    if (!outputText) {
      return respond(502, { error: "AI не вернул результат анализа" });
    }

    return respond(200, { analysis: JSON.parse(outputText) });
  } catch (error) {
    console.error("Meal analysis failed", error);
    return respond(500, { error: "Не удалось обработать фотографию" });
  }
});
