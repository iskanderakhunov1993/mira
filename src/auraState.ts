import type { AuraWorkoutLog, WorkoutFeedback, WorkoutLevel, WorkoutStatus, WorkoutVenue } from './workoutEngine';

export const AURA_STORAGE_KEY = 'mira-state-v3';
export const LEGACY_AURA_STORAGE_KEY = 'luna-flow-aura-v2';
export const LEGACY_APP_STORAGE_KEY = 'luna-flow-state-v1';

export const toIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const AURA_TODAY = toIsoDate(new Date());

export type AuraModuleId = 'cycle' | 'mood' | 'sleep' | 'daily' | 'activity' | 'intimate' | 'nutrition' | 'body' | 'note';
export type AuraHomeCardId = 'hormonoscope' | 'cycloscope' | 'dailyPlan' | 'rhythm' | 'recommendation' | 'knowledge';
export type AuraOnboardingGoal = 'today' | 'forecast' | 'patterns' | 'doctor';
export type AuraCyclePattern = 'stable' | 'changes' | 'irregular' | 'unknown';
export type AuraIntimacyComfort = 'comfortable' | 'discomfort' | 'pain';
export type AuraIntimacyAfter = 'none' | 'pain' | 'bleeding' | 'discharge';
export type AuraIntimacyDesire = 'lower' | 'usual' | 'higher';
export type AuraAnimalAvatar = 'cat' | 'dog' | 'rabbit' | 'bird' | 'fish' | 'turtle' | 'squirrel' | 'snail' | 'mouse' | 'ladybug';
export type AuraBleedingType = 'period-start' | 'period-ongoing' | 'spotting' | 'between-periods' | 'after-sex';
export type AuraPainOnset = 'usual' | 'new' | 'sudden';
export type AuraReliefEffect = 'not-used' | 'helped' | 'partly' | 'did-not-help';
export type AuraPregnancyTestResult = 'negative' | 'positive';
export type AuraEntryCompleteness = 'focused' | 'full';
export type AuraCoverageStatus = 'recorded' | 'explicit-none' | 'other-only' | 'empty';
export type AuraDayCoverage = {
  cycle: AuraCoverageStatus;
  symptoms: AuraCoverageStatus;
  wellbeing: AuraCoverageStatus;
  habits: AuraCoverageStatus;
};
export type AuraContraception = 'none' | 'pill' | 'implant-injection' | 'ring-patch' | 'other';
export type AuraIud = 'none' | 'copper' | 'hormonal' | 'unsure';
export type AuraBleedingMedication = 'anticoagulant' | 'aspirin' | 'hormonal-treatment' | 'other';
export type AuraHormonoscopeFeedback = 'matched' | 'neutral' | 'missed';

export type AuraHealthContext = {
  contraception?: AuraContraception;
  iud?: AuraIud;
  bleedingMedications: AuraBleedingMedication[];
  updatedAt?: string;
};

export type AuraOnboarding = {
  completed: boolean;
  goal?: AuraOnboardingGoal;
  lastPeriod?: string;
  cyclePattern?: AuraCyclePattern;
  cycleLength?: number;
  periodLength?: number;
  periodLengthUnknown: boolean;
  focus: AuraModuleId[];
  reminders: boolean;
};

export type AuraSymptom = {
  id: string;
  label: string;
  severity: 1 | 2 | 3;
  affectsLife: boolean;
};

export type AuraPeriodCheckin = {
  bleedingType: AuraBleedingType;
  overall: 'easy' | 'usual' | 'harder' | 'very-hard';
  flow: 'light' | 'medium' | 'heavy' | 'very-heavy';
  changeFrequency: '4h-plus' | '2-3h' | '1-2h' | 'hourly';
  hourlyBleedingHours: number;
  largeClots: boolean;
  leaksThroughProtection: boolean;
  doubleProtection: boolean;
  nightChanges: boolean;
  durationDays: number;
  painImpact: 'none' | 'slow-down' | 'disrupts' | 'unable';
  painScore: number;
  painLocations: string[];
  painOnset?: AuraPainOnset;
  reliefEffect?: AuraReliefEffect;
  symptoms: string[];
  pregnancyPossible: boolean;
  pregnancyTest?: AuraPregnancyTestResult;
  differentFromUsual: boolean;
  result: 'usual' | 'observe' | 'doctor' | 'urgent';
  completedAt: string;
};

export type AuraDayEntry = {
  rating?: number;
  period?: 'none' | 'light' | 'medium' | 'heavy';
  periodCheckin?: AuraPeriodCheckin;
  completionQuality?: AuraEntryCompleteness;
  symptoms: AuraSymptom[];
  symptomsChecked?: boolean;
  moods: string[];
  energy?: number;
  sleepHours?: number;
  sleepQuality?: 'Плохое' | 'Обычное' | 'Хорошее';
  water?: number;
  steps?: number;
  activity?: string;
  workout?: AuraWorkoutLog;
  intimate?: boolean;
  intimacyComfort?: AuraIntimacyComfort;
  intimacyAfter?: AuraIntimacyAfter[];
  intimacyDesire?: AuraIntimacyDesire;
  intimacyNote?: string;
  nutrition: string[];
  calories?: number;
  temperature?: number;
  weight?: number;
  careItems?: string[];
  recommendedActivityDone?: boolean;
  b6Prescribed?: boolean;
  b6Taken?: boolean;
  note?: string;
  contexts: string[];
  updatedAt: string;
};

export type AuraState = {
  version: 3;
  avatar: AuraAnimalAvatar;
  profile: {
    fullName: string;
    birthDate?: string;
    healthContext: AuraHealthContext;
  };
  selectedDate: string;
  entries: Record<string, AuraDayEntry>;
  periodStarts: string[];
  periodEnds: string[];
  excludedCycleStarts: string[];
  modules: Record<AuraModuleId, boolean>;
  homeCards: Record<AuraHomeCardId, boolean>;
  savedArticles: string[];
  hormonoscopeFeedback: Record<string, AuraHormonoscopeFeedback>;
  cycloscopeFeedback: Record<string, AuraHormonoscopeFeedback>;
  notifications: boolean;
  onboarding: AuraOnboarding;
  privacy: {
    localOnly: boolean;
    sensitiveExport: boolean;
  };
  attention: {
    dismissedUntil?: string;
    evidenceKey?: string;
    lastShownAt?: string;
    showCount: number;
  };
};

export type AuraSafetyFact = {
  date: string;
  category: 'cycle' | 'symptoms' | 'intimate';
  label: string;
  detail: string;
  sensitive: boolean;
};

const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const clamp = (value: unknown, min: number, max: number): number | undefined => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(min, Math.min(max, numeric)) : undefined;
};

export function isValidAuraDate(value: unknown, today = AURA_TODAY): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  return toIsoDate(parsed) === value && value <= today;
}

