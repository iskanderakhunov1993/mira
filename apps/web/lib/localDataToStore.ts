import type { DailyCheckIn, MiraLocalData, UserProfile } from "@/lib/types";
import { getCycleNorm } from "@/lib/cycleEngine";
import type { CareState, Cycle, CyclePhase, DailyLog, SettingsState } from "@/store";

function dateStr(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function cyclePhaseForDay(day: number, periodLength: number, cycleLength: number): CyclePhase {
  if (day <= periodLength) return "menstrual";
  if (day <= Math.max(periodLength + 1, Math.round(cycleLength * 0.45))) return "follicular";
  if (day <= Math.round(cycleLength * 0.58)) return "ovulatory";
  return "luteal";
}

function painLevelToNumber(level?: DailyCheckIn["pain"] extends infer Pain ? Pain extends { level?: infer Level } ? Level : never : never): DailyLog["symptoms"]["pain"]["level"] {
  if (level === "strong") return 4;
  if (level === "medium") return 3;
  if (level === "light") return 1;
  return 0;
}

function moodToStore(value?: DailyCheckIn["mood"] extends infer Mood ? Mood extends { value: infer Value } ? Value : never : never): DailyLog["symptoms"]["mood"] {
  if (value === "joy") return "great";
  if (value === "sadness") return "low";
  if (value === "anger") return "irritable";
  if (value === "anxiety") return "anxious";
  if (value === "swings") return "irritable";
  if (value === "normal") return "neutral";
  return null;
}

function sleepToStore(value?: DailyCheckIn["sleep"] extends infer Sleep ? Sleep extends { quality: infer Quality } ? Quality : never : never): DailyLog["symptoms"]["sleep"]["quality"] {
  if (value === "good") return "good";
  if (value === "normal") return "normal";
  if (value === "bad" || value === "little" || value === "insomnia") return "poor";
  return null;
}

function periodToBleeding(period?: DailyCheckIn["period"]): DailyLog["symptoms"]["bleeding"] {
  if (!period) return { amount: 0, pads: 0, color: null, clots: null };
  const amount = period.intensity === "very_heavy" ? 3 : period.intensity === "heavy" ? 2 : 1;
  return {
    amount,
    pads: period.intensity === "very_heavy" ? 8 : period.intensity === "heavy" ? 6 : period.intensity === "moderate" ? 4 : 2,
    color: period.type === "brown" ? "brown" : null,
    clots: period.type === "clots" ? "large" : null,
  };
}

function cycleDayForDate(date: string, profile: UserProfile) {
  const starts = profile.cycleConfig.periodStarts?.length
    ? profile.cycleConfig.periodStarts
    : [profile.cycleConfig.periodStart];
  const start = new Date(`${starts.filter((item) => item <= date).at(-1) ?? profile.cycleConfig.periodStart}T00:00:00`);
  const current = new Date(`${date}T00:00:00`);
  const diff = Math.floor((current.getTime() - start.getTime()) / 86_400_000);
  return ((diff % profile.cycleConfig.cycleLength) + profile.cycleConfig.cycleLength) % profile.cycleConfig.cycleLength + 1;
}

function checkInToDailyLog(checkIn: DailyCheckIn, data: MiraLocalData): DailyLog {
  const profile = data.profile!;
  const cycleDay = cycleDayForDate(checkIn.date, profile);
  const water = data.waterLog?.[checkIn.date];
  const walking = data.walkingLog?.[checkIn.date];
  const weight = data.weightLog?.[checkIn.date];

  return {
    date: checkIn.date,
    cycleDay,
    symptoms: {
      bleeding: periodToBleeding(checkIn.period),
      pain: {
        level: painLevelToNumber(checkIn.pain?.level),
        type: checkIn.pain?.kinds.includes("headache") ? "aching" : checkIn.pain?.kinds.length ? "cramping" : null,
        location: checkIn.pain?.kinds.includes("headache") ? ["head"] : checkIn.pain?.kinds.includes("back") ? ["back"] : checkIn.pain?.kinds.length ? ["lower_abdomen"] : [],
        radiation: [],
        affectedLife: checkIn.pain?.level === "strong" ? "cancelled_plans" : "none",
        tookPainkiller: Boolean(checkIn.symptomLog?.medications?.length),
        painkillerHelped: null,
      },
      mood: moodToStore(checkIn.mood?.value),
      energy: checkIn.energy?.value ?? null,
      sleep: {
        quality: sleepToStore(checkIn.sleep?.quality),
        hours: checkIn.sleep?.hours ?? null,
        wokeUp: null,
        wokeUpReason: null,
      },
      skin: {
        acne: Boolean(checkIn.pms?.symptoms.includes("Акне")),
        acneCount: checkIn.pms?.symptoms.includes("Акне") ? 1 : null,
        dryness: false,
        oiliness: false,
        hairLoss: false,
      },
      basalTemperature: null,
      libido: checkIn.symptomLog?.libido === "high" ? "high" : checkIn.symptomLog?.libido === "normal" ? "medium" : checkIn.symptomLog?.libido === "low" ? "low" : null,
      context: [
        checkIn.stress ? "stress" : null,
        checkIn.symptomLog?.sweetCraving ? "sweet_craving" : null,
        ...(checkIn.pms?.symptoms.map((item) => `pms:${item}`) ?? []),
      ].filter(Boolean) as string[],
      note: checkIn.note?.text ?? "",
    },
    selfCare: {
      water: water ? water.glasses * 0.25 : 0,
      calories: null,
      protein: null,
      fats: null,
      carbs: null,
      walking: walking ? walking.steps >= 9000 ? "much" : walking.steps >= 5000 ? "normal" : "little" : null,
      workout: null,
      weight: weight?.weight ?? null,
      vitamins: { magnesium: false, omega3: false, zinc: false },
    },
  };
}

function buildCyclesFromProfile(data: MiraLocalData): Cycle[] {
  const profile = data.profile;
  const starts = Array.from(new Set([
    ...(profile?.cycleConfig.periodStarts ?? []),
    ...(profile?.cycleConfig.periodStart ? [profile.cycleConfig.periodStart] : []),
  ])).sort();
  if (!profile || starts.length < 2) return [];

  return starts.slice(0, -1).map((startDate, index) => {
    const nextStart = starts[index + 1];
    const end = new Date(`${nextStart}T00:00:00`);
    end.setDate(end.getDate() - 1);
    const endDate = end.toISOString().slice(0, 10);
    const length = Math.max(1, Math.round((new Date(`${nextStart}T00:00:00`).getTime() - new Date(`${startDate}T00:00:00`).getTime()) / 86_400_000));
    return {
      id: `cycle-${index + 1}`,
      startDate,
      endDate,
      length,
      periodLength: profile.cycleConfig.periodLength,
      symptoms: [],
    };
  });
}

export function buildStoreStateFromLocalData(data: MiraLocalData) {
  const profile = data.profile;
  const logs = Object.values(data.checkIns)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry) => checkInToDailyLog(entry, data));
  const cycles = buildCyclesFromProfile(data);
  const today = dateStr(0);
  const norm = profile ? getCycleNorm(profile) : null;
  const currentDay = norm?.cycleDay ?? 1;
  const averageLength = norm?.cycleLength ?? profile?.cycleConfig.cycleLength ?? 28;
  const periodLength = profile?.cycleConfig.periodLength ?? 5;
  const latestWeight = Object.values(data.weightLog ?? {}).sort((a, b) => b.date.localeCompare(a.date))[0];
  const todayLog = logs.find((log) => log.date === today);
  const care: CareState = {
    water: { current: todayLog?.selfCare.water ?? 0, target: 2 },
    vitamins: { magnesium: false, omega3: false, zinc: false },
    weight: {
      current: latestWeight?.weight ?? profile?.weight ?? null,
      history: Object.values(data.weightLog ?? {}),
    },
    activity: {
      walking: todayLog?.selfCare.walking ?? null,
      workout: todayLog?.selfCare.workout ?? null,
    },
  };
  const settings: SettingsState = {
    reminders: profile?.reminders
      ? { water: profile.reminders.items.water, log: profile.reminders.items.symptoms, vitamins: false }
      : { water: true, log: true, vitamins: false },
    privacy: {
      pin: profile?.pinEnabled ?? false,
      pinCode: null,
      dataStorage: "device",
    },
    achievements: [
      { id: "streak-7", title: "7 дней подряд", description: "Отмечай состояние неделю", unlocked: logs.length >= 7, unlockedDate: null, progress: Math.min(logs.length, 7), target: 7 },
      { id: "cycles-3", title: "3 цикла записано", description: "Собери данные за 3 цикла", unlocked: cycles.length >= 3, unlockedDate: null, progress: Math.min(cycles.length, 3), target: 3 },
      { id: "streak-30", title: "30 дней подряд", description: "Месяц регулярных отметок", unlocked: logs.length >= 30, unlockedDate: null, progress: Math.min(logs.length, 30), target: 30 },
    ],
  };

  return {
    user: {
      name: profile?.name ?? "Mira",
      age: profile?.age ?? 0,
      trackingMonths: Math.max(0, Math.round(logs.length / 30)),
      totalCycles: cycles.length,
    },
    cycle: {
      averageLength,
      periodLength,
      lastPeriodStart: profile?.cycleConfig.periodStart ?? null,
      cycles,
      currentDay,
      phase: cyclePhaseForDay(currentDay, periodLength, averageLength),
      daysUntilPeriod: norm?.isDelayed ? -norm.delayDays : norm?.daysUntilPeriod ?? averageLength - currentDay,
    },
    logs: {
      dailyLogs: logs,
      currentDate: today,
    },
    care,
    settings,
  };
}
