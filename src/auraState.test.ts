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
  getAuraCycleRangeTrend,
  getAuraDayCoverage,
  getAuraObservationDates,
  getAuraPeriodEpisodes,
  getAuraSafetyFacts,
  loadAuraState,
  migrateLegacyAppState,
  parseImportedAuraState,
  sanitizeAuraState,
  setAuraCycleExcluded,
  setAuraPeriodEnd,
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
  it('keeps completeness separate by data direction', () => {
    const today = AURA_TODAY;
    const yesterday = addDays(today, -1);
    const twoDaysAgo = addDays(today, -2);
    const state = sanitizeAuraState({
      entries: {
        [today]: { water: 1200 },
        [yesterday]: { symptoms: [], symptomsChecked: true },
        [twoDaysAgo]: { symptoms: [{ id: 'pain', label: 'Боль', severity: 2, affectsLife: false }] },
      },
    });

    expect(getAuraDayCoverage(state, today)).toMatchObject({ cycle: 'other-only', symptoms: 'other-only', wellbeing: 'other-only', habits: 'recorded' });
    expect(getAuraDayCoverage(state, yesterday).symptoms).toBe('explicit-none');
    expect(getAuraDayCoverage(state, twoDaysAgo).symptoms).toBe('recorded');
    expect(getAuraDayCoverage(state, addDays(today, -3))).toEqual({ cycle: 'empty', symptoms: 'empty', wellbeing: 'empty', habits: 'empty' });
  });

  it('derives pain evidence from actual cycle starts rather than calendar months', () => {
    const evidence = deriveAttentionEvidence(attentionState());
    expect(evidence.eligible).toBe(true);
    expect(evidence.painDays).toBe(3);
    expect(evidence.cycles).toBe(2);
    expect(evidence.entries[0]).toMatchObject({ date: '2026-05-10', cycleStart: '2026-05-10', value: 2, affectsLife: false });
    expect(evidence.entries[1]).toMatchObject({ date: '2026-06-08', cycleStart: '2026-06-08', value: 3, affectsLife: true });
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
      avatar: 'turtle',
      modules: { sleep: false },
      homeCards: { dailyPlan: false },
      onboarding: { goal: 'forecast', focus: ['sleep', 'unknown'] },
      periodStarts: [AURA_TODAY, '2099-01-01', 'bad-date'],
      entries: {
        [AURA_TODAY]: { careItems: ['pads', 42], moods: 'bad', symptomsChecked: true, water: -500, steps: 999999, temperature: 50, weight: 5, intimacyAfter: ['pain', 'unknown'] },
        '2099-01-01': { symptoms: [] },
      },
    });
    expect(repaired.modules.sleep).toBe(false);
    expect(repaired.avatar).toBe('turtle');
    expect(repaired.modules.cycle).toBe(true);
    expect(repaired.homeCards.dailyPlan).toBe(false);
    expect(repaired.homeCards.recommendation).toBe(true);
    expect(repaired.privacy.localOnly).toBe(true);
    expect(repaired.onboarding.goal).toBe('forecast');
    expect(repaired.onboarding.focus).toEqual(['sleep']);
    expect(repaired.periodStarts).toEqual([AURA_TODAY]);
    expect(repaired.entries).not.toHaveProperty('2099-01-01');
    expect(repaired.entries[AURA_TODAY]).toMatchObject({ careItems: ['pads'], moods: [], symptomsChecked: true, water: 0, steps: 100000, intimacyAfter: ['pain'] });
    expect(repaired.entries[AURA_TODAY].temperature).toBe(43);
    expect(repaired.entries[AURA_TODAY].weight).toBe(20);
  });

  it('keeps configurable Today cards instead of removing them from the product', () => {
    const customized = sanitizeAuraState({
      homeCards: {
        rhythm: false,
        dailyPlan: false,
        hormonoscope: false,
        recommendation: false,
      },
    });

    expect(customized.homeCards).toMatchObject({
      rhythm: false,
      dailyPlan: false,
      hormonoscope: false,
      recommendation: false,
    });
  });

  it('keeps a valid period check-in and clamps its numeric answers', () => {
    const repaired = sanitizeAuraState({
      entries: {
        [AURA_TODAY]: {
          periodCheckin: {
            bleedingType: 'between-periods',
            overall: 'harder',
            flow: 'heavy',
            changeFrequency: '1-2h',
            hourlyBleedingHours: 52,
            largeClots: true,
            leaksThroughProtection: true,
            doubleProtection: false,
            nightChanges: true,
            durationDays: 44,
            painImpact: 'disrupts',
            painScore: 18,
            painLocations: ['Низ живота', 42],
            symptoms: ['dizziness', 'nausea', null],
            pregnancyPossible: false,
            differentFromUsual: true,
            result: 'doctor',
            completedAt: '2026-07-17T09:41:00.000Z',
          },
        },
      },
    });
    expect(repaired.entries[AURA_TODAY].periodCheckin).toMatchObject({
      bleedingType: 'between-periods',
      overall: 'harder',
      flow: 'heavy',
      changeFrequency: '1-2h',
      hourlyBleedingHours: 24,
      largeClots: true,
      leaksThroughProtection: true,
      nightChanges: true,
      durationDays: 30,
      painImpact: 'disrupts',
      painScore: 10,
      painLocations: ['Низ живота'],
      symptoms: ['dizziness', 'nausea'],
      differentFromUsual: true,
      result: 'doctor',
    });
  });

  it('falls back to the cat avatar when an imported avatar is unknown', () => {
    expect(sanitizeAuraState({ avatar: 'dragon' }).avatar).toBe('cat');
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

  it('keeps a valid workout log and removes malformed workout data', () => {
    const repaired = sanitizeAuraState({
      entries: {
        [AURA_TODAY]: {
          workout: {
            id: 'workout-today',
            date: '2099-01-01',
            generatedAt: '2026-07-15T09:41:00.000Z',
            level: 'light',
            title: 'Лёгкая тренировка',
            durationMin: 12,
            intensityLabel: 'Легко',
            reasons: ['Без выраженных ограничений'],
            exercises: [{ id: 'walk', title: 'Ходьба на месте', amount: '4 минуты', note: 'В удобном темпе' }],
            safety: 'standard',
            status: 'completed',
            feedback: 'right',
            snapshot: { cycleDay: 10, energy: 4, maxSymptomSeverity: 0, symptomsAffectLife: false },
          },
        },
        [addDays(AURA_TODAY, -1)]: { workout: { level: 'extreme', exercises: [] } },
      },
    });
    expect(repaired.entries[AURA_TODAY].workout).toMatchObject({ date: AURA_TODAY, level: 'light', status: 'completed', feedback: 'right' });
    expect(repaired.entries[addDays(AURA_TODAY, -1)].workout).toBeUndefined();
  });

  it('creates a genuinely empty state after full deletion', () => {
    const empty = createEmptyAuraState();
    expect(empty.entries).toEqual({});
    expect(empty.periodStarts).toEqual([]);
    expect(empty.periodEnds).toEqual([]);
    expect(empty.excludedCycleStarts).toEqual([]);
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

  it('repairs consecutive legacy starts created by daily period logging', () => {
    const first = addDays(AURA_TODAY, -30);
    const repaired = sanitizeAuraState({
      periodStarts: [first, addDays(first, 1), addDays(first, 2), AURA_TODAY],
    });
    expect(repaired.periodStarts).toEqual([first, AURA_TODAY]);
    expect(getAuraCycleMetrics(repaired).cycleLengths).toEqual([30]);
  });

  it('stores a period end separately from its cycle start', () => {
    const start = addDays(AURA_TODAY, -4);
    const state = setAuraPeriodStart(createEmptyAuraState(), start, true);
    const ended = setAuraPeriodEnd(state, AURA_TODAY, true);
    expect(ended.periodStarts).toEqual([start]);
    expect(ended.periodEnds).toEqual([AURA_TODAY]);
    expect(setAuraPeriodEnd(ended, AURA_TODAY, false).periodEnds).toEqual([]);
  });

  it('distinguishes ongoing, confirmed and unknown period episodes', () => {
    const firstStart = addDays(AURA_TODAY, -60);
    const secondStart = addDays(AURA_TODAY, -30);
    const state = sanitizeAuraState({
      periodStarts: [firstStart, secondStart, AURA_TODAY],
      periodEnds: [addDays(firstStart, 4)],
      entries: {
        [firstStart]: { period: 'medium' },
        [addDays(firstStart, 1)]: { period: 'medium' },
        [secondStart]: { period: 'medium' },
        [addDays(secondStart, 1)]: { period: 'medium' },
        [AURA_TODAY]: { period: 'medium' },
      },
    });
    expect(getAuraPeriodEpisodes(state)).toEqual([
      expect.objectContaining({ start: firstStart, status: 'confirmed', duration: 5, observedDays: 2 }),
      expect.objectContaining({ start: secondStart, status: 'unknown', duration: null, observedDays: 2 }),
      expect.objectContaining({ start: AURA_TODAY, status: 'ongoing', duration: null, observedDays: 1 }),
    ]);
  });

  it('does not save a confirmed end outside a known period episode', () => {
    const state = createEmptyAuraState();
    expect(setAuraPeriodEnd(state, AURA_TODAY, true)).toBe(state);
  });

  it('counts cycle starts as observations even without a separate day entry', () => {
    const state = sanitizeAuraState({
      periodStarts: [addDays(AURA_TODAY, -28), AURA_TODAY],
      periodEnds: [addDays(AURA_TODAY, -24)],
      entries: {
        [AURA_TODAY]: { rating: 4 },
        [addDays(AURA_TODAY, -2)]: { sleepHours: 7.5 },
      },
    });
    expect(getAuraObservationDates(state)).toEqual([addDays(AURA_TODAY, -28), addDays(AURA_TODAY, -24), addDays(AURA_TODAY, -2), AURA_TODAY]);
  });

  it('collects important medical facts and keeps intimate facts opt-in', () => {
    const date = addDays(AURA_TODAY, -1);
    const state = sanitizeAuraState({
      entries: {
        [date]: {
          period: 'heavy',
          symptoms: [{ id: 'pain', label: 'Боль внизу живота', severity: 3, affectsLife: true }],
          intimate: true,
          intimacyComfort: 'pain',
          intimacyAfter: ['bleeding'],
        },
      },
    });
    expect(getAuraSafetyFacts(state).map((fact) => fact.category)).toEqual(['cycle', 'symptoms']);
    expect(getAuraSafetyFacts(state, true).map((fact) => fact.category)).toEqual(['cycle', 'symptoms', 'intimate']);
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
      historyStage: 'preliminary',
      averageLength: 28,
      analysisCyclesUsed: 3,
      forecastCyclesUsed: 3,
      cycleDay: 10,
      personalMin: 27,
      personalMax: 29,
      daysLate: 0,
      forecast: { start: '2026-08-01', end: '2026-08-03', confidence: 'growing', cyclesUsed: 3 },
      periodForecast: { start: '2026-08-02', end: '2026-08-06', confidence: 'growing' },
    });
  });

  it('keeps the open cycle separate and excludes completed cycles without merging boundaries', () => {
    const state = sanitizeAuraState({
      ...createEmptyAuraState(),
      periodStarts: ['2026-04-12', '2026-05-10', '2026-06-08', '2026-07-05'],
      excludedCycleStarts: ['2026-05-10', '2026-07-05', 'bad-date'],
    });
    const metrics = getAuraCycleMetrics(state, '2026-07-14');
    expect(metrics.currentStart).toBe('2026-07-05');
    expect(metrics.completedStarts).toEqual(['2026-04-12', '2026-06-08']);
    expect(metrics.excludedStarts).toEqual(['2026-05-10']);
    expect(metrics.cycleLengths).toEqual([28, 27]);
    expect(metrics.completedCycles).toBe(2);
    expect(state.excludedCycleStarts).toEqual(['2026-05-10']);
  });

  it('allows excluding only a completed cycle and restoring it', () => {
    const state = sanitizeAuraState({
      ...createEmptyAuraState(),
      periodStarts: ['2026-05-10', '2026-06-08', '2026-07-05'],
    });
    const excluded = setAuraCycleExcluded(state, '2026-06-08', true);
    expect(excluded.excludedCycleStarts).toEqual(['2026-06-08']);
    expect(setAuraCycleExcluded(excluded, '2026-07-05', true)).toBe(excluded);
    expect(setAuraCycleExcluded(excluded, '2026-06-08', false).excludedCycleStarts).toEqual([]);
  });

  it('uses a deliberately broad preliminary window when only one start is known', () => {
    const state = sanitizeAuraState({
      ...createEmptyAuraState(),
      periodStarts: ['2026-07-05'],
    });
    const metrics = getAuraCycleMetrics(state, '2026-07-14');
    expect(metrics.cycleDay).toBe(10);
    expect(metrics.completedCycles).toBe(0);
    expect(metrics.forecast).toEqual({
      start: '2026-07-26',
      end: '2026-08-09',
      confidence: 'preliminary',
      cyclesUsed: 0,
    });
    expect(metrics.periodForecast).toEqual({ start: '2026-08-02', end: '2026-08-06', confidence: 'preliminary' });
    expect(metrics.daysLate).toBe(0);
  });

  it('shows a preliminary forecast after one start when onboarding supplied a cycle estimate', () => {
    const state = sanitizeAuraState({
      ...createEmptyAuraState(),
      onboarding: { completed: true, cyclePattern: 'stable', cycleLength: 28 },
      periodStarts: ['2026-07-15'],
    });
    const metrics = getAuraCycleMetrics(state, '2026-07-15');
    expect(metrics.forecast).toEqual({
      start: '2026-08-10',
      end: '2026-08-14',
      confidence: 'preliminary',
      cyclesUsed: 0,
    });
    expect(metrics.periodForecast).toEqual({ start: '2026-08-12', end: '2026-08-16', confidence: 'preliminary' });
    expect(metrics.daysLate).toBe(0);
  });

  it('keeps an early calendar orientation broad and does not label it as a personal delay', () => {
    const state = sanitizeAuraState({
      ...createEmptyAuraState(),
      periodStarts: ['2026-05-10', '2026-06-08'],
    });
    const metrics = getAuraCycleMetrics(state, '2026-07-15');
    expect(metrics.forecast).toMatchObject({ start: '2026-06-29', end: '2026-07-13', cyclesUsed: 0 });
    expect(metrics.daysLate).toBe(0);
  });

  it('does not calculate a personal average or range from two completed cycles', () => {
    const state = sanitizeAuraState({
      ...createEmptyAuraState(),
      periodStarts: ['2026-05-10', '2026-06-08', '2026-07-05'],
    });
    const metrics = getAuraCycleMetrics(state, '2026-07-14');
    expect(metrics.cycleLengths).toEqual([29, 27]);
    expect(metrics.historyStage).toBe('comparison');
    expect(metrics.averageLength).toBeNull();
    expect(metrics.personalMin).toBeNull();
    expect(metrics.personalMax).toBeNull();
    expect(metrics.forecastCyclesUsed).toBe(0);
  });

  it('uses six cycles for averages and up to twelve cycles for a longer forecast', () => {
    const starts = Array.from({ length: 13 }, (_, index) => addDays('2025-07-01', index * 28));
    const state = sanitizeAuraState({ ...createEmptyAuraState(), periodStarts: starts });
    const metrics = getAuraCycleMetrics(state, addDays(starts[starts.length - 1], 5));
    expect(metrics.historyStage).toBe('long');
    expect(metrics.analysisCyclesUsed).toBe(6);
    expect(metrics.forecastCyclesUsed).toBe(12);
    expect(metrics.averageLength).toBe(28);
    expect(metrics.forecast).toMatchObject({ confidence: 'personal', cyclesUsed: 12 });
  });

  it('explains whether the personal cycle range stayed similar or changed', () => {
    expect(getAuraCycleRangeTrend([28, 29, 28, 27, 29, 28])).toMatchObject({
      status: 'similar',
      title: 'Цикл остаётся похожим',
      previousSpread: 1,
      recentSpread: 2,
    });
    expect(getAuraCycleRangeTrend([28, 29, 28, 26, 30, 28])).toMatchObject({
      status: 'wider',
      title: 'Диапазон стал шире',
      previousSpread: 1,
      recentSpread: 4,
    });
    expect(getAuraCycleRangeTrend([26, 30, 28, 28, 29, 28])).toMatchObject({
      status: 'narrower',
      title: 'Диапазон стал уже',
      previousSpread: 4,
      recentSpread: 1,
    });
    expect(getAuraCycleRangeTrend([26, 30, 28, 29, 27, 28, 28, 29, 28, 28, 29, 28])).toMatchObject({
      status: 'narrower',
      previousSpread: 4,
      recentSpread: 1,
    });
    expect(getAuraCycleRangeTrend([28, 29, 28])).toMatchObject({ status: 'insufficient' });
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
