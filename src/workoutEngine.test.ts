import { describe, expect, it } from 'vitest';
import { chooseWorkoutLevel, generateWorkout, type WorkoutContext } from './workoutEngine';

const base = (patch: Partial<WorkoutContext> = {}): WorkoutContext => ({
  date: '2026-07-15',
  cycleDay: 12,
  rating: 3,
  energy: 3,
  sleepHours: 7,
  sleepQuality: 'Обычное',
  symptoms: [],
  ...patch,
});

describe('Mira workout engine', () => {
  it('chooses rest when pain is severe or affects daily life', () => {
    expect(chooseWorkoutLevel(base({ symptoms: [{ id: 'pain', severity: 3, affectsLife: true }] })).level).toBe('rest');
    expect(chooseWorkoutLevel(base({ symptoms: [{ id: 'headache', severity: 3, affectsLife: false }] })).level).toBe('rest');
  });

  it('chooses recovery for poor sleep, low energy or medium symptoms', () => {
    expect(chooseWorkoutLevel(base({ energy: 2 })).level).toBe('recovery');
    expect(chooseWorkoutLevel(base({ sleepQuality: 'Плохое' })).level).toBe('recovery');
    expect(chooseWorkoutLevel(base({ symptoms: [{ id: 'headache', severity: 2, affectsLife: false }] })).level).toBe('recovery');
  });

  it('does not use cycle day alone to force a hard or easy workout', () => {
    expect(chooseWorkoutLevel(base({ cycleDay: 2 })).level).toBe('light');
    expect(chooseWorkoutLevel(base({ cycleDay: 24 })).level).toBe('light');
  });

  it('allows only moderate low-impact work when readiness data is clearly positive', () => {
    expect(chooseWorkoutLevel(base({ rating: 5, energy: 5, sleepHours: 8, sleepQuality: 'Хорошее' })).level).toBe('moderate');
  });

  it('generates a deterministic stored plan shape with its input snapshot', () => {
    const workout = generateWorkout(base({ period: 'light' }), '2026-07-15T09:41:00.000Z');
    expect(workout).toMatchObject({
      id: 'workout-2026-07-15-094100',
      level: 'light',
      status: 'planned',
      snapshot: { cycleDay: 12, period: 'light', energy: 3 },
    });
    expect(workout.exercises.length).toBeGreaterThan(2);
  });
});
