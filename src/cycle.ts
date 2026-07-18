import { addDays, daysBetween, isValidPastOrTodayIsoDate, parseIsoDate, todayIso, toIsoDate } from './data';
import type { AppState, DayEntry, Mood } from './types';

export const moodLabels: Record<Mood, string> = {
  great: 'Радостно',
  calm: 'Спокойно',
  sensitive: 'Чувствительно',
  tired: 'Устала',
  low: 'Грустно',
};

export const moodIcons: Record<Mood, string> = {
  great: '✨',
  calm: '🌿',
  sensitive: '🫶',
  tired: '🌙',
  low: '☁️',
};

export const quickSymptomOptions = [
  'Боль внизу живота',
  'Чувствительная грудь',
  'Головная боль',
  'Высыпания',
  'Боль в спине',
  'Усталость',
] as const;

export const symptomGroups = [
  {
    id: 'pain',
    title: 'Боль',
    description: 'Где ощущается боль',
    options: [
      'Боль внизу живота',
      'Боль в животе',
      'Боль в спине',
      'Головная боль',
      'Мигрень',
      'Чувствительная грудь',
      'Боль в суставах',
    ],
  },
  {
    id: 'energy',
    title: 'Энергия и сон',
    description: 'Изменения сил, внимания и сна',
    options: [
      'Усталость',
      'Мало энергии',
      'Сонливость',
      'Бессонница',
      'Забывчивость',
      'Головокружение',
    ],
  },
  {
    id: 'body',
    title: 'Кожа и тело',
    description: 'Другие заметные изменения',
    options: [
      'Высыпания',
      'Отёчность',
      'Повышенная температура',
      'Приливы',
      'Ночная потливость',
      'Жжение во рту',
      'Повышенный аппетит',
    ],
  },
  {
    id: 'intimate',
    title: 'Интимное самочувствие',
    description: 'Можно оставить пустым',
    options: [
      'Зуд во влагалище',
      'Жжение или раздражение',
      'Сухость влагалища',
      'Необычный запах',
      'Боль во время секса',
    ],
  },
  {
    id: 'urinary',
    title: 'Мочеиспускание',
    description: 'Только заметные изменения',
    options: [
      'Жжение при мочеиспускании',
      'Частые позывы к мочеиспусканию',
    ],
  },
] as const;

export const symptomOptions = symptomGroups.flatMap((group) => group.options);

export const detailedMoodOptions = [
  'Спокойствие',
  'Радость',
  'Много энергии',
  'Игривость',
  'Перепады настроения',
  'Раздражение',
  'Грусть',
  'Тревога',
  'Подавленность',
  'Апатия',
];

export const dischargeOptions = [
  'Нет выделений',
  'Кремообразные',
  'Водянистые',
  'Липкие',
  'Слизистые',
  'Кровянистые вне месячных',
  'Мажущие между месячными',
  'Кровотечение после секса',
  'Сгустки',
  'Белые, комковатые',
  'Серые',
  'Жёлтые или зелёные',
  'Выделения с необычным запахом',
];

export const digestionOptions = ['Тошнота', 'Рвота', 'Вздутие', 'Запор', 'Диарея', 'Снижение аппетита', 'Повышенный аппетит'];

export const contextOptions = [
  'Путешествие',
  'Стресс',
  'Медитация',
  'Дыхательные практики',
  'Болезнь или травма',
  'Алкоголь',
  'Гормональная терапия',
];

export type AnalyticsPeriodFilter = '3' | '6' | '12m' | 'all';
export type PeriodRange = { start: string; end: string; length: number };

export function getLastPeriodStart(periodDays: string[]): string | null {
  const sorted = periodDays.filter((date) => isValidPastOrTodayIsoDate(date)).sort();
  if (sorted.length === 0) return null;
  let currentStart = sorted[0];
  for (let index = 1; index < sorted.length; index += 1) {
    if (daysBetween(sorted[index - 1], sorted[index]) > 1) {
      currentStart = sorted[index];
    }
  }
  return currentStart;
}

