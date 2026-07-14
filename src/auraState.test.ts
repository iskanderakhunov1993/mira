import { describe, expect, it } from 'vitest';
import { AURA_TODAY, addDays, createEmptyAuraState, defaultAuraState, deriveAttentionEvidence, sanitizeAuraState, setAuraPeriodStart, shouldShowAttention } from './auraState';

describe('Aura prototype state', () => {
  it('derives an evidence-gated pain attention signal', () => {
    const evidence = deriveAttentionEvidence(defaultAuraState);
    expect(evidence.eligible).toBe(true);
    expect(evidence.painDays).toBe(4);
    expect(evidence.cycles).toBe(2);
  });

  it('does not repeat dismissed evidence until the pause ends', () => {
    const evidence = deriveAttentionEvidence(defaultAuraState);
    const dismissed = {
      ...defaultAuraState,
      attention: { showCount: 1, evidenceKey: evidence.key, dismissedUntil: addDays(AURA_TODAY, 7) },
    };
    expect(shouldShowAttention(dismissed, AURA_TODAY)).toBe(false);
    expect(shouldShowAttention(dismissed, addDays(AURA_TODAY, 7))).toBe(true);
  });

  it('repairs incomplete imported settings', () => {
    const repaired = sanitizeAuraState({ modules: { sleep: false }, onboarding: { goal: 'forecast', focus: ['sleep', 'unknown'] }, entries: { [AURA_TODAY]: { careItems: ['pads', 42], moods: 'bad', symptomsChecked: true, intimate: false, intimacyComfort: 'unknown', intimacyAfter: ['pain', 'unknown'], intimacyDesire: 'higher', intimacyNote: 42 } } });
    expect(repaired.modules.sleep).toBe(false);
    expect(repaired.modules.cycle).toBe(true);
    expect(repaired.privacy.localOnly).toBe(true);
    expect(repaired.onboarding.goal).toBe('forecast');
    expect(repaired.onboarding.focus).toEqual(['sleep']);
    expect(repaired.entries[AURA_TODAY].careItems).toEqual(['pads']);
    expect(repaired.entries[AURA_TODAY].moods).toEqual([]);
    expect(repaired.entries[AURA_TODAY].symptomsChecked).toBe(true);
    expect(repaired.entries[AURA_TODAY].intimate).toBeUndefined();
    expect(repaired.entries[AURA_TODAY].intimacyComfort).toBeUndefined();
    expect(repaired.entries[AURA_TODAY].intimacyAfter).toEqual(['pain']);
    expect(repaired.entries[AURA_TODAY].intimacyDesire).toBe('higher');
    expect(repaired.entries[AURA_TODAY].intimacyNote).toBeUndefined();
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
});
