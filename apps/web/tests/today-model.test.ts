import assert from "node:assert/strict";
import { test } from "node:test";
import { createEmptyHealthSnapshot } from "../data/seed.ts";
import { buildTodayViewModel } from "../features/today/model.ts";
import type { Cycle, DailyEntry, UserProfile } from "../types/health.ts";

const now = new Date("2026-07-07T12:00:00.000Z");
const settings = createEmptyHealthSnapshot().settings;

function profile(patch: Partial<UserProfile> = {}): UserProfile {
  return {
    id: "profile",
    displayName: "Mira",
    onboardingCompleted: true,
    goal: "understand_cycle",
    lastPeriodStart: "2026-07-01",
    periodStartUnknown: false,
    cycleRegularity: "regular",
    factors: [],
    trackerPreferences: ["cycle", "wellbeing", "water"],
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
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

test("today model renders empty state without profile", () => {
  const model = buildTodayViewModel({ profile: null, settings, entries: [], now });

  assert.equal(model.cardState, "empty");
  assert.equal(model.hasProfile, false);
  assert.equal(model.cycleDay, null);
});

test("today model detects first day period", () => {
  const model = buildTodayViewModel({
    profile: profile({ lastPeriodStart: "2026-07-07" }),
    settings,
    entries: [],
    now,
  });

  assert.equal(model.cardState, "period_started");
  assert.equal(model.cycleDay, 1);
});

test("today model shows period soon as range", () => {
  const model = buildTodayViewModel({
    profile: profile({ lastPeriodStart: "2026-06-14" }),
    settings,
    entries: [],
    now,
  });

  assert.equal(model.cardState, "period_soon");
  assert.match(model.cardTitle, /Месячные могут начаться/);
  assert.match(model.cardBody, /0 завершённых циклах/);
});

test("today model uses completed cycle history from shared cycle engine", () => {
  const model = buildTodayViewModel({
    profile: profile({ lastPeriodStart: "2026-06-14" }),
    settings,
    cycles: [cycle("2026-03-22"), cycle("2026-04-19"), cycle("2026-05-17"), cycle("2026-06-14")],
    entries: [],
    now,
  });

  assert.equal(model.cardState, "period_soon");
  assert.match(model.cardBody, /3 завершённых циклах/);
});

test("today model notices long cycle cautiously", () => {
  const model = buildTodayViewModel({
    profile: profile({ lastPeriodStart: "2026-06-01" }),
    settings,
    entries: [],
    now,
  });

  assert.equal(model.cardState, "long_cycle");
  assert.match(model.cardBody, /наблюдение/);
});

test("today model picks water quick tracker and insight sample", () => {
  const entry: DailyEntry = {
    id: "entry-2026-07-07",
    date: "2026-07-07",
    waterMl: 500,
    checkIn: { value: "normal" },
    context: [],
    symptoms: [],
    createdAt: "2026-07-07T00:00:00.000Z",
    updatedAt: "2026-07-07T00:00:00.000Z",
  };
  const model = buildTodayViewModel({
    profile: profile(),
    settings,
    entries: [
      entry,
      { ...entry, id: "entry-2026-07-06", date: "2026-07-06" },
    ],
    now,
  });

  assert.equal(model.quickTracker.type, "water");
  assert.equal(model.quickTracker.valueLabel, "500 мл");
  assert.equal(model.insight?.sample, "2 записей");
});