const entry = (value: Partial<AuraDayEntry>, date = AURA_TODAY): AuraDayEntry => ({
  symptoms: [],
  moods: [],
  nutrition: [],
  contexts: [],
  updatedAt: `${date}T09:41:00`,
  ...value,
});

export const defaultAuraState: AuraState = {
  version: 3,
  avatar: 'cat',
  profile: { fullName: '', healthContext: { bleedingMedications: [] } },
  selectedDate: AURA_TODAY,
  periodStarts: [],
  periodEnds: [],
  excludedCycleStarts: [],
  entries: {},
  modules: {
    cycle: true,
    mood: true,
    sleep: true,
    daily: true,
    activity: false,
    intimate: false,
    nutrition: false,
    body: false,
    note: true,
  },
  homeCards: {
    hormonoscope: false,
    cycloscope: false,
    dailyPlan: true,
    rhythm: true,
    recommendation: true,
    knowledge: true,
  },
  savedArticles: [],
  hormonoscopeFeedback: {},
  cycloscopeFeedback: {},
  notifications: false,
  onboarding: {
    completed: false,
    periodLengthUnknown: false,
    focus: [],
    reminders: false,
  },
  privacy: {
    localOnly: true,
    sensitiveExport: false,
  },
  attention: {
    showCount: 0,
  },
};

const moduleIds = Object.keys(defaultAuraState.modules) as AuraModuleId[];
const homeCardIds = Object.keys(defaultAuraState.homeCards) as AuraHomeCardId[];
const animalAvatarIds: AuraAnimalAvatar[] = ['cat', 'dog', 'rabbit', 'bird', 'fish', 'turtle', 'squirrel', 'snail', 'mouse', 'ladybug'];
const intimacyComfortValues: AuraIntimacyComfort[] = ['comfortable', 'discomfort', 'pain'];
const intimacyAfterValues: AuraIntimacyAfter[] = ['none', 'pain', 'bleeding', 'discharge'];
const intimacyDesireValues: AuraIntimacyDesire[] = ['lower', 'usual', 'higher'];
const periodValues: AuraDayEntry['period'][] = ['none', 'light', 'medium', 'heavy'];
const bleedingTypeValues: AuraBleedingType[] = ['period-start', 'period-ongoing', 'spotting', 'between-periods', 'after-sex'];
const periodOverallValues: AuraPeriodCheckin['overall'][] = ['easy', 'usual', 'harder', 'very-hard'];
const periodFlowValues: AuraPeriodCheckin['flow'][] = ['light', 'medium', 'heavy', 'very-heavy'];
const periodChangeFrequencyValues: AuraPeriodCheckin['changeFrequency'][] = ['4h-plus', '2-3h', '1-2h', 'hourly'];
const periodPainImpactValues: AuraPeriodCheckin['painImpact'][] = ['none', 'slow-down', 'disrupts', 'unable'];
const periodResultValues: AuraPeriodCheckin['result'][] = ['usual', 'observe', 'doctor', 'urgent'];
const painOnsetValues: AuraPainOnset[] = ['usual', 'new', 'sudden'];
const reliefEffectValues: AuraReliefEffect[] = ['not-used', 'helped', 'partly', 'did-not-help'];
const pregnancyTestValues: AuraPregnancyTestResult[] = ['negative', 'positive'];
const entryCompletenessValues: AuraEntryCompleteness[] = ['focused', 'full'];
const contraceptionValues: AuraContraception[] = ['none', 'pill', 'implant-injection', 'ring-patch', 'other'];
const iudValues: AuraIud[] = ['none', 'copper', 'hormonal', 'unsure'];
const bleedingMedicationValues: AuraBleedingMedication[] = ['anticoagulant', 'aspirin', 'hormonal-treatment', 'other'];
const sleepQualityValues: NonNullable<AuraDayEntry['sleepQuality']>[] = ['Плохое', 'Обычное', 'Хорошее'];
const workoutLevels: WorkoutLevel[] = ['rest', 'recovery', 'light', 'moderate'];
const workoutStatuses: WorkoutStatus[] = ['planned', 'in_progress', 'completed', 'skipped'];
const workoutFeedbackValues: WorkoutFeedback[] = ['easy', 'right', 'hard'];
const workoutVenueValues: WorkoutVenue[] = ['home', 'outdoor', 'gym'];

function normalizePeriodStartDates(values: string[]): string[] {
  return values.sort().reduce<string[]>((result, date) => {
    const previous = result[result.length - 1];
    if (!previous || daysBetween(previous, date) >= 18) result.push(date);
    return result;
  }, []);
}

function sanitizeSymptoms(value: unknown): AuraSymptom[] {
  if (!Array.isArray(value)) return [];
  const result = new Map<string, AuraSymptom>();
  for (const raw of value) {
    if (!isObject(raw) || typeof raw.id !== 'string' || typeof raw.label !== 'string') continue;
    const severity = clamp(raw.severity, 1, 3);
    if (!severity) continue;
    const id = raw.id.slice(0, 80);
    result.set(id, {
      id,
      label: raw.label.slice(0, 120),
      severity: Math.round(severity) as 1 | 2 | 3,
      affectsLife: raw.affectsLife === true,
    });
  }
  return [...result.values()];
}

function sanitizePeriodCheckin(value: unknown): AuraPeriodCheckin | undefined {
  if (!isObject(value)
    || typeof value.overall !== 'string'
    || !periodOverallValues.includes(value.overall as AuraPeriodCheckin['overall'])
    || typeof value.flow !== 'string'
    || !periodFlowValues.includes(value.flow as AuraPeriodCheckin['flow'])
    || typeof value.changeFrequency !== 'string'
    || !periodChangeFrequencyValues.includes(value.changeFrequency as AuraPeriodCheckin['changeFrequency'])
    || typeof value.painImpact !== 'string'
    || !periodPainImpactValues.includes(value.painImpact as AuraPeriodCheckin['painImpact'])
    || typeof value.result !== 'string'
    || !periodResultValues.includes(value.result as AuraPeriodCheckin['result'])) return undefined;
  const durationDays = clamp(value.durationDays, 1, 30);
  const painScore = clamp(value.painScore, 0, 10);
  if (durationDays === undefined || painScore === undefined) return undefined;
  return {
    bleedingType: typeof value.bleedingType === 'string' && bleedingTypeValues.includes(value.bleedingType as AuraBleedingType)
      ? value.bleedingType as AuraBleedingType
      : 'period-start',
    overall: value.overall as AuraPeriodCheckin['overall'],
    flow: value.flow as AuraPeriodCheckin['flow'],
    changeFrequency: value.changeFrequency as AuraPeriodCheckin['changeFrequency'],
    hourlyBleedingHours: Math.round(clamp(value.hourlyBleedingHours, 0, 24) ?? 0),
    largeClots: value.largeClots === true,
    leaksThroughProtection: value.leaksThroughProtection === true,
    doubleProtection: value.doubleProtection === true,
    nightChanges: value.nightChanges === true,
    durationDays: Math.round(durationDays),
    painImpact: value.painImpact as AuraPeriodCheckin['painImpact'],
    painScore: Math.round(painScore),
    painLocations: Array.isArray(value.painLocations) ? value.painLocations.filter((item): item is string => typeof item === 'string').map((item) => item.slice(0, 80)).slice(0, 10) : [],
    painOnset: typeof value.painOnset === 'string' && painOnsetValues.includes(value.painOnset as AuraPainOnset) ? value.painOnset as AuraPainOnset : undefined,
    reliefEffect: typeof value.reliefEffect === 'string' && reliefEffectValues.includes(value.reliefEffect as AuraReliefEffect) ? value.reliefEffect as AuraReliefEffect : undefined,
    symptoms: Array.isArray(value.symptoms) ? value.symptoms.filter((item): item is string => typeof item === 'string').map((item) => item.slice(0, 80)).slice(0, 20) : [],
    pregnancyPossible: value.pregnancyPossible === true,
    pregnancyTest: typeof value.pregnancyTest === 'string' && pregnancyTestValues.includes(value.pregnancyTest as AuraPregnancyTestResult) ? value.pregnancyTest as AuraPregnancyTestResult : undefined,
    differentFromUsual: value.differentFromUsual === true,
    result: value.result as AuraPeriodCheckin['result'],
    completedAt: typeof value.completedAt === 'string' ? value.completedAt.slice(0, 40) : new Date().toISOString(),
  };
}

