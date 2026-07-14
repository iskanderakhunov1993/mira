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
export type AuraHomeCardId = 'hormonoscope' | 'cycloscope' | 'rhythm' | 'recommendation' | 'knowledge';
export type AuraOnboardingGoal = 'today' | 'forecast' | 'patterns' | 'doctor';
export type AuraCyclePattern = 'stable' | 'changes' | 'irregular' | 'unknown';
export type AuraIntimacyComfort = 'comfortable' | 'discomfort' | 'pain';
export type AuraIntimacyAfter = 'none' | 'pain' | 'bleeding' | 'discharge';
export type AuraIntimacyDesire = 'lower' | 'usual' | 'higher';

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

export type AuraDayEntry = {
  rating?: number;
  period?: 'none' | 'light' | 'medium' | 'heavy';
  symptoms: AuraSymptom[];
  symptomsChecked?: boolean;
  moods: string[];
  energy?: number;
  sleepHours?: number;
  sleepQuality?: 'Плохое' | 'Обычное' | 'Хорошее';
  water?: number;
  steps?: number;
  activity?: string;
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
  selectedDate: string;
  entries: Record<string, AuraDayEntry>;
  periodStarts: string[];
  modules: Record<AuraModuleId, boolean>;
  homeCards: Record<AuraHomeCardId, boolean>;
  savedArticles: string[];
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
  selectedDate: AURA_TODAY,
  periodStarts: [],
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
    rhythm: true,
    recommendation: true,
    knowledge: true,
  },
  savedArticles: [],
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
const intimacyComfortValues: AuraIntimacyComfort[] = ['comfortable', 'discomfort', 'pain'];
const intimacyAfterValues: AuraIntimacyAfter[] = ['none', 'pain', 'bleeding', 'discharge'];
const intimacyDesireValues: AuraIntimacyDesire[] = ['lower', 'usual', 'higher'];
const periodValues: AuraDayEntry['period'][] = ['none', 'light', 'medium', 'heavy'];
const sleepQualityValues: NonNullable<AuraDayEntry['sleepQuality']>[] = ['Плохое', 'Обычное', 'Хорошее'];

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
    symptoms: sanitizeSymptoms(raw.symptoms),
    symptomsChecked: typeof raw.symptomsChecked === 'boolean' ? raw.symptomsChecked : undefined,
    moods: Array.isArray(raw.moods) ? raw.moods.filter((item): item is string => typeof item === 'string').map((item) => item.slice(0, 80)) : [],
    energy: energy ? Math.round(energy) : undefined,
    sleepHours,
    sleepQuality,
    water: water === undefined ? undefined : Math.round(water),
    steps: steps === undefined ? undefined : Math.round(steps),
    activity: typeof raw.activity === 'string' ? raw.activity.slice(0, 120) : undefined,
    intimate: raw.intimate === true ? true : undefined,
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
  const cycleLength = clamp(rawOnboarding.cycleLength, 18, 60);
  const periodLength = clamp(rawOnboarding.periodLength, 1, 14);
  const selectedDate = isValidAuraDate(candidate.selectedDate) ? candidate.selectedDate : AURA_TODAY;
  return {
    version: 3,
    selectedDate,
    entries,
    periodStarts: Array.isArray(candidate.periodStarts)
      ? Array.from(new Set(candidate.periodStarts.filter((item): item is string => isValidAuraDate(item)))).sort()
      : [],
    modules: Object.fromEntries(moduleIds.map((id) => [id, typeof rawModules[id] === 'boolean' ? rawModules[id] : defaultAuraState.modules[id]])) as Record<AuraModuleId, boolean>,
    homeCards: Object.fromEntries(homeCardIds.map((id) => [id, typeof rawHomeCards[id] === 'boolean' ? rawHomeCards[id] : defaultAuraState.homeCards[id]])) as Record<AuraHomeCardId, boolean>,
    savedArticles: Array.isArray(candidate.savedArticles) ? Array.from(new Set(candidate.savedArticles.filter((item): item is string => typeof item === 'string').map((item) => item.slice(0, 120)))) : [],
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
    entries: {
      ...state.entries,
      [date]: {
        ...(state.entries[date] ?? emptyAuraEntry(date)),
        updatedAt: new Date().toISOString(),
      },
    },
  };
}

