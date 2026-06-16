import type {
  BodyScanContext,
  BodyScanView,
  BodyVisionAnalysis
} from "../types";

type BodyAnalysisResponse = {
  analysis: BodyVisionAnalysis;
  source: "ai" | "demo";
};

export function createDemoBodyAnalysis(
  context: BodyScanContext,
  isFollowUp: boolean
): BodyVisionAnalysis {
  const painFocus =
    context.painAreas.length > 0
      ? `Учесть чувствительность: ${context.painAreas.join(", ")}.`
      : "Пользователь не отметил активную боль.";

  return {
    captureQuality: 92,
    observations: [
      "Все три ракурса сняты с сопоставимого расстояния.",
      "На фронтальном кадре заметна небольшая разница уровня плеч, которая может зависеть от стойки.",
      painFocus
    ],
    visibleIndicators: [
      {
        label: "Плечевой пояс",
        observation:
          "В спокойной стойке видна небольшая разница высоты плеч.",
        confidence: 0.72,
        caveat: "Это визуальный ориентир, а не вывод о состоянии позвоночника."
      },
      {
        label: "Контроль корпуса",
        observation:
          "Положение корпуса выглядит достаточно устойчивым во всех ракурсах.",
        confidence: 0.81,
        caveat: "Один статичный кадр не показывает качество движения."
      },
      {
        label: "Опора",
        observation:
          "Стойка выглядит немного неравномерной между сторонами.",
        confidence: 0.65,
        caveat: "На результат могут влиять ракурс камеры и перенос веса."
      }
    ],
    focusAreas: [
      "Стабильность корпуса",
      "Сила ягодиц",
      "Мягкая мобильность грудного отдела"
    ],
    trainingGuidance: {
      prioritize: [
        "Контролируемый темп",
        "Стабильные положения",
        "Симметричные движения"
      ],
      avoid:
        context.painLevel >= 5
          ? ["Резкие движения", "Работа через боль", "Предельная амплитуда"]
          : ["Работа через боль", "Рывковые повторения"],
      intensityNote:
        context.painLevel >= 5
          ? "Начать с низкой интенсивности и остановиться при усилении боли."
          : "Подойдёт умеренная нагрузка с запасом 2–3 повтора."
    },
    comparisonNote: isFollowUp
      ? "По сравнению с предыдущим scan стойка выглядит стабильнее, но одинаковые условия съёмки важны для честной динамики."
      : "Это baseline. Повтори scan через 14 дней в похожем свете и положении камеры."
  };
}

const wait = (milliseconds: number) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

export async function analyzeBodyPhotos(
  photos: Partial<Record<BodyScanView, File>>,
  context: BodyScanContext,
  isFollowUp: boolean
): Promise<BodyAnalysisResponse> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const hasAllPhotos = ["front", "side", "back"].every(
    (view) => photos[view as BodyScanView]
  );

  if (!supabaseUrl || !anonKey || !hasAllPhotos) {
    await wait(1400);
    return {
      analysis: createDemoBodyAnalysis(context, isFollowUp),
      source: "demo"
    };
  }

  const body = new FormData();
  (["front", "side", "back"] as BodyScanView[]).forEach((view) => {
    body.append(view, photos[view]!);
  });
  body.append("context", JSON.stringify(context));
  body.append("isFollowUp", String(isFollowUp));

  const response = await fetch(
    `${supabaseUrl}/functions/v1/analyze-body`,
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
    | { analysis: BodyVisionAnalysis }
    | { error?: string };

  if (!response.ok || !("analysis" in payload)) {
    throw new Error(
      "error" in payload && payload.error
        ? payload.error
        : "Не удалось проанализировать body scan"
    );
  }

  return { analysis: payload.analysis, source: "ai" };
}