export function getPeriodRanges(periodDays: string[]): PeriodRange[] {
  const sorted = periodDays.filter((date) => isValidPastOrTodayIsoDate(date)).sort();
  if (sorted.length === 0) return [];

  const ranges: PeriodRange[] = [];
  let start = sorted[0];
  let end = sorted[0];

  for (let index = 1; index < sorted.length; index += 1) {
    if (daysBetween(end, sorted[index]) === 1) {
      end = sorted[index];
    } else {
      ranges.push({ start, end, length: daysBetween(start, end) + 1 });
      start = sorted[index];
      end = sorted[index];
    }
  }

  ranges.push({ start, end, length: daysBetween(start, end) + 1 });
  return ranges;
}

export function filterPeriodRangesForAnalytics(ranges: PeriodRange[], filter: AnalyticsPeriodFilter, asOf = todayIso()): PeriodRange[] {
  if (filter === 'all') return ranges;
  if (filter === '12m') {
    const cutoff = addDays(asOf, -364);
    return ranges.filter((range) => range.start >= cutoff && range.start <= asOf);
  }
  return ranges.slice(-(Number(filter) + 1));
}

export function getSymptomSeveritySummary(entries: DayEntry[]) {
  const samples: Record<string, number[]> = {};
  for (const entry of entries) {
    for (const symptom of entry.symptoms) {
      const severity = entry.symptomSeverity?.[symptom];
      if (typeof severity !== 'number' || severity < 1 || severity > 3) continue;
      samples[symptom] = [...(samples[symptom] ?? []), severity];
    }
  }
  return Object.entries(samples)
    .map(([symptom, values]) => ({
      symptom,
      count: values.length,
      averageSeverity: values.reduce((sum, value) => sum + value, 0) / values.length,
    }))
    .sort((left, right) => right.count - left.count || right.averageSeverity - left.averageSeverity || left.symptom.localeCompare(right.symptom, 'ru-RU'));
}

export function getCycleStats(state: AppState) {
  const ranges = getPeriodRanges(state.periodDays);
  const cycleLengths = ranges
    .slice(1)
    .map((range, index) => daysBetween(ranges[index].start, range.start));
  const previousCycleLength =
    cycleLengths[cycleLengths.length - 1] ?? state.profile.cycleLength;
  const previousPeriodLength =
    ranges[ranges.length - 1]?.length ?? state.profile.periodLength;
  const minCycleLength = cycleLengths.length ? Math.min(...cycleLengths) : previousCycleLength;
  const maxCycleLength = cycleLengths.length ? Math.max(...cycleLengths) : previousCycleLength;

  return {
    ranges,
    cycleLengths,
    previousCycleLength,
    previousPeriodLength,
    minCycleLength,
    maxCycleLength,
    isCycleNormal: previousCycleLength >= 21 && previousCycleLength <= 35,
    isPeriodNormal: previousPeriodLength >= 2 && previousPeriodLength <= 8,
    isRegular: maxCycleLength - minCycleLength <= 7,
  };
}

export function getPredictedPeriodDays(state: AppState): string[] {
  const ranges = getPeriodRanges(state.periodDays);
  if (ranges.length === 0) return [];
  const lastStart = getLastPeriodStart(state.periodDays);
  if (!lastStart) return [];
  const cycleLengths = getCycleStats(state).cycleLengths;
  const recentLengths = cycleLengths.slice(-6).sort((left, right) => left - right);
  const middle = Math.floor(recentLengths.length / 2);
  const cycleLength = recentLengths.length === 0
    ? state.profile.cycleLength
    : recentLengths.length % 2
      ? recentLengths[middle]
      : Math.round((recentLengths[middle - 1] + recentLengths[middle]) / 2);
  if (!Number.isFinite(cycleLength) || cycleLength <= 0) return [];
  const today = todayIso();
  const nextStart = addDays(lastStart, cycleLength);
  if (nextStart < today) return [];
  return Array.from({ length: state.profile.periodLength }, (_, index) =>
    addDays(nextStart, index),
  );
}

