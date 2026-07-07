import assert from "node:assert/strict";
import { test } from "node:test";
import { getCycleNorm, recordPeriodStart } from "../lib/cycleEngine.ts";
import type { UserProfile } from "../lib/types.ts";

function profile(patch: Partial<UserProfile> = {}): UserProfile {
  return {
    name: "Mira",
    showCalories: false,
    cycleConfig: {
      periodStart: "2026-06-25",
      cycleLength: 28,
      periodLength: 5,
      periodStarts: ["2026-04-01", "2026-04-29", "2026-05-27", "2026-06-25"],
    },
    trackingPreferences: ["cycle", "pain", "mood"],
    additionalMode: "none",
    pinEnabled: false,
    hiddenNotifications: false,
    privateMarks: true,
    reportSexDefault: false,
    ...patch,
  };
}

test("legacy cycle engine matches shared median and range semantics", () => {
  const norm = getCycleNorm(profile(), new Date("2026-07-07T12:00:00.000Z"));

  assert.equal(norm.cycleLength, 28);
  assert.equal(norm.cycleDay, 13);
  assert.equal(norm.daysUntilPeriod, 16);
  assert.equal(norm.delayDays, 0);
  assert.equal(norm.observedCycles, 3);
  assert.equal(norm.confidence, "high");
});

test("legacy cycle engine collapses close period starts before computing delay", () => {
  const norm = getCycleNorm(profile({
    cycleConfig: {
      periodStart: "2026-06-25",
      cycleLength: 28,
      periodLength: 5,
      periodStarts: ["2026-06-01", "2026-06-05", "2026-06-25"],
    },
  }), new Date("2026-07-30T12:00:00.000Z"));

  assert.deepEqual({
    cycleLength: norm.cycleLength,
    cycleDay: norm.cycleDay,
    isDelayed: norm.isDelayed,
    delayDays: norm.delayDays,
    observedCycles: norm.observedCycles,
  }, {
    cycleLength: 24,
    cycleDay: 36,
    isDelayed: true,
    delayDays: 12,
    observedCycles: 1,
  });
});

test("recordPeriodStart deduplicates starts inside the same bleeding window", () => {
  const updated = recordPeriodStart(profile(), "2026-06-28");

  assert.deepEqual(updated.cycleConfig.periodStarts, ["2026-04-01", "2026-04-29", "2026-05-27", "2026-06-25"]);
  assert.equal(updated.cycleConfig.periodStart, "2026-06-25");
});
