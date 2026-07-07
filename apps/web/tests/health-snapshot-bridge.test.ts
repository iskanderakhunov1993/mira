import assert from "node:assert/strict";
import test from "node:test";
import { createEmptyHealthSnapshot } from "../data/seed.ts";
import { mergeHealthSnapshotIntoLegacy } from "../lib/healthSnapshotBridge.ts";
import type { MiraLocalData } from "../lib/types.ts";

function emptyLegacy(): MiraLocalData {
  return {
    version: 2,
    checkIns: {},
    workouts: [],
    onboardingCompleted: false,
  };
}

test("health snapshot bridge exposes repository profile and daily data to legacy screens", () => {
  const snapshot = createEmptyHealthSnapshot();
  snapshot.profile = {
    id: "local-profile",
    displayName: "Mira",
    onboardingCompleted: true,
    goal: "track_wellbeing",
    lastPeriodStart: "2026-07-01",
    periodStartUnknown: false,
    cycleRegularity: "regular",
    factors: [],
    trackerPreferences: ["cycle", "water", "pain", "symptoms"],
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  };
  snapshot.cycles = [
    {
      id: "cycle-2026-07-01",
      startDate: "2026-07-01",
      source: "user",
      createdAt: "2026-07-01T00:00:00.000Z",
      updatedAt: "2026-07-01T00:00:00.000Z",
    },
  ];
  snapshot.dailyEntries = [
    {
      id: "entry-2026-07-01",
      date: "2026-07-01",
      checkIn: { value: "hard" },
      period: {
        id: "period-2026-07-01",
        date: "2026-07-01",
        state: "started",
        createdAt: "2026-07-01T00:00:00.000Z",
      },
      waterMl: 750,
      pain: { location: "голова", intensity: 4, affectedLife: "moderately" },
      context: [],
      symptoms: ["тошнота"],
      createdAt: "2026-07-01T00:00:00.000Z",
      updatedAt: "2026-07-01T08:00:00.000Z",
    },
  ];

  const legacy = mergeHealthSnapshotIntoLegacy(emptyLegacy(), snapshot);

  assert.equal(legacy.onboardingCompleted, true);
  assert.equal(legacy.profile?.cycleConfig.periodStart, "2026-07-01");
  assert.deepEqual(legacy.profile?.cycleConfig.periodStarts, ["2026-07-01"]);
  assert.equal(legacy.profile?.reportSexDefault, false);
  assert.deepEqual(legacy.profile?.cloudSyncExclude, ["intimacy", "notes"]);
  assert.equal(legacy.checkIns["2026-07-01"]?.period?.intensity, "moderate");
  assert.equal(legacy.checkIns["2026-07-01"]?.mood?.value, "anxiety");
  assert.deepEqual(legacy.checkIns["2026-07-01"]?.pain?.kinds, ["headache"]);
  assert.deepEqual(legacy.checkIns["2026-07-01"]?.pms?.symptoms, ["тошнота"]);
  assert.equal(legacy.waterLog?.["2026-07-01"]?.glasses, 3);
});
