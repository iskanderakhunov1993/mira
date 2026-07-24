import {
  createEmptyAuraState,
  sanitizeAuraState,
  type AuraState,
} from './auraState';

type TelegramWebApp = {
  initData?: string;
  ready?: () => void;
};

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: TelegramWebApp;
  };
};

type ApiStateResponse = {
  state: unknown | null;
  revision: number;
  updatedAt: string;
};

type AuthResponse = {
  token: string;
};

const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
const apiBase = (viteEnv?.VITE_MIRA_API_URL ?? '').replace(/\/$/, '');
let sessionToken = '';
let remoteRevision = 0;
let saveQueue = Promise.resolve(true);

export class MiraApiError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}

function endpoint(path: string) {
  return `${apiBase}${path}`;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(endpoint(path), {
    ...init,
    headers: {
      accept: 'application/json',
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...(sessionToken ? { authorization: `Bearer ${sessionToken}` } : {}),
      ...init.headers,
    },
  });
  const body = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) throw new MiraApiError(body.error ?? `HTTP_${response.status}`);
  return body as T;
}

async function authenticate() {
  const telegram = (window as TelegramWindow).Telegram?.WebApp;
  telegram?.ready?.();
  const initData = telegram?.initData ?? '';
  const devUserId = viteEnv?.DEV ? viteEnv?.VITE_MIRA_DEV_USER_ID : undefined;
  if (!initData && !devUserId) throw new MiraApiError('TELEGRAM_AUTH_REQUIRED');
  const authenticated = await request<AuthResponse>('/api/v1/auth/telegram', {
    method: 'POST',
    body: JSON.stringify(initData ? { initData } : { devUserId }),
  });
  sessionToken = authenticated.token;
}

export async function loadAuraServerState(): Promise<AuraState> {
  await authenticate();
  const stored = await request<ApiStateResponse>('/api/v1/state');
  remoteRevision = stored.revision;
  const state = stored.state ? sanitizeAuraState(stored.state) : createEmptyAuraState();
  return { ...state, revision: stored.revision, updatedAt: stored.updatedAt };
}

async function saveState(state: AuraState): Promise<boolean> {
  try {
    const saved = await request<{ revision: number; updatedAt: string }>('/api/v1/state', {
      method: 'PUT',
      body: JSON.stringify({ state: sanitizeAuraState(state), revision: remoteRevision }),
    });
    remoteRevision = saved.revision;
    return true;
  } catch {
    return false;
  }
}

export function persistAuraServerState(state: AuraState): Promise<boolean> {
  saveQueue = saveQueue.then(() => saveState(state), () => saveState(state));
  return saveQueue;
}

export async function clearAuraServerState(): Promise<boolean> {
  try {
    await saveQueue;
    const cleared = await request<{ revision: number }>('/api/v1/state?revision=' + remoteRevision, {
      method: 'DELETE',
    });
    remoteRevision = cleared.revision;
    return true;
  } catch {
    return false;
  }
}
