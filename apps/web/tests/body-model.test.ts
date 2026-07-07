import assert from "node:assert/strict";
import { test } from "node:test";
import { buildBodyViewModel, buildDoctorSummaryHtml, buildDoctorSummaryText, defaultDoctorSummaryOptions } from "../features/body/model.ts";
import type { BodySource } from "../features/body/types.ts";
import type { Cycle, DailyEntry, UserProfile } from "../types/health.ts";

function profile(): UserProfile {
  return {
    id: "profile",
    onboardingCompleted: true,
    lastPeriodStart: "2026-06-26",
    periodStartUnknown: false,
    cycleRegularity: "regular",
    factors: [],
    trackerPreferences: ["cycle"],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
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

function entry(date: string, patch: Partial<DailyEntry> = {}): DailyEntry {
  return {
    id: `entry-${date}`,
    date,
    context: [],
    symptoms: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...patch,
  };
}

function source(patch: Partial<BodySource> = {}): BodySource {
  return {
    profile: profile(),
    cycles: [cycle("2026-04-01"), cycle("2026-04-29"), cycle("2026-05-28"), cycle("2026-06-26")],
    entries: [
      entry("2026-06-26", { period: { id: "p1", date: "2026-06-26", state: "started", createdAt: "x" } }),
      entry("2026-06-27", { period: { id: "p2", date: "2026-06-27", state: "continued", createdAt: "x" }, pain: { intensity: 4, location: "низ живота", affectedLife: "moderately" } }),
      entry("2026-06-28", { pain: { intensity: 3, location: "низ живота", affectedLife: "slightly" }, energy: "low", symptoms: ["головная боль"] }),
      entry("2026-07-01", { energy: "low", sleep: { quality: "poor" }, symptoms: ["головная боль"], waterMl: 500, note: "личная заметка" }),
    ],
    ...patch,
  };
}

test("body model summarizes rhythm", () => {
  const model = buildBodyViewModel(source());

  assert.equal(model.rhythm.completedCycles, 3);
  assert.equal(model.rhythm.averageCycleLength, 29);
  assert.equal(model.rhythm.cycleRange, "28–29 дн.");
});

test("body model gates insights by completed cycles and sample size", () => {
  const model = buildBodyViewModel(source());
  const empty = buildBodyViewModel(source({ cycles: [], entries: [] }));

  assert.equal(model.hasEnoughForInsights, true);
  assert.ok(model.insights.length <= 3);
  assert.ok(model.insights.some((insight) => insight.title === "Боль повторялась"));
  assert.equal(empty.hasEnoughForInsights, false);
  assert.deepEqual(empty.insights, []);
});

test("body model builds doctor summary without sensitive defaults", () => {
  const model = buildBodyViewModel(source());
  const text = buildDoctorSummaryText(model.doctorSummary);
  const html = buildDoctorSummaryHtml(model.doctorSummary);

  assert.match(text, /Mira — сводка для врача/);
  assert.match(text, /Отчёт не является диагнозом/);
  assert.doesNotMatch(text, /sex|калории/i);
  assert.doesNotMatch(text, /личная заметка/i);
  assert.match(html, /<table>/);
  assert.match(html, /Наблюдения Mira/);
});

test("doctor summary includes notes only after explicit opt in", () => {
  const model = buildBodyViewModel(source());
  const hidden = buildDoctorSummaryText(model.doctorSummary, defaultDoctorSummaryOptions);
  const visible = buildDoctorSummaryText(model.doctorSummary, { ...defaultDoctorSummaryOptions, notes: true });

  assert.doesNotMatch(hidden, /личная заметка/);
  assert.match(visible, /Личные заметки/);
  assert.match(visible, /личная заметка/);
});
