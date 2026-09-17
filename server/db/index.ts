import { db as jsonDb, dbEvents } from '../db.ts';
import { PostgresStateAdapter } from './postgres.ts';

const usePostgres = String(process.env.USE_POSTGRES || '').toLowerCase() === 'true';
const databaseUrl = process.env.DATABASE_URL || '';

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
export const dbReady = (postgresAdapter?.ready ?? Promise.resolve()).catch((error) => {
  console.warn('[DB] Postgres readiness check failed. Falling back to JSON database mode.', error);
});

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
