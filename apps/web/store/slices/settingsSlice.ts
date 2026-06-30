import type { StateCreator } from "zustand";
import type { MiraStore, SettingsState } from "../types";

export const createSettingsSlice: StateCreator<MiraStore, [["zustand/devtools", never], ["zustand/persist", unknown], ["zustand/immer", never]], [], Pick<MiraStore,
  "toggleReminder" | "togglePin" | "unlockAchievement" | "updateAchievementProgress"
>> = (set) => ({
  toggleReminder: (name: keyof SettingsState["reminders"]) => {
    set((state) => {
      state.settings.reminders[name] = !state.settings.reminders[name];
    }, false, "settings/toggleReminder");
  },

  togglePin: (enabled: boolean, code?: string) => {
    set((state) => {
      state.settings.privacy.pin = enabled;
      state.settings.privacy.pinCode = enabled ? code ?? state.settings.privacy.pinCode : null;
    }, false, "settings/togglePin");
  },

  unlockAchievement: (id: string) => {
    set((state) => {
      const achievement = state.settings.achievements.find((item) => item.id === id);
      if (achievement) {
        achievement.unlocked = true;
        achievement.unlockedDate = new Date().toISOString().slice(0, 10);
        achievement.progress = achievement.target;
      }
    }, false, "settings/unlockAchievement");
  },

  updateAchievementProgress: (id: string, progress: number) => {
    set((state) => {
      const achievement = state.settings.achievements.find((item) => item.id === id);
      if (achievement) {
        achievement.progress = Math.min(achievement.target, Math.max(0, progress));
        if (achievement.progress >= achievement.target) {
          achievement.unlocked = true;
          achievement.unlockedDate = achievement.unlockedDate ?? new Date().toISOString().slice(0, 10);
        }
      }
    }, false, "settings/updateAchievementProgress");
  },
});
