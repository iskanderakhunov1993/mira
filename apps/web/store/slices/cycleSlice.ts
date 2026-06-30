import type { StateCreator } from "zustand";
import type { Cycle, CyclePhase, MiraStore } from "../types";

function diffDays(from: string, to: string) {
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  return Math.floor((end.getTime() - start.getTime()) / 86_400_000);
}

function phaseForDay(day: number, periodLength: number, averageLength: number): CyclePhase {
  if (day <= periodLength) return "menstrual";
  if (day <= Math.max(periodLength + 1, Math.round(averageLength * 0.45))) return "follicular";
  if (day <= Math.round(averageLength * 0.58)) return "ovulatory";
  return "luteal";
}

export const createCycleSlice: StateCreator<MiraStore, [["zustand/devtools", never], ["zustand/persist", unknown], ["zustand/immer", never]], [], Pick<MiraStore,
  "setCycleLength" | "setPeriodLength" | "setLastPeriodStart" | "addCycle" | "updateCurrentDay" | "calculatePhase" | "calculateDaysUntilPeriod"
>> = (set, get) => ({
  setCycleLength: (length: number) => {
    set((state) => {
      state.cycle.averageLength = Math.max(15, length);
    }, false, "cycle/setCycleLength");
    get().updateCurrentDay();
  },

  setPeriodLength: (length: number) => {
    set((state) => {
      state.cycle.periodLength = Math.max(1, length);
    }, false, "cycle/setPeriodLength");
    get().updateCurrentDay();
  },

  setLastPeriodStart: (date: string) => {
    set((state) => {
      state.cycle.lastPeriodStart = date;
    }, false, "cycle/setLastPeriodStart");
    get().updateCurrentDay();
  },

  addCycle: (cycle: Cycle) => {
    set((state) => {
      state.cycle.cycles = [...state.cycle.cycles, cycle];
      if (state.cycle.cycles.length > 0) {
        const total = state.cycle.cycles.reduce((sum, item) => sum + item.length, 0);
        state.cycle.averageLength = Math.round(total / state.cycle.cycles.length);
      }
    }, false, "cycle/addCycle");
  },

  updateCurrentDay: () => {
    const state = get();
    const today = new Date().toISOString().slice(0, 10);
    const lastStart = state.cycle.lastPeriodStart;
    const currentDay = lastStart ? Math.max(1, diffDays(lastStart, today) + 1) : state.cycle.currentDay;
    const daysUntilPeriod = state.calculateDaysUntilPeriod();
    const phase = state.calculatePhase(currentDay);

    set((draft) => {
      draft.cycle.currentDay = currentDay;
      draft.cycle.daysUntilPeriod = daysUntilPeriod;
      draft.cycle.phase = phase;
    }, false, "cycle/updateCurrentDay");
  },

  calculatePhase: (day: number) => {
    const { periodLength, averageLength } = get().cycle;
    return phaseForDay(day, periodLength, averageLength);
  },

  calculateDaysUntilPeriod: () => {
    const { currentDay, averageLength } = get().cycle;
    const remaining = averageLength - currentDay;
    return remaining >= 0 ? remaining : 0;
  },
});
