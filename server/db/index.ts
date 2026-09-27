import { db as jsonDb, dbEvents } from '../db.ts';
import { PostgresStateAdapter } from './postgres.ts';

const databaseUrl = process.env.DATABASE_URL || '';
const isVercel = Boolean(process.env.VERCEL);
const usePostgres = String(process.env.USE_POSTGRES || '').toLowerCase() === 'true' || (isVercel && Boolean(databaseUrl));

if (usePostgres && !databaseUrl) {
  console.warn('[DB] USE_POSTGRES=true requires DATABASE_URL, so the app will continue using the JSON database fallback.');
}

let postgresAdapter: PostgresStateAdapter | undefined;

if (usePostgres && databaseUrl) {
  try {
    postgresAdapter = new PostgresStateAdapter(databaseUrl);
  } catch (error) {
    console.warn('[DB] Postgres initialization failed. Falling back to JSON database mode.', error);
    postgresAdapter = undefined;
  }
}

/** Resolves before the app accepts requests in PostgreSQL mode. */
export const dbReady = postgresAdapter?.ready ?? Promise.resolve();

/**
 * Compatibility boundary: existing synchronous services continue using the
 * established database contract while PostgreSQL mode hydrates and persists
 * the same snapshot through the durable adapter.
 */
export const db = jsonDb;
export { dbEvents };
export const persistenceMode = postgresAdapter ? 'postgres' : 'json';

export async function refreshDatabase() {
  await dbReady;
  await postgresAdapter?.refresh();
}

export async function flushDatabase() {
  await dbReady;
  await postgresAdapter?.flush();
}
