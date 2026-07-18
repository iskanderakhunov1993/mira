import type { AuraPeriodCheckin } from './auraState';

export type PeriodCheckinInput = Pick<
  AuraPeriodCheckin,
  'bleedingType' | 'overall' | 'flow' | 'changeFrequency' | 'hourlyBleedingHours' | 'largeClots' | 'leaksThroughProtection' | 'doubleProtection' | 'nightChanges' | 'durationDays' | 'painImpact' | 'painScore' | 'painOnset' | 'reliefEffect' | 'symptoms' | 'pregnancyPossible' | 'pregnancyTest' | 'differentFromUsual'
>;

export function evaluatePeriodCheckin(input: PeriodCheckinInput): AuraPeriodCheckin['result'] {
  const has = (id: string) => input.symptoms.includes(id);
  const severePain = input.painScore >= 7 || input.painImpact === 'unable';
  const prolongedHourlyBleeding = input.changeFrequency === 'hourly' && input.hourlyBleedingHours >= 2;
  const circulationSymptoms = has('breathlessness') || has('dizziness') || has('fainting') || has('chest-pain') || has('racing-heart');
  const unusualBleeding = input.bleedingType === 'between-periods' || input.bleedingType === 'after-sex';
  if ((prolongedHourlyBleeding && circulationSymptoms)
    || (input.pregnancyPossible && severePain)
    || (input.pregnancyPossible && input.painOnset === 'sudden')
    || (input.pregnancyTest === 'positive' && input.painOnset === 'sudden')
    || (input.pregnancyPossible && input.flow === 'very-heavy')
    || (has('fainting') && input.flow !== 'light')) return 'urgent';
  if (input.flow === 'very-heavy'
    || input.changeFrequency === 'hourly'
    || severePain
    || input.durationDays > 7
    || unusualBleeding
    || input.painOnset === 'new'
    || input.painOnset === 'sudden'
    || input.pregnancyTest === 'positive'
    || has('fever')
    || has('painful-urination')
    || input.pregnancyPossible) return 'doctor';
  if (input.overall === 'harder'
    || input.overall === 'very-hard'
    || input.flow === 'heavy'
    || input.changeFrequency === '1-2h'
    || input.largeClots
    || input.leaksThroughProtection
    || input.doubleProtection
    || input.nightChanges
    || input.bleedingType === 'spotting'
    || input.painImpact === 'slow-down'
    || input.painImpact === 'disrupts'
    || input.painScore >= 4
    || input.reliefEffect === 'did-not-help'
    || input.differentFromUsual
    || input.symptoms.some((id) => ['dizziness', 'weakness', 'nausea', 'breathlessness'].includes(id))) return 'observe';
  return 'usual';
}