function sanitizeWorkout(date: string, value: unknown): AuraWorkoutLog | undefined {
  if (!isObject(value)
    || typeof value.id !== 'string'
    || typeof value.generatedAt !== 'string'
    || typeof value.title !== 'string'
    || typeof value.intensityLabel !== 'string'
    || typeof value.level !== 'string'
    || !workoutLevels.includes(value.level as WorkoutLevel)
    || typeof value.status !== 'string'
    || !workoutStatuses.includes(value.status as WorkoutStatus)
    || !['standard', 'caution', 'rest'].includes(String(value.safety))
    || !Array.isArray(value.exercises)
    || !isObject(value.snapshot)) return undefined;
  const durationMin = clamp(value.durationMin, 1, 120);
  if (!durationMin) return undefined;
  const snapshot = value.snapshot;
  const cycleDay = clamp(snapshot.cycleDay, 1, 200);
  const rating = clamp(snapshot.rating, 1, 5);
  const energy = clamp(snapshot.energy, 1, 5);
  const sleepHours = clamp(snapshot.sleepHours, 0, 24);
  const maxSymptomSeverity = clamp(snapshot.maxSymptomSeverity, 0, 3) ?? 0;
  const period = typeof snapshot.period === 'string' && periodValues.includes(snapshot.period as AuraDayEntry['period']) ? snapshot.period as AuraDayEntry['period'] : undefined;
  const sleepQuality = typeof snapshot.sleepQuality === 'string' && sleepQualityValues.includes(snapshot.sleepQuality as NonNullable<AuraDayEntry['sleepQuality']>) ? snapshot.sleepQuality as AuraDayEntry['sleepQuality'] : undefined;
  const exercises = value.exercises.flatMap((raw) => {
    if (!isObject(raw) || typeof raw.id !== 'string' || typeof raw.title !== 'string' || typeof raw.amount !== 'string' || typeof raw.note !== 'string') return [];
    return [{ id: raw.id.slice(0, 80), title: raw.title.slice(0, 160), amount: raw.amount.slice(0, 80), note: raw.note.slice(0, 320) }];
  }).slice(0, 12);
  if (!exercises.length) return undefined;
  return {
    id: value.id.slice(0, 120),
    date,
    generatedAt: value.generatedAt.slice(0, 40),
    level: value.level as WorkoutLevel,
    title: value.title.slice(0, 180),
    durationMin: Math.round(durationMin),
    intensityLabel: value.intensityLabel.slice(0, 80),
    reasons: Array.isArray(value.reasons) ? value.reasons.filter((item): item is string => typeof item === 'string').map((item) => item.slice(0, 240)).slice(0, 6) : [],
    exercises,
    venue: typeof value.venue === 'string' && workoutVenueValues.includes(value.venue as WorkoutVenue) ? value.venue as WorkoutVenue : 'home',
    completedExerciseIds: Array.isArray(value.completedExerciseIds) ? value.completedExerciseIds.filter((item): item is string => typeof item === 'string' && exercises.some((exercise) => exercise.id === item)).slice(0, 12) : [],
    weeklyTarget: Math.round(clamp(value.weeklyTarget, 1, 5) ?? 3),
    recentCompletedCount: Math.round(clamp(value.recentCompletedCount, 0, 7) ?? 0),
    safety: value.safety as AuraWorkoutLog['safety'],
    status: value.status as WorkoutStatus,
    startedAt: typeof value.startedAt === 'string' ? value.startedAt.slice(0, 40) : undefined,
    completedAt: typeof value.completedAt === 'string' ? value.completedAt.slice(0, 40) : undefined,
    feedback: typeof value.feedback === 'string' && workoutFeedbackValues.includes(value.feedback as WorkoutFeedback) ? value.feedback as WorkoutFeedback : undefined,
    snapshot: {
      cycleDay: cycleDay ? Math.round(cycleDay) : undefined,
      period,
      rating: rating ? Math.round(rating) : undefined,
      energy: energy ? Math.round(energy) : undefined,
      sleepHours,
      sleepQuality,
      maxSymptomSeverity: Math.round(maxSymptomSeverity),
      symptomsAffectLife: snapshot.symptomsAffectLife === true,
    },
  };
}

