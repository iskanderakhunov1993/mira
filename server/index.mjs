import { createServer } from 'node:http';
import pg from 'pg';
import { createRequestHandler } from './app.mjs';
import { parseEncryptionKey } from './crypto.mjs';
import { PostgresStateRepository } from './repository.mjs';

const { Pool } = pg;
const port = Number(process.env.PORT ?? 8787);

function required(name, minimumLength = 1) {
  const value = process.env[name];
  if (!value || value.length < minimumLength) throw new Error(`${name} is required`);
  return value;
}

const databaseUrl = required('DATABASE_URL');
const sessionSecret = required('MIRA_SESSION_SECRET', 32);
const allowDevAuth = process.env.MIRA_ALLOW_DEV_AUTH === 'true' && process.env.NODE_ENV !== 'production';
const botToken = allowDevAuth ? process.env.TELEGRAM_BOT_TOKEN : required('TELEGRAM_BOT_TOKEN');
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.DATABASE_SSL === 'require' ? { rejectUnauthorized: true } : undefined,
});
const repository = new PostgresStateRepository(
  pool,
  parseEncryptionKey(process.env.MIRA_DATA_ENCRYPTION_KEY),
);
const handler = createRequestHandler({
  repository,
  botToken,
  sessionSecret,
  allowedOrigin: process.env.MIRA_WEB_ORIGIN,
  allowDevAuth,
});

const server = createServer(handler);
server.listen(port, '0.0.0.0', () => {
  console.log(`Mira API listening on http://0.0.0.0:${port}`);
});

async function shutdown(signal) {
  console.log(`Received ${signal}, shutting down`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
