BEGIN;

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  telegram_user_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_states (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  state_ciphertext BYTEA,
  state_iv BYTEA,
  state_tag BYTEA,
  revision BIGINT NOT NULL DEFAULT 0 CHECK (revision >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT encrypted_state_complete CHECK (
    (state_ciphertext IS NULL AND state_iv IS NULL AND state_tag IS NULL)
    OR
    (state_ciphertext IS NOT NULL AND state_iv IS NOT NULL AND state_tag IS NOT NULL)
  )
);

COMMIT;