export function getCycleDay(state: AppState, date = todayIso()): number | null {
  const lastStart = getLastPeriodStart(state.periodDays);
  if (!lastStart) return null;
  const diff = daysBetween(lastStart, date);
  if (diff < 0) return null;
  return diff + 1;
}

export function getCycleDelayDays(state: AppState, date = todayIso()): number | null {
  const lastStart = getLastPeriodStart(state.periodDays);
  if (!lastStart || getPeriodRanges(state.periodDays).length < 2) return null;
  const cycleLengths = getCycleStats(state).cycleLengths;
  const recentLengths = cycleLengths.slice(-6).sort((left, right) => left - right);
  const middle = Math.floor(recentLengths.length / 2);
  const expectedLength = recentLengths.length % 2
    ? recentLengths[middle]
    : Math.round((recentLengths[middle - 1] + recentLengths[middle]) / 2);
  return Math.max(0, daysBetween(addDays(lastStart, expectedLength), date));
}

export type HormonoscopePhase = {
  id: 'menstrual' | 'early-follicular' | 'late-follicular' | 'ovulatory' | 'early-luteal' | 'late-luteal';
  label: string;
  eyebrow: string;
  description: string;
  hormoneNote: string;
  support: string;
  progress: number;
  confidence: string;
};

export function getHormonoscope(state: AppState, date = todayIso()): HormonoscopePhase | null {
  if (state.profile.trackingMode === 'wellbeing-only') return null;
  const cycleDay = getCycleDay(state, date);
  if (!cycleDay) return null;

  const stats = getCycleStats(state);
  const recentLengths = stats.cycleLengths.slice(-6).sort((left, right) => left - right);
  const middle = Math.floor(recentLengths.length / 2);
  const expectedLength = recentLengths.length === 0
    ? state.profile.cycleLength
    : recentLengths.length % 2
      ? recentLengths[middle]
      : Math.round((recentLengths[middle - 1] + recentLengths[middle]) / 2);
  const periodLength = Math.max(2, Math.min(8, state.profile.periodLength));
  const estimatedOvulationDay = Math.max(periodLength + 2, expectedLength - 14);
  const progress = Math.max(4, Math.min(100, Math.round((cycleDay / Math.max(1, expectedLength)) * 100)));
  const confidence = stats.cycleLengths.length >= 3
    ? `Календарный ориентир по ${stats.cycleLengths.length} завершённым циклам`
    : 'Предварительный календарный ориентир';

  if (cycleDay <= periodLength) {
    return {
      id: 'menstrual',
      label: 'Менструальная фаза',
      eyebrow: `${cycleDay}-й день цикла`,
      description: 'Начался новый цикл. В это время уровни эстрогена и прогестерона обычно находятся на низком уровне.',
      hormoneNote: 'Эстроген и прогестерон обычно низкие',
      support: 'Можно отметить интенсивность, боль, энергию и то, как симптомы влияют на обычные дела.',
      progress,
      confidence,
    };
  }

  const follicularMidpoint = periodLength + Math.max(1, Math.floor((estimatedOvulationDay - periodLength) / 2));
  const lutealMidpoint = estimatedOvulationDay + Math.max(2, Math.floor((expectedLength - estimatedOvulationDay) / 2));

  if (cycleDay <= follicularMidpoint) {
    return {
      id: 'early-follicular',
      label: 'Ранняя фолликулярная фаза',
      eyebrow: `${cycleDay}-й день цикла`,
      description: 'После месячных эстроген обычно постепенно растёт, а прогестерон остаётся относительно низким.',
      hormoneNote: 'Эстроген обычно растёт',
      support: 'Возвращайтесь к привычному ритму постепенно и отмечайте энергию без ожидания обязательного подъёма.',
      progress,
      confidence,
    };
  }

  if (cycleDay < estimatedOvulationDay - 1) return {
    id: 'late-follicular',
    label: 'Поздняя фолликулярная фаза',
    eyebrow: `${cycleDay}-й день цикла`,
    description: 'Фолликул продолжает созревать, а уровень эстрогена перед предполагаемой овуляцией обычно становится выше.',
    hormoneNote: 'Эстроген может быть выше',
    support: 'Если есть ресурс, это может быть удобное время для активных задач; ориентируйтесь на свои отметки.',
    progress,
    confidence,
  };

  if (cycleDay <= estimatedOvulationDay + 1) {
    return {
      id: 'ovulatory',
      label: 'Предполагаемое окно овуляции',
      eyebrow: `${cycleDay}-й день цикла`,
      description: 'По календарю это может быть время овуляции. Эстроген часто достигает высокого уровня, а ЛГ кратковременно повышается.',
      hormoneNote: 'Возможен пик эстрогена и подъём ЛГ',
      support: 'Календарь не подтверждает овуляцию и не подходит как самостоятельный метод контрацепции.',
      progress,
      confidence,
    };
  }

  if (cycleDay <= lutealMidpoint) return {
    id: 'early-luteal',
    label: 'Ранняя лютеиновая фаза',
    eyebrow: `${cycleDay}-й день цикла`,
    description: 'После предполагаемой овуляции прогестерон обычно повышается и поддерживает вторую половину цикла.',
    hormoneNote: 'Прогестерон обычно повышается',
    support: 'Сохраняйте привычный темп и отмечайте сон, аппетит и настроение, если замечаете изменения.',
    progress,
    confidence,
  };

  return {
    id: 'late-luteal',
    label: 'Поздняя лютеиновая фаза',
    eyebrow: `${cycleDay}-й день цикла`,
    description: 'Ближе к следующим месячным уровни эстрогена и прогестерона обычно снижаются.',
    hormoneNote: 'Гормональные уровни обычно снижаются',
    support: 'Оставьте больше пространства для отдыха и отмечайте повторяющиеся симптомы без самодиагностики.',
    progress,
    confidence,
  };
}