function sanitizeEntry(date: string, raw: Record<string, unknown>): AuraDayEntry {
  const rating = clamp(raw.rating, 1, 5);
  const energy = clamp(raw.energy, 1, 5);
  const water = clamp(raw.water, 0, 20_000);
  const steps = clamp(raw.steps, 0, 100_000);
  const calories = clamp(raw.calories, 0, 10_000);
  const sleepHours = clamp(raw.sleepHours, 0, 24);
  const temperature = clamp(raw.temperature, 34, 43);
  const weight = clamp(raw.weight, 20, 300);
  const period = typeof raw.period === 'string' && periodValues.includes(raw.period as AuraDayEntry['period']) ? raw.period as AuraDayEntry['period'] : undefined;
  const sleepQuality = typeof raw.sleepQuality === 'string' && sleepQualityValues.includes(raw.sleepQuality as NonNullable<AuraDayEntry['sleepQuality']>) ? raw.sleepQuality as AuraDayEntry['sleepQuality'] : undefined;
  return entry({
    rating: rating ? Math.round(rating) : undefined,
    period,
    periodCheckin: sanitizePeriodCheckin(raw.periodCheckin),
    completionQuality: typeof raw.completionQuality === 'string' && entryCompletenessValues.includes(raw.completionQuality as AuraEntryCompleteness) ? raw.completionQuality as AuraEntryCompleteness : undefined,
    symptoms: sanitizeSymptoms(raw.symptoms),
    symptomsChecked: typeof raw.symptomsChecked === 'boolean' ? raw.symptomsChecked : undefined,
    moods: Array.isArray(raw.moods) ? raw.moods.filter((item): item is string => typeof item === 'string').map((item) => item.slice(0, 80)) : [],
    energy: energy ? Math.round(energy) : undefined,
    sleepHours,
    sleepQuality,
    water: water === undefined ? undefined : Math.round(water),
    steps: steps === undefined ? undefined : Math.round(steps),
    activity: typeof raw.activity === 'string' ? raw.activity.slice(0, 120) : undefined,
    workout: sanitizeWorkout(date, raw.workout),
    intimate: typeof raw.intimate === 'boolean' ? raw.intimate : undefined,
    intimacyComfort: typeof raw.intimacyComfort === 'string' && intimacyComfortValues.includes(raw.intimacyComfort as AuraIntimacyComfort) ? raw.intimacyComfort as AuraIntimacyComfort : undefined,
    intimacyAfter: Array.isArray(raw.intimacyAfter) ? raw.intimacyAfter.filter((item): item is AuraIntimacyAfter => typeof item === 'string' && intimacyAfterValues.includes(item as AuraIntimacyAfter)) : [],
    intimacyDesire: typeof raw.intimacyDesire === 'string' && intimacyDesireValues.includes(raw.intimacyDesire as AuraIntimacyDesire) ? raw.intimacyDesire as AuraIntimacyDesire : undefined,
    intimacyNote: typeof raw.intimacyNote === 'string' ? raw.intimacyNote.slice(0, 1000) : undefined,
    nutrition: Array.isArray(raw.nutrition) ? raw.nutrition.filter((item): item is string => typeof item === 'string').map((item) => item.slice(0, 80)) : [],
    calories: calories === undefined ? undefined : Math.round(calories),
    temperature,
    weight,
    careItems: Array.isArray(raw.careItems) ? raw.careItems.filter((item): item is string => typeof item === 'string').map((item) => item.slice(0, 80)) : [],
    recommendedActivityDone: raw.recommendedActivityDone === true ? true : undefined,
    b6Prescribed: raw.b6Prescribed === true ? true : undefined,
    b6Taken: raw.b6Prescribed === true && raw.b6Taken === true ? true : undefined,
    note: typeof raw.note === 'string' ? raw.note.slice(0, 5000) : undefined,
    contexts: Array.isArray(raw.contexts) ? raw.contexts.filter((item): item is string => typeof item === 'string').map((item) => item.slice(0, 80)) : [],
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt.slice(0, 40) : `${date}T09:41:00`,
  }, date);
}

export function sanitizeAuraState(value: unknown): AuraState {
  if (!isObject(value)) return structuredClone(defaultAuraState);
  const candidate = value as Partial<AuraState>;
  const entries = isObject(candidate.entries)
    ? Object.fromEntries(Object.entries(candidate.entries).flatMap(([date, raw]) => isValidAuraDate(date) && isObject(raw) ? [[date, sanitizeEntry(date, raw)]] : []))
    : {};
  const rawModules: Record<string, unknown> = isObject(candidate.modules) ? candidate.modules : {};
  const rawHomeCards: Record<string, unknown> = isObject(candidate.homeCards) ? candidate.homeCards : {};
  const rawOnboarding: Record<string, unknown> = isObject(candidate.onboarding) ? candidate.onboarding : {};
  const rawAttention: Record<string, unknown> = isObject(candidate.attention) ? candidate.attention : {};
  const rawPrivacy: Record<string, unknown> = isObject(candidate.privacy) ? candidate.privacy : {};
  const rawHormonoscopeFeedback: Record<string, unknown> = isObject(candidate.hormonoscopeFeedback) ? candidate.hormonoscopeFeedback : {};
  const rawCycloscopeFeedback: Record<string, unknown> = isObject(candidate.cycloscopeFeedback) ? candidate.cycloscopeFeedback : {};
  const rawProfile: Record<string, unknown> = isObject(candidate.profile) ? candidate.profile : {};
  const rawHealthContext: Record<string, unknown> = isObject(rawProfile.healthContext) ? rawProfile.healthContext : {};
  const cycleLength = clamp(rawOnboarding.cycleLength, 18, 60);
  const periodLength = clamp(rawOnboarding.periodLength, 1, 14);
  const selectedDate = isValidAuraDate(candidate.selectedDate) ? candidate.selectedDate : AURA_TODAY;
  const periodStarts = Array.isArray(candidate.periodStarts)
    ? normalizePeriodStartDates(Array.from(new Set(candidate.periodStarts.filter((item): item is string => isValidAuraDate(item)))))
    : [];
  const completedStartSet = new Set(periodStarts.slice(0, -1));
  const excludedCycleStarts = Array.isArray(candidate.excludedCycleStarts)
    ? Array.from(new Set(candidate.excludedCycleStarts.filter((item): item is string => isValidAuraDate(item) && completedStartSet.has(item)))).sort()
    : [];
  return {
    version: 3,
    avatar: typeof candidate.avatar === 'string' && animalAvatarIds.includes(candidate.avatar as AuraAnimalAvatar) ? candidate.avatar as AuraAnimalAvatar : defaultAuraState.avatar,
    profile: {
      fullName: typeof rawProfile.fullName === 'string' ? rawProfile.fullName.trim().slice(0, 120) : '',
      birthDate: isValidAuraDate(rawProfile.birthDate) ? rawProfile.birthDate : undefined,
      healthContext: {
        contraception: typeof rawHealthContext.contraception === 'string' && contraceptionValues.includes(rawHealthContext.contraception as AuraContraception) ? rawHealthContext.contraception as AuraContraception : undefined,
        iud: typeof rawHealthContext.iud === 'string' && iudValues.includes(rawHealthContext.iud as AuraIud) ? rawHealthContext.iud as AuraIud : undefined,
        bleedingMedications: Array.isArray(rawHealthContext.bleedingMedications)
          ? rawHealthContext.bleedingMedications.filter((item): item is AuraBleedingMedication => typeof item === 'string' && bleedingMedicationValues.includes(item as AuraBleedingMedication))
          : [],
        updatedAt: typeof rawHealthContext.updatedAt === 'string' ? rawHealthContext.updatedAt.slice(0, 40) : undefined,
      },
    },
    selectedDate,
    entries,
    periodStarts,
    periodEnds: Array.isArray(candidate.periodEnds)
      ? Array.from(new Set(candidate.periodEnds.filter((item): item is string => isValidAuraDate(item)))).sort()
      : [],
    excludedCycleStarts,
    modules: Object.fromEntries(moduleIds.map((id) => [id, typeof rawModules[id] === 'boolean' ? rawModules[id] : defaultAuraState.modules[id]])) as Record<AuraModuleId, boolean>,
    homeCards: Object.fromEntries(homeCardIds.map((id) => [id, typeof rawHomeCards[id] === 'boolean' ? rawHomeCards[id] : defaultAuraState.homeCards[id]])) as Record<AuraHomeCardId, boolean>,
    savedArticles: Array.isArray(candidate.savedArticles) ? Array.from(new Set(candidate.savedArticles.filter((item): item is string => typeof item === 'string').map((item) => item.slice(0, 120)))) : [],
    hormonoscopeFeedback: Object.fromEntries(Object.entries(rawHormonoscopeFeedback).flatMap(([date, feedback]) => isValidAuraDate(date) && ['matched', 'neutral', 'missed'].includes(String(feedback)) ? [[date, feedback as AuraHormonoscopeFeedback]] : [])),
    cycloscopeFeedback: Object.fromEntries(Object.entries(rawCycloscopeFeedback).flatMap(([date, feedback]) => isValidAuraDate(date) && ['matched', 'neutral', 'missed'].includes(String(feedback)) ? [[date, feedback as AuraHormonoscopeFeedback]] : [])),
    notifications: candidate.notifications === true,
    onboarding: {
      completed: rawOnboarding.completed === true,
      goal: ['today', 'forecast', 'patterns', 'doctor'].includes(String(rawOnboarding.goal)) ? rawOnboarding.goal as AuraOnboardingGoal : undefined,
      lastPeriod: isValidAuraDate(rawOnboarding.lastPeriod) ? rawOnboarding.lastPeriod : undefined,
      cyclePattern: ['stable', 'changes', 'irregular', 'unknown'].includes(String(rawOnboarding.cyclePattern)) ? rawOnboarding.cyclePattern as AuraCyclePattern : undefined,
      cycleLength: cycleLength ? Math.round(cycleLength) : undefined,
      periodLength: periodLength ? Math.round(periodLength) : undefined,
      periodLengthUnknown: rawOnboarding.periodLengthUnknown === true,
      focus: Array.isArray(rawOnboarding.focus) ? rawOnboarding.focus.filter((item): item is AuraModuleId => typeof item === 'string' && moduleIds.includes(item as AuraModuleId)) : [],
      reminders: rawOnboarding.reminders === true,
    },
    privacy: {
      localOnly: true,
      sensitiveExport: rawPrivacy.sensitiveExport === true,
    },
    attention: {
      dismissedUntil: isValidAuraDate(rawAttention.dismissedUntil, '9999-12-31') ? rawAttention.dismissedUntil : undefined,
      evidenceKey: typeof rawAttention.evidenceKey === 'string' ? rawAttention.evidenceKey.slice(0, 5000) : undefined,
      lastShownAt: isValidAuraDate(rawAttention.lastShownAt) ? rawAttention.lastShownAt : undefined,
      showCount: Math.round(clamp(rawAttention.showCount, 0, 10_000) ?? 0),
    },
  };
}

