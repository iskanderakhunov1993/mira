import type {
  BodyScanResult,
  Exercise,
  ReadinessInput,
  UserProfile
} from "../types";

export function calculateReadiness(input: ReadinessInput) {
  const recovery = 10 - input.soreness;
  return Math.round(
    ((input.sleep * 0.35 +
      input.energy * 0.3 +
      input.mood * 0.2 +
      recovery * 0.15) /
      10) *
      100
  );
}

export function getCoachDecision(readiness: number) {
  if (readiness >= 80) {
    return {
      mode: "Силовая тренировка",
      duration: 42,
      intensity: "Умеренно высокая",
      insight:
        "Тело хорошо восстановилось. Сегодня можно постепенно увеличить нагрузку, сохраняя 2 повтора в запасе."
    };
  }

  if (readiness >= 60) {
    return {
      mode: "Мягкая сила + mobility",
      duration: 32,
      intensity: "Умеренная",
      insight:
        "Ресурс немного ниже обычного. Сохраним тренировочный ритм, но снизим объем и добавим больше восстановления."
    };
  }

  return {
    mode: "Recovery flow",
    duration: 20,
    intensity: "Низкая",
    insight:
      "Сегодня телу полезнее восстановление. Сделаем mobility, дыхание и спокойную прогулку без давления на результат."
  };
}

type WorkoutPlan = {
  mode: string;
  duration: number;
  rationale: string;
  signals: string[];
  exercises: Exercise[];
};

const exercise = (
  id: number,
  name: string,
  focus: string,
  prescription: string,
  rest: string,
  cue: string
): Exercise => ({
  id,
  name,
  focus,
  prescription,
  rest,
  cue,
  completed: false,
  skipped: false
});

export function buildPersonalizedWorkout(
  profile: UserProfile,
  scan: BodyScanResult | undefined,
  readiness: number
): WorkoutPlan {
  const concerns = new Set([
    ...profile.limitations,
    ...(scan?.painAreas ?? [])
  ]);
  const highPain = (scan?.painLevel ?? 0) >= 7;
  const lowerBackSensitive = concerns.has("Поясница");
  const kneeSensitive = concerns.has("Колени");
  const upperBodySensitive =
    concerns.has("Плечи") || concerns.has("Шея");

  if (highPain) {
    return {
      mode: "Recovery check-in",
      duration: 16,
      rationale:
        "Ты отметила сильную боль. Сегодня Ayla не предлагает силовую нагрузку: только спокойное дыхание и движения без боли. При новой или усиливающейся боли лучше обратиться к специалисту.",
      signals: [
        `Боль ${scan?.painLevel}/10`,
        "Без силовой нагрузки",
        "Только комфортная амплитуда"
      ],
      exercises: [
        exercise(
          1,
          "Спокойное дыхание лёжа",
          "Восстановление",
          "3 × 5 дыханий",
          "30 сек",
          "Дыши свободно. Остановись, если положение усиливает боль."
        ),
        exercise(
          2,
          "Мягкие движения стоп",
          "Кровообращение · без нагрузки",
          "2 × 12",
          "30 сек",
          "Двигайся медленно и только в безболезненной амплитуде."
        ),
        exercise(
          3,
          "Неспешная прогулка",
          "Лёгкая активность",
          "5–10 минут",
          "по самочувствию",
          "Сохраняй разговорный темп и остановись при усилении симптомов."
        )
      ]
    };
  }

  const exercises: Exercise[] = [
    exercise(
      1,
      "Дыхание 90/90",
      "Корпус · восстановление",
      "2 × 6 дыханий",
      "30 сек",
      "Выдох длиннее вдоха, не создавай давление через боль."
    ),
    exercise(
      2,
      lowerBackSensitive ? "Dead bug с короткой амплитудой" : "Ягодичный мост",
      lowerBackSensitive
        ? "Корпус · контроль поясницы"
        : "Ягодицы · задняя линия",
      "3 × 10",
      "45 сек",
      lowerBackSensitive
        ? "Двигай только одной конечностью и сохраняй спокойное дыхание."
        : "Поднимай таз до комфортной высоты без переразгибания поясницы."
    ),
    exercise(
      3,
      upperBodySensitive
        ? "Тяга ленты нейтральным хватом"
        : "Тяга верхнего блока",
      "Спина · контроль плеч",
      "3 × 10",
      "60 сек",
      upperBodySensitive
        ? "Держи плечи расслабленными и уменьши натяжение при дискомфорте."
        : "Опусти плечи и веди локти к рёбрам без рывка."
    ),
    exercise(
      4,
      kneeSensitive ? "Отведение бедра с лентой" : "Сплит-присед с опорой",
      kneeSensitive
        ? "Ягодицы · без глубокой нагрузки на колено"
        : "Ноги · стабильность",
      kneeSensitive ? "3 × 12 / сторона" : "3 × 8 / сторона",
      "60 сек",
      kneeSensitive
        ? "Сохраняй таз стабильным и не заваливай корпус."
        : "Используй опору и двигайся только в комфортной амплитуде."
    )
  ];

  const intensity =
    readiness >= 80
      ? "умеренную нагрузку"
      : readiness >= 60
        ? "мягкую умеренную нагрузку"
        : "низкую нагрузку";
  const scanFocus = scan?.focusAreas.slice(0, 2).join(" и ");

  return {
    mode:
      readiness < 60
        ? "Recovery flow + stability"
        : "Персональная сила + mobility",
    duration: readiness >= 80 ? 40 : readiness >= 60 ? 32 : 22,
    rationale: scan
      ? `План использует body scan: фокус на ${scanFocus}. Выбрала ${intensity} и учла отмеченные зоны: ${
          concerns.size > 0 ? [...concerns].join(", ") : "без ограничений"
        }.`
      : `План опирается на цель «${profile.goal}» и готовность ${readiness}/100. После body scan Ayla сможет точнее подобрать фокус и варианты упражнений.`,
    signals: [
      `Цель: ${profile.goal}`,
      `Готовность ${readiness}`,
      scan ? `Body scan ${scan.source === "ai" ? "AI" : "demo"}` : "Без body scan",
      scan?.painAreas.length
        ? `Бережно: ${scan.painAreas.join(", ")}`
        : "Активная боль не указана"
    ],
    exercises
  };
}
