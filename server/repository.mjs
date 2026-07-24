import { decryptState, encryptState } from './crypto.mjs';

export class PostgresStateRepository {
  constructor(pool, encryptionKey) {
    this.pool = pool;
    this.encryptionKey = encryptionKey;
  }

  async ensureUser(telegramUserId) {
    const result = await this.pool.query(
      `INSERT INTO users (telegram_user_id)
       VALUES ($1)
       ON CONFLICT (telegram_user_id)
       DO UPDATE SET last_seen_at = NOW()
       RETURNING id`,
      [telegramUserId],
    );
    const userId = String(result.rows[0].id);
    await this.pool.query(
      `INSERT INTO user_states (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId],
    );
    return userId;
  }

  async getState(userId) {
    const result = await this.pool.query(
      `SELECT state_ciphertext, state_iv, state_tag, revision, updated_at
       FROM user_states
       WHERE user_id = $1`,
      [userId],
    );
    if (!result.rowCount) return null;
    const row = result.rows[0];
    return {
      state: decryptState({
        ciphertext: row.state_ciphertext,
        iv: row.state_iv,
        tag: row.state_tag,
      }, userId, this.encryptionKey),
      revision: Number(row.revision),
      updatedAt: row.updated_at?.toISOString?.() ?? String(row.updated_at),
    };
  }

  async saveState(userId, state, expectedRevision) {
    const encrypted = encryptState(state, userId, this.encryptionKey);
    const result = await this.pool.query(
      `UPDATE user_states
       SET state_ciphertext = $1,
           state_iv = $2,
           state_tag = $3,
           revision = revision + 1,
           updated_at = NOW()
       WHERE user_id = $4 AND revision = $5
       RETURNING revision, updated_at`,
      [encrypted.ciphertext, encrypted.iv, encrypted.tag, userId, expectedRevision],
    );
    if (!result.rowCount) return null;
    return {
      revision: Number(result.rows[0].revision),
      updatedAt: result.rows[0].updated_at.toISOString(),
    };
  }

  async clearState(userId, expectedRevision) {
    const result = await this.pool.query(
      `UPDATE user_states
       SET state_ciphertext = NULL,
           state_iv = NULL,
           state_tag = NULL,
           revision = revision + 1,
           updated_at = NOW()
       WHERE user_id = $1 AND revision = $2
       RETURNING revision, updated_at`,
      [userId, expectedRevision],
    );
    if (!result.rowCount) return null;
    return {
      revision: Number(result.rows[0].revision),
      updatedAt: result.rows[0].updated_at.toISOString(),
    };
  }
}
