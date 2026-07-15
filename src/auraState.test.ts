import { beforeEach, describe, expect, it } from 'vitest';
import {
  AURA_STORAGE_KEY,
  AURA_TODAY,
  LEGACY_APP_STORAGE_KEY,
  LEGACY_AURA_STORAGE_KEY,
  addDays,
  clearAllMiraStorage,
  createEmptyAuraState,
  deriveAttentionEvidence,
  getAuraCycleMetrics,
  loadAuraState,
  migrateLegacyAppState,
  parseImportedAuraState,
  sanitizeAuraState,
  setAuraPeriodStart,
  shouldShowAttention,
  type AuraState,
} from './auraState';

const storage = new Map<string, string>();

beforeEach(() => {
  storage.clear();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    },
  });
});

const attentionState = (): AuraState => sanitizeAuraState({
  ...createEmptyAuraState(),
  periodStarts: ['2026-05-10', '2026-06-08', '2026-07-05'],
  entries: {
    '2026-05-10': { symptoms: [{ id: 'pain', label: 'Боль внизу живота', severity: 2, affectsLife: false }] },
    '2026-06-08': { symptoms: [{ id: 'pain', label: 'Боль внизу живота', severity: 3, affectsLife: true }] },
    '2026-06-10': { symptoms: [{ id: 'pain', label: 'Боль внизу живота', severity: 3, affectsLife: true }] },
    '2026-07-05': { symptoms: [{ id: 'pain', label: 'Боль внизу живота', severity: 2, affectsLife: false }] },
  },
});

