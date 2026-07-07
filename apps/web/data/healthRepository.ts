import { parseHealthSnapshot } from "@/db/migrations";
import { getBrowserStorage, type KeyValueStorage } from "@/db/storage";
import { createEmptyHealthSnapshot } from "@/data/seed";
import { pushHealthSnapshot } from "@/lib/sync";
import type {
  Cycle,
  DailyEntry,
  HealthRepository,
  HealthSettings,
  HealthSnapshot,
  RepositoryResult,
  UserProfile,
} from "@/types/health";

export const HEALTH_STORAGE_KEY = "mira-new-health-v1";

function ok<T>(data: T): RepositoryResult<T> {
  return { ok: true, data };
}

function fail<T>(error: unknown): RepositoryResult<T> {
  return {
    ok: false,
    error: {
      code: "unknown",
      message: error instanceof Error ? error.message : "Unknown repository error",
    },
  };
}

export class LocalHealthRepository implements HealthRepository {
  constructor(private readonly storage: KeyValueStorage = getBrowserStorage()) {}

  async getSnapshot() {
    return this.read((snapshot) => snapshot);
  }

  async getProfile() {
    return this.read((snapshot) => snapshot.profile);
  }

  async saveProfile(profile: UserProfile) {
    return this.write((snapshot) => ({ ...snapshot, profile }), profile);
  }

  async listCycles() {
    return this.read((snapshot) => snapshot.cycles);
  }

  async saveCycle(cycle: Cycle) {
    return this.write(
      (snapshot) => ({
        ...snapshot,
        cycles: upsertById(snapshot.cycles, cycle),
      }),
      cycle
    );
  }

  async listDailyEntries() {
    return this.read((snapshot) => snapshot.dailyEntries);
  }

  async saveDailyEntry(entry: DailyEntry) {
    return this.write(
      (snapshot) => ({
        ...snapshot,
        dailyEntries: upsertById(snapshot.dailyEntries, entry),
      }),
      entry
    );
  }

  async getSettings() {
    return this.read((snapshot) => snapshot.settings);
  }

  async saveSettings(settings: HealthSettings) {
    return this.write((snapshot) => ({ ...snapshot, settings }), settings);
  }

  async resetLocalData() {
    const snapshot = createEmptyHealthSnapshot();

    try {
      this.storage.setItem(HEALTH_STORAGE_KEY, JSON.stringify(snapshot));
      await this.pushCloudSnapshot(snapshot);
      return ok(snapshot);
    } catch (error) {
      return fail<HealthSnapshot>(error);
    }
  }

  private async read<T>(selector: (snapshot: HealthSnapshot) => T): Promise<RepositoryResult<T>> {
    try {
      return ok(selector(this.readSnapshot()));
    } catch (error) {
      return fail<T>(error);
    }
  }

  private async write<T>(update: (snapshot: HealthSnapshot) => HealthSnapshot, value: T): Promise<RepositoryResult<T>> {
    try {
      const next = update(this.readSnapshot());
      this.storage.setItem(HEALTH_STORAGE_KEY, JSON.stringify(next));
      await this.pushCloudSnapshot(next);
      return ok(value);
    } catch (error) {
      return fail<T>(error);
    }
  }

  private readSnapshot() {
    return parseHealthSnapshot(this.storage.getItem(HEALTH_STORAGE_KEY));
  }

  private async pushCloudSnapshot(snapshot: HealthSnapshot) {
    await pushHealthSnapshot(snapshot).catch(() => undefined);
  }
}

function upsertById<T extends { id: string }>(items: T[], item: T) {
  const index = items.findIndex((current) => current.id === item.id);
  if (index === -1) return [...items, item];

  return items.map((current, currentIndex) => (currentIndex === index ? item : current));
}
