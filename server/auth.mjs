import { createHmac, timingSafeEqual } from 'node:crypto';

function base64Url(value) {
  return Buffer.from(value).toString('base64url');
}

function parseBase64Url(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

export function verifyTelegramInitData(initData, botToken, options = {}) {
  if (!initData || !botToken) throw new Error('TELEGRAM_AUTH_UNAVAILABLE');
  const params = new URLSearchParams(initData);
  const suppliedHash = params.get('hash');
  if (!suppliedHash || !/^[a-f0-9]{64}$/i.test(suppliedHash)) throw new Error('TELEGRAM_AUTH_INVALID');

  params.delete('hash');
  params.delete('signature');
  const dataCheckString = [...params.entries()]
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const expectedHash = createHmac('sha256', secretKey).update(dataCheckString).digest();
  const actualHash = Buffer.from(suppliedHash, 'hex');
  if (actualHash.length !== expectedHash.length || !timingSafeEqual(actualHash, expectedHash)) {
    throw new Error('TELEGRAM_AUTH_INVALID');
  }

  const authDate = Number(params.get('auth_date'));
  const nowSeconds = options.nowSeconds ?? Math.floor(Date.now() / 1000);
  const maxAgeSeconds = options.maxAgeSeconds ?? 86_400;
  if (!Number.isSafeInteger(authDate) || authDate > nowSeconds + 60 || nowSeconds - authDate > maxAgeSeconds) {
    throw new Error('TELEGRAM_AUTH_EXPIRED');
  }

  let user;
  try {
    user = JSON.parse(params.get('user') ?? '');
  } catch {
    throw new Error('TELEGRAM_AUTH_INVALID');
  }
  if (!user || !Number.isSafeInteger(user.id) || user.id <= 0) throw new Error('TELEGRAM_AUTH_INVALID');
  return { telegramUserId: String(user.id) };
}

export function createSessionToken(userId, secret, options = {}) {
  if (!secret) throw new Error('MIRA_SESSION_SECRET is required');
  const nowSeconds = options.nowSeconds ?? Math.floor(Date.now() / 1000);
  const payload = base64Url(JSON.stringify({
    sub: String(userId),
    iat: nowSeconds,
    exp: nowSeconds + (options.ttlSeconds ?? 43_200),
  }));
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifySessionToken(token, secret, options = {}) {
  if (!token || !secret) throw new Error('SESSION_INVALID');
  const [payload, suppliedSignature, extra] = token.split('.');
  if (!payload || !suppliedSignature || extra) throw new Error('SESSION_INVALID');
  const expectedSignature = createHmac('sha256', secret).update(payload).digest();
  const actualSignature = Buffer.from(suppliedSignature, 'base64url');
  if (actualSignature.length !== expectedSignature.length || !timingSafeEqual(actualSignature, expectedSignature)) {
    throw new Error('SESSION_INVALID');
  }
  let claims;
  try {
    claims = JSON.parse(parseBase64Url(payload));
  } catch {
    throw new Error('SESSION_INVALID');
  }
  const nowSeconds = options.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (!claims?.sub || !Number.isSafeInteger(claims.exp) || claims.exp <= nowSeconds) throw new Error('SESSION_EXPIRED');
  return { userId: String(claims.sub) };
}
