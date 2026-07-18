import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { clearAuraDatabaseState, loadAuraDatabaseState, persistAuraDatabaseState } from './auraDb';
import { AURA_STORAGE_KEY, AURA_TODAY, createEmptyAuraState, emptyAuraEntry, persistAuraState } from './auraState';

const storage = new Map<string, string>();

async function resetIndexedDb() {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase('mira-local-health');
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('TEST_DATABASE_BLOCKED'));
  });
}

beforeEach(async () => {
  storage.clear();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    },
  });
  await resetIndexedDb();
});

describe('Mira local database', () => {
  it('migrates an existing compatible local state into IndexedDB', async () => {
    const legacy = createEmptyAuraState();
    legacy.onboarding.completed = true;
    legacy.entries[AURA_TODAY] = { ...emptyAuraEntry(), rating: 4, symptomsChecked: true };
    expect(persistAuraState(legacy)).toBe(true);

    const loaded = await loadAuraDatabaseState();
    expect(loaded.onboarding.completed).toBe(true);
    expect(loaded.entries[AURA_TODAY]).toMatchObject({ rating: 4, symptomsChecked: true });

    storage.clear();
    const loadedFromDatabase = await loadAuraDatabaseState();
    expect(loadedFromDatabase.entries[AURA_TODAY]).toMatchObject({ rating: 4, symptomsChecked: true });
  });

  it('persists one sanitized state to IndexedDB and the compatible fallback', async () => {
    const state = createEmptyAuraState();
    state.entries[AURA_TODAY] = { ...emptyAuraEntry(), water: 1750, steps: 7200 };

    expect(await persistAuraDatabaseState(state)).toBe(true);
    expect(storage.has(AURA_STORAGE_KEY)).toBe(true);
    storage.clear();

    const loaded = await loadAuraDatabaseState();
    expect(loaded.entries[AURA_TODAY]).toMatchObject({ water: 1750, steps: 7200 });
  });

  it('repairs IndexedDB from a newer compatible fallback', async () => {
    const databaseState = createEmptyAuraState();
    databaseState.entries[AURA_TODAY] = { ...emptyAuraEntry(), water: 500 };
    await persistAuraDatabaseState(databaseState);

    const newerFallback = createEmptyAuraState();
    newerFallback.revision = 20;
    newerFallback.updatedAt = '2026-07-18T20:00:00.000Z';
    newerFallback.entries[AURA_TODAY] = { ...emptyAuraEntry(), water: 1800 };
    persistAuraState(newerFallback);

    expect((await loadAuraDatabaseState()).entries[AURA_TODAY]?.water).toBe(1800);
    storage.clear();
    expect((await loadAuraDatabaseState()).entries[AURA_TODAY]?.water).toBe(1800);
  });

  it('repairs the compatible fallback from a newer IndexedDB state', async () => {
    const databaseState = createEmptyAuraState();
    databaseState.revision = 20;
    databaseState.updatedAt = '2026-07-18T20:00:00.000Z';
    databaseState.entries[AURA_TODAY] = { ...emptyAuraEntry(), steps: 9000 };
    await persistAuraDatabaseState(databaseState);

    const olderFallback = createEmptyAuraState();
    olderFallback.revision = 1;
    olderFallback.updatedAt = '2026-07-18T10:00:00.000Z';
    olderFallback.entries[AURA_TODAY] = { ...emptyAuraEntry(), steps: 1000 };
    persistAuraState(olderFallback);

    expect((await loadAuraDatabaseState()).entries[AURA_TODAY]?.steps).toBe(9000);
    expect(JSON.parse(storage.get(AURA_STORAGE_KEY) ?? '{}').entries[AURA_TODAY].steps).toBe(9000);
  });

  it('clears IndexedDB and all compatible local keys', async () => {
    const state = createEmptyAuraState();
    state.onboarding.completed = true;
    await persistAuraDatabaseState(state);

    expect(await clearAuraDatabaseState()).toBe(true);
    expect(storage.size).toBe(0);
    expect((await loadAuraDatabaseState()).onboarding.completed).toBe(false);
  });

  it('reports a failed verified delete when IndexedDB cannot be opened', async () => {
    const state = createEmptyAuraState();
    state.onboarding.completed = true;
    await persistAuraDatabaseState(state);
    const originalOpen = indexedDB.open.bind(indexedDB);
    Object.defineProperty(indexedDB, 'open', {
      configurable: true,
      value: () => { throw new Error('TEST_INDEXED_DB_UNAVAILABLE'); },
    });

    try {
      expect(await clearAuraDatabaseState()).toBe(false);
      expect(storage.size).toBe(0);
    } finally {
      Object.defineProperty(indexedDB, 'open', { configurable: true, value: originalOpen });
    }
  });
});
