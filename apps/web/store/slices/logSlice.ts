import type { StateCreator } from "zustand";
import type { DailyLog, MiraStore } from "../types";

export const createLogSlice: StateCreator<MiraStore, [["zustand/devtools", never], ["zustand/persist", unknown], ["zustand/immer", never]], [], Pick<MiraStore,
  "setDailyLog" | "addDailyLog" | "updateDailyLog" | "getLogByDate" | "getLogsByCycle"
>> = (set, get) => ({
  setDailyLog: (log: DailyLog) => {
    set((state) => {
      state.logs.dailyLogs = state.logs.dailyLogs.map((item) => item.date === log.date ? log : item);
      if (!state.logs.dailyLogs.some((item) => item.date === log.date)) state.logs.dailyLogs.push(log);
    }, false, "logs/setDailyLog");
  },

  addDailyLog: (log: DailyLog) => {
    get().setDailyLog(log);
  },

  updateDailyLog: (date: string, updates: Partial<DailyLog>) => {
    set((state) => {
      state.logs.dailyLogs = state.logs.dailyLogs.map((log) => log.date === date ? { ...log, ...updates } : log);
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
