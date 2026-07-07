import { createDemoHealthSnapshot, createEmptyHealthSnapshot, isDemoDataEnabled } from "@/data/seed";
import type { HealthSnapshot } from "@/types/health";

export const HEALTH_SCHEMA_VERSION = 1;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function migrateHealthSnapshot(raw: unknown): HealthSnapshot {
  if (!isObject(raw)) {
    return isDemoDataEnabled() ? createDemoHealthSnapshot() : createEmptyHealthSnapshot();
  }

  const base = createEmptyHealthSnapshot();

  return {
    schemaVersion: HEALTH_SCHEMA_VERSION,
    profile: isObject(raw.profile) ? (raw.profile as unknown as HealthSnapshot["profile"]) : base.profile,
    cycles: Array.isArray(raw.cycles) ? (raw.cycles as HealthSnapshot["cycles"]) : base.cycles,
    dailyEntries: Array.isArray(raw.dailyEntries)
      ? (raw.dailyEntries as HealthSnapshot["dailyEntries"])
      : base.dailyEntries,
    settings: isObject(raw.settings)
      ? {
          ...base.settings,
          ...(raw.settings as Partial<HealthSnapshot["settings"]>),
          reminders: {
            ...base.settings.reminders,
            ...((raw.settings as Partial<HealthSnapshot["settings"]>).reminders ?? {}),
          },
          privacy: {
            ...base.settings.privacy,
            ...((raw.settings as Partial<HealthSnapshot["settings"]>).privacy ?? {}),
          },
          basalTemperature: {
            ...base.settings.basalTemperature,
            ...((raw.settings as Partial<HealthSnapshot["settings"]>).basalTemperature ?? {}),
          },
          customSymptoms: Array.isArray((raw.settings as Partial<HealthSnapshot["settings"]>).customSymptoms)
            ? (raw.settings as Partial<HealthSnapshot["settings"]>).customSymptoms!
            : base.settings.customSymptoms,
          demoDataEnabled: Boolean((raw.settings as Partial<HealthSnapshot["settings"]>).demoDataEnabled),
        }
      : base.settings,
  };
}

export function parseHealthSnapshot(value: string | null): HealthSnapshot {
  if (!value) return migrateHealthSnapshot(null);

  try {
    return migrateHealthSnapshot(JSON.parse(value));
  } catch {
    return createEmptyHealthSnapshot();
  }
}
