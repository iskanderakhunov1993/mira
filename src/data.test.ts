import { beforeEach, describe, expect, it } from 'vitest';
import { createBackupPayload, createDayEntry, defaultState, loadState, parseImportedState, saveState } from './data';

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

describe('local state persistence', () => {
  it('saves and restores a valid daily entry', () => {
    const entry = { ...createDayEntry('2026-07-12'), waterMl: 1250, symptoms: ['Головная боль'], symptomsChecked: true };
    saveState({ ...defaultState, onboardingComplete: true, entries: { [entry.date]: entry } });

    expect(loadState()).toMatchObject({
      onboardingComplete: true,
      entries: { '2026-07-12': { waterMl: 1250, symptoms: ['Головная боль'], symptomsChecked: true } },
    });
  });

  it('distinguishes an explicit no-symptom mark from an untouched day', () => {
    const imported = parseImportedState({
      ...defaultState,
      entries: {
        '2026-07-12': { ...createDayEntry('2026-07-12'), symptomsChecked: true },
        '2026-07-11': { ...createDayEntry('2026-07-11') },
      },
    });

    expect(imported.entries['2026-07-12'].symptomsChecked).toBe(true);
    expect(imported.entries['2026-07-11'].symptomsChecked).toBeUndefined();
  });

  it('normalizes imported settings and unsafe numeric values', () => {
    const imported = parseImportedState({
      ...defaultState,
      profile: { ...defaultState.profile, cycleLength: 200, dailyMetrics: ['water', 'unknown'] },
      entries: {
        '2026-07-12': { ...createDayEntry('2026-07-12'), waterMl: -500, steps: 999999 },
      },
    });

    expect(imported.profile.dailyMetrics).toEqual(['water']);
    expect(imported.entries['2026-07-12']).toMatchObject({ waterMl: 0, steps: 100000 });
  });

  it('preserves only supported configurable metrics', () => {
    const imported = parseImportedState({
      ...defaultState,
      profile: { ...defaultState.profile, dailyMetrics: ['steps', 'calories', 'unsupported'] },
    });

    expect(imported.profile.dailyMetrics).toEqual(['steps']);
  });

  it('preserves home card visibility and keeps experimental cards off for older profiles', () => {
    const hidden = parseImportedState({
      ...defaultState,
      profile: { ...defaultState.profile, showHormonoscope: false, showCycloscope: false },
    });
    expect(hidden.profile).toMatchObject({ showHormonoscope: false, showCycloscope: false });

    const legacyProfile = { ...defaultState.profile } as Partial<typeof defaultState.profile>;
    delete legacyProfile.showHormonoscope;
    delete legacyProfile.showCycloscope;
    const migrated = parseImportedState({ ...defaultState, profile: legacyProfile });
    expect(migrated.profile).toMatchObject({ showHormonoscope: false, showCycloscope: false });
  });

  it('restores backup status, report draft and insight feedback after reload', () => {
    saveState({
      ...defaultState,
      onboardingComplete: true,
      lastBackupAt: '2026-07-12',
      insightFeedback: { 'cycle:range': 'helpful' },
      doctorReportDraft: {
        period: '6',
        questions: 'Что обсудить на приёме?',
        included: {
          cycles: true,
          pain: true,
          symptoms: true,
          wellbeing: true,
          sleep: true,
          lifestyle: true,
          measurements: true,
          questions: true,
          notes: false,
          sex: false,
        },
        updatedAt: '2026-07-12',
      },
    });

    expect(loadState()).toMatchObject({
      lastBackupAt: '2026-07-12',
      insightFeedback: { 'cycle:range': 'helpful' },
      doctorReportDraft: {
        period: '6',
        questions: 'Что обсудить на приёме?',
        updatedAt: '2026-07-12',
      },
    });
  });

  it('rejects future period days and future diary entries', () => {
    const imported = parseImportedState({
      ...defaultState,
      periodDays: ['2026-07-12', '2099-01-01'],
      entries: {
        '2026-07-12': createDayEntry('2026-07-12'),
        '2099-01-01': createDayEntry('2099-01-01'),
      },
    });

    expect(imported.periodDays).toEqual(['2026-07-12']);
    expect(imported.entries).not.toHaveProperty('2099-01-01');
  });

  it('rejects malformed backup files', () => {
    expect(() => parseImportedState({ entries: {} })).toThrow('Invalid backup');
  });

  it('excludes notes and intimate data from the default backup selection', () => {
    const entry = {
      ...createDayEntry('2026-07-12'),
      note: 'Личная заметка',
      contextTags: ['стресс'],
      hadSex: true,
      discharge: ['кровянистые'],
      symptoms: ['Головная боль'],
      sleepHours: 7.5,
    };
    const backup = createBackupPayload(
      { ...defaultState, entries: { [entry.date]: entry } },
      { cycle: true, wellbeing: true, lifestyle: true, notes: false, intimate: false },
    );
    const exportedEntry = backup.entries['2026-07-12'];

    expect(exportedEntry).toMatchObject({ symptoms: ['Головная боль'], sleepHours: 7.5 });
    expect(exportedEntry).not.toHaveProperty('note');
    expect(exportedEntry).not.toHaveProperty('contextTags');
    expect(exportedEntry).not.toHaveProperty('hadSex');
    expect(exportedEntry).not.toHaveProperty('discharge');
    expect(backup.exportMeta).toMatchObject({
      included: { cycle: true, wellbeing: true, lifestyle: true, notes: false, intimate: false },
    });
  });
});
