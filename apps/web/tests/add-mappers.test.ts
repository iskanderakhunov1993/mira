import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildLegacyData,
  buildRepositoryCycle,
  buildRepositoryEntry,
  createInitialAddDraft,
  validateAddDraft,
} from "../features/add/mappers.ts";
import type { MiraLocalData } from "../lib/types.ts";

function emptyLegacy(): MiraLocalData {
  return {
    version: 2,
    checkIns: {},
    workouts: [],
    onboardingCompleted: true,
    profile: {
      name: "Mira",
      showCalories: false,
      cycleConfig: {
        periodStart: "2026-07-01",
        cycleLength: 28,
        periodLength: 5,
        periodStarts: ["2026-07-01"],
      },
      trackingPreferences: ["cycle"],
      additionalMode: "none",
      pinEnabled: false,
      hiddenNotifications: false,
      privateMarks: true,
      reportSexDefault: false,
      cloudSyncExclude: ["intimacy", "notes"],
    },
  };
}

test("add mapper saves period start and creates cycle", () => {
  const draft = { ...createInitialAddDraft(), action: "period" as const, periodState: "started" as const };
  const entry = buildRepositoryEntry(undefined, draft, "2026-07-07");
  const cycle = buildRepositoryCycle(draft, "2026-07-07");
  const legacy = buildLegacyData(emptyLegacy(), draft, "2026-07-07");

  assert.equal(entry.period?.state, "started");
  assert.equal(cycle?.startDate, "2026-07-07");
  assert.equal(legacy.profile?.cycleConfig.periodStart, "2026-07-07");
  assert.ok(legacy.profile?.cycleConfig.periodStarts?.includes("2026-07-07"));
});

test("add mapper increments water and validates custom amount", () => {
  const invalid = { ...createInitialAddDraft(), action: "water" as const, waterAmount: "custom" as const, customWaterMl: "0" };
  assert.equal(validateAddDraft(invalid), "Введите объём воды больше 0 мл.");

  const draft = { ...invalid, customWaterMl: "300" };
  const entry = buildRepositoryEntry({ id: "entry", date: "2026-07-07", waterMl: 250, context: [], symptoms: [], createdAt: "x", updatedAt: "x" }, draft, "2026-07-07");
  assert.equal(entry.waterMl, 550);
});

test("add mapper saves sleep with optional hours", () => {
  const draft = { ...createInitialAddDraft(), action: "sleep" as const, sleepQuality: "poor" as const, sleepHours: "6.5" };
  const entry = buildRepositoryEntry(undefined, draft, "2026-07-07");
  const legacy = buildLegacyData(emptyLegacy(), draft, "2026-07-07");

  assert.deepEqual(entry.sleep, { quality: "poor", hours: 6.5 });
  assert.equal(legacy.checkIns["2026-07-07"].sleep?.quality, "bad");
});

test("add mapper saves pain without medical diagnosis", () => {
  const draft = { ...createInitialAddDraft(), action: "pain" as const, painLocation: "низ живота", painIntensity: 5 as const, painAffectedLife: "moderately" as const };
  const entry = buildRepositoryEntry(undefined, draft, "2026-07-07");
  const legacy = buildLegacyData(emptyLegacy(), draft, "2026-07-07");

  assert.equal(entry.pain?.intensity, 5);
  assert.equal(legacy.checkIns["2026-07-07"].pain?.level, "strong");
});

test("add mapper saves symptom and other context", () => {
  const symptomDraft = { ...createInitialAddDraft(), action: "symptom" as const, symptom: "другое", customSymptom: "озноб" };
  const contextDraft = { ...createInitialAddDraft(), action: "other" as const, context: "поездка", note: "перелёт" };

  const symptomEntry = buildRepositoryEntry(undefined, symptomDraft, "2026-07-07");
  const contextEntry = buildRepositoryEntry(symptomEntry, contextDraft, "2026-07-07");
  const legacy = buildLegacyData(emptyLegacy(), contextDraft, "2026-07-07");

  assert.deepEqual(symptomEntry.symptoms, ["озноб"]);
  assert.deepEqual(contextEntry.context, ["поездка"]);
  assert.equal(legacy.checkIns["2026-07-07"].note?.text, "перелёт");
});
