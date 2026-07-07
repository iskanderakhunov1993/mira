import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildCalendarViewModel,
  completedCycleLengths,
  median,
  uniquePeriodStarts,
} from "../features/calendar/model.ts";
import type { CalendarSource } from "../features/calendar/types.ts";
import type { Cycle, DailyEntry, UserProfile } from "../types/health.ts";

const now = new Date("2026-07-07T12:00:00.000Z");

function profile(patch: Partial<UserProfile> = {}): UserProfile {
  return {
    id: "profile",
    onboardingCompleted: true,
    goal: "understand_cycle",
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

function source(patch: Partial<CalendarSource> = {}): CalendarSource {
  return {
    profile: profile(),
    cycles: [cycle("2026-04-01"), cycle("2026-04-29"), cycle("2026-05-27"), cycle("2026-06-25")],
    entries: [entry("2026-07-07")],
    monthDate: now,
    selectedDate: "2026-07-07",
    now,
    ...patch,
  };
}

test("calendar algorithm computes median from completed cycles", () => {
  assert.equal(median([29, 28, 31]), 29);
  assert.deepEqual(completedCycleLengths(["2026-04-01", "2026-04-29", "2026-05-27", "2026-06-25"]), [28, 28, 29]);
});

test("calendar forecast uses range and sample size", () => {
  const model = buildCalendarViewModel(source());

  assert.equal(model.forecast.sampleSize, 3);
  assert.equal(model.forecast.medianLength, 28);
  assert.equal(model.forecast.reliability, "high");
  assert.match(model.forecast.text, /примерно/);
});

test("calendar handles irregular cycle with wider copy", () => {
  const model = buildCalendarViewModel(source({
    profile: profile({ cycleRegularity: "unpredictable" }),
    cycles: [cycle("2026-02-01"), cycle("2026-03-05"), cycle("2026-04-20"), cycle("2026-06-25")],
  }));

  assert.equal(model.forecast.status, "irregular");
  assert.match(model.forecast.text, /более широкий диапазон/);
});

test("calendar handles absence of data", () => {
  const model = buildCalendarViewModel(source({ profile: null, cycles: [], entries: [] }));

  assert.equal(model.forecast.status, "empty");
  assert.equal(model.history.length, 0);
});

test("calendar lets user data override forecast for early period start", () => {
  const model = buildCalendarViewModel(source({
    entries: [entry("2026-07-07", true)],
    selectedDate: "2026-07-07",
  }));
  const todayCell = model.days.find((day) => day.date === "2026-07-07");

  assert.equal(todayCell?.kind, "today");
  assert.deepEqual(model.selectedDay.entries, ["Месячные начались"]);
});

test("calendar ignores multiple period starts inside one cycle when computing completed lengths", () => {
  const starts = uniquePeriodStarts(source({
    profile: null,
    cycles: [cycle("2026-06-01")],
    entries: [entry("2026-06-05", true), entry("2026-07-01", true)],
  }));
  const lengths = completedCycleLengths(starts);

  assert.deepEqual(lengths, [30]);
});
