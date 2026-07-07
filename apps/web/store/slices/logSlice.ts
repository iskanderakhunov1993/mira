import type { StateCreator } from "zustand";
import type { DailyLog, MiraStore } from "../types";

function uniqueValues<T>(left: T[], right: T[]): T[] {
  return Array.from(new Set([...left, ...right]));
}

function keepNumber(existing: number, incoming: number): number {
  return incoming > 0 ? incoming : existing;
}

function keepNullable<T>(existing: T | null, incoming: T | null): T | null {
  return incoming ?? existing;
}

function mergeDailyLog(existing: DailyLog | undefined, incoming: DailyLog): DailyLog {
  if (!existing) return incoming;

  return {
    ...existing,
    ...incoming,
    cycleDay: incoming.cycleDay || existing.cycleDay,
    symptoms: {
      ...existing.symptoms,
      ...incoming.symptoms,
      bleeding: {
        ...existing.symptoms.bleeding,
        ...incoming.symptoms.bleeding,
        amount: Math.max(existing.symptoms.bleeding.amount, incoming.symptoms.bleeding.amount) as DailyLog["symptoms"]["bleeding"]["amount"],
        pads: keepNumber(existing.symptoms.bleeding.pads, incoming.symptoms.bleeding.pads),
        color: keepNullable(existing.symptoms.bleeding.color, incoming.symptoms.bleeding.color),
        clots: keepNullable(existing.symptoms.bleeding.clots, incoming.symptoms.bleeding.clots),
      },
      pain: {
        ...existing.symptoms.pain,
        ...incoming.symptoms.pain,
        level: Math.max(existing.symptoms.pain.level, incoming.symptoms.pain.level) as DailyLog["symptoms"]["pain"]["level"],
        type: keepNullable(existing.symptoms.pain.type, incoming.symptoms.pain.type),
        affectedLife: incoming.symptoms.pain.affectedLife === "none" ? existing.symptoms.pain.affectedLife : incoming.symptoms.pain.affectedLife,
        tookPainkiller: existing.symptoms.pain.tookPainkiller || incoming.symptoms.pain.tookPainkiller,
        painkillerHelped: keepNullable(existing.symptoms.pain.painkillerHelped, incoming.symptoms.pain.painkillerHelped),
        location: uniqueValues(existing.symptoms.pain.location, incoming.symptoms.pain.location),
        radiation: uniqueValues(existing.symptoms.pain.radiation, incoming.symptoms.pain.radiation),
      },
      mood: keepNullable(existing.symptoms.mood, incoming.symptoms.mood),
      energy: keepNullable(existing.symptoms.energy, incoming.symptoms.energy),
      sleep: {
        ...existing.symptoms.sleep,
        ...incoming.symptoms.sleep,
        quality: keepNullable(existing.symptoms.sleep.quality, incoming.symptoms.sleep.quality),
        hours: keepNullable(existing.symptoms.sleep.hours, incoming.symptoms.sleep.hours),
        wokeUp: keepNullable(existing.symptoms.sleep.wokeUp, incoming.symptoms.sleep.wokeUp),
        wokeUpReason: incoming.symptoms.sleep.wokeUpReason || existing.symptoms.sleep.wokeUpReason
          ? uniqueValues(existing.symptoms.sleep.wokeUpReason ?? [], incoming.symptoms.sleep.wokeUpReason ?? [])
          : null,
      },
      skin: {
        ...existing.symptoms.skin,
        ...incoming.symptoms.skin,
        acne: existing.symptoms.skin.acne || incoming.symptoms.skin.acne,
        acneCount: Math.max(existing.symptoms.skin.acneCount ?? 0, incoming.symptoms.skin.acneCount ?? 0) || null,
        dryness: existing.symptoms.skin.dryness || incoming.symptoms.skin.dryness,
        oiliness: existing.symptoms.skin.oiliness || incoming.symptoms.skin.oiliness,
        hairLoss: existing.symptoms.skin.hairLoss || incoming.symptoms.skin.hairLoss,
      },
      basalTemperature: keepNullable(existing.symptoms.basalTemperature ?? null, incoming.symptoms.basalTemperature ?? null),
      libido: keepNullable(existing.symptoms.libido, incoming.symptoms.libido),
      context: uniqueValues(existing.symptoms.context, incoming.symptoms.context),
      note: [existing.symptoms.note, incoming.symptoms.note]
        .map((note) => note.trim())
        .filter(Boolean)
        .filter((note, index, notes) => notes.indexOf(note) === index)
        .join("\n"),
    },
    selfCare: {
      ...existing.selfCare,
      ...incoming.selfCare,
      water: keepNumber(existing.selfCare.water, incoming.selfCare.water),
      calories: keepNullable(existing.selfCare.calories, incoming.selfCare.calories),
      protein: keepNullable(existing.selfCare.protein, incoming.selfCare.protein),
      fats: keepNullable(existing.selfCare.fats, incoming.selfCare.fats),
      carbs: keepNullable(existing.selfCare.carbs, incoming.selfCare.carbs),
      walking: keepNullable(existing.selfCare.walking, incoming.selfCare.walking),
      workout: keepNullable(existing.selfCare.workout, incoming.selfCare.workout),
      weight: keepNullable(existing.selfCare.weight, incoming.selfCare.weight),
      vitamins: {
        ...existing.selfCare.vitamins,
        ...incoming.selfCare.vitamins,
        magnesium: existing.selfCare.vitamins.magnesium || incoming.selfCare.vitamins.magnesium,
        omega3: existing.selfCare.vitamins.omega3 || incoming.selfCare.vitamins.omega3,
        zinc: existing.selfCare.vitamins.zinc || incoming.selfCare.vitamins.zinc,
      },
    },
  };
}

export const createLogSlice: StateCreator<MiraStore, [["zustand/devtools", never], ["zustand/persist", unknown], ["zustand/immer", never]], [], Pick<MiraStore,
  "setDailyLog" | "addDailyLog" | "updateDailyLog" | "getLogByDate" | "getLogsByCycle"
>> = (set, get) => ({
  setDailyLog: (log: DailyLog) => {
    set((state) => {
      const existing = state.logs.dailyLogs.find((item) => item.date === log.date);
      const merged = mergeDailyLog(existing, log);
      state.logs.dailyLogs = state.logs.dailyLogs.map((item) => item.date === log.date ? merged : item);
      if (!existing) state.logs.dailyLogs.push(merged);
    }, false, "logs/setDailyLog");
  },

  addDailyLog: (log: DailyLog) => {
    get().setDailyLog(log);
  },

  updateDailyLog: (date: string, updates: Partial<DailyLog>) => {
    set((state) => {
      state.logs.dailyLogs = state.logs.dailyLogs.map((log) => log.date === date ? mergeDailyLog(log, { ...log, ...updates }) : log);
    }, false, "logs/updateDailyLog");
  },

  getLogByDate: (date: string) => {
    return get().logs.dailyLogs.find((log) => log.date === date);
  },

  getLogsByCycle: (cycleId: string) => {
    const cycle = get().cycle.cycles.find((item) => item.id === cycleId);
    if (!cycle) return [];
    return get().logs.dailyLogs.filter((log) => log.date >= cycle.startDate && (!cycle.endDate || log.date <= cycle.endDate));
  },
});