export type PainRecurrenceInsight = {
  observedCycles: number;
  cyclesWithPain: number;
  typicalDays: string;
  message: string;
};

export function getPainRecurrenceInsight(state: AppState): PainRecurrenceInsight | null {
  const ranges = getPeriodRanges(state.periodDays);
  if (ranges.length < 4) return null;
  const completed = ranges.slice(-5, -1);
  const cycles = completed.map((range, index) => {
    const nextStart = ranges[ranges.indexOf(range) + 1]?.start;
    if (!nextStart) return [];
    return Object.values(state.entries)
      .filter((entry) => entry.date >= range.start && entry.date < nextStart && ((entry.pain ?? 0) > 0 || entry.symptoms.some((symptom) => /боль|спазм/i.test(symptom))))
      .map((entry) => daysBetween(range.start, entry.date) + 1);
  });
  const withPain = cycles.filter((days) => days.length > 0);
  if (withPain.length < 3) return null;
  const allDays = withPain.flat().sort((a, b) => a - b);
  const start = allDays[Math.floor((allDays.length - 1) * 0.25)];
  const end = allDays[Math.ceil((allDays.length - 1) * 0.75)];
  const typicalDays = start === end ? `${start}-й день` : `${start}–${end}-й дни`;
  return {
    observedCycles: completed.length,
    cyclesWithPain: withPain.length,
    typicalDays,
    message: `В ${withPain.length} из ${completed.length} последних циклов боль отмечалась примерно на ${typicalDays}. В следующем цикле она может повториться, но это не медицинский прогноз.`,
  };
}

const zodiacSigns = [
  { from: '01-20', name: 'Водолей', symbol: '♒' },
  { from: '02-19', name: 'Рыбы', symbol: '♓' },
  { from: '03-21', name: 'Овен', symbol: '♈' },
  { from: '04-20', name: 'Телец', symbol: '♉' },
  { from: '05-21', name: 'Близнецы', symbol: '♊' },
  { from: '06-21', name: 'Рак', symbol: '♋' },
  { from: '07-23', name: 'Лев', symbol: '♌' },
  { from: '08-23', name: 'Дева', symbol: '♍' },
  { from: '09-23', name: 'Весы', symbol: '♎' },
  { from: '10-23', name: 'Скорпион', symbol: '♏' },
  { from: '11-22', name: 'Стрелец', symbol: '♐' },
  { from: '12-22', name: 'Козерог', symbol: '♑' },
] as const;

