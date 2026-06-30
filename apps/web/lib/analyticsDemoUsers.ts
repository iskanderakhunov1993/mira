import type { DailyCheckIn, MiraLocalData, UserProfile } from "@/lib/types";

function dateStr(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function checkIn(daysAgo: number, partial: Partial<DailyCheckIn>): [string, DailyCheckIn] {
  const date = dateStr(daysAgo);
  return [date, { date, savedAt: new Date().toISOString(), ...partial }];
}

function range(startDaysAgo: number, count: number, fn: (index: number) => Partial<DailyCheckIn>): [string, DailyCheckIn][] {
  return Array.from({ length: count }, (_, index) => checkIn(startDaysAgo - index, fn(index)));
}

function makeProfile(name: string, periodStartDaysAgo: number, cycleLength: number, periodLength: number, age?: number): UserProfile {
  const periodStarts: string[] = [];
  let anchor = periodStartDaysAgo;
  for (let index = 0; index < 4; index++) {
    periodStarts.unshift(dateStr(anchor));
    anchor += cycleLength + (index % 2 === 0 ? 1 : -2);
  }

  return {
    name,
    age,
    showCalories: false,
    cycleConfig: {
      periodStart: dateStr(periodStartDaysAgo),
      cycleLength,
      periodLength,
      periodStarts,
    },
    trackingPreferences: ["cycle", "pain", "mood", "energy", "sleep", "nutrition", "workout"],
    additionalMode: "none",
    pinEnabled: false,
    hiddenNotifications: false,
    privateMarks: true,
  };
}

function makeData(
  name: string,
  periodStartDaysAgo: number,
  cycleLength: number,
  periodLength: number,
  checkIns: [string, DailyCheckIn][],
  opts?: { age?: number; care?: boolean; labs45?: boolean },
): MiraLocalData {
  const checkInMap: Record<string, DailyCheckIn> = {};
  for (const [key, value] of checkIns) checkInMap[key] = value;

  const data: MiraLocalData = {
    version: 2,
    profile: makeProfile(name, periodStartDaysAgo, cycleLength, periodLength, opts?.age),
    checkIns: checkInMap,
    workouts: [],
    onboardingCompleted: true,
  };

  if (opts?.care) {
    data.waterLog = Object.fromEntries(
      Array.from({ length: 18 }, (_, index) => {
        const key = dateStr(index);
        return [key, { date: key, glasses: index % 4 === 0 ? 3 : 7, goal: 8 }];
      }),
    );
    data.walkingLog = Object.fromEntries(
      Array.from({ length: 18 }, (_, index) => {
        const key = dateStr(index);
        return [key, { date: key, steps: index % 5 === 0 ? 2800 : 7600, goal: 7000, source: "manual" as const }];
      }),
    );
    data.weightLog = {
      [dateStr(21)]: { date: dateStr(21), weight: 64.8 },
      [dateStr(7)]: { date: dateStr(7), weight: 65.3 },
      [dateStr(0)]: { date: dateStr(0), weight: 65.9 },
    };
    data.workouts = Array.from({ length: 8 }, (_, index) => ({
      id: `demo-workout-${index}`,
      date: dateStr(index * 3),
      status: index % 3 === 0 ? "lighter" : "completed",
      activityType: index % 3 === 0 ? "walk" : "moderate_strength",
      durationMinutes: index % 3 === 0 ? 20 : 35,
      title: index % 3 === 0 ? "Лёгкая прогулка" : "Силовая тренировка",
    }));
  }

  if (opts?.labs45) {
    data.labs = [
      { id: "demo-ferritin", testId: "ferritin", value: 12, unit: "нг/мл", date: dateStr(4) },
      { id: "demo-estradiol", testId: "estradiol", value: 18, unit: "пг/мл", date: dateStr(4) },
      { id: "demo-progesterone", testId: "progesterone", value: 1.1, unit: "нг/мл", date: dateStr(4) },
    ];
  }

  return data;
}

export type AnalyticsDemoUser = {
  id: string;
  name: string;
  label: string;
  description: string;
  tags: string[];
  build: () => MiraLocalData;
};

export const analyticsDemoUsers: AnalyticsDemoUser[] = [
  {
    id: "learning",
    name: "Ника",
    label: "Мало данных",
    description: "3 отметки: аналитика должна честно сказать, что Mira ещё учится.",
    tags: ["новичок", "3 дня"],
    build: () => makeData("Ника", 9, 28, 5, [
      checkIn(2, { mood: { value: "normal" }, energy: { value: "normal" } }),
      checkIn(1, { sleep: { quality: "good", hours: 8 }, mood: { value: "joy" } }),
      checkIn(0, { mood: { value: "normal" }, energy: { value: "high" } }),
    ]),
  },
  {
    id: "stable",
    name: "Лина",
    label: "Стабильный цикл",
    description: "60 дней спокойных отметок: должна быть уверенная, не тревожная аналитика.",
    tags: ["60 дней", "норма"],
    build: () => makeData("Лина", 16, 28, 4, [
      ...range(60, 60, (index) => {
        const cycleDay = (index % 28) + 1;
        if (cycleDay <= 4) {
          return {
            period: { intensity: "light" as const },
            pain: cycleDay <= 2 ? { kinds: ["cramps" as const], level: "light" as const } : undefined,
            mood: { value: "normal" as const },
            energy: { value: "normal" as const },
            sleep: { quality: "good" as const, hours: 8 },
          };
        }
        return { mood: { value: "joy" as const }, energy: { value: "high" as const }, sleep: { quality: "good" as const, hours: 8 } };
      }),
    ], { care: true }),
  },
  {
    id: "pms",
    name: "Камилла",
    label: "Симптомы перед месячными",
    description: "Повторяются тревога, тяга к сладкому и низкая энергия перед месячными.",
    tags: ["ПМС", "тревога", "сон"],
    build: () => makeData("Камилла", 25, 28, 5, [
      ...range(56, 5, () => ({ period: { intensity: "moderate" as const }, pain: { kinds: ["cramps" as const], level: "medium" as const } })),
      ...range(44, 9, () => ({ pms: { symptoms: ["Тревожность", "Раздражительность", "Тяга к еде"] }, symptomLog: { sweetCraving: true, anxiety: true }, mood: { value: "anxiety" as const }, energy: { value: "low" as const }, sleep: { quality: "bad" as const, hours: 5 } })),
      ...range(28, 5, () => ({ period: { intensity: "moderate" as const }, pain: { kinds: ["cramps" as const], level: "medium" as const } })),
      ...range(8, 8, () => ({ pms: { symptoms: ["Тревожность", "Раздражительность", "Вздутие"] }, symptomLog: { sweetCraving: true, anxiety: true }, mood: { value: "swings" as const }, energy: { value: "low" as const }, sleep: { quality: "bad" as const, hours: 5 } })),
      checkIn(0, { pms: { symptoms: ["Тревожность", "Тяга к еде"] }, symptomLog: { sweetCraving: true, anxiety: true }, mood: { value: "anxiety" }, energy: { value: "low" } }),
    ], { care: true }),
  },
  {
    id: "doctor",
    name: "София",
    label: "Для врача",
    description: "Сильная боль и обильность повторяются: аналитика должна подсветить отчёт врачу.",
    tags: ["боль", "обильность", "красные флаги"],
    build: () => makeData("София", 3, 27, 7, [
      ...range(57, 7, () => ({ period: { intensity: "very_heavy" as const }, pain: { kinds: ["cramps" as const, "lower_abdomen" as const, "back" as const], level: "strong" as const }, energy: { value: "exhausted" as const }, symptomLog: { medications: ["ибупрофен"] } })),
      ...range(30, 7, () => ({ period: { intensity: "heavy" as const }, pain: { kinds: ["cramps" as const, "back" as const], level: "strong" as const }, energy: { value: "exhausted" as const }, symptomLog: { medications: ["дротаверин"] } })),
      ...range(3, 3, () => ({ period: { intensity: "very_heavy" as const }, pain: { kinds: ["cramps" as const, "lower_abdomen" as const], level: "strong" as const }, energy: { value: "exhausted" as const } })),
      checkIn(0, { period: { intensity: "very_heavy" }, pain: { kinds: ["cramps", "lower_abdomen"], level: "strong" }, energy: { value: "exhausted" } }),
    ], { care: true }),
  },
  {
    id: "care",
    name: "Фатима",
    label: "Забота влияет",
    description: "Есть вода, ходьба, тренировки и вес: видно, как эти данные попадают в аналитику.",
    tags: ["вода", "ходьба", "вес"],
    build: () => makeData("Фатима", 13, 29, 5, [
      ...range(45, 45, (index) => ({
        mood: { value: index % 5 === 0 ? "anxiety" as const : "normal" as const },
        energy: { value: index % 4 === 0 ? "low" as const : "normal" as const },
        sleep: { quality: index % 4 === 0 ? "bad" as const : "good" as const, hours: index % 4 === 0 ? 5 : 8 },
        meals: [{ type: "lunch" as const, size: "medium" as const, components: index % 3 === 0 ? ["sweets" as const, "fastfood" as const] : ["protein" as const, "vegetables" as const, "grains" as const] }],
      })),
    ], { care: true }),
  },
  {
    id: "age45",
    name: "Елена",
    label: "45+ и анализы",
    description: "Перименопауза, сон, энергия и анализы: проверить возрастной контекст.",
    tags: ["45+", "анализы", "сон"],
    build: () => makeData("Елена", 48, 35, 5, [
      ...range(100, 5, () => ({ period: { intensity: "heavy" as const }, energy: { value: "low" as const } })),
      ...range(82, 12, () => ({ sleep: { quality: "insomnia" as const, hours: 4 }, mood: { value: "swings" as const }, energy: { value: "low" as const } })),
      ...range(55, 5, () => ({ period: { intensity: "very_heavy" as const }, energy: { value: "exhausted" as const } })),
      ...range(16, 10, () => ({ sleep: { quality: "bad" as const, hours: 5 }, mood: { value: "anxiety" as const }, energy: { value: "low" as const } })),
      checkIn(0, { sleep: { quality: "insomnia", hours: 4 }, mood: { value: "swings" }, energy: { value: "low" } }),
    ], { age: 52, care: true, labs45: true }),
  },
];
