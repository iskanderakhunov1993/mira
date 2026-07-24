import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';
import {
  createSessionToken,
  verifySessionToken,
  verifyTelegramInitData,
} from './auth.mjs';

function signedInitData(botToken, nowSeconds) {
  const params = new URLSearchParams({
    auth_date: String(nowSeconds),
    query_id: 'query-1',
    user: JSON.stringify({ id: 123456789, first_name: 'Test' }),
  });
  const dataCheckString = [...params.entries()]
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  const secret = createHmac('sha256', 'WebAppData').update(botToken).digest();
  params.set('hash', createHmac('sha256', secret).update(dataCheckString).digest('hex'));
  return params.toString();
}

test('validates signed Telegram initData', () => {
  const nowSeconds = 1_800_000_000;
  const result = verifyTelegramInitData(signedInitData('bot-token', nowSeconds), 'bot-token', { nowSeconds });
  assert.equal(result.telegramUserId, '123456789');
});

test('rejects tampered Telegram initData', () => {
  const nowSeconds = 1_800_000_000;
  const tampered = signedInitData('bot-token', nowSeconds).replace('123456789', '999');
  assert.throws(
    () => verifyTelegramInitData(tampered, 'bot-token', { nowSeconds }),
    /TELEGRAM_AUTH_INVALID/,
  );
});

test('creates and verifies expiring session tokens', () => {
  const token = createSessionToken('42', 'session-secret', { nowSeconds: 100, ttlSeconds: 60 });
  assert.deepEqual(verifySessionToken(token, 'session-secret', { nowSeconds: 120 }), { userId: '42' });
  assert.throws(
    () => verifySessionToken(token, 'session-secret', { nowSeconds: 161 }),
    /SESSION_EXPIRED/,
  );
});
