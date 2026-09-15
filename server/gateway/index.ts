/**
 * Database Gateway
 * Exposes `db` (JSON Mock DB) by default. Optionally switch to SQLite adapter in future.
 * Usage: import { db, dbEvents } from '../server/gateway'
 */
import { db as jsonDb, dbEvents } from '../db/index';

// For now default to JSON mock DB. Enable SQLITE by setting USE_SQLITE=true and implementing sqlite adapter.
const useSqlite = process.env.USE_SQLITE === 'true';

if (useSqlite) {
  console.warn('USE_SQLITE=true is set, but no sqlite adapter implemented — falling back to JSON DB.');
}

export const db = jsonDb;
export { dbEvents };
