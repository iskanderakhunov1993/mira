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

export async function loadAuraDatabaseState(): Promise<AuraState> {
  const compatibleState = loadAuraState();
  if (!indexedDbAvailable()) return compatibleState;
  try {
    const stored = await readDatabaseState();
    if (stored) return sanitizeAuraState(stored);
    await writeDatabaseState(compatibleState);
    return compatibleState;
  } catch {
    return compatibleState;
  }
}

export async function persistAuraDatabaseState(state: AuraState): Promise<boolean> {
  const safeState = sanitizeAuraState(state);
  const fallbackSaved = persistAuraState(safeState);
  if (!indexedDbAvailable()) return fallbackSaved;
  try {
    await writeDatabaseState(safeState);
    return true;
  } catch {
    return fallbackSaved;
  }
}

export async function clearAuraDatabaseState(): Promise<void> {
  clearAllMiraStorage();
  if (!indexedDbAvailable()) return;
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
  } catch {
    // localStorage has already been cleared; a later empty-state save repairs IndexedDB.
  }
}

export const auraDatabaseInfo = {
  name: DATABASE_NAME,
  version: DATABASE_VERSION,
  mode: 'local-first' as const,
};
