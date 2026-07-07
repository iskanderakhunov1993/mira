import assert from "node:assert/strict";
import { test } from "node:test";

const emptySnapshot = () => ({
  schemaVersion: 1,
  profile: null,
  cycles: [],
  dailyEntries: [],
  settings: {
    themeMode: "system",
    waterTargetMl: 1800,
    trackerPreferences: ["cycle", "wellbeing", "mood", "energy", "water"],
    demoDataEnabled: false,
    notificationsMode: "important_only",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
});

class MemoryStorage {
  values = new Map();
  getItem(key) {
    return this.values.get(key) ?? null;
  }
  setItem(key, value) {
    this.values.set(key, value);
  }
  removeItem(key) {
    this.values.delete(key);
  }
}

class TestRepository {
  key = "mira-new-health-v1";
  constructor(storage) {
    this.storage = storage;
  }
  snapshot() {
    const raw = this.storage.getItem(this.key);
    if (!raw) return emptySnapshot();
    try {
      return { ...emptySnapshot(), ...JSON.parse(raw) };
    } catch {
      return emptySnapshot();
    }
  }
  save(snapshot) {
    this.storage.setItem(this.key, JSON.stringify(snapshot));
  }
  async getProfile() {
    return { ok: true, data: this.snapshot().profile };
  }
  async saveProfile(profile) {
    this.save({ ...this.snapshot(), profile });
    return { ok: true, data: profile };
  }
  async saveDailyEntry(entry) {
    const snapshot = this.snapshot();
    const dailyEntries = snapshot.dailyEntries.filter((item) => item.id !== entry.id);
    this.save({ ...snapshot, dailyEntries: [...dailyEntries, entry] });
    return { ok: true, data: entry };
  }
  async listDailyEntries() {
    return { ok: true, data: this.snapshot().dailyEntries };
  }
  async saveCycle(cycle) {
    const snapshot = this.snapshot();
    const cycles = snapshot.cycles.filter((item) => item.id !== cycle.id);
    this.save({ ...snapshot, cycles: [...cycles, cycle] });
    return { ok: true, data: cycle };
  }
  async listCycles() {
    return { ok: true, data: this.snapshot().cycles };
  }
  async getSettings() {
    return { ok: true, data: this.snapshot().settings };
  }
  async resetLocalData() {
    const snapshot = emptySnapshot();
    this.save(snapshot);
    return { ok: true, data: snapshot };
  }
}

test("repository creates and updates profile locally", async () => {
  const repo = new TestRepository(new MemoryStorage());
  assert.equal((await repo.getProfile()).data, null);

  const profile = {
    id: "profile-1",
    onboardingCompleted: true,
    factors: [],
    trackerPreferences: ["cycle"],
    createdAt: "2026-07-07T00:00:00.000Z",
    updatedAt: "2026-07-07T00:00:00.000Z",
  };

  assert.equal((await repo.saveProfile(profile)).ok, true);
  assert.deepEqual((await repo.getProfile()).data, profile);
});

test("repository upserts daily entries and cycles", async () => {
  const repo = new TestRepository(new MemoryStorage());
  const entry = {
    id: "entry-1",
    date: "2026-07-07",
    symptoms: [],
    createdAt: "2026-07-07T00:00:00.000Z",
    updatedAt: "2026-07-07T00:00:00.000Z",
  };
  const cycle = {
    id: "cycle-1",
    startDate: "2026-07-01",
    source: "user",
    createdAt: "2026-07-07T00:00:00.000Z",
    updatedAt: "2026-07-07T00:00:00.000Z",
  };

  await repo.saveDailyEntry(entry);
  await repo.saveDailyEntry({ ...entry, symptoms: ["сон"] });
  await repo.saveCycle(cycle);

  assert.deepEqual((await repo.listDailyEntries()).data, [{ ...entry, symptoms: ["сон"] }]);
  assert.deepEqual((await repo.listCycles()).data, [cycle]);
});

test("repository tolerates empty and broken storage, then resets", async () => {
  const storage = new MemoryStorage();
  const repo = new TestRepository(storage);

  assert.equal((await repo.getSettings()).data.demoDataEnabled, false);
  storage.setItem("mira-new-health-v1", "{not-json");
  assert.equal((await repo.listCycles()).data.length, 0);

  await repo.saveCycle({
    id: "cycle-1",
    startDate: "2026-07-01",
    source: "user",
    createdAt: "2026-07-07T00:00:00.000Z",
    updatedAt: "2026-07-07T00:00:00.000Z",
  });
  assert.equal((await repo.resetLocalData()).data.cycles.length, 0);
});
