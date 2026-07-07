import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildCycleSummary,
  completedCycleLengths,
  median,
  uniquePeriodStarts,
} from "../features/cycle/model.ts";
import type { CycleSource } from "../features/cycle/model.ts";
import type { Cycle, DailyEntry, UserProfile } from "../types/health.ts";

const now = new Date("2026-07-07T12:00:00.000Z");

function profile(patch: Partial<UserProfile> = {}): UserProfile {
  return {
    id: "profile",
    onboardingCompleted: true,
    lastPeriodStart: "2026-06-25",
    periodStartUnknown: false,
    cycleRegularity: "regular",
    factors: [],
    trackerPreferences: ["cycle"],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...patch,
  };
}

function cycle(startDate: string): Cycle {
  return {
    id: `cycle-${startDate}`,
    startDate,
    source: "user",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function entry(date: string, period = false): DailyEntry {
  return {
    id: `entry-${date}`,
    date,
    period: period ? { id: `period-${date}`, date, state: "started", createdAt: "2026-01-01T00:00:00.000Z" } : undefined,
    context: [],
    symptoms: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function source(patch: Partial<CycleSource> = {}): CycleSource {
  return {
    profile: profile(),
    cycles: [cycle("2026-04-01"), cycle("2026-04-29"), cycle("2026-05-27"), cycle("2026-06-25")],
    entries: [entry("2026-07-07")],
    now,
    ...patch,
  };
}

test("cycle model normalizes starts and completed lengths", () => {
  const starts = uniquePeriodStarts(source({
    profile: null,
    cycles: [cycle("2026-06-01")],
    entries: [entry("2026-06-05", true), entry("2026-07-01", true)],
  }));

  assert.deepEqual(starts, ["2026-06-01", "2026-07-01"]);
  assert.deepEqual(completedCycleLengths(starts), [30]);
  assert.equal(median([29, 28, 31]), 29);
});

test("cycle model returns median, reliability and forecast range", () => {
  const summary = buildCycleSummary(source());

  assert.deepEqual(summary.completedLengths, [28, 28, 29]);
  assert.equal(summary.sampleSize, 3);
  assert.equal(summary.medianLength, 28);
  assert.equal(summary.reliability, "high");
  assert.equal(summary.cycleDay, 13);
  assert.equal(summary.daysUntilPeriod, 16);
  assert.deepEqual(summary.forecastRange, { start: "2026-07-22", end: "2026-07-24" });
});

test("cycle model handles irregular cycles with lower reliability", () => {
  const summary = buildCycleSummary(source({
    profile: profile({ cycleRegularity: "unpredictable" }),
    cycles: [cycle("2026-02-01"), cycle("2026-03-05"), cycle("2026-04-20"), cycle("2026-06-25")],
  }));

  assert.equal(summary.forecastStatus, "irregular");
  assert.equal(summary.reliability, "medium");
  assert.equal(summary.forecastRange?.start, "2026-07-27");
  assert.equal(summary.forecastRange?.end, "2026-08-10");
});

test("cycle model detects delay", () => {
  const summary = buildCycleSummary(source({
    profile: profile({ lastPeriodStart: "2026-06-01" }),
    cycles: [cycle("2026-05-04"), cycle("2026-06-01")],
  }));

  assert.equal(summary.isDelayed, true);
  assert.equal(summary.forecastStatus, "delayed");
  assert.equal(summary.delayDays, 9);
  assert.equal(summary.daysUntilPeriod, 0);
});

test("cycle model handles absence of data", () => {
  const summary = buildCycleSummary(source({ profile: null, cycles: [], entries: [] }));

  assert.deepEqual(summary.starts, []);
  assert.equal(summary.forecastStatus, "empty");
  assert.equal(summary.cycleDay, null);
  assert.equal(summary.forecastRange, null);
});
