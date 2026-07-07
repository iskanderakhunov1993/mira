import type { HealthSnapshot, TrackerPreference } from "../types/health";

const now = "2026-01-01T00:00:00.000Z";

export const defaultTrackerPreferences: TrackerPreference[] = ["cycle", "wellbeing", "mood", "energy", "water"];

export function isDemoDataEnabled() {
  return process.env.NEXT_PUBLIC_MIRA_DEMO_DATA === "true" && process.env.NODE_ENV !== "production";
}

export function createEmptyHealthSnapshot(): HealthSnapshot {
  return {
    schemaVersion: 1,
    profile: null,
    cycles: [],
    dailyEntries: [],
    settings: {
      themeMode: "system",
      waterTargetMl: 1800,
      trackerPreferences: defaultTrackerPreferences,
      demoDataEnabled: false,
      notificationsMode: "important_only",
      reminders: {
        periodWindow: true,
        cycleStartConfirm: true,
        water: false,
        sleep: false,
        basalTemperature: false,
        weeklyInsight: true,
        checkIn: true,
      },
      privacy: {
        pinEnabled: false,
        biometricsEnabled: false,
      },
      basalTemperature: {
        enabled: false,
        unit: "celsius",
      },
      customSymptoms: [],
      createdAt: now,
      updatedAt: now,
    },
  };
}

export function createDemoHealthSnapshot(): HealthSnapshot {
  const snapshot = createEmptyHealthSnapshot();

  return {
    ...snapshot,
    profile: {
      id: "demo-profile",
      displayName: "Mira",
      onboardingCompleted: true,
      goal: "understand_cycle",
      lastPeriodStart: "2026-06-20",
      factors: [],
      trackerPreferences: defaultTrackerPreferences,
      createdAt: now,
      updatedAt: now,
    },
    cycles: [
      {
        id: "demo-cycle-1",
        startDate: "2026-06-20",
        source: "seed",
        createdAt: now,
        updatedAt: now,
      },
    ],
    dailyEntries: [
      {
        id: "demo-entry-1",
        date: "2026-06-20",
        checkIn: { value: "normal" },
        context: [],
        symptoms: [],
        createdAt: now,
        updatedAt: now,
      },
    ],
    settings: {
      ...snapshot.settings,
      demoDataEnabled: true,
    },
  };
}
