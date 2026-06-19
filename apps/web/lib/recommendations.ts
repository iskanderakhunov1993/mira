export type OnboardingState = {
  goal: string;
  periodStart: string;
  cycleLength: number;
  cycleRegularity: "Регулярный" | "Нерегулярный";
  trainingPlace: "Зал" | "Дом";
  level: "Новичок" | "Средний" | "Продвинутый";
  workoutsPerWeek: number;
  sleepQuality: "Плохо" | "Нормально" | "Хорошо";
  stressLevel: number;
  activityLevel: "Низкая" | "Средняя" | "Высокая";
};

export type CheckInState = {
  energy: number;
  sleep: "Плохо" | "Нормально" | "Хорошо";
  stress: number;
  mood: number;
  painLevel: number;
  painAreas: string[];
  workload: "Лёгкая" | "Обычная" | "Высокая";
  symptoms: string[];
  note: string;
};

export type ResourceToday = {
  level: "низкий" | "средний" | "высокий";
  score: number;
  factors: string[];
};

export type GymState = {
  energy: "Много энергии" | "Нормально" | "Устала";
  time: "12 мин" | "25 мин" | "40 мин";
  goal: "Ноги и ягодицы" | "Всё тело" | "Мягкое кардио" | "Просто подвигаться";
};

export type WorkoutExercise = {
  name: string;
  prescription: string;
  rest: string;
  cue: string;
};

export function getCycleDay(periodStart: string, cycleLength: number) {
  if (!periodStart) return 18;
  const start = new Date(periodStart);
  const today = new Date();
  const days = Math.max(
    0,
    Math.floor((today.getTime() - start.getTime()) / 86400000)
  );
  return (days % cycleLength) + 1;
}

export function getCyclePhase(cycleDay: number) {
  if (cycleDay <= 5) return "Менструальная";
  if (cycleDay <= 12) return "Фолликулярная";
  if (cycleDay <= 16) return "Овуляторная";
  if (cycleDay <= 24) return "Лютеиновая";
  return "Поздняя лютеиновая";
}

export function getResourceToday(checkIn: CheckInState): ResourceToday {
  const sleepScore = checkIn.sleep === "Хорошо" ? 3 : checkIn.sleep === "Нормально" ? 2 : 1;
  const moodScore = Math.max(1, Math.round(checkIn.mood / 5));
  const workloadPenalty = checkIn.workload === "Высокая" ? 2 : checkIn.workload === "Обычная" ? 1 : 0;
  const score = checkIn.energy + sleepScore + moodScore - Math.max(0, checkIn.stress - 5) - workloadPenalty - Math.ceil(checkIn.painLevel / 3);
  const factors = [
    `Сон: ${checkIn.sleep.toLowerCase()}`,
    `Энергия: ${checkIn.energy}/10`,
    `Настроение: ${checkIn.mood}/10`,
    checkIn.painLevel ? `Боль: ${checkIn.painLevel}/10` : "Боль: не отмечена",
    `Работа: ${checkIn.workload.toLowerCase()}`,
    checkIn.symptoms.length ? `Симптомы: ${checkIn.symptoms.join(", ")}` : "Симптомы: не отмечены"
  ];

  return {
    level: score <= 6 ? "низкий" : score >= 10 ? "высокий" : "средний",
    score,
    factors
  };
}

export function buildDailyPlan(
  profile: OnboardingState,
  checkIn: CheckInState
) {
  const cycleDay = getCycleDay(profile.periodStart, profile.cycleLength);
  const phase = getCyclePhase(cycleDay);
  const lowRecovery =
    checkIn.energy <= 4 ||
    checkIn.stress >= 7 ||
    checkIn.sleep === "Плохо" ||
    checkIn.painLevel > 0 ||
    checkIn.symptoms.includes("спазмы") ||
    checkIn.symptoms.includes("усталость");

  const movement = checkIn.painLevel > 0
    ? {
        title: "Пауза в нагрузке + комфортное движение",
        detail: "Без тренировки через боль",
        reason:
          "Ты отметила боль или заметный дискомфорт. Сегодня лучше выбрать только комфортные движения и остановиться, если ощущения усиливаются."
      }
    : lowRecovery
    ? {
        title: "Мягкая силовая + мобильность",
        detail: "22 мин, низкая нагрузка",
        reason:
          "Сегодня тело может лучше откликнуться на спокойное движение и более ровное дыхание."
      }
    : phase === "Фолликулярная" || phase === "Овуляторная"
      ? {
          title: "Постепенная силовая тренировка",
          detail: "38 мин, средняя интенсивность",
          reason:
            "В этой фазе цикла энергии часто бывает больше, поэтому силовая нагрузка может ощущаться поддерживающе."
        }
      : {
          title: "Умеренное кардио",
          detail: "25 мин, легко-средне",
          reason:
            "Более плавный темп может поддержать энергию без лишнего стресса для тела."
        };

  const nutrition = checkIn.symptoms.includes("тяга")
    ? {
        title: "Добавь белок раньше",
        detail: "Сделай завтрак более белковым",
        reason:
          "Белок может помочь стабилизировать энергию и мягче пройти тягу к быстрым перекусам."
      }
    : {
        title: "Вода + сбалансированная тарелка",
        detail: "Вода, белок, клетчатка",
        reason:
          "Сегодня базовые вещи выглядят как самая полезная поддержка для тела."
      };

  const recovery = checkIn.stress >= 7
    ? {
        title: "10 минут замедления",
        detail: "Дыхание или спокойная прогулка",
        reason:
          "Стресс выглядит повышенным, поэтому короткая пауза для нервной системы может помочь перед тренировкой."
      }
    : {
        title: "Сохрани вечернее восстановление",
        detail: "Меньше света, спокойнее темп",
        reason:
          "Лучшее восстановление вечером может сделать завтрашнее движение более естественным."
      };

  return { cycleDay, phase, movement, nutrition, recovery };
}

