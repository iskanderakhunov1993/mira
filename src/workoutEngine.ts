export type WorkoutLevel = 'rest' | 'recovery' | 'light' | 'moderate';
export type WorkoutStatus = 'planned' | 'in_progress' | 'completed' | 'skipped';
export type WorkoutFeedback = 'easy' | 'right' | 'hard';

export type WorkoutExercise = {
  id: string;
  title: string;
  amount: string;
  note: string;
};

export type WorkoutSnapshot = {
  cycleDay?: number;
  period?: 'none' | 'light' | 'medium' | 'heavy';
  rating?: number;
  energy?: number;
  sleepHours?: number;
  sleepQuality?: 'Плохое' | 'Обычное' | 'Хорошее';
  maxSymptomSeverity: number;
  symptomsAffectLife: boolean;
};

export type AuraWorkoutLog = {
  id: string;
  date: string;
  generatedAt: string;
  level: WorkoutLevel;
  title: string;
  durationMin: number;
  intensityLabel: string;
  reasons: string[];
  exercises: WorkoutExercise[];
  safety: 'standard' | 'caution' | 'rest';
  status: WorkoutStatus;
  startedAt?: string;
  completedAt?: string;
  feedback?: WorkoutFeedback;
  snapshot: WorkoutSnapshot;
};

export type WorkoutContext = Omit<WorkoutSnapshot, 'maxSymptomSeverity' | 'symptomsAffectLife'> & {
  date: string;
  symptoms: Array<{ id: string; severity: 1 | 2 | 3; affectsLife: boolean }>;
};

const plans: Record<WorkoutLevel, Pick<AuraWorkoutLog, 'title' | 'durationMin' | 'intensityLabel' | 'exercises' | 'safety'>> = {
  rest: {
    title: 'Сегодня лучше восстановиться',
    durationMin: 5,
    intensityLabel: 'Без нагрузки',
    safety: 'rest',
    exercises: [
      { id: 'comfortable-position', title: 'Удобное положение', amount: '1 минута', note: 'Лягте или сядьте так, чтобы ничего не усиливало боль.' },
      { id: 'calm-breathing', title: 'Спокойное дыхание', amount: '3 минуты', note: 'Медленный вдох и более длинный выдох, без задержки дыхания.' },
      { id: 'body-check', title: 'Проверка самочувствия', amount: '1 минута', note: 'Если боль сильная или нарастает, тренировку не начинайте.' },
    ],
  },
  recovery: {
    title: 'Мягкое восстановление',
    durationMin: 8,
    intensityLabel: 'Очень легко',
    safety: 'caution',
    exercises: [
      { id: 'breathing', title: 'Дыхание без напряжения', amount: '2 минуты', note: 'Плечи расслаблены, выдох чуть длиннее вдоха.' },
      { id: 'shoulder-circles', title: 'Круги плечами', amount: '1 минута', note: 'Медленно, в комфортной амплитуде.' },
      { id: 'pelvic-tilt', title: 'Мягкие наклоны таза лёжа', amount: '2 минуты', note: 'Без сильного напряжения живота и без боли.' },
      { id: 'easy-mobility', title: 'Спокойная подвижность', amount: '2 минуты', note: 'Потянитесь вверх и мягко перенесите вес с ноги на ногу.' },
      { id: 'finish-breathing', title: 'Завершение дыханием', amount: '1 минута', note: 'Остановитесь раньше, если стало хуже.' },
    ],
  },
  light: {
    title: 'Лёгкая тренировка без оборудования',
    durationMin: 12,
    intensityLabel: 'Легко',
    safety: 'standard',
    exercises: [
      { id: 'warmup', title: 'Разминка суставов', amount: '2 минуты', note: 'Плечи, стопы и спокойные повороты корпуса.' },
      { id: 'march', title: 'Ходьба на месте', amount: '4 минуты', note: 'Темп позволяет говорить полными фразами.' },
      { id: 'chair-squat', title: 'Приседания к стулу', amount: '2 × 8', note: 'Коснитесь стула и встаньте, держась за опору при необходимости.' },
      { id: 'wall-push', title: 'Отжимания от стены', amount: '2 × 8', note: 'Корпус ровный, движения без рывков.' },
      { id: 'cooldown', title: 'Спокойная заминка', amount: '2 минуты', note: 'Дыхание и мягкое вытяжение икр и спины.' },
    ],
  },
  moderate: {
    title: 'Тренировка всего тела',
    durationMin: 20,
    intensityLabel: 'Умеренно',
    safety: 'standard',
    exercises: [
      { id: 'warmup', title: 'Динамическая разминка', amount: '3 минуты', note: 'Ходьба на месте, плечи и тазобедренные суставы.' },
      { id: 'chair-squat', title: 'Приседания к стулу', amount: '3 × 10', note: 'Контролируйте опускание, колени направлены вперёд.' },
      { id: 'wall-push', title: 'Отжимания от стены', amount: '3 × 10', note: 'Оставляйте 2–3 повтора в запасе.' },
      { id: 'glute-bridge', title: 'Ягодичный мост', amount: '3 × 10', note: 'Поднимайте таз без прогиба в пояснице.' },
      { id: 'bird-dog', title: 'Рука и нога на четвереньках', amount: '2 × 6 на сторону', note: 'Двигайтесь медленно и сохраняйте устойчивость.' },
      { id: 'cooldown', title: 'Заминка', amount: '3 минуты', note: 'Снизьте темп и восстановите спокойное дыхание.' },
    ],
  },
};

