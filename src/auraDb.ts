import {
  clearAllMiraStorage,
  loadAuraState,
  persistAuraState,
  sanitizeAuraState,
  type AuraState,
} from './auraState';

const DATABASE_NAME = 'mira-local-health';
const DATABASE_VERSION = 1;
const STATE_STORE = 'app-state';
const STATE_KEY = 'current';

function indexedDbAvailable() {
  return typeof indexedDB !== 'undefined';
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STATE_STORE)) request.result.createObjectStore(STATE_STORE);
    };
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () => reject(request.error ?? new Error('INDEXED_DB_OPEN_FAILED'));
    request.onblocked = () => reject(new Error('INDEXED_DB_BLOCKED'));
  });
}

async function readDatabaseState(): Promise<unknown> {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = database.transaction(STATE_STORE, 'readonly').objectStore(STATE_STORE).get(STATE_KEY);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('INDEXED_DB_READ_FAILED'));
    });
  } finally {
    database.close();
  }
}

async function writeDatabaseState(state: AuraState): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STATE_STORE, 'readwrite');
      transaction.objectStore(STATE_STORE).put(state, STATE_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('INDEXED_DB_WRITE_FAILED'));
      transaction.onabort = () => reject(transaction.error ?? new Error('INDEXED_DB_WRITE_ABORTED'));
    });
  } finally {
    database.close();
  }
}

function compareStateFreshness(first: AuraState, second: AuraState): number {
  if (first.revision !== second.revision) return first.revision - second.revision;
  return Date.parse(first.updatedAt) - Date.parse(second.updatedAt);
}

export async function loadAuraDatabaseState(): Promise<AuraState> {
  const compatibleState = loadAuraState();
  if (!indexedDbAvailable()) return compatibleState;
  try {
    const stored = await readDatabaseState();
    if (stored) {
      const databaseState = sanitizeAuraState(stored);
      const newest = compareStateFreshness(databaseState, compatibleState) >= 0 ? databaseState : compatibleState;
      await writeDatabaseState(newest);
      persistAuraState(newest);
      return newest;
    }
    await writeDatabaseState(compatibleState);
    return compatibleState;
  } catch {
    return compatibleState;
  }
}

export async function persistAuraDatabaseState(state: AuraState): Promise<boolean> {
  const currentFallback = loadAuraState();
  let currentDatabase = currentFallback;
  if (indexedDbAvailable()) {
    try {
      const stored = await readDatabaseState();
      if (stored) currentDatabase = sanitizeAuraState(stored);
    } catch {
      // The compatible fallback still provides a safe revision baseline.
    }
  }
  const nextRevision = Math.max(state.revision, currentFallback.revision, currentDatabase.revision) + 1;
  const safeState = sanitizeAuraState({ ...state, revision: nextRevision, updatedAt: new Date().toISOString() });
  const fallbackSaved = persistAuraState(safeState);
  if (!indexedDbAvailable()) return fallbackSaved;
  try {
    await writeDatabaseState(safeState);
    return true;
  } catch {
    return fallbackSaved;
  }
}

export async function clearAuraDatabaseState(): Promise<boolean> {
  clearAllMiraStorage();
  if (!indexedDbAvailable()) return loadAuraState().revision === 0;
  try {
    const database = await openDatabase();
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(STATE_STORE, 'readwrite');
        transaction.objectStore(STATE_STORE).delete(STATE_KEY);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error ?? new Error('INDEXED_DB_CLEAR_FAILED'));
        transaction.onabort = () => reject(transaction.error ?? new Error('INDEXED_DB_CLEAR_ABORTED'));
      });
    } finally {
      database.close();
    }
    const remaining = await readDatabaseState();
    return remaining === undefined && loadAuraState().revision === 0;
  } catch {
    return false;
  }
}

export const auraDatabaseInfo = {
  name: DATABASE_NAME,
  version: DATABASE_VERSION,
  mode: 'local-first' as const,
};
