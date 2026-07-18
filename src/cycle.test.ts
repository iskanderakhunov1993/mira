import { describe, expect, it } from 'vitest';
import { addDays, createDayEntry, defaultProfile, todayIso } from './data';
import { dischargeOptions, filterPeriodRangesForAnalytics, getCycleAnalyticsEmptyGuidance, getCycleStats, getCycloscope, getHormonoscope, getPainRecurrenceInsight, getPeriodRanges, getPredictedPeriodDays, getSymptomSeveritySummary, getWeekSummary, getZodiacSign, quickSymptomOptions, symptomGroups, symptomOptions } from './cycle';
import type { AppState } from './types';

const stateWithPeriods = (periodDays: string[]): AppState => ({
  onboardingComplete: true,
  profile: { ...defaultProfile },
  periodDays,
  periodEnds: [],
  entries: {},
  savedArticles: [],
});

describe('cycle calculations', () => {
  it('keeps important symptom groups complete without duplicate options', () => {
    expect(symptomGroups.map((group) => group.title)).toEqual([
      'Боль',
      'Энергия и сон',
      'Кожа и тело',
      'Интимное самочувствие',
      'Мочеиспускание',
    ]);
    expect(new Set(symptomOptions).size).toBe(symptomOptions.length);
    expect(quickSymptomOptions.every((option) => symptomOptions.includes(option))).toBe(true);
    expect(dischargeOptions).toContain('Выделения с необычным запахом');
    expect(dischargeOptions).toContain('Мажущие между месячными');
  });

  it('groups consecutive period days into separate ranges', () => {
    expect(
      getPeriodRanges([
        '2026-05-17',
        '2026-05-18',
        '2026-05-19',
        '2026-06-14',
        '2026-06-15',
      ]),
    ).toEqual([
      { start: '2026-05-17', end: '2026-05-19', length: 3 },
      { start: '2026-06-14', end: '2026-06-15', length: 2 },
    ]);
  });

  it('filters analytics ranges by a calendar year without mixing older history', () => {
    const ranges = [
      { start: '2025-06-01', end: '2025-06-05', length: 5 },
      { start: '2025-08-01', end: '2025-08-05', length: 5 },
      { start: '2026-01-01', end: '2026-01-05', length: 5 },
      { start: '2026-07-01', end: '2026-07-05', length: 5 },
    ];

    expect(filterPeriodRangesForAnalytics(ranges, '12m', '2026-07-14').map((range) => range.start)).toEqual([
      '2025-08-01',
      '2026-01-01',
      '2026-07-01',
    ]);
    expect(filterPeriodRangesForAnalytics(ranges, 'all', '2026-07-14')).toHaveLength(4);
  });

  it('summarizes only explicitly recorded symptom severity values', () => {
    const first = { ...createDayEntry('2026-06-01'), symptoms: ['Головная боль', 'Боль в спине'], symptomSeverity: { 'Головная боль': 3 as const, 'Боль в спине': 2 as const } };
    const second = { ...createDayEntry('2026-07-01'), symptoms: ['Головная боль'], symptomSeverity: { 'Головная боль': 1 as const } };
    const missing = { ...createDayEntry('2026-07-02'), symptoms: ['Головная боль'] };

    expect(getSymptomSeveritySummary([first, second, missing])).toEqual([
      { symptom: 'Головная боль', count: 2, averageSeverity: 2 },
      { symptom: 'Боль в спине', count: 1, averageSeverity: 2 },
    ]);
  });

  it('calculates a regular 28-day cycle from recorded starts', () => {
    const state = stateWithPeriods([
      '2026-05-17',
      '2026-05-18',
      '2026-06-14',
      '2026-06-15',
      '2026-07-12',
    ]);

    expect(getCycleStats(state)).toMatchObject({
      cycleLengths: [28, 28],
      previousCycleLength: 28,
      isCycleNormal: true,
      isRegular: true,
    });
  });

  it('predicts the next period from the median recent cycle length', () => {
    const state = stateWithPeriods([
      '2026-05-17',
      '2026-05-18',
      '2026-06-14',
      '2026-06-15',
      '2026-07-12',
    ]);

    expect(getPredictedPeriodDays(state)).toEqual([
      '2026-08-09',
      '2026-08-10',
      '2026-08-11',
      '2026-08-12',
      '2026-08-13',
    ]);
  });

  it('provides a preliminary prediction after the first recorded period', () => {
    const state = stateWithPeriods(['2026-07-12']);

    expect(getPredictedPeriodDays(state)).toEqual([
      '2026-08-09',
      '2026-08-10',
      '2026-08-11',
      '2026-08-12',
      '2026-08-13',
    ]);
  });

  it('explains the correct next step before and after the first cycle starts', () => {
    expect(getCycleAnalyticsEmptyGuidance(false, 0)).toMatchObject({
      title: 'Начните первый цикл',
      description: expect.stringContaining('первый день месячных'),
    });
    expect(getCycleAnalyticsEmptyGuidance(true, 0)).toMatchObject({
      title: 'Следующая цель — завершить первый цикл',
      description: expect.stringContaining('следующих месячных'),
    });
  });

  it('builds weekly analytics only from recorded values', () => {
    const state = stateWithPeriods([]);
    const today = todayIso();
    state.entries = {
      [addDays(today, -1)]: { ...createDayEntry(addDays(today, -1)), waterMl: 1000, mood: 'calm' },
      [today]: { ...createDayEntry(today), waterMl: 1500, mood: 'great' },
    };

    expect(getWeekSummary(state)).toMatchObject({
      totalWater: 2500,
      averageWater: 357,
      moodCount: 2,
    });
  });

  it('builds a cautious calendar-based hormonoscope phase', () => {
    const state = stateWithPeriods([
      '2026-05-18',
      '2026-06-15',
      '2026-07-13',
    ]);

    expect(getHormonoscope(state, '2026-07-13')).toMatchObject({
      id: 'menstrual',
      label: 'Менструальная фаза',
    });
    expect(getHormonoscope(state, '2026-07-24')).toMatchObject({
      id: 'late-follicular',
    });
    expect(getHormonoscope(state, '2026-07-27')).toMatchObject({
      id: 'ovulatory',
    });
    expect(getHormonoscope(state, '2026-08-02')).toMatchObject({
      id: 'early-luteal',
    });
  });

  it('shows a pain recurrence insight only after repeated observations in completed cycles', () => {
    const state = stateWithPeriods(['2026-03-01', '2026-04-01', '2026-05-01', '2026-06-01', '2026-07-01']);
    state.entries = Object.fromEntries(['2026-03-02', '2026-04-03', '2026-05-02'].map((date) => [date, { ...createDayEntry(date), pain: 2 }]));
    expect(getPainRecurrenceInsight(state)).toMatchObject({ observedCycles: 4, cyclesWithPain: 3 });
  });

  it('does not show hormonoscope before the first recorded cycle start', () => {
    expect(getHormonoscope(stateWithPeriods([]), '2026-07-13')).toBeNull();
  });

  it('creates a deterministic Cycloscope reading from date and zodiac sign', () => {
    const state = stateWithPeriods([]);
    state.profile.birthDate = '1994-07-25';

    expect(getZodiacSign(state.profile.birthDate)).toEqual({ name: 'Лев', symbol: '♌' });
    expect(getCycloscope(state, '2026-07-13')).toEqual(getCycloscope(state, '2026-07-13'));
    expect(getCycloscope(state, '2026-07-13').sign).toBe('Лев');
  });

  it('uses a neutral lunar reading when birth date is missing', () => {
    expect(getCycloscope(stateWithPeriods([]), '2026-07-13')).toMatchObject({
      sign: 'Лунный знак',
      symbol: '☾',
    });
  });
});
