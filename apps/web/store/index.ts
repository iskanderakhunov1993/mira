"use client";

import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { initialCareState, initialCycleState, initialLogState, initialSettingsState, initialUIState, initialUserState } from "./initialState";
import { persistedMiraStateSchema } from "./schema";
import { createCareSlice } from "./slices/careSlice";
import { createCycleSlice } from "./slices/cycleSlice";
import { createLogSlice } from "./slices/logSlice";
import { createSettingsSlice } from "./slices/settingsSlice";
import { createUISlice } from "./slices/uiSlice";
import { createUserSlice } from "./slices/userSlice";
import { selectCurrentCycle, selectCycleStats, selectMostCommonSymptoms, selectRedFlags, selectSkinHistory } from "./selectors";
import type { MiraState, MiraStore } from "./types";

type PersistedMiraState = Pick<MiraState, "user" | "cycle" | "logs" | "care" | "settings">;

export const useMiraStore = create<MiraStore>()(
  devtools(
    persist(
      immer((...args) => ({
        user: initialUserState,
        cycle: initialCycleState,
        logs: initialLogState,
        care: initialCareState,
        settings: initialSettingsState,
        ui: initialUIState,
        ...createUserSlice(...args),
        ...createCycleSlice(...args),
        ...createLogSlice(...args),
        ...createCareSlice(...args),
        ...createSettingsSlice(...args),
        ...createUISlice(...args),
      })),
      {
        name: "mira-zustand-store",
        version: 1,
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          user: state.user,
          cycle: state.cycle,
          logs: state.logs,
          care: state.care,
          settings: state.settings,
        }),
        merge: (persistedState, currentState) => {
          const parsed = persistedMiraStateSchema.safeParse(persistedState);
          if (!parsed.success) return currentState;
          const persisted = parsed.data as PersistedMiraState;
          return {
            ...currentState,
            ...persisted,
            ui: initialUIState,
          };
        },
      }
    ),
    { name: "MiraStore" }
  )
);

export const miraSelectors = {
  selectCurrentCycle,
  selectCycleStats,
  selectMostCommonSymptoms,
  selectRedFlags,
  selectSkinHistory,
};

export { selectCurrentCycle, selectCycleStats, selectMostCommonSymptoms, selectRedFlags, selectSkinHistory };
export type * from "./types";
