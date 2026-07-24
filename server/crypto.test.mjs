import assert from 'node:assert/strict';
import test from 'node:test';
import { randomBytes } from 'node:crypto';
import { decryptState, encryptState } from './crypto.mjs';

test('encrypts and decrypts a user state', () => {
  const key = randomBytes(32);
  const state = { version: 3, entries: { '2026-07-24': { symptoms: ['pain'] } } };
  const encrypted = encryptState(state, '42', key);
  assert.notEqual(encrypted.ciphertext.toString('utf8'), JSON.stringify(state));
  assert.deepEqual(decryptState(encrypted, '42', key), state);
});

test('binds ciphertext to one user', () => {
  const key = randomBytes(32);
  const encrypted = encryptState({ version: 3 }, '42', key);
  assert.throws(() => decryptState(encrypted, '43', key));
});
