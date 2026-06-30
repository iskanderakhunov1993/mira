import type { StateCreator } from "zustand";
import type { CareState, MiraStore } from "../types";

export const createCareSlice: StateCreator<MiraStore, [["zustand/devtools", never], ["zustand/persist", unknown], ["zustand/immer", never]], [], Pick<MiraStore,
  "setWater" | "addWater" | "setVitamin" | "setWeight" | "setActivity"
>> = (set) => ({
  setWater: (amount: number) => {
    set((state) => {
      state.care.water.current = Math.max(0, Math.min(3, amount));
    }, false, "care/setWater");
  },

  addWater: (amount: number) => {
    set((state) => {
      state.care.water.current = Math.max(0, Math.min(3, Math.round((state.care.water.current + amount) * 10) / 10));
    }, false, "care/addWater");
  },

  setVitamin: (name: keyof CareState["vitamins"], has: boolean) => {
    set((state) => {
      state.care.vitamins[name] = has;
    }, false, "care/setVitamin");
  },

  setWeight: (weight: number) => {
    set((state) => {
      const date = new Date().toISOString().slice(0, 10);
      state.care.weight.current = weight;
      state.care.weight.history = [
        ...state.care.weight.history.filter((entry) => entry.date !== date),
        { date, weight },
      ];
    }, false, "care/setWeight");
  },

  setActivity: (type, value) => {
    set((state) => {
      state.care.activity[type] = value;
    }, false, "care/setActivity");
  },
});
