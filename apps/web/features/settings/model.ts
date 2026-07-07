import type { HealthSettings, HealthSnapshot, TrackerPreference } from "../../types/health";

export function toggleTracker(settings: HealthSettings, tracker: TrackerPreference): HealthSettings {
  const exists = settings.trackerPreferences.includes(tracker);
  const trackerPreferences = exists
    ? settings.trackerPreferences.filter((item) => item !== tracker)
    : [...settings.trackerPreferences, tracker];
  return { ...settings, trackerPreferences, updatedAt: new Date().toISOString() };
}

export function setWaterTarget(settings: HealthSettings, value: number): HealthSettings {
  return {
    ...settings,
    waterTargetMl: Math.max(0, Math.round(value)),
    updatedAt: new Date().toISOString(),
  };
}

export function addCustomSymptom(settings: HealthSettings, symptom: string): HealthSettings {
  const normalized = symptom.trim();
  if (!normalized) return settings;
  return {
    ...settings,
    customSymptoms: Array.from(new Set([...settings.customSymptoms, normalized])),
    updatedAt: new Date().toISOString(),
  };
}

export function removeCustomSymptom(settings: HealthSettings, symptom: string): HealthSettings {
  return {
    ...settings,
    customSymptoms: settings.customSymptoms.filter((item) => item !== symptom),
    updatedAt: new Date().toISOString(),
  };
}

export function buildJsonExport(snapshot: HealthSnapshot) {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      schemaVersion: snapshot.schemaVersion,
      profile: snapshot.profile,
      cycles: snapshot.cycles,
      dailyEntries: snapshot.dailyEntries,
      settings: snapshot.settings,
    },
    null,
    2
  );
}
