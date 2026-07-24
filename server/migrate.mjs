import { readFile } from 'node:fs/promises';
import pg from 'pg';

const { Pool } = pg;
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'require' ? { rejectUnauthorized: true } : undefined,
});

try {
  const migration = await readFile(new URL('./migrations/001_server_state.sql', import.meta.url), 'utf8');
  await pool.query(migration);
  console.log('Applied server/migrations/001_server_state.sql');
} finally {
  await pool.end();
}