export function getZodiacSign(birthDate: string): { name: string; symbol: string } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null;
  const monthDay = birthDate.slice(5);
  let sign: (typeof zodiacSigns)[number] = zodiacSigns[zodiacSigns.length - 1];
  for (const candidate of zodiacSigns) {
    if (monthDay >= candidate.from) sign = candidate;
  }
  return { name: sign.name, symbol: sign.symbol };
}

export type CycloscopeReading = {
  sign: string;
  symbol: string;
  title: string;
  message: string;
  focus: string;
  luckyDetail: string;
};

export function getCycloscope(state: AppState, date = todayIso()): CycloscopeReading {
  const zodiac = getZodiacSign(state.profile.birthDate);
  const seedText = `${date}-${zodiac?.name ?? 'Луна'}`;
  const seed = Array.from(seedText).reduce((sum, character) => sum + character.charCodeAt(0), 0);
  const titles = ['День мягкой ясности', 'Время слушать себя', 'Маленький шаг вперёд', 'Тихая уверенность', 'Пространство для нового', 'День добрых совпадений'];
  const messages = [
    'Сегодня не обязательно ускоряться. Спокойный выбор может оказаться точнее первого импульса.',
    'Обратите внимание на идею, которая возвращается второй раз. Возможно, ей стоит дать немного места.',
    'Планы могут измениться, и это не испортит день. Оставьте в расписании немного воздуха.',
    'Разговор станет легче, если начать с простого и честного наблюдения без готового вывода.',
    'Сегодня особенно полезно завершить одно небольшое дело вместо того, чтобы начинать сразу несколько.',
    'Тёплая встреча или короткое сообщение могут дать больше энергии, чем большой список задач.',
  ];
  const focuses = ['бережный темп', 'одна ясная задача', 'честный разговор', 'уют вокруг себя', 'небольшая прогулка', 'творческая пауза'];
  const details = ['лавандовый оттенок', 'число 7', 'тёплый чай', 'любимая песня', 'серебряная деталь', 'вечерний свет'];
  const index = seed % titles.length;

  return {
    sign: zodiac?.name ?? 'Лунный знак',
    symbol: zodiac?.symbol ?? '☾',
    title: titles[index],
    message: messages[(seed + 2) % messages.length],
    focus: focuses[(seed + 4) % focuses.length],
    luckyDetail: details[(seed + 1) % details.length],
  };
}

export function getMonthDays(monthCursor: Date): string[] {
  const first = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
  const start = new Date(first);
  const offset = (first.getDay() + 6) % 7;
  start.setDate(first.getDate() - offset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return toIsoDate(date);
  });
}

export function formatRuDate(value: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
  }).format(parseIsoDate(value));
}

export function getCycleAnalyticsEmptyGuidance(periodStarted: boolean, completedCycleCount: number) {
  if (!periodStarted) {
    return {
      title: 'Начните первый цикл',
      description: 'Отметьте первый день месячных. После этого появится предварительный прогноз, а история цикла начнёт собираться.',
    };
  }
  if (completedCycleCount === 0) {
    return {
      title: 'Следующая цель — завершить первый цикл',
      description: 'Отметьте начало следующих месячных. После этого здесь появится первое сравнение с вашей историей.',
    };
  }
  return {
    title: `До сравнения циклов осталось: ${Math.max(0, 2 - completedCycleCount)}`,
    description: 'Отметьте начало следующих месячных. После этого здесь появится первое сравнение с вашей историей.',
  };
}

export function getWeekSummary(state: AppState) {
  const today = todayIso();
  const days = Array.from({ length: 7 }, (_, index) => addDays(today, index - 6));
  const totalWater = days.reduce(
    (sum, date) => sum + (state.entries[date]?.waterMl ?? 0),
    0,
  );
  const moods = days
    .map((date) => state.entries[date]?.mood)
    .filter((mood): mood is Mood => Boolean(mood));
  return {
    days,
    totalWater,
    averageWater: Math.round(totalWater / 7),
    moodCount: moods.length,
  };
}