export function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return toIsoDate(new Date(year, month - 1, day + days));
}

export function daysBetween(start: string, end: string): number {
  const [startYear, startMonth, startDay] = start.split('-').map(Number);
  const [endYear, endMonth, endDay] = end.split('-').map(Number);
  return Math.round((new Date(endYear, endMonth - 1, endDay).getTime() - new Date(startYear, startMonth - 1, startDay).getTime()) / 86_400_000);
}

const median = (values: number[]): number => {
  const sorted = [...values].sort((left, right) => left - right);
  if (!sorted.length) return 0;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
};

export type AuraCycleMetrics = {
  starts: string[];
  cycleLengths: number[];
  completedCycles: number;
  lastStart: string | null;
  cycleDay: number | null;
  expectedLength: number | null;
  personalMin: number | null;
  personalMax: number | null;
  forecast: null | {
    start: string;
    end: string;
    confidence: 'preliminary' | 'growing' | 'personal';
    cyclesUsed: number;
  };
};

export function getAuraCycleMetrics(state: AuraState, today = AURA_TODAY): AuraCycleMetrics {
  const starts = state.periodStarts.filter((date) => isValidAuraDate(date, today)).sort();
  const cycleLengths = starts.slice(1).map((start, index) => daysBetween(starts[index], start)).filter((length) => length >= 18 && length <= 60);
  const recent = cycleLengths.slice(-6);
  const fallback = Math.round(clamp(state.onboarding.cycleLength, 18, 60) ?? 28);
  const expectedLength = starts.length ? (recent.length ? median(recent) : fallback) : null;
  const lastStart = starts[starts.length - 1] ?? null;
  const cycleDay = lastStart ? daysBetween(lastStart, today) + 1 : null;
  let forecast: AuraCycleMetrics['forecast'] = null;
  if (lastStart && expectedLength) {
    const minLength = recent.length >= 2 ? Math.min(...recent) : Math.max(18, expectedLength - 2);
    const maxLength = recent.length >= 2 ? Math.max(...recent) : Math.min(60, expectedLength + 2);
    let start = addDays(lastStart, minLength);
    let end = addDays(lastStart, maxLength);
    let guard = 0;
    while (end < today && guard < 24) {
      start = addDays(start, expectedLength);
      end = addDays(end, expectedLength);
      guard += 1;
    }
    forecast = {
      start,
      end,
      confidence: recent.length >= 3 ? 'personal' : recent.length >= 1 ? 'growing' : 'preliminary',
      cyclesUsed: recent.length,
    };
  }
  return {
    starts,
    cycleLengths,
    completedCycles: cycleLengths.length,
    lastStart,
    cycleDay: cycleDay && cycleDay > 0 ? cycleDay : null,
    expectedLength,
    personalMin: recent.length >= 3 ? Math.min(...recent) : null,
    personalMax: recent.length >= 3 ? Math.max(...recent) : null,
    forecast,
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
  entries: Array<{ date: string; value: number }>;
};

export function deriveAttentionEvidence(state: AuraState): AttentionEvidence {
  const starts = getAuraCycleMetrics(state).starts;
  const painEntries = Object.entries(state.entries)
    .flatMap(([date, day]) => day.symptoms
      .filter((symptom) => symptom.id === 'pain' && symptom.severity >= 2)
      .map((symptom) => ({ date, cycleStart: cycleStartForDate(starts, date), ...symptom })))
    .filter((item) => Boolean(item.cycleStart))
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
    entries: painEntries.map(({ date, severity }) => ({ date, value: severity })),
  };
}

export function shouldShowAttention(state: AuraState, today = AURA_TODAY): boolean {
  const evidence = deriveAttentionEvidence(state);
  if (!evidence.eligible) return false;
  if (state.attention.evidenceKey !== evidence.key) return true;
  return Boolean(state.attention.dismissedUntil && state.attention.dismissedUntil <= today);
}
