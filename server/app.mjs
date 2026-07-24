import { createSessionToken, verifySessionToken, verifyTelegramInitData } from './auth.mjs';

const MAX_BODY_BYTES = 2 * 1024 * 1024;

function json(response, status, body, extraHeaders = {}) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    ...extraHeaders,
  });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error('BODY_TOO_LARGE');
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    throw new Error('BODY_INVALID');
  }
}

function validateState(value) {
  return Boolean(
    value
    && typeof value === 'object'
    && !Array.isArray(value)
    && value.version === 3
    && value.entries
    && typeof value.entries === 'object'
    && Array.isArray(value.periodStarts),
  );
}

function bearerToken(request) {
  const header = request.headers.authorization ?? '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}

export function createRequestHandler(options) {
  const {
    repository,
    botToken,
    sessionSecret,
    allowedOrigin,
    allowDevAuth = false,
    nowSeconds,
  } = options;

  return async function handleRequest(request, response) {
    const url = new URL(request.url ?? '/', 'http://localhost');
    const origin = request.headers.origin;
    const corsHeaders = allowedOrigin && origin === allowedOrigin
      ? { 'access-control-allow-origin': origin, vary: 'Origin' }
      : {};

    if (request.method === 'OPTIONS') {
      response.writeHead(204, {
        ...corsHeaders,
        'access-control-allow-headers': 'authorization,content-type',
        'access-control-allow-methods': 'GET,PUT,POST,DELETE,OPTIONS',
      });
      response.end();
      return;
    }

    try {
      if (request.method === 'GET' && url.pathname === '/api/health') {
        json(response, 200, { ok: true }, corsHeaders);
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/v1/auth/telegram') {
        const body = await readJson(request);
        let telegramUserId;
        if (allowDevAuth && process.env.NODE_ENV !== 'production' && /^\d{1,20}$/.test(String(body.devUserId ?? ''))) {
          telegramUserId = String(body.devUserId);
        } else {
          ({ telegramUserId } = verifyTelegramInitData(body.initData, botToken, { nowSeconds }));
        }
        const userId = await repository.ensureUser(telegramUserId);
        json(response, 200, {
          token: createSessionToken(userId, sessionSecret, { nowSeconds }),
        }, corsHeaders);
        return;
      }

      const { userId } = verifySessionToken(bearerToken(request), sessionSecret, { nowSeconds });

      if (request.method === 'GET' && url.pathname === '/api/v1/state') {
        const stored = await repository.getState(userId);
        if (!stored) {
          json(response, 404, { error: 'USER_NOT_FOUND' }, corsHeaders);
          return;
        }
        json(response, 200, stored, corsHeaders);
        return;
      }

      if (request.method === 'PUT' && url.pathname === '/api/v1/state') {
        const body = await readJson(request);
        if (!validateState(body.state) || !Number.isSafeInteger(body.revision) || body.revision < 0) {
          json(response, 400, { error: 'STATE_INVALID' }, corsHeaders);
          return;
        }
        const saved = await repository.saveState(userId, body.state, body.revision);
        if (!saved) {
          json(response, 409, { error: 'REVISION_CONFLICT' }, corsHeaders);
          return;
        }
        json(response, 200, saved, corsHeaders);
        return;
      }

      if (request.method === 'DELETE' && url.pathname === '/api/v1/state') {
        const revision = Number(url.searchParams.get('revision'));
        if (!Number.isSafeInteger(revision) || revision < 0) {
          json(response, 400, { error: 'REVISION_INVALID' }, corsHeaders);
          return;
        }
        const cleared = await repository.clearState(userId, revision);
        if (!cleared) {
          json(response, 409, { error: 'REVISION_CONFLICT' }, corsHeaders);
          return;
        }
        json(response, 200, cleared, corsHeaders);
        return;
      }

      json(response, 404, { error: 'NOT_FOUND' }, corsHeaders);
    } catch (error) {
      const code = error instanceof Error ? error.message : 'INTERNAL_ERROR';
      if (code === 'BODY_TOO_LARGE') {
        json(response, 413, { error: code }, corsHeaders);
      } else if (code === 'BODY_INVALID') {
        json(response, 400, { error: code }, corsHeaders);
      } else if (code.startsWith('TELEGRAM_AUTH_') || code.startsWith('SESSION_')) {
        json(response, 401, { error: code }, corsHeaders);
      } else {
        console.error('Mira API request failed', { path: url.pathname, code });
        json(response, 500, { error: 'INTERNAL_ERROR' }, corsHeaders);
      }
    }
  };
}