export function parseImportedAuraState(value: unknown): AuraState {
  if (!isObject(value) || !isObject(value.entries) || !Array.isArray(value.periodStarts)) throw new Error('Invalid backup');
  return sanitizeAuraState(value);
}

export function getAuraObservationDates(state: AuraState): string[] {
  return Array.from(new Set([...Object.keys(state.entries), ...state.periodStarts, ...state.periodEnds]))
    .filter((date) => isValidAuraDate(date))
    .sort();
}

export function getAuraDayCoverage(state: AuraState, date: string): AuraDayCoverage {
  const day = state.entries[date];
  const cycleRecorded = state.periodStarts.includes(date)
    || state.periodEnds.includes(date)
    || Boolean(day?.periodCheckin)
    || day?.period !== undefined;
  const symptomsRecorded = Boolean(day?.symptoms.length);
  const symptomsExplicitlyAbsent = day?.symptomsChecked === true && !symptomsRecorded;
  const wellbeingRecorded = day?.rating !== undefined
    || day?.energy !== undefined
    || Boolean(day?.moods.length);
  const habitsRecorded = day?.sleepHours !== undefined
    || day?.sleepQuality !== undefined
    || day?.water !== undefined
    || day?.steps !== undefined
    || Boolean(day?.activity)
    || Boolean(day?.workout)
    || Boolean(day?.nutrition.length)
    || day?.calories !== undefined
    || day?.temperature !== undefined
    || day?.weight !== undefined;
  const otherRecorded = day?.intimate !== undefined
    || Boolean(day?.intimacyComfort)
    || Boolean(day?.intimacyAfter?.length)
    || Boolean(day?.intimacyDesire)
    || Boolean(day?.intimacyNote?.trim())
    || Boolean(day?.note?.trim())
    || Boolean(day?.contexts.length)
    || Boolean(day?.careItems?.length)
    || day?.recommendedActivityDone !== undefined
    || day?.b6Prescribed !== undefined
    || day?.b6Taken !== undefined;
  const hasAnyRecord = cycleRecorded || symptomsRecorded || symptomsExplicitlyAbsent || wellbeingRecorded || habitsRecorded || otherRecorded;
  const status = (recorded: boolean): AuraCoverageStatus => recorded ? 'recorded' : hasAnyRecord ? 'other-only' : 'empty';

  return {
    cycle: status(cycleRecorded),
    symptoms: symptomsRecorded ? 'recorded' : symptomsExplicitlyAbsent ? 'explicit-none' : hasAnyRecord ? 'other-only' : 'empty',
    wellbeing: status(wellbeingRecorded),
    habits: status(habitsRecorded),
  };
}

