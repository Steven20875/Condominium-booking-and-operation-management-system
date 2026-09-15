import { db as jsonDb, dbEvents } from '../db.ts';
import { PostgresStateAdapter } from './postgres.ts';

const usePostgres = String(process.env.USE_POSTGRES || '').toLowerCase() === 'true';
const databaseUrl = process.env.DATABASE_URL || '';

if (usePostgres && !databaseUrl) {
  throw new Error('USE_POSTGRES=true requires DATABASE_URL.');
}

const postgresAdapter = usePostgres ? new PostgresStateAdapter(databaseUrl) : undefined;

/** Resolves before the app accepts requests in PostgreSQL mode. */
export const dbReady = postgresAdapter?.ready ?? Promise.resolve();

/**
 * Compatibility boundary: existing synchronous services continue using the
 * established database contract while PostgreSQL mode hydrates and persists
 * the same snapshot through the durable adapter.
 */
export const db = jsonDb;
export { dbEvents };
export const persistenceMode = usePostgres ? 'postgres' : 'json';

export async function flushDatabase() {
  await postgresAdapter?.flush();
}
