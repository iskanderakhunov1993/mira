import assert from "node:assert/strict";
import { test } from "node:test";
import { createEmptyHealthSnapshot } from "../data/seed.ts";
import { addCustomSymptom, buildJsonExport, removeCustomSymptom, setWaterTarget, toggleTracker } from "../features/settings/model.ts";

test("settings toggles trackers without deleting old data", () => {
  const settings = createEmptyHealthSnapshot().settings;
  const withoutWater = toggleTracker(settings, "water");
  const withSleep = toggleTracker(withoutWater, "sleep");

  assert.equal(withoutWater.trackerPreferences.includes("water"), false);
  assert.equal(withSleep.trackerPreferences.includes("sleep"), true);
});

test("settings clamps water target", () => {
  const settings = createEmptyHealthSnapshot().settings;
  assert.equal(setWaterTarget(settings, -10).waterTargetMl, 0);
  assert.equal(setWaterTarget(settings, 1950.4).waterTargetMl, 1950);
});

test("settings manages custom symptoms", () => {
  const settings = createEmptyHealthSnapshot().settings;
  const added = addCustomSymptom(settings, " озноб ");
  const duplicated = addCustomSymptom(added, "озноб");
  const removed = removeCustomSymptom(duplicated, "озноб");

  assert.deepEqual(duplicated.customSymptoms, ["озноб"]);
  assert.deepEqual(removed.customSymptoms, []);
});

test("settings JSON export includes local snapshot", () => {
  const snapshot = createEmptyHealthSnapshot();
  const exported = JSON.parse(buildJsonExport(snapshot));

  assert.equal(exported.schemaVersion, 1);
  assert.ok(exported.exportedAt);
  assert.deepEqual(exported.dailyEntries, []);
});