export function getAuraSafetyFacts(state: AuraState, includeSensitive = false): AuraSafetyFact[] {
  const facts = Object.entries(state.entries).flatMap(([date, day]) => {
    const dailyFacts: AuraSafetyFact[] = [];
    const checkin = day.periodCheckin;
    if (checkin && ['spotting', 'between-periods', 'after-sex'].includes(checkin.bleedingType)) {
      const label = checkin.bleedingType === 'spotting'
        ? 'Мажущие кровянистые выделения'
        : checkin.bleedingType === 'between-periods'
          ? 'Кровотечение между месячными'
          : 'Кровотечение после близости';
      const markers = [
        checkin.flow === 'very-heavy' ? 'очень обильное' : checkin.flow === 'heavy' ? 'обильное' : checkin.flow === 'medium' ? 'среднее' : 'слабое',
        checkin.changeFrequency === 'hourly' ? `смена средства каждый час${checkin.hourlyBleedingHours ? ` около ${checkin.hourlyBleedingHours} ч подряд` : ''}` : '',
        checkin.painScore ? `боль ${checkin.painScore}/10` : '',
      ].filter(Boolean);
      if (checkin.bleedingType !== 'after-sex' || includeSensitive) {
        dailyFacts.push({ date, category: 'cycle', label, detail: markers.join(' · '), sensitive: checkin.bleedingType === 'after-sex' });
      }
    }
    if (day.period === 'heavy') {
      dailyFacts.push({
        date,
        category: 'cycle',
        label: 'Обильные месячные',
        detail: 'Интенсивность отмечена как обильная.',
        sensitive: false,
      });
    }
    if (checkin?.result === 'urgent') {
      dailyFacts.push({
        date,
        category: 'cycle',
        label: 'Сочетание симптомов требовало срочной оценки',
        detail: 'Такой результат был показан по ответам пользователя в ежедневной отметке.',
        sensitive: false,
      });
    }
    day.symptoms.forEach((symptom) => {
      if (symptom.severity !== 3 && !symptom.affectsLife) return;
      const markers = [symptom.severity === 3 ? 'сильный симптом' : '', symptom.affectsLife ? 'мешал обычным делам' : ''].filter(Boolean);
      dailyFacts.push({
        date,
        category: 'symptoms',
        label: symptom.label,
        detail: markers.join(' · '),
        sensitive: false,
      });
    });
    if (includeSensitive && (day.intimacyComfort === 'pain' || day.intimacyAfter?.some((item) => ['pain', 'bleeding'].includes(item)))) {
      dailyFacts.push({
        date,
        category: 'intimate',
        label: 'После близости',
        detail: day.intimacyAfter?.includes('bleeding') ? 'отмечены кровянистые выделения или боль' : 'отмечена боль',
        sensitive: true,
      });
    }
    return dailyFacts;
  });
  return facts.sort((left, right) => right.date.localeCompare(left.date));
}

function periodStartsFromDays(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const days = Array.from(new Set(value.filter((item): item is string => isValidAuraDate(item)))).sort();
  return days.filter((date, index) => index === 0 || daysBetween(days[index - 1], date) > 1);
}

const legacyMoodLabels: Record<string, string> = {
  great: 'Радость',
  calm: 'Спокойствие',
  sensitive: 'Чувствительность',
  tired: 'Усталость',
  low: 'Грусть',
};

export function migrateLegacyAppState(value: unknown): AuraState | null {
  if (!isObject(value) || !isObject(value.profile) || !isObject(value.entries)) return null;
  const legacyEntries = Object.fromEntries(Object.entries(value.entries).flatMap(([date, raw]) => {
    if (!isValidAuraDate(date) || !isObject(raw)) return [];
    const symptoms = Array.isArray(raw.symptoms) ? raw.symptoms.filter((item): item is string => typeof item === 'string').map((label, index) => ({
      id: label === 'Боль внизу живота' ? 'pain' : `legacy-${index}-${label.slice(0, 24)}`,
      label,
      severity: Math.round(clamp(isObject(raw.symptomSeverity) ? raw.symptomSeverity[label] : undefined, 1, 3) ?? 1) as 1 | 2 | 3,
      affectsLife: raw.symptomsAffectDailyLife === true,
    })) : [];
    const moods = Array.isArray(raw.moods) ? raw.moods.filter((item): item is string => typeof item === 'string') : typeof raw.mood === 'string' && legacyMoodLabels[raw.mood] ? [legacyMoodLabels[raw.mood]] : [];
    const flow = clamp(raw.flow, 0, 3);
    const flowMap: AuraDayEntry['period'][] = ['none', 'light', 'medium', 'heavy'];
    const qualityMap: Record<string, AuraDayEntry['sleepQuality']> = { poor: 'Плохое', okay: 'Обычное', good: 'Хорошее' };
    return [[date, sanitizeEntry(date, {
      rating: raw.dayRating,
      period: flow === undefined ? undefined : flowMap[Math.round(flow)],
      symptoms,
      symptomsChecked: raw.symptomsChecked,
      moods,
      energy: raw.energy,
      sleepHours: raw.sleepHours,
      sleepQuality: typeof raw.sleepQuality === 'string' ? qualityMap[raw.sleepQuality] : undefined,
      water: raw.waterMl,
      steps: raw.steps,
      calories: raw.calories,
      temperature: raw.basalTemperature,
      weight: raw.weightKg,
      intimate: raw.hadSex === true ? true : undefined,
      nutrition: Array.isArray(raw.digestion) ? raw.digestion : [],
      contexts: Array.isArray(raw.contextTags) ? raw.contextTags : [],
      note: raw.note,
      updatedAt: `${date}T09:41:00`,
    })]];
  }));
  const profile = value.profile;
  const periodStarts = periodStartsFromDays(value.periodDays);
  return sanitizeAuraState({
    ...defaultAuraState,
    entries: legacyEntries,
    periodStarts,
    // Legacy daily marks prove observed bleeding days, but not an explicitly confirmed ending.
    periodEnds: [],
    savedArticles: Array.isArray(value.savedArticles) ? value.savedArticles : [],
    notifications: profile.reminderEnabled === true,
    onboarding: {
      completed: value.onboardingComplete === true,
      lastPeriod: periodStarts[periodStarts.length - 1],
      cycleLength: profile.cycleLength,
      periodLength: profile.periodLength,
      periodLengthUnknown: false,
      focus: ['cycle', 'mood', 'sleep', 'daily', 'note'],
      reminders: profile.reminderEnabled === true,
    },
  });
}

export function loadAuraState(): AuraState {
  try {
    const current = localStorage.getItem(AURA_STORAGE_KEY);
    if (current) return sanitizeAuraState(JSON.parse(current));
    const oldAura = localStorage.getItem(LEGACY_AURA_STORAGE_KEY);
    if (oldAura) {
      const migrated = sanitizeAuraState(JSON.parse(oldAura));
      persistAuraState(migrated);
      return migrated;
    }
    const oldApp = localStorage.getItem(LEGACY_APP_STORAGE_KEY);
    if (oldApp) {
      const migrated = migrateLegacyAppState(JSON.parse(oldApp));
      if (migrated) {
        persistAuraState(migrated);
        return migrated;
      }
    }
  } catch {
    // Fall through to a genuinely empty, safe state.
  }
  return structuredClone(defaultAuraState);
}

export function persistAuraState(state: AuraState): boolean {
  try {
    localStorage.setItem(AURA_STORAGE_KEY, JSON.stringify(sanitizeAuraState(state)));
    return true;
  } catch {
    return false;
  }
}

export function clearAllMiraStorage(): void {
  localStorage.removeItem(AURA_STORAGE_KEY);
  localStorage.removeItem(LEGACY_AURA_STORAGE_KEY);
  localStorage.removeItem(LEGACY_APP_STORAGE_KEY);
}

