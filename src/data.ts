import type { AppState, DailyMetric, DayEntry, Profile, TrackingModule } from './types';

const STORAGE_KEY = 'luna-flow-state-v1';

export const todayIso = () => toIsoDate(new Date());

export const defaultProfile: Profile = {
  name: '',
  birthDate: '',
  cycleLength: 28,
  periodLength: 5,
  waterGoalMl: 1800,
  trackingMode: 'cycle',
  trackingModules: ['cycle', 'wellbeing', 'sleep'],
  dailyMetrics: ['water', 'nutrition', 'steps'],
  showHormonoscope: false,
  showCycloscope: false,
  reminderEnabled: false,
  reminderTime: '20:00',
};

const trackingModules: TrackingModule[] = ['cycle', 'wellbeing', 'sleep', 'body', 'personal'];
const dailyMetrics: DailyMetric[] = ['water', 'nutrition', 'steps'];

export const defaultState: AppState = {
  onboardingComplete: false,
  profile: defaultProfile,
  periodDays: [],
  periodEnds: [],
  entries: {},
  savedArticles: [],
};

export type BackupOptions = {
  cycle: boolean;
  wellbeing: boolean;
  lifestyle: boolean;
  notes: boolean;
  intimate: boolean;
};

export function createBackupPayload(state: AppState, options: BackupOptions) {
  const entries = Object.fromEntries(Object.entries(state.entries).map(([date, entry]) => {
    const exported: Partial<DayEntry> & { date: string } = { date };
    if (options.cycle) Object.assign(exported, { flow: entry.flow });
    if (options.wellbeing) Object.assign(exported, {
      dayRating: entry.dayRating,
      mood: entry.mood,
      moods: entry.moods,
      pain: entry.pain,
      energy: entry.energy,
      symptoms: entry.symptoms,
      symptomSeverity: entry.symptomSeverity,
      symptomsAffectDailyLife: entry.symptomsAffectDailyLife,
      digestion: entry.digestion,
    });
    if (options.lifestyle) Object.assign(exported, {
      waterMl: entry.waterMl,
      sleepHours: entry.sleepHours,
      sleepQuality: entry.sleepQuality,
      appetite: entry.appetite,
      steps: entry.steps,
      calories: entry.calories,
      activity: entry.activity,
      basalTemperature: entry.basalTemperature,
      weightKg: entry.weightKg,
    });
    if (options.notes) Object.assign(exported, { note: entry.note, contextTags: entry.contextTags });
    if (options.intimate) Object.assign(exported, { hadSex: entry.hadSex, discharge: entry.discharge });
    return [date, exported];
  }));

  return {
    ...state,
    periodDays: options.cycle ? state.periodDays : [],
    periodEnds: options.cycle ? state.periodEnds : [],
    entries,
    doctorReportDraft: undefined,
    exportMeta: { createdAt: todayIso(), included: options },
  };
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function isValidPastOrTodayIsoDate(value: unknown, today = todayIso()): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = parseIsoDate(value);
  return !Number.isNaN(parsed.getTime()) && toIsoDate(parsed) === value && value <= today;
}

