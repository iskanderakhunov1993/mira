import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const AAD_PREFIX = 'mira-user-state-v1:';

export function parseEncryptionKey(value) {
  if (!value) throw new Error('MIRA_DATA_ENCRYPTION_KEY is required');
  const key = Buffer.from(value, 'base64');
  if (key.length !== 32) throw new Error('MIRA_DATA_ENCRYPTION_KEY must be a base64-encoded 32-byte key');
  return key;
}

export function encryptState(state, userId, key) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(Buffer.from(`${AAD_PREFIX}${userId}`));
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(state), 'utf8'),
    cipher.final(),
  ]);
  return {
    ciphertext,
    iv,
    tag: cipher.getAuthTag(),
  };
}

export function decryptState(encrypted, userId, key) {
  if (!encrypted?.ciphertext) return null;
  const decipher = createDecipheriv(ALGORITHM, key, encrypted.iv);
  decipher.setAAD(Buffer.from(`${AAD_PREFIX}${userId}`));
  decipher.setAuthTag(encrypted.tag);
  const plaintext = Buffer.concat([
    decipher.update(encrypted.ciphertext),
    decipher.final(),
  ]);
  return JSON.parse(plaintext.toString('utf8'));
}