export function emptyAuraEntry(date = AURA_TODAY): AuraDayEntry {
  return entry({}, date);
}

export function createEmptyAuraState(): AuraState {
  return structuredClone(defaultAuraState);
}

export function setAuraPeriodStart(state: AuraState, date: string, marked: boolean): AuraState {
  if (!isValidAuraDate(date)) return state;
  const periodStarts = marked
    ? Array.from(new Set([...state.periodStarts, date])).sort()
    : state.periodStarts.filter((item) => item !== date);
  return {
    ...state,
    selectedDate: date,
    periodStarts,
    excludedCycleStarts: state.excludedCycleStarts.filter((item) => periodStarts.includes(item)),
    entries: {
      ...state.entries,
      [date]: {
        ...(state.entries[date] ?? emptyAuraEntry(date)),
        updatedAt: new Date().toISOString(),
      },
    },
  };
}

export function setAuraCycleExcluded(state: AuraState, start: string, excluded: boolean): AuraState {
  const starts = normalizePeriodStartDates(state.periodStarts.filter((date) => isValidAuraDate(date)));
  if (!starts.slice(0, -1).includes(start)) return state;
  return {
    ...state,
    excludedCycleStarts: excluded
      ? Array.from(new Set([...state.excludedCycleStarts, start])).sort()
      : state.excludedCycleStarts.filter((item) => item !== start),
  };
}

export function setAuraPeriodEnd(state: AuraState, date: string, marked: boolean): AuraState {
  if (!isValidAuraDate(date)) return state;
  const starts = normalizePeriodStartDates(state.periodStarts);
  const episodeStart = [...starts].reverse().find((start) => start <= date);
  const nextStart = episodeStart ? starts[starts.indexOf(episodeStart) + 1] : undefined;
  if (marked && (!episodeStart || (nextStart && date >= nextStart))) return state;
  const periodEnds = marked
    ? Array.from(new Set([...state.periodEnds, date])).sort()
    : state.periodEnds.filter((item) => item !== date);
  return {
    ...state,
    selectedDate: date,
    periodEnds,
    entries: {
      ...state.entries,
      [date]: {
        ...(state.entries[date] ?? emptyAuraEntry(date)),
        updatedAt: new Date().toISOString(),
      },
    },
  };
}

export type AuraPeriodEpisode = {
  start: string;
  nextCycleStart: string | null;
  status: 'ongoing' | 'confirmed' | 'unknown';
  confirmedEnd: string | null;
  duration: number | null;
  observedDays: number;
  lastObservedDate: string;
};

export function getAuraPeriodEpisodes(state: AuraState, today = AURA_TODAY): AuraPeriodEpisode[] {
  const starts = normalizePeriodStartDates(state.periodStarts.filter((date) => isValidAuraDate(date, today)));
  return starts.map((start, index) => {
    const nextCycleStart = starts[index + 1] ?? null;
    const confirmedEnd = state.periodEnds
      .filter((date) => date >= start && (!nextCycleStart || date < nextCycleStart))
      .sort()[0] ?? null;
    const observedDates = Array.from(new Set([
      start,
      ...Object.entries(state.entries).flatMap(([date, entry]) => {
        const inEpisode = date >= start && (!nextCycleStart || date < nextCycleStart);
        const periodMarked = Boolean(entry.period && entry.period !== 'none');
        const bleedingMarked = entry.periodCheckin?.bleedingType === 'period-start' || entry.periodCheckin?.bleedingType === 'period-ongoing';
        return inEpisode && (periodMarked || bleedingMarked) ? [date] : [];
      }),
    ])).sort();
    const lastObservedDate = observedDates[observedDates.length - 1] ?? start;
    const status: AuraPeriodEpisode['status'] = confirmedEnd
      ? 'confirmed'
      : !nextCycleStart && lastObservedDate >= today ? 'ongoing'
        : 'unknown';
    return {
      start,
      nextCycleStart,
      status,
      confirmedEnd,
      duration: confirmedEnd ? daysBetween(start, confirmedEnd) + 1 : null,
      observedDays: observedDates.length,
      lastObservedDate,
    };
  });
}

export function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const result = new Date(Date.UTC(year, month - 1, day + days));
  return `${result.getUTCFullYear()}-${String(result.getUTCMonth() + 1).padStart(2, '0')}-${String(result.getUTCDate()).padStart(2, '0')}`;
}

export function daysBetween(start: string, end: string): number {
  const [startYear, startMonth, startDay] = start.split('-').map(Number);
  const [endYear, endMonth, endDay] = end.split('-').map(Number);
  return Math.round((Date.UTC(endYear, endMonth - 1, endDay) - Date.UTC(startYear, startMonth - 1, startDay)) / 86_400_000);
}

const median = (values: number[]): number => {
  const sorted = [...values].sort((left, right) => left - right);
  if (!sorted.length) return 0;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
};

export type AuraCycleRangeTrend = {
  status: 'insufficient' | 'similar' | 'wider' | 'narrower';
  title: string;
  description: string;
  recentSpread: number | null;
  previousSpread: number | null;
};

export function getAuraCycleRangeTrend(cycleLengths: number[]): AuraCycleRangeTrend {
  if (cycleLengths.length < 6) {
    return {
      status: 'insufficient',
      title: 'Пока формируется личная картина',
      description: `Для сравнения нужны шесть завершённых циклов. Сейчас сохранено ${cycleLengths.length}.`,
      recentSpread: null,
      previousSpread: null,
    };
  }

  const groupSize = cycleLengths.length >= 12 ? 6 : 3;
  const comparisonWindow = cycleLengths.slice(-(groupSize * 2));
  const previous = comparisonWindow.slice(0, groupSize);
  const recent = comparisonWindow.slice(groupSize);
  const spread = (values: number[]) => Math.max(...values) - Math.min(...values);
  const previousSpread = spread(previous);
  const recentSpread = spread(recent);
  const difference = recentSpread - previousSpread;
  const groupLabel = groupSize === 6 ? 'шести' : 'трёх';
  const comparison = `Разброс последних ${groupLabel} циклов — ${recentSpread} дн., предыдущих ${groupLabel} — ${previousSpread} дн.`;

  if (difference >= 2) {
    return { status: 'wider', title: 'Диапазон стал шире', description: comparison, recentSpread, previousSpread };
  }
  if (difference <= -2) {
    return { status: 'narrower', title: 'Диапазон стал уже', description: comparison, recentSpread, previousSpread };
  }
  return { status: 'similar', title: 'Цикл остаётся похожим', description: comparison, recentSpread, previousSpread };
}