export function buildWorkout(
  profile: OnboardingState,
  checkIn: CheckInState,
  gym: GymState
) {
  const plan = buildDailyPlan(profile, checkIn);
  const highPain = checkIn.painLevel >= 5;
  const tired = gym.energy === "Устала" || checkIn.energy <= 4 || checkIn.painLevel > 0;

  if (highPain) {
    return {
      title: "Восстановление без силовой нагрузки",
      time: gym.time,
      intensity: "Низкая",
      explanation:
        "Ты отметила заметную боль. Сегодня Mira предлагает только комфортное движение и паузу от силовой нагрузки. Остановись, если ощущения усиливаются.",
      warmup: "2 минуты спокойного дыхания в удобном положении",
      exercises: [
        {
          name: "Мягкие движения стоп",
          prescription: "2 × 8-10",
          rest: "30 сек",
          cue: "Двигайся медленно и только в комфортной амплитуде."
        },
        {
          name: "Неспешная прогулка",
          prescription: "5-10 минут",
          rest: "По самочувствию",
          cue: "Сохраняй разговорный темп и остановись при усилении боли."
        }
      ],
      cooldown: "Спокойный выдох и отдых"
    };
  }

  const intensity = tired
    ? "Низко-средняя"
    : gym.energy === "Много энергии"
      ? "Средне-высокая"
      : "Средняя";
  const title =
    gym.goal === "Ноги и ягодицы"
      ? "Силовая на низ тела"
      : gym.goal === "Мягкое кардио"
        ? "Низкоударное кардио"
        : gym.goal === "Всё тело"
          ? "Тонус всего тела"
          : "Мягкая перезагрузка движением";

  const exercises: WorkoutExercise[] =
    gym.goal === "Ноги и ягодицы"
      ? [
          { name: "Ягодичный мост в тренажёре", prescription: "3 × 10", rest: "60 сек", cue: "Поднимай таз до комфортной высоты без переразгибания." },
          { name: "Жим ногами", prescription: "3 × 10", rest: "75 сек", cue: "Сохраняй устойчивую опору и работай без дискомфорта в коленях." },
          { name: "Отведение ноги в кроссовере", prescription: "2 × 12 / сторона", rest: "45 сек", cue: "Держи корпус стабильным и двигайся плавно." },
          { name: "Сгибание ног сидя", prescription: "2 × 12", rest: "45 сек", cue: "Не спеши и сохраняй комфортную амплитуду." }
        ]
      : gym.goal === "Мягкое кардио"
        ? [
            { name: "Ходьба в наклоне", prescription: "6-12 минут", rest: "По самочувствию", cue: "Выбирай темп, при котором можно спокойно говорить." },
            { name: "Велосипед в ровном темпе", prescription: "5-8 минут", rest: "По самочувствию", cue: "Без рывков и гонки за скоростью." },
            { name: "Dead bug на корпус", prescription: "2 × 8 / сторона", rest: "45 сек", cue: "Двигайся медленно и сохраняй ровное дыхание." }
          ]
        : gym.goal === "Всё тело"
          ? [
              { name: "Тяга верхнего блока", prescription: "3 × 10", rest: "60 сек", cue: "Опусти плечи и веди локти к рёбрам без рывка." },
              { name: "Гоблет-присед", prescription: "3 × 8", rest: "60 сек", cue: "Остановись в комфортной глубине и держи опору устойчивой." },
              { name: "Жим в тренажёре", prescription: "2 × 10", rest: "60 сек", cue: "Сохраняй спокойное дыхание и не форсируй движение." },
              { name: "Тяга блока сидя", prescription: "2 × 10", rest: "60 сек", cue: "Двигай лопатки мягко, без напряжения в шее." }
            ]
          : [
              { name: "Ходьба на дорожке", prescription: "5-10 минут", rest: "По самочувствию", cue: "Выбирай комфортный разговорный темп." },
              { name: "Мобильность таза", prescription: "2 × 6 / сторона", rest: "30 сек", cue: "Двигайся без боли и не увеличивай амплитуду через усилие." },
              { name: "Лёгкая тяга блока", prescription: "2 × 10", rest: "45 сек", cue: "Сохраняй плечи расслабленными." },
              { name: "Мягкая растяжка", prescription: "3 минуты", rest: "По самочувствию", cue: "Не тянись через дискомфорт." }
            ];

  const exerciseCount = gym.time === "12 мин" ? 2 : gym.time === "25 мин" ? 3 : 4;

  return {
    title,
    time: gym.time,
    intensity,
    explanation: `С учётом восстановления и фазы цикла «${plan.phase.toLowerCase()}» эта тренировка держит нагрузку поддерживающей, без лишнего давления на тело.`,
    warmup: tired
      ? "6 мин спокойной ходьбы + мобильность"
      : "8 мин ходьбы в наклоне + активация",
    exercises: exercises.slice(0, exerciseCount),
    cooldown: "5 мин лёгкой ходьбы, длинные выдохи, расслабление таза и спины"
  };
}
