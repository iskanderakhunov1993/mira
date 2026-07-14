export const AURA_STORAGE_KEY = 'luna-flow-aura-v2';
export const AURA_TODAY = '2026-07-14';

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
  version: 2;
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

const entry = (value: Partial<AuraDayEntry>): AuraDayEntry => ({
  symptoms: [],
  moods: [],
  nutrition: [],
  contexts: [],
  updatedAt: `${AURA_TODAY}T09:41:00`,
  ...value,
});

export const defaultAuraState: AuraState = {
  version: 2,
  selectedDate: AURA_TODAY,
  periodStarts: ['2026-05-10', '2026-06-08', '2026-07-05'],
  entries: {
    '2026-06-08': entry({ period: 'medium', symptoms: [{ id: 'pain', label: 'Боль внизу живота', severity: 2, affectsLife: false }] }),
    '2026-06-10': entry({ period: 'light', symptoms: [{ id: 'pain', label: 'Боль внизу живота', severity: 3, affectsLife: true }], rating: 2 }),
    '2026-07-05': entry({ period: 'medium', moods: ['Спокойствие'], rating: 3 }),
    '2026-07-09': entry({ period: 'light', rating: 4, water: 1600, temperature: 36.5, weight: 58.8 }),
    '2026-07-11': entry({ symptoms: [{ id: 'fatigue', label: 'Усталость', severity: 1, affectsLife: false }], energy: 3, sleepHours: 6.8, sleepQuality: 'Обычное', temperature: 36.6, weight: 58.7 }),
    '2026-07-12': entry({ symptoms: [{ id: 'pain', label: 'Боль внизу живота', severity: 3, affectsLife: true }], rating: 2, moods: ['Тревога'] }),
    '2026-07-13': entry({ rating: 4, moods: ['Спокойствие', 'Радость'], energy: 4, water: 1800, sleepHours: 7.2, sleepQuality: 'Хорошее', temperature: 36.7, weight: 58.5 }),
    '2026-07-14': entry({
      rating: 3,
      symptoms: [{ id: 'pain', label: 'Боль внизу живота', severity: 2, affectsLife: false }],
      moods: [],
      energy: 3,
      sleepHours: 7.5,
      sleepQuality: 'Хорошее',
      water: 1200,
      steps: 6420,
      calories: 1780,
      temperature: 36.6,
      weight: 58.4,
      nutrition: [],
      contexts: [],
    }),
  },
  modules: {
    cycle: true,
    mood: true,
    sleep: true,
    daily: true,
    activity: true,
    intimate: false,
    nutrition: true,
    body: true,
    note: true,
  },
  homeCards: {
    hormonoscope: true,
    cycloscope: true,
    rhythm: true,
    recommendation: true,
    knowledge: true,
  },
  savedArticles: ['cycle-length'],
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

const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const intimacyComfortValues: AuraIntimacyComfort[] = ['comfortable', 'discomfort', 'pain'];
const intimacyAfterValues: AuraIntimacyAfter[] = ['none', 'pain', 'bleeding', 'discharge'];
const intimacyDesireValues: AuraIntimacyDesire[] = ['lower', 'usual', 'higher'];

export function sanitizeAuraState(value: unknown): AuraState {
  if (!isObject(value)) return structuredClone(defaultAuraState);
  const candidate = value as Partial<AuraState>;
  const sanitizedEntries = isObject(candidate.entries)
    ? Object.fromEntries(Object.entries(candidate.entries).flatMap(([date, raw]) => {
      if (!isObject(raw)) return [];
      return [[date, entry({
        ...raw,
        symptoms: Array.isArray(raw.symptoms) ? raw.symptoms as AuraSymptom[] : [],
        symptomsChecked: typeof raw.symptomsChecked === 'boolean' ? raw.symptomsChecked : undefined,
        moods: Array.isArray(raw.moods) ? raw.moods.filter((item): item is string => typeof item === 'string') : [],
        nutrition: Array.isArray(raw.nutrition) ? raw.nutrition.filter((item): item is string => typeof item === 'string') : [],
        contexts: Array.isArray(raw.contexts) ? raw.contexts.filter((item): item is string => typeof item === 'string') : [],
        careItems: Array.isArray(raw.careItems) ? raw.careItems.filter((item): item is string => typeof item === 'string') : [],
        intimate: raw.intimate === true ? true : undefined,
        intimacyComfort: typeof raw.intimacyComfort === 'string' && intimacyComfortValues.includes(raw.intimacyComfort as AuraIntimacyComfort) ? raw.intimacyComfort as AuraIntimacyComfort : undefined,
        intimacyAfter: Array.isArray(raw.intimacyAfter) ? raw.intimacyAfter.filter((item): item is AuraIntimacyAfter => typeof item === 'string' && intimacyAfterValues.includes(item as AuraIntimacyAfter)) : [],
        intimacyDesire: typeof raw.intimacyDesire === 'string' && intimacyDesireValues.includes(raw.intimacyDesire as AuraIntimacyDesire) ? raw.intimacyDesire as AuraIntimacyDesire : undefined,
        intimacyNote: typeof raw.intimacyNote === 'string' ? raw.intimacyNote.slice(0, 1000) : undefined,
      } as Partial<AuraDayEntry>)]];
    }))
    : structuredClone(defaultAuraState.entries);
  return {
    ...structuredClone(defaultAuraState),
    ...candidate,
    version: 2,
    entries: sanitizedEntries,
    modules: { ...defaultAuraState.modules, ...(isObject(candidate.modules) ? candidate.modules : {}) },
    homeCards: { ...defaultAuraState.homeCards, ...(isObject(candidate.homeCards) ? candidate.homeCards : {}) },
    privacy: { ...defaultAuraState.privacy, ...(isObject(candidate.privacy) ? candidate.privacy : {}) },
    onboarding: {
      ...defaultAuraState.onboarding,
      ...(isObject(candidate.onboarding) ? candidate.onboarding : {}),
      focus: isObject(candidate.onboarding) && Array.isArray(candidate.onboarding.focus)
        ? candidate.onboarding.focus.filter((item): item is AuraModuleId => typeof item === 'string' && item in defaultAuraState.modules)
        : [],
    },
    attention: { ...defaultAuraState.attention, ...(isObject(candidate.attention) ? candidate.attention : {}) },
    savedArticles: Array.isArray(candidate.savedArticles) ? candidate.savedArticles.filter((item): item is string => typeof item === 'string') : [],
    periodStarts: Array.isArray(candidate.periodStarts) ? candidate.periodStarts.filter((item): item is string => typeof item === 'string') : [],
  };
}

export function loadAuraState(): AuraState {
  try {
    const stored = localStorage.getItem(AURA_STORAGE_KEY);
    return stored ? sanitizeAuraState(JSON.parse(stored)) : structuredClone(defaultAuraState);
  } catch {
    return structuredClone(defaultAuraState);
  }
}

export function persistAuraState(state: AuraState): boolean {
  try {
    localStorage.setItem(AURA_STORAGE_KEY, JSON.stringify(sanitizeAuraState(state)));
    return true;
  } catch {
    return false;
  }
}

export function emptyAuraEntry(): AuraDayEntry {
  return entry({ updatedAt: `${AURA_TODAY}T09:41:00` });
}

export function createEmptyAuraState(): AuraState {
  return {
    ...structuredClone(defaultAuraState),
    entries: {},
    periodStarts: [],
    savedArticles: [],
    onboarding: structuredClone(defaultAuraState.onboarding),
    attention: { showCount: 0 },
  };
}

export function setAuraPeriodStart(state: AuraState, date: string, marked: boolean): AuraState {
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
        ...(state.entries[date] ?? emptyAuraEntry()),
        updatedAt: `${date}T09:41:00`,
      },
    },
  };
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
  const painEntries = Object.entries(state.entries)
    .flatMap(([date, day]) => day.symptoms.filter((symptom) => symptom.id === 'pain').map((symptom) => ({ date, ...symptom })))
    .sort((a, b) => a.date.localeCompare(b.date));
  const severeDays = painEntries.filter((item) => item.severity === 3).length;
  const impactDays = painEntries.filter((item) => item.affectsLife).length;
  const cycles = new Set(painEntries.map((item) => item.date.slice(0, 7))).size;
  const key = painEntries.map((item) => `${item.date}:${item.severity}:${Number(item.affectsLife)}`).join('|');
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

export function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day + days);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
