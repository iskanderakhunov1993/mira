import type { StateCreator } from "zustand";
import type { ActiveTab, MiraStore, Notification } from "../types";

export const createUISlice: StateCreator<MiraStore, [["zustand/devtools", never], ["zustand/persist", unknown], ["zustand/immer", never]], [], Pick<MiraStore,
  "setLoading" | "setActiveTab" | "openPainModal" | "closePainModal" | "addNotification" | "markNotificationRead" | "clearNotifications"
>> = (set) => ({
  setLoading: (isLoading: boolean) => {
    set((state) => {
      state.ui.isLoading = isLoading;
    }, false, "ui/setLoading");
  },

  setActiveTab: (tab: ActiveTab) => {
    set((state) => {
      state.ui.activeTab = tab;
    }, false, "ui/setActiveTab");
  },

  openPainModal: () => {
    set((state) => {
      state.ui.isPainModalOpen = true;
    }, false, "ui/openPainModal");
  },

  closePainModal: () => {
    set((state) => {
      state.ui.isPainModalOpen = false;
    }, false, "ui/closePainModal");
  },

  addNotification: (notification: Omit<Notification, "id" | "read">) => {
    set((state) => {
      state.ui.notifications.push({
        ...notification,
        id: crypto.randomUUID(),
        read: false,
      });
    }, false, "ui/addNotification");
  },

  markNotificationRead: (id: string) => {
    set((state) => {
      const notification = state.ui.notifications.find((item) => item.id === id);
      if (notification) notification.read = true;
    }, false, "ui/markNotificationRead");
  },

  clearNotifications: () => {
    set((state) => {
      state.ui.notifications = [];
    }, false, "ui/clearNotifications");
  },
});