const unique = (values: string[]) => [...new Set(values)].slice(0, 4);

export function chooseWorkoutLevel(context: WorkoutContext): { level: WorkoutLevel; reasons: string[] } {
  const maxSymptomSeverity = context.symptoms.reduce((max, item) => Math.max(max, item.severity), 0);
  const symptomsAffectLife = context.symptoms.some((item) => item.affectsLife);
  const severePain = context.symptoms.some((item) => ['pain', 'back', 'back-pain', 'joint-pain'].includes(item.id) && item.severity === 3);
  const severeSymptom = maxSymptomSeverity === 3;
  const veryLowReadiness = context.energy === 1 || context.rating === 1 || (context.sleepHours !== undefined && context.sleepHours > 0 && context.sleepHours < 4.5);

  if (severeSymptom || symptomsAffectLife || veryLowReadiness) {
    return {
      level: 'rest',
      reasons: unique([
        severePain || symptomsAffectLife ? 'Сегодня отмечена сильная или мешающая обычным делам боль.' : '',
        severeSymptom && !severePain ? 'Сегодня отмечен сильный симптом — нагрузку лучше отложить.' : '',
        context.energy === 1 ? 'Энергия отмечена как очень низкая.' : '',
        context.rating === 1 ? 'Общее состояние отмечено как очень тяжёлое.' : '',
        context.sleepHours !== undefined && context.sleepHours > 0 && context.sleepHours < 4.5 ? 'Сна было меньше 4,5 часа.' : '',
      ].filter(Boolean)),
    };
  }

  const recoverySignals = [
    context.energy !== undefined && context.energy <= 2,
    context.rating !== undefined && context.rating <= 2,
    context.sleepQuality === 'Плохое',
    context.sleepHours !== undefined && context.sleepHours > 0 && context.sleepHours < 6,
    context.period === 'heavy',
    maxSymptomSeverity >= 2,
  ];
  if (recoverySignals.some(Boolean)) {
    return {
      level: 'recovery',
      reasons: unique([
        context.energy !== undefined && context.energy <= 2 ? 'Сегодня мало энергии.' : '',
        context.rating !== undefined && context.rating <= 2 ? 'Самочувствие ниже обычного.' : '',
        context.sleepQuality === 'Плохое' || (context.sleepHours !== undefined && context.sleepHours > 0 && context.sleepHours < 6) ? 'Сон мог не дать полного восстановления.' : '',
        context.period === 'heavy' ? 'Отмечены обильные месячные.' : '',
        maxSymptomSeverity >= 2 ? 'Есть симптомы средней выраженности.' : '',
      ].filter(Boolean)),
    };
  }

  const hasEnoughPositiveData = (context.energy ?? 0) >= 4
    && (context.rating ?? 0) >= 4
    && ((context.sleepHours ?? 0) >= 7 || context.sleepQuality === 'Хорошее')
    && maxSymptomSeverity === 0;

  if (hasEnoughPositiveData) {
    return {
      level: 'moderate',
      reasons: ['Энергия и общее состояние отмечены как хорошие.', 'Сон выглядит достаточным для умеренной нагрузки.'],
    };
  }

  return {
    level: 'light',
    reasons: unique([
      context.cycleDay ? `Сегодня ${context.cycleDay}-й день цикла — это только календарный контекст.` : 'Пока мало данных о цикле.',
      context.period && context.period !== 'none' ? 'Месячные отмечены, поэтому выбран лёгкий темп.' : '',
      context.energy === undefined || context.rating === undefined ? 'Не все отметки заполнены — выбран безопасный лёгкий вариант.' : 'Текущее состояние подходит для лёгкого движения.',
    ].filter(Boolean)),
  };
}

export function generateWorkout(context: WorkoutContext, generatedAt = new Date().toISOString()): AuraWorkoutLog {
  const decision = chooseWorkoutLevel(context);
  const plan = plans[decision.level];
  const maxSymptomSeverity = context.symptoms.reduce((max, item) => Math.max(max, item.severity), 0);
  return {
    id: `workout-${context.date}-${generatedAt.slice(11, 19).replace(/:/g, '')}`,
    date: context.date,
    generatedAt,
    level: decision.level,
    title: plan.title,
    durationMin: plan.durationMin,
    intensityLabel: plan.intensityLabel,
    reasons: decision.reasons,
    exercises: plan.exercises.map((item) => ({ ...item })),
    safety: plan.safety,
    status: 'planned',
    snapshot: {
      cycleDay: context.cycleDay,
      period: context.period,
      rating: context.rating,
      energy: context.energy,
      sleepHours: context.sleepHours,
      sleepQuality: context.sleepQuality,
      maxSymptomSeverity,
      symptomsAffectLife: context.symptoms.some((item) => item.affectsLife),
    },
  };
}
