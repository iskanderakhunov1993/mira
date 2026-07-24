import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import test from 'node:test';
import { createRequestHandler } from './app.mjs';

class MemoryRepository {
  constructor() {
    this.users = new Map();
    this.states = new Map();
  }

  async ensureUser(telegramUserId) {
    const userId = this.users.get(telegramUserId) ?? String(this.users.size + 1);
    this.users.set(telegramUserId, userId);
    if (!this.states.has(userId)) {
      this.states.set(userId, { state: null, revision: 0, updatedAt: new Date(0).toISOString() });
    }
    return userId;
  }

  async getState(userId) {
    return this.states.get(userId) ?? null;
  }

  async saveState(userId, state, expectedRevision) {
    const current = this.states.get(userId);
    if (!current || current.revision !== expectedRevision) return null;
    const next = {
      state,
      revision: current.revision + 1,
      updatedAt: new Date(1_000).toISOString(),
    };
    this.states.set(userId, next);
    return { revision: next.revision, updatedAt: next.updatedAt };
  }

  async clearState(userId, expectedRevision) {
    const current = this.states.get(userId);
    if (!current || current.revision !== expectedRevision) return null;
    const next = {
      state: null,
      revision: current.revision + 1,
      updatedAt: new Date(2_000).toISOString(),
    };
    this.states.set(userId, next);
    return { revision: next.revision, updatedAt: next.updatedAt };
  }
}

function createResponse() {
  let resolve;
  const completed = new Promise((done) => { resolve = done; });
  return {
    status: 0,
    headers: {},
    body: '',
    completed,
    writeHead(status, headers) {
      this.status = status;
      this.headers = headers;
    },
    end(body = '') {
      this.body = String(body);
      resolve();
    },
  };
}

async function invoke(handler, { method = 'GET', path, token, body }) {
  const request = Readable.from(body ? [Buffer.from(JSON.stringify(body))] : []);
  request.method = method;
  request.url = path;
  request.headers = {
    ...(body ? { 'content-type': 'application/json' } : {}),
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  };
  const response = createResponse();
  await handler(request, response);
  await response.completed;
  return {
    status: response.status,
    body: response.body ? JSON.parse(response.body) : null,
  };
}

async function withApi(run) {
  const repository = new MemoryRepository();
  const handler = createRequestHandler({
    repository,
    sessionSecret: 'test-session-secret',
    allowDevAuth: true,
    nowSeconds: 1_800_000_000,
  });
  await run(handler);
}

test('authenticates and stores state with optimistic revision checks', async () => {
  await withApi(async (handler) => {
    const authResponse = await invoke(handler, {
      method: 'POST',
      path: '/api/v1/auth/telegram',
      body: { devUserId: '1001' },
    });
    assert.equal(authResponse.status, 200);
    const { token } = authResponse.body;

    const initial = await invoke(handler, { path: '/api/v1/state', token });
    assert.deepEqual(initial.body, {
      state: null,
      revision: 0,
      updatedAt: new Date(0).toISOString(),
    });

    const state = { version: 3, entries: {}, periodStarts: [] };
    const saved = await invoke(handler, {
      method: 'PUT',
      path: '/api/v1/state',
      token,
      body: { state, revision: 0 },
    });
    assert.equal(saved.status, 200);
    assert.equal(saved.body.revision, 1);

    const conflict = await invoke(handler, {
      method: 'PUT',
      path: '/api/v1/state',
      token,
      body: { state, revision: 0 },
    });
    assert.equal(conflict.status, 409);
  });
});

test('rejects unauthenticated state access', async () => {
  await withApi(async (handler) => {
    const response = await invoke(handler, { path: '/api/v1/state' });
    assert.equal(response.status, 401);
  });
});