describe('Mira unified state', () => {
  it('derives pain evidence from actual cycle starts rather than calendar months', () => {
    const evidence = deriveAttentionEvidence(attentionState());
    expect(evidence.eligible).toBe(true);
    expect(evidence.painDays).toBe(4);
    expect(evidence.cycles).toBe(3);
  });

  it('does not repeat dismissed evidence until the pause ends', () => {
    const state = attentionState();
    const evidence = deriveAttentionEvidence(state);
    const dismissed = {
      ...state,
      attention: { showCount: 1, evidenceKey: evidence.key, dismissedUntil: addDays(AURA_TODAY, 7) },
    };
    expect(shouldShowAttention(dismissed, AURA_TODAY)).toBe(false);
    expect(shouldShowAttention(dismissed, addDays(AURA_TODAY, 7))).toBe(true);
  });

  it('repairs settings, dates and unsafe health values', () => {
    const repaired = sanitizeAuraState({
      modules: { sleep: false },
      onboarding: { goal: 'forecast', focus: ['sleep', 'unknown'] },
      periodStarts: [AURA_TODAY, '2099-01-01', 'bad-date'],
      entries: {
        [AURA_TODAY]: { careItems: ['pads', 42], moods: 'bad', symptomsChecked: true, water: -500, steps: 999999, temperature: 50, weight: 5, intimacyAfter: ['pain', 'unknown'] },
        '2099-01-01': { symptoms: [] },
      },
    });
    expect(repaired.modules.sleep).toBe(false);
    expect(repaired.modules.cycle).toBe(true);
    expect(repaired.privacy.localOnly).toBe(true);
    expect(repaired.onboarding.goal).toBe('forecast');
    expect(repaired.onboarding.focus).toEqual(['sleep']);
    expect(repaired.periodStarts).toEqual([AURA_TODAY]);
    expect(repaired.entries).not.toHaveProperty('2099-01-01');
    expect(repaired.entries[AURA_TODAY]).toMatchObject({ careItems: ['pads'], moods: [], symptomsChecked: true, water: 0, steps: 100000, intimacyAfter: ['pain'] });
    expect(repaired.entries[AURA_TODAY].temperature).toBe(43);
    expect(repaired.entries[AURA_TODAY].weight).toBe(20);
  });

  it('preserves both yes and no intimacy answers as explicit private facts', () => {
    const repaired = sanitizeAuraState({
      entries: {
        [AURA_TODAY]: { intimate: false },
        [addDays(AURA_TODAY, -1)]: { intimate: true },
      },
    });
    expect(repaired.entries[AURA_TODAY].intimate).toBe(false);
    expect(repaired.entries[addDays(AURA_TODAY, -1)].intimate).toBe(true);
  });

  it('creates a genuinely empty state after full deletion', () => {
    const empty = createEmptyAuraState();
    expect(empty.entries).toEqual({});
    expect(empty.periodStarts).toEqual([]);
    expect(empty.savedArticles).toEqual([]);
    expect(empty.onboarding.completed).toBe(false);
    expect(shouldShowAttention(empty)).toBe(false);
  });

  it('marks a period start once and allows undo', () => {
    const empty = createEmptyAuraState();
    const marked = setAuraPeriodStart(setAuraPeriodStart(empty, AURA_TODAY, true), AURA_TODAY, true);
    expect(marked.periodStarts).toEqual([AURA_TODAY]);
    expect(marked.selectedDate).toBe(AURA_TODAY);
    expect(marked.entries[AURA_TODAY]).toBeDefined();
    expect(setAuraPeriodStart(marked, AURA_TODAY, false).periodStarts).toEqual([]);
  });

  it('calculates cycle day, personal range and a forecast from stored starts', () => {
    const state = sanitizeAuraState({
      ...createEmptyAuraState(),
      periodStarts: ['2026-04-12', '2026-05-10', '2026-06-08', '2026-07-05'],
    });
    const metrics = getAuraCycleMetrics(state, '2026-07-14');
    expect(metrics).toMatchObject({
      cycleLengths: [28, 29, 27],
      completedCycles: 3,
      cycleDay: 10,
      personalMin: 27,
      personalMax: 29,
      daysLate: 0,
      forecast: { start: '2026-08-01', end: '2026-08-03', confidence: 'personal', cyclesUsed: 3 },
    });
  });

  it('does not invent a forecast from a single period start', () => {
    const state = sanitizeAuraState({
      ...createEmptyAuraState(),
      periodStarts: ['2026-07-05'],
    });
    const metrics = getAuraCycleMetrics(state, '2026-07-14');
    expect(metrics.cycleDay).toBe(10);
    expect(metrics.completedCycles).toBe(0);
    expect(metrics.forecast).toBeNull();
    expect(metrics.daysLate).toBe(0);
  });

  it('keeps an overdue forecast visible instead of rolling it into a virtual future cycle', () => {
    const state = sanitizeAuraState({
      ...createEmptyAuraState(),
      periodStarts: ['2026-05-10', '2026-06-08'],
    });
    const metrics = getAuraCycleMetrics(state, '2026-07-15');
    expect(metrics.forecast).toMatchObject({ start: '2026-07-05', end: '2026-07-09', cyclesUsed: 1 });
    expect(metrics.daysLate).toBe(6);
  });

  it('migrates the previous AppState without losing daily records', () => {
    const migrated = migrateLegacyAppState({
      onboardingComplete: true,
      profile: { cycleLength: 29, periodLength: 5, reminderEnabled: true },
      periodDays: ['2026-06-08', '2026-06-09', '2026-07-05'],
      savedArticles: ['cycle-basics'],
      entries: {
        '2026-07-05': { waterMl: 1200, symptoms: ['Боль внизу живота'], symptomSeverity: { 'Боль внизу живота': 2 }, symptomsAffectDailyLife: true, moods: ['Спокойствие'], note: 'важно' },
      },
    });
    expect(migrated).not.toBeNull();
    expect(migrated?.periodStarts).toEqual(['2026-06-08', '2026-07-05']);
    expect(migrated?.entries['2026-07-05']).toMatchObject({ water: 1200, note: 'важно', symptoms: [{ id: 'pain', severity: 2, affectsLife: true }] });
  });

  it('rejects malformed imports instead of replacing them with demo data', () => {
    expect(() => parseImportedAuraState({ entries: {} })).toThrow('Invalid backup');
    expect(() => parseImportedAuraState('bad')).toThrow('Invalid backup');
  });

  it('migrates old storage once and clears every historical Mira key', () => {
    storage.set(LEGACY_APP_STORAGE_KEY, JSON.stringify({
      onboardingComplete: true,
      profile: { cycleLength: 28, periodLength: 5 },
      periodDays: [AURA_TODAY],
      entries: {},
      savedArticles: [],
    }));
    const loaded = loadAuraState();
    expect(loaded.periodStarts).toEqual([AURA_TODAY]);
    expect(storage.has(AURA_STORAGE_KEY)).toBe(true);
    storage.set(LEGACY_AURA_STORAGE_KEY, '{}');
    clearAllMiraStorage();
    expect(storage.size).toBe(0);
  });
});
