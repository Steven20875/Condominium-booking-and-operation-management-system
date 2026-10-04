import { db as jsonDb, dbEvents } from '../db.ts';
import { PostgresStateAdapter } from './postgres.ts';

const databaseUrl = process.env.DATABASE_URL || '';
const isVercel = Boolean(process.env.VERCEL);
const usePostgres = String(process.env.USE_POSTGRES || '').toLowerCase() === 'true' || (isVercel && Boolean(databaseUrl));

if (usePostgres && !databaseUrl) {
  console.warn('[DB] USE_POSTGRES=true requires DATABASE_URL, so the app will continue using the JSON database fallback.');
}

let postgresAdapter: PostgresStateAdapter | undefined;

/**
 * Compatibility boundary: existing synchronous services continue using the
 * established database contract while PostgreSQL mode hydrates and persists
 * the same snapshot through the durable adapter on first application startup.
 */
export const db = jsonDb;
export { dbEvents };
export const persistenceMode = usePostgres && databaseUrl ? 'postgres' : 'json';

export async function ensureDatabaseReady() {
  if (!usePostgres || !databaseUrl) return;

  postgresAdapter ??= new PostgresStateAdapter(databaseUrl);
  await postgresAdapter.ensureInitialized();
}

export async function refreshDatabase() {
  await ensureDatabaseReady();
  await postgresAdapter?.refresh();
}

export async function flushDatabase() {
  await ensureDatabaseReady();
  await postgresAdapter?.flush();
}
