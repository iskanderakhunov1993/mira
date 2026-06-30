import type { StateCreator } from "zustand";
import type { MiraStore, UserState } from "../types";

export const createUserSlice: StateCreator<MiraStore, [["zustand/devtools", never], ["zustand/persist", unknown], ["zustand/immer", never]], [], Pick<MiraStore, "setUser" | "updateTrackingStats">> = (set) => ({
  setUser: (user: Partial<UserState>) => {
    set((state) => {
      state.user = { ...state.user, ...user };
    }, false, "user/setUser");
  },

  updateTrackingStats: (months: number, cycles: number) => {
    set((state) => {
      state.user.trackingMonths = months;
      state.user.totalCycles = cycles;
    }, false, "user/updateTrackingStats");
  },
});