export function sanitizeState(state: AppState): AppState {
  const selectedModules = Array.isArray(state.profile?.trackingModules)
    ? state.profile.trackingModules.filter((module): module is TrackingModule => trackingModules.includes(module as TrackingModule))
    : [];
  const selectedDailyMetrics = Array.isArray(state.profile?.dailyMetrics)
    ? state.profile.dailyMetrics.filter((metric): metric is DailyMetric => dailyMetrics.includes(metric as DailyMetric))
    : defaultProfile.dailyMetrics;
  const reportDraft = state.doctorReportDraft;
  const entries = Object.entries(state.entries).reduce<Record<string, DayEntry>>((result, [date, entry]) => {
    if (!isValidPastOrTodayIsoDate(date) || !entry || typeof entry !== 'object') return result;
    const severity = Object.entries(entry.symptomSeverity ?? {}).reduce<Record<string, 1 | 2 | 3>>((values, [symptom, raw]) => {
      const value = Number(raw);
      if (entry.symptoms?.includes(symptom) && (value === 1 || value === 2 || value === 3)) values[symptom] = value;
      return values;
    }, {});
    result[date] = {
      ...createDayEntry(date),
      ...entry,
      date,
      waterMl: Number.isFinite(entry.waterMl) ? Math.max(0, Math.min(20000, Number(entry.waterMl))) : 0,
      sleepHours: Number.isFinite(entry.sleepHours) ? Math.max(0, Math.min(24, Number(entry.sleepHours))) : undefined,
      steps: Number.isFinite(entry.steps) ? Math.max(0, Math.min(100000, Number(entry.steps))) : undefined,
      calories: Number.isFinite(entry.calories) ? Math.max(0, Math.min(10000, Number(entry.calories))) : undefined,
      pain: [0, 1, 2, 3].includes(Number(entry.pain)) ? entry.pain : undefined,
      flow: [0, 1, 2, 3].includes(Number(entry.flow)) ? entry.flow : undefined,
      energy: [1, 2, 3, 4, 5].includes(Number(entry.energy)) ? entry.energy : undefined,
      dayRating: [1, 2, 3, 4, 5].includes(Number(entry.dayRating)) ? entry.dayRating : undefined,
      basalTemperature: Number.isFinite(entry.basalTemperature) && Number(entry.basalTemperature) >= 34 && Number(entry.basalTemperature) <= 43 ? Number(entry.basalTemperature) : undefined,
      weightKg: Number.isFinite(entry.weightKg) && Number(entry.weightKg) >= 20 && Number(entry.weightKg) <= 300 ? Number(entry.weightKg) : undefined,
      symptomsChecked: typeof entry.symptomsChecked === 'boolean' ? entry.symptomsChecked : entry.symptoms?.length ? true : undefined,
      symptomSeverity: severity,
      symptomsAffectDailyLife: typeof entry.symptomsAffectDailyLife === 'boolean' ? entry.symptomsAffectDailyLife : undefined,
    };
    return result;
  }, {});
  return {
    ...state,
    profile: {
      ...defaultProfile,
      ...state.profile,
      trackingModules: selectedModules.length ? selectedModules : defaultProfile.trackingModules,
      dailyMetrics: selectedDailyMetrics,
      trackingMode: state.profile?.trackingMode === 'wellbeing-only' ? 'wellbeing-only' : 'cycle',
      showHormonoscope: typeof state.profile?.showHormonoscope === 'boolean' ? state.profile.showHormonoscope : false,
      showCycloscope: typeof state.profile?.showCycloscope === 'boolean' ? state.profile.showCycloscope : false,
      reminderEnabled: state.profile?.reminderEnabled === true,
      reminderTime: typeof state.profile?.reminderTime === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(state.profile.reminderTime) ? state.profile.reminderTime : defaultProfile.reminderTime,
    },
    periodDays: Array.from(new Set(state.periodDays.filter((date) => isValidPastOrTodayIsoDate(date)))).sort(),
    periodEnds: Array.from(new Set((state.periodEnds ?? []).filter((date) => isValidPastOrTodayIsoDate(date)))).sort(),
    entries,
    lastBackupAt: isValidPastOrTodayIsoDate(state.lastBackupAt) ? state.lastBackupAt : undefined,
    insightFeedback: Object.entries(state.insightFeedback ?? {}).reduce<Record<string, 'helpful' | 'not-helpful'>>((result, [key, value]) => {
      if (value === 'helpful' || value === 'not-helpful') result[key.slice(0, 120)] = value;
      return result;
    }, {}),
    doctorReportDraft: reportDraft && typeof reportDraft === 'object' ? {
      period: ['3', '6', 'all'].includes(reportDraft.period) ? reportDraft.period : '3',
      questions: typeof reportDraft.questions === 'string' ? reportDraft.questions.slice(0, 5000) : '',
      included: {
        cycles: reportDraft.included?.cycles !== false,
        pain: reportDraft.included?.pain !== false,
        symptoms: reportDraft.included?.symptoms !== false,
        wellbeing: reportDraft.included?.wellbeing !== false,
        sleep: reportDraft.included?.sleep !== false,
        lifestyle: reportDraft.included?.lifestyle !== false,
        measurements: reportDraft.included?.measurements !== false,
        questions: reportDraft.included?.questions !== false,
        notes: reportDraft.included?.notes === true,
        sex: reportDraft.included?.sex === true,
      },
      updatedAt: isValidPastOrTodayIsoDate(reportDraft.updatedAt) ? reportDraft.updatedAt : todayIso(),
      excludedCycleStarts: Array.from(new Set((reportDraft.excludedCycleStarts ?? []).filter((date) => isValidPastOrTodayIsoDate(date)))).sort(),
    } : undefined,
  };
}

export function addDays(value: string, days: number): string {
  const date = parseIsoDate(value);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

export function daysBetween(start: string, end: string): number {
  const startTime = parseIsoDate(start).getTime();
  const endTime = parseIsoDate(end).getTime();
  return Math.round((endTime - startTime) / 86_400_000);
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return sanitizeState({
      onboardingComplete: parsed.onboardingComplete ?? false,
      profile: { ...defaultProfile, ...parsed.profile },
      periodDays: Array.isArray(parsed.periodDays) ? parsed.periodDays : [],
      periodEnds: Array.isArray(parsed.periodEnds) ? parsed.periodEnds : [],
      entries: parsed.entries ?? {},
      savedArticles: Array.isArray(parsed.savedArticles) ? parsed.savedArticles : [],
      lastBackupAt: parsed.lastBackupAt,
      doctorReportDraft: parsed.doctorReportDraft,
      insightFeedback: parsed.insightFeedback,
    });
  } catch {
    return defaultState;
  }
}

export function parseImportedState(value: unknown, fallback: AppState = defaultState): AppState {
  if (!value || typeof value !== 'object') throw new Error('Invalid backup');
  const parsed = value as Partial<AppState>;
  if (!parsed.profile || typeof parsed.profile !== 'object' || !Array.isArray(parsed.periodDays) || !parsed.entries || typeof parsed.entries !== 'object') {
    throw new Error('Invalid backup');
  }
  return sanitizeState({
    onboardingComplete: true,
    profile: { ...fallback.profile, ...parsed.profile },
    periodDays: parsed.periodDays,
    periodEnds: Array.isArray(parsed.periodEnds) ? parsed.periodEnds : [],
    entries: parsed.entries,
    savedArticles: Array.isArray(parsed.savedArticles) ? parsed.savedArticles.filter((item): item is string => typeof item === 'string') : [],
    lastBackupAt: parsed.lastBackupAt,
    doctorReportDraft: parsed.doctorReportDraft,
    insightFeedback: parsed.insightFeedback,
  });
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeState(state)));
}

export function createDayEntry(date: string): DayEntry {
  return {
    date,
    waterMl: 0,
    hadSex: false,
    moods: [],
    symptoms: [],
    discharge: [],
    digestion: [],
    contextTags: [],
    symptomSeverity: {},
    note: '',
  };
}

export function resetState(): void {
  localStorage.removeItem(STORAGE_KEY);
}