export type AuraCycleMetrics = {
  starts: string[];
  currentStart: string | null;
  completedStarts: string[];
  excludedStarts: string[];
  cycleLengths: number[];
  completedCycles: number;
  historyStage: 'fact' | 'comparison' | 'preliminary' | 'personal' | 'long';
  averageLength: number | null;
  analysisCyclesUsed: number;
  forecastCyclesUsed: number;
  lastStart: string | null;
  cycleDay: number | null;
  expectedLength: number | null;
  personalMin: number | null;
  personalMax: number | null;
  daysLate: number;
  forecast: null | {
    start: string;
    end: string;
    confidence: 'preliminary' | 'growing' | 'personal';
    cyclesUsed: number;
  };
  periodForecast: null | {
    start: string;
    end: string;
    confidence: 'preliminary' | 'growing' | 'personal';
  };
};

export function getAuraCycleMetrics(state: AuraState, today = AURA_TODAY): AuraCycleMetrics {
  const starts = normalizePeriodStartDates(state.periodStarts.filter((date) => isValidAuraDate(date, today)));
  const excluded = new Set(state.excludedCycleStarts ?? []);
  const completed = starts.slice(0, -1).map((start, index) => ({ start, length: daysBetween(start, starts[index + 1]) }))
    .filter(({ length }) => length >= 18 && length <= 60);
  const includedCompleted = completed.filter(({ start }) => !excluded.has(start));
  const completedStarts = includedCompleted.map(({ start }) => start);
  const excludedStarts = completed.filter(({ start }) => excluded.has(start)).map(({ start }) => start);
  const cycleLengths = includedCompleted.map(({ length }) => length);
  const recent = cycleLengths.slice(-6);
  const forecastHistory = cycleLengths.slice(-12);
  const historyStage: AuraCycleMetrics['historyStage'] = cycleLengths.length >= 12 ? 'long'
    : cycleLengths.length >= 6 ? 'personal'
      : cycleLengths.length >= 3 ? 'preliminary'
        : cycleLengths.length >= 2 ? 'comparison' : 'fact';
  const fallback = Math.round(clamp(state.onboarding.cycleLength, 18, 60) ?? 28);
  const expectedLength = starts.length ? (forecastHistory.length >= 3 ? median(forecastHistory) : fallback) : null;
  const lastStart = starts[starts.length - 1] ?? null;
  const cycleDay = lastStart ? daysBetween(lastStart, today) + 1 : null;
  let forecast: AuraCycleMetrics['forecast'] = null;
  if (lastStart && expectedLength) {
    const preliminarySpread = state.onboarding.cyclePattern === 'stable' ? 2
      : state.onboarding.cyclePattern === 'changes' ? 4
        : state.onboarding.cyclePattern === 'irregular' ? 10 : 7;
    const hasPersonalForecast = forecastHistory.length >= 3;
    const minLength = hasPersonalForecast ? Math.min(...forecastHistory) : Math.max(18, expectedLength - preliminarySpread);
    const maxLength = hasPersonalForecast ? Math.max(...forecastHistory) : Math.min(60, expectedLength + preliminarySpread);
    const start = addDays(lastStart, minLength);
    const end = addDays(lastStart, maxLength);
    forecast = {
      start,
      end,
      confidence: forecastHistory.length >= 6 ? 'personal' : forecastHistory.length >= 3 ? 'growing' : 'preliminary',
      cyclesUsed: hasPersonalForecast ? forecastHistory.length : 0,
    };
  }
  const expectedPeriodLength = Math.round(clamp(state.onboarding.periodLength, 1, 10) ?? 5);
  const periodForecast = lastStart && expectedLength ? {
    start: addDays(lastStart, expectedLength),
    end: addDays(lastStart, expectedLength + expectedPeriodLength - 1),
    confidence: forecast?.confidence ?? 'preliminary' as const,
  } : null;
  const daysLate = forecast && forecast.cyclesUsed > 0 && forecast.end < today ? daysBetween(forecast.end, today) : 0;
  return {
    starts,
    currentStart: starts[starts.length - 1] ?? null,
    completedStarts,
    excludedStarts,
    cycleLengths,
    completedCycles: cycleLengths.length,
    historyStage,
    averageLength: recent.length >= 3 ? Math.round(recent.reduce((sum, value) => sum + value, 0) / recent.length) : null,
    analysisCyclesUsed: recent.length >= 3 ? recent.length : 0,
    forecastCyclesUsed: forecastHistory.length >= 3 ? forecastHistory.length : 0,
    lastStart,
    cycleDay: cycleDay && cycleDay > 0 ? cycleDay : null,
    expectedLength,
    personalMin: recent.length >= 3 ? Math.min(...recent) : null,
    personalMax: recent.length >= 3 ? Math.max(...recent) : null,
    daysLate,
    forecast,
    periodForecast,
  };
}

function cycleStartForDate(starts: string[], date: string): string | null {
  let current: string | null = null;
  for (const start of starts) {
    if (start > date) break;
    current = start;
  }
  return current;
}

export type AttentionEvidence = {
  eligible: boolean;
  painDays: number;
  severeDays: number;
  impactDays: number;
  cycles: number;
  key: string;
  entries: Array<{ date: string; value: number; cycleStart: string; affectsLife: boolean }>;
};

export function deriveAttentionEvidence(state: AuraState): AttentionEvidence {
  const metrics = getAuraCycleMetrics(state);
  const starts = metrics.starts;
  const completedStarts = new Set(metrics.completedStarts);
  const painEntries = Object.entries(state.entries)
    .flatMap(([date, day]) => day.symptoms
      .filter((symptom) => symptom.id === 'pain' && symptom.severity >= 2)
      .map((symptom) => ({ date, cycleStart: cycleStartForDate(starts, date), ...symptom })))
    .filter((item) => Boolean(item.cycleStart && completedStarts.has(item.cycleStart)))
    .sort((left, right) => left.date.localeCompare(right.date));
  const severeDays = painEntries.filter((item) => item.severity === 3).length;
  const impactDays = painEntries.filter((item) => item.affectsLife).length;
  const cycles = new Set(painEntries.map((item) => item.cycleStart)).size;
  const key = painEntries.map((item) => `${item.date}:${item.cycleStart}:${item.severity}:${Number(item.affectsLife)}`).join('|');
  return {
    eligible: painEntries.length >= 3 && cycles >= 2 && (severeDays >= 2 || impactDays >= 2),
    painDays: painEntries.length,
    severeDays,
    impactDays,
    cycles,
    key,
    entries: painEntries.map(({ date, severity, cycleStart, affectsLife }) => ({ date, value: severity, cycleStart: cycleStart!, affectsLife })),
  };
}

export function shouldShowAttention(state: AuraState, today = AURA_TODAY): boolean {
  const evidence = deriveAttentionEvidence(state);
  if (!evidence.eligible) return false;
  if (state.attention.evidenceKey !== evidence.key) return true;
  return Boolean(state.attention.dismissedUntil && state.attention.dismissedUntil <= today);
}
