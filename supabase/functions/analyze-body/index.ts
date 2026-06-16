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

const stringArray = {
  type: "array",
  items: { type: "string" }
};

const bodyAnalysisSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    captureQuality: { type: "number", minimum: 0, maximum: 100 },
    observations: stringArray,
    visibleIndicators: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          label: { type: "string" },
          observation: { type: "string" },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          caveat: { type: "string" }
        },
        required: ["label", "observation", "confidence", "caveat"]
      }
    },
    focusAreas: stringArray,
    trainingGuidance: {
      type: "object",
      additionalProperties: false,
      properties: {
        prioritize: stringArray,
        avoid: stringArray,
        intensityNote: { type: "string" }
      },
      required: ["prioritize", "avoid", "intensityNote"]
    },
    comparisonNote: { type: "string" }
  },
  required: [
    "captureQuality",
    "observations",
    "visibleIndicators",
    "focusAreas",
    "trainingGuidance",
    "comparisonNote"
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
    binary += String.fromCharCode(
      ...bytes.subarray(offset, offset + chunkSize)
    );
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
    const views = ["front", "side", "back"] as const;
    const images: File[] = [];

    for (const view of views) {
      const image = formData.get(view);
      if (!(image instanceof File)) {
        return respond(400, { error: `Не найден ракурс: ${view}` });
      }
      if (!allowedImageTypes.has(image.type)) {
        return respond(415, {
          error: "Поддерживаются изображения JPEG, PNG и WebP"
        });
      }
      if (image.size > 8 * 1024 * 1024) {
        return respond(413, { error: "Каждое фото должно быть меньше 8 МБ" });
      }
      images.push(image);
    }

    const contextRaw = formData.get("context");
    const context =
      typeof contextRaw === "string"
        ? JSON.parse(contextRaw)
        : { goal: "", painAreas: [], painLevel: 0 };
    const isFollowUp = formData.get("isFollowUp") === "true";

    const imageContent = await Promise.all(
      images.map(async (image) => ({
        type: "input_image",
        image_url: `data:${image.type};base64,${bytesToBase64(
          new Uint8Array(await image.arrayBuffer())
        )}`,
        detail: "high"
      }))
    );

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
              "You are Ayla's body-aware fitness observation assistant. Analyze three full-body photos only for neutral, visible fitness indicators and capture quality. Never classify the person as thin, fat, attractive, healthy, unhealthy, normal, or abnormal. Never estimate weight, BMI, body-fat percentage, age, pregnancy, disease, scoliosis, spinal curvature, injury, or any medical condition from images. Do not diagnose posture. Describe possible visual asymmetries as low-confidence observations that may result from stance, clothing, camera angle, or lighting. User-reported pain is context, not something visible in the image. Give conservative training guidance, never recommend exercising through pain, and recommend professional evaluation for severe or worsening pain. Respond in Russian."
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `The images are front, side, and back in that order. Goal: ${
                  context.goal || "not provided"
                }. Self-reported pain areas: ${
                  context.painAreas?.join(", ") || "none"
                }. Pain level 0-10: ${
                  context.painLevel ?? 0
                }. Follow-up scan: ${isFollowUp}. Evaluate image comparability, neutral visible indicators, useful training focus, movements to prioritize or avoid, and a cautious comparison note.`
              },
              ...imageContent
            ]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "body_scan_analysis",
            strict: true,
            schema: bodyAnalysisSchema
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
    console.error("Body analysis failed", error);
    return respond(500, { error: "Не удалось обработать body scan" });
  }
});
