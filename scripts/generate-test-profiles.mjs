import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = resolve(root, 'public/test-profiles');
const dayMs = 86_400_000;

const toIsoDate = (date) => date.toISOString().slice(0, 10);
const addDays = (date, days) => toIsoDate(new Date(new Date(`${date}T12:00:00Z`).getTime() + days * dayMs));
const today = toIsoDate(new Date());

const baseState = (name, avatar) => ({
  version: 3,
  avatar,
  profile: {
    fullName: name,
    birthDate: '1994-06-15',
    healthContext: { bleedingMedications: [] },
  },
  selectedDate: today,
  entries: {},
  periodStarts: [],
  periodEnds: [],
  excludedCycleStarts: [],
  modules: {
    cycle: true,
    mood: true,
    sleep: true,
    daily: true,
    activity: true,
    intimate: false,
    nutrition: true,
    body: false,
    note: true,
  },
  homeCards: {
    hormonoscope: false,
    cycloscope: false,
    dailyPlan: true,
    rhythm: true,
    recommendation: true,
    knowledge: true,
  },
  savedArticles: [],
  notifications: false,
  onboarding: {
    completed: true,
    goal: 'patterns',
    cyclePattern: 'stable',
    cycleLength: 28,
    periodLength: 5,
    periodLengthUnknown: false,
    focus: ['cycle', 'mood', 'sleep', 'daily'],
    reminders: false,
  },
  privacy: { localOnly: true, sensitiveExport: false },
  attention: { showCount: 0 },
});

const createEntry = (date, cycleIndex, patch = {}) => ({
  symptoms: [],
  moods: cycleIndex % 2 ? ['Спокойствие'] : ['Хорошее настроение'],
  nutrition: [],
  contexts: [],
  rating: cycleIndex % 2 ? 4 : 5,
  energy: cycleIndex % 2 ? 3 : 4,
  sleepHours: cycleIndex % 2 ? 7 : 8,
  sleepQuality: 'Хорошее',
  water: 1600 + cycleIndex * 100,
  steps: 6200 + cycleIndex * 350,
  completionQuality: 'full',
  updatedAt: `${date}T09:41:00.000Z`,
  ...patch,
});

function withCycleHistory(state, completedCycles, includeCurrentCycle = true) {
  const startCount = completedCycles + (includeCurrentCycle ? 1 : 0);
  const latestStart = addDays(today, -10);
  const starts = Array.from({ length: startCount }, (_, index) => addDays(latestStart, -28 * (startCount - index - 1)));

  state.periodStarts = starts;
  state.periodEnds = starts.map((start) => addDays(start, 4));
  state.onboarding.lastPeriod = starts.at(-1);

  starts.forEach((start, cycleIndex) => {
    for (let day = 0; day < 5; day += 1) {
      const date = addDays(start, day);
      state.entries[date] = createEntry(date, cycleIndex, {
        period: day < 2 ? 'medium' : 'light',
        symptoms: day === 0 ? [{ id: 'pain', label: 'Спазмы', severity: 2, affectsLife: false }] : [],
      });
    }
    const observationDate = addDays(start, 12);
    if (observationDate <= today) state.entries[observationDate] = createEntry(observationDate, cycleIndex);
  });

  return state;
}

const profiles = [
  ['no-cycle.json', baseState('Тест · без цикла', 'cat')],
  ['first-cycle.json', withCycleHistory(baseState('Тест · первый цикл', 'rabbit'), 0, true)],
  ['one-completed-cycle.json', withCycleHistory(baseState('Тест · 1 завершённый цикл', 'bird'), 1)],
  ['three-completed-cycles.json', withCycleHistory(baseState('Тест · 3 завершённых цикла', 'squirrel'), 3)],
  ['five-completed-cycles.json', withCycleHistory(baseState('Тест · 5 завершённых циклов', 'ladybug'), 5)],
];

await mkdir(outputDirectory, { recursive: true });
await Promise.all(profiles.map(([fileName, state]) => writeFile(
  resolve(outputDirectory, fileName),
  `${JSON.stringify(state, null, 2)}\n`,
)));

console.log(`Generated ${profiles.length} test profiles in public/test-profiles`);
