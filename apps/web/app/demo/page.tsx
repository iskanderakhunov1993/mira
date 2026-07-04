"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { CareState, Cycle, CycleState, DailyLog, SettingsState, UserState } from "@/store";
import { useMiraStore } from "@/store";
import type { MiraLocalData } from "@/lib/types";

const dayMs = 86_400_000;

function isoDaysAgo(daysAgo: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function diffDays(from: string, to: string) {
  return Math.floor((new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) / dayMs);
}

type DemoLogOverrides = Omit<Partial<DailyLog["symptoms"]>, "bleeding" | "pain" | "sleep" | "skin"> & {
  bleeding?: Partial<DailyLog["symptoms"]["bleeding"]>;
  pain?: Partial<DailyLog["symptoms"]["pain"]>;
  sleep?: Partial<DailyLog["symptoms"]["sleep"]>;
  skin?: Partial<DailyLog["symptoms"]["skin"]>;
  selfCare?: Partial<DailyLog["selfCare"]>;
};

function makeLog(date: string, cycleDay: number, overrides: DemoLogOverrides = {}): DailyLog {
  const { bleeding, pain, sleep, skin, selfCare, ...symptoms } = overrides;

  return {
    date,
    cycleDay,
    symptoms: {
      mood: null,
      energy: null,
      libido: null,
      note: "",
      ...symptoms,
      bleeding: { amount: 0, pads: 0, color: null, clots: null, ...bleeding },
      pain: {
        level: 0,
        type: null,
        location: [],
        radiation: [],
        affectedLife: "none",
        tookPainkiller: false,
        painkillerHelped: null,
        ...pain,
      },
      sleep: { quality: null, hours: null, wokeUp: null, wokeUpReason: null, ...sleep },
      skin: { acne: false, acneCount: null, dryness: false, oiliness: false, hairLoss: false, ...skin },
      context: symptoms.context ?? [],
    },
    selfCare: {
      water: 1.8,
      calories: null,
      protein: null,
      fats: null,
      carbs: null,
      walking: "normal",
      workout: null,
      weight: null,
      vitamins: { magnesium: false, omega3: false, zinc: false },
      ...selfCare,
    },
  };
}

function buildDemo() {
  const today = new Date().toISOString().slice(0, 10);
  const lastPeriodStart = isoDaysAgo(21);
  const currentDay = diffDays(lastPeriodStart, today) + 1;
  const cycles: Cycle[] = [
    { id: "demo-cycle-1", startDate: isoDaysAgo(105), endDate: isoDaysAgo(78), length: 28, periodLength: 5, symptoms: [] },
    { id: "demo-cycle-2", startDate: isoDaysAgo(77), endDate: isoDaysAgo(50), length: 28, periodLength: 5, symptoms: [] },
    { id: "demo-cycle-3", startDate: isoDaysAgo(49), endDate: isoDaysAgo(22), length: 28, periodLength: 6, symptoms: [] },
  ];

  const dailyLogs: DailyLog[] = [
    makeLog(isoDaysAgo(21), 1, { bleeding: { amount: 3, pads: 7, color: "bright" }, pain: { level: 4, type: "cramping", location: ["low_abdomen"], affectedLife: "moderately" }, mood: "low", energy: "low", sleep: { quality: "poor", hours: 5.5 }, note: "Первый день, боль мешала работать.", selfCare: { water: 0.9, walking: "little" } }),
    makeLog(isoDaysAgo(20), 2, { bleeding: { amount: 3, pads: 6, color: "dark", clots: "small" }, pain: { level: 3, type: "cramping", location: ["low_abdomen", "back"] }, energy: "exhausted", sleep: { quality: "poor", hours: 6 }, selfCare: { water: 1.1, walking: "little" } }),
    makeLog(isoDaysAgo(19), 3, { bleeding: { amount: 2, pads: 4, color: "dark" }, pain: { level: 2, type: "aching", location: ["back"] }, mood: "irritable", energy: "low", selfCare: { water: 1.4 } }),
    makeLog(isoDaysAgo(18), 4, { bleeding: { amount: 1, pads: 2, color: "brown" }, mood: "neutral", energy: "normal", sleep: { quality: "normal", hours: 7 } }),
    makeLog(isoDaysAgo(17), 5, { bleeding: { amount: 1, pads: 1, color: "brown" }, mood: "good", energy: "normal", sleep: { quality: "good", hours: 7.5 } }),
    makeLog(isoDaysAgo(15), 7, { mood: "good", energy: "high", sleep: { quality: "good", hours: 8 }, selfCare: { water: 2.1, walking: "much", workout: "light" } }),
    makeLog(isoDaysAgo(13), 9, { mood: "good", energy: "normal", skin: { acne: true, acneCount: 1 }, selfCare: { water: 1.7, walking: "normal" } }),
    makeLog(isoDaysAgo(11), 11, { context: ["sex_protected"], libido: "medium", mood: "great", energy: "normal", sleep: { quality: "good", hours: 7.5 } }),
    makeLog(isoDaysAgo(9), 13, { context: ["discharge_watery"], mood: "good", energy: "high", selfCare: { water: 2.2, walking: "much" } }),
    makeLog(isoDaysAgo(7), 15, { mood: "anxious", energy: "normal", sleep: { quality: "normal", hours: 7 }, context: ["craving_sweet"] }),
    makeLog(isoDaysAgo(6), 16, { mood: "irritable", energy: "low", sleep: { quality: "poor", hours: 5.8 }, context: ["craving_sweet"], selfCare: { water: 1 } }),
    makeLog(isoDaysAgo(5), 17, { pain: { level: 2, type: "aching", location: ["head"] }, mood: "anxious", energy: "low", sleep: { quality: "poor", hours: 5.5 }, selfCare: { water: 0.8, walking: "little" } }),
    makeLog(isoDaysAgo(4), 18, { context: ["sex_unprotected"], libido: "high", mood: "neutral", energy: "normal", note: "Важно не включать интимные данные в отчёт без выбора." }),
    makeLog(isoDaysAgo(3), 19, { pain: { level: 1, type: "dull", location: ["low_abdomen"] }, mood: "irritable", energy: "low", skin: { acne: true, acneCount: 2 }, selfCare: { water: 1.2 } }),
    makeLog(isoDaysAgo(2), 20, { mood: "low", energy: "low", sleep: { quality: "poor", hours: 6 }, context: ["appetite_high", "craving_sweet"], selfCare: { water: 1 } }),
    makeLog(isoDaysAgo(1), 21, { pain: { level: 2, type: "cramping", location: ["low_abdomen"] }, mood: "anxious", energy: "normal", sleep: { quality: "normal", hours: 7 }, selfCare: { water: 1.6 } }),
    makeLog(today, currentDay, { mood: "neutral", energy: "normal", sleep: { quality: "normal", hours: 7.2 }, selfCare: { water: 1.4, walking: "normal" } }),
  ];

  const user: UserState = {
    name: "Амина",
    email: "amina@mira.app",
    age: 27,
    trackingMonths: 4,
    totalCycles: 4,
  };
  const cycle: CycleState = {
    averageLength: 28,
    periodLength: 5,
    lastPeriodStart,
    cycles,
    currentDay,
    phase: currentDay <= 5 ? "menstrual" : currentDay <= 13 ? "follicular" : currentDay <= 16 ? "ovulatory" : "luteal",
    daysUntilPeriod: Math.max(0, 28 - currentDay),
  };
  const care: CareState = {
    water: { current: 1.4, target: 2 },
    vitamins: { magnesium: true, omega3: false, zinc: false },
    weight: {
      current: 58.4,
      history: [
        { date: isoDaysAgo(21), weight: 58.1 },
        { date: isoDaysAgo(7), weight: 58.8 },
        { date: today, weight: 58.4 },
      ],
    },
    activity: { walking: "normal", workout: "light" },
  };
  const settings: SettingsState = {
    reminders: { water: true, log: true, vitamins: false },
    privacy: { pin: false, pinCode: null, dataStorage: "device" },
    achievements: [
      { id: "streak-7", title: "7 дней подряд", description: "Отмечай состояние неделю", unlocked: true, unlockedDate: isoDaysAgo(14), progress: 7, target: 7 },
      { id: "cycles-3", title: "3 цикла записано", description: "Собери данные за 3 цикла", unlocked: true, unlockedDate: isoDaysAgo(22), progress: 3, target: 3 },
      { id: "streak-30", title: "30 дней подряд", description: "Месяц регулярных отметок", unlocked: false, unlockedDate: null, progress: 17, target: 30 },
    ],
  };

  const legacyData: MiraLocalData = {
    version: 2,
    onboardingCompleted: true,
    profile: {
      name: "Амина",
      email: "amina@mira.app",
      age: 27,
      height: 165,
      weight: 58.4,
      activityLevel: "medium",
      showCalories: false,
      cycleConfig: {
        periodStart: lastPeriodStart,
        cycleLength: 28,
        periodLength: 5,
        periodStarts: [...cycles.map((item) => item.startDate), lastPeriodStart],
      },
      trackingPreferences: ["cycle", "pain", "mood", "energy", "sleep", "nutrition", "intimacy"],
      additionalMode: "none",
      pinEnabled: false,
      hiddenNotifications: true,
      privateMarks: true,
    },
    checkIns: {},
    workouts: [],
    waterLog: Object.fromEntries(dailyLogs.filter((log) => log.selfCare.water > 0).map((log) => [log.date, { date: log.date, glasses: Math.round(log.selfCare.water / 0.25), goal: 8 }])),
    walkingLog: Object.fromEntries(dailyLogs.filter((log) => log.selfCare.walking && log.selfCare.walking !== "none").map((log) => [log.date, { date: log.date, steps: log.selfCare.walking === "much" ? 10_000 : log.selfCare.walking === "normal" ? 6500 : 2500, goal: 7000, source: "manual" }])),
    weightLog: Object.fromEntries(care.weight.history.map((entry) => [entry.date, entry])),
  };

  return { user, cycle, logs: { dailyLogs, currentDate: today }, care, settings, legacyData };
}

export default function DemoPage() {
  const router = useRouter();

  useEffect(() => {
    const demo = buildDemo();
    useMiraStore.setState((state) => ({
      ...state,
      user: demo.user,
      cycle: demo.cycle,
      logs: demo.logs,
      care: demo.care,
      settings: demo.settings,
    }));
    window.localStorage.setItem("mira-zustand-store", JSON.stringify({
      state: {
        user: demo.user,
        cycle: demo.cycle,
        logs: demo.logs,
        care: demo.care,
        settings: demo.settings,
      },
      version: 1,
    }));
    window.localStorage.setItem("mira:data", JSON.stringify(demo.legacyData));
    window.setTimeout(() => router.replace("/analysis"), 250);
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050505] px-5 text-[#F5F0ED]">
      <div className="max-w-sm rounded-[24px] border border-[#2E2826] bg-[#1D1816] p-6 text-center">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8D817B]">Demo</p>
        <h1 className="mt-2 text-2xl font-black">Создаю демо Амины</h1>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-[#B7AAA4]">
          Загружаю цикл, симптомы, сон, воду, интимные отметки и данные для отчёта.
        </p>
      </div>
    </main>
  );
}
