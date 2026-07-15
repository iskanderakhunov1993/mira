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

  it('clears IndexedDB and all compatible local keys', async () => {
    const state = createEmptyAuraState();
    state.onboarding.completed = true;
    await persistAuraDatabaseState(state);

    await clearAuraDatabaseState();
    expect(storage.size).toBe(0);
    expect((await loadAuraDatabaseState()).onboarding.completed).toBe(false);
  });
});
