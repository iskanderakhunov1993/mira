import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildHealthSnapshotUpdates,
  buildLegacyOnboardingData,
  buildStoreOnboardingPatch,
  createInitialOnboardingDraft,
} from "../features/onboarding/mappers.ts";
import type { MiraLocalData } from "../lib/types.ts";
import type { OnboardingDraft } from "../features/onboarding/types.ts";

const fixedDate = new Date("2026-07-07T12:00:00.000Z");

function createEmpty(): MiraLocalData {
  return {
    version: 2,
    checkIns: {},
    workouts: [],
    onboardingCompleted: false,
  };
}

function baseDraft(patch: Partial<OnboardingDraft> = {}): OnboardingDraft {
  return {
    ...createInitialOnboardingDraft(fixedDate),
    goal: "understand_cycle",
    periodStartMode: "date",
    lastPeriodStart: "2026-07-01",
    regularity: "regular",
    factors: [],
    initialCheckIn: "good",
    ...patch,
  };
}

test("onboarding mapper handles full path with period date", () => {
  const draft = baseDraft();
  const health = buildHealthSnapshotUpdates(draft, fixedDate);
  const legacy = buildLegacyOnboardingData(createEmpty(), draft, fixedDate);

  assert.equal(health.profile.lastPeriodStart, "2026-07-01");
  assert.equal(health.cycle?.startDate, "2026-07-01");
  assert.equal(health.dailyEntry?.checkIn?.value, "good");
  assert.equal(legacy.onboardingCompleted, true);
  assert.equal(legacy.profile?.cycleConfig.periodStart, "2026-07-01");
  assert.equal(legacy.profile?.reportSexDefault, false);
  assert.deepEqual(legacy.profile?.cloudSyncExclude, ["intimacy", "notes"]);
});

test("onboarding mapper allows unknown date", () => {
  const draft = baseDraft({ periodStartMode: "unknown", lastPeriodStart: "" });
  const health = buildHealthSnapshotUpdates(draft, fixedDate);
  const legacy = buildLegacyOnboardingData(createEmpty(), draft, fixedDate);
  const store = buildStoreOnboardingPatch(draft, fixedDate);

  assert.equal(health.profile.periodStartUnknown, true);
  assert.equal(health.cycle, null);
  assert.equal(legacy.profile?.cycleConfig.periodStart, "2026-07-07");
  assert.equal(store.user.totalCycles, 0);
});

test("onboarding mapper treats current period as today", () => {
  const draft = baseDraft({ periodStartMode: "current", lastPeriodStart: "" });
  const health = buildHealthSnapshotUpdates(draft, fixedDate);

  assert.equal(health.profile.lastPeriodStart, "2026-07-07");
  assert.equal(health.cycle?.startDate, "2026-07-07");
  assert.equal(health.dailyEntry?.period?.state, "started");
});

test("onboarding mapper stores irregular cycle without forcing prediction precision", () => {
  const draft = baseDraft({ periodStartMode: "irregular", regularity: "unpredictable", lastPeriodStart: "" });
  const health = buildHealthSnapshotUpdates(draft, fixedDate);

  assert.equal(health.profile.cycleRegularity, "unpredictable");
  assert.equal(health.profile.periodStartUnknown, true);
  assert.equal(health.cycle, null);
});

test("onboarding mapper keeps default and optional trackers", () => {
  const draft = baseDraft({ trackers: ["cycle", "wellbeing", "mood", "energy", "water", "sleep", "pain"] });
  const health = buildHealthSnapshotUpdates(draft, fixedDate);
  const legacy = buildLegacyOnboardingData(createEmpty(), draft, fixedDate);

  assert.deepEqual(health.settings.trackerPreferences, draft.trackers);
  assert.deepEqual(legacy.profile?.trackingPreferences, ["cycle", "mood", "energy", "sleep", "pain"]);
});

test("onboarding mapper preserves privacy defaults", () => {
  const draft = baseDraft({ trackers: ["cycle", "calories"] });
  const legacy = buildLegacyOnboardingData(createEmpty(), draft, fixedDate);

  assert.equal(legacy.profile?.showCalories, false);
  assert.equal(legacy.profile?.reportSexDefault, false);
  assert.ok(legacy.profile?.cloudSyncExclude?.includes("intimacy"));
  assert.ok(legacy.profile?.cloudSyncExclude?.includes("notes"));
});
