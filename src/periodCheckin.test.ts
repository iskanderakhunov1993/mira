import { describe, expect, it } from 'vitest';
import { evaluatePeriodCheckin, type PeriodCheckinInput } from './periodCheckin';

const usual: PeriodCheckinInput = {
  bleedingType: 'period-ongoing',
  overall: 'usual',
  flow: 'medium',
  changeFrequency: '4h-plus',
  hourlyBleedingHours: 0,
  largeClots: false,
  leaksThroughProtection: false,
  doubleProtection: false,
  nightChanges: false,
  durationDays: 2,
  painImpact: 'none',
  painScore: 0,
  symptoms: [],
  pregnancyPossible: false,
  differentFromUsual: false,
};

describe('period check-in result', () => {
  it('keeps an ordinary day neutral', () => {
    expect(evaluatePeriodCheckin(usual)).toBe('usual');
  });

  it('suggests observation for a noticeable but non-urgent change', () => {
    expect(evaluatePeriodCheckin({ ...usual, overall: 'harder', painImpact: 'slow-down', painScore: 4 })).toBe('observe');
  });

  it('suggests a consultation for severe pain or prolonged bleeding', () => {
    expect(evaluatePeriodCheckin({ ...usual, painImpact: 'unable', painScore: 8 })).toBe('doctor');
    expect(evaluatePeriodCheckin({ ...usual, durationDays: 8 })).toBe('doctor');
  });

  it('raises urgent guidance only for explicit high-risk combinations', () => {
    expect(evaluatePeriodCheckin({
      ...usual,
      flow: 'very-heavy',
      changeFrequency: 'hourly',
      hourlyBleedingHours: 3,
      symptoms: ['breathlessness'],
    })).toBe('urgent');
    expect(evaluatePeriodCheckin({
      ...usual,
      pregnancyPossible: true,
      painImpact: 'unable',
      painScore: 8,
    })).toBe('urgent');
  });

  it('does not label one isolated hourly change as an emergency without systemic symptoms', () => {
    expect(evaluatePeriodCheckin({
      ...usual,
      flow: 'very-heavy',
      changeFrequency: 'hourly',
      hourlyBleedingHours: 1,
    })).toBe('doctor');
  });

  it('routes bleeding between periods or after sex to a consultation', () => {
    expect(evaluatePeriodCheckin({ ...usual, bleedingType: 'between-periods', flow: 'light' })).toBe('doctor');
    expect(evaluatePeriodCheckin({ ...usual, bleedingType: 'after-sex', flow: 'light' })).toBe('doctor');
  });
});
