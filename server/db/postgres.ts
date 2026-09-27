import { neon } from '@neondatabase/serverless';
import { db as jsonDb, type DatabaseSchema } from '../db.ts';

const SNAPSHOT_ID = 'application';
const COLLECTIONS: Array<keyof DatabaseSchema> = [
  'users',
  'units',
  'bookings',
  'payments',
  'maintenanceRequests',
  'notifications',
  'activityLogs'
];

type IdentifiedRecord = { id: string };

function cloneSnapshot(snapshot: DatabaseSchema): DatabaseSchema {
  return JSON.parse(JSON.stringify(snapshot)) as DatabaseSchema;
}

function mergeRecords<T extends IdentifiedRecord>(base: T[], local: T[], current: T[]): T[] {
  const baseById = new Map(base.map((record) => [record.id, record]));
  const localById = new Map(local.map((record) => [record.id, record]));
  const merged = [...current];

  for (const original of base) {
    const changed = localById.get(original.id);
    const currentIndex = merged.findIndex((record) => record.id === original.id);

    if (!changed) {
      if (currentIndex !== -1) merged.splice(currentIndex, 1);
    } else if (JSON.stringify(changed) !== JSON.stringify(original)) {
      if (currentIndex === -1) merged.push(changed);
      else merged[currentIndex] = changed;
    }
  }

  for (const record of local) {
    if (baseById.has(record.id)) continue;
    const currentIndex = merged.findIndex((currentRecord) => currentRecord.id === record.id);
    if (currentIndex === -1) merged.push(record);
    else merged[currentIndex] = record;
  }

  return merged;
}

function mergeSnapshot(base: DatabaseSchema, local: DatabaseSchema, current: DatabaseSchema): DatabaseSchema {
  const merged = cloneSnapshot(current);
  const mergedCollections = merged as unknown as Record<keyof DatabaseSchema, IdentifiedRecord[]>;

  for (const collection of COLLECTIONS) {
    mergedCollections[collection] = mergeRecords(
      base[collection] as IdentifiedRecord[],
      local[collection] as IdentifiedRecord[],
      current[collection] as IdentifiedRecord[]
    );
  }

  return merged;
}

export class PostgresStateAdapter {
  public readonly ready: Promise<void>;
  private pendingWrite: Promise<void> = Promise.resolve();
  private lastPersistedSnapshot?: DatabaseSchema;

  constructor(private readonly databaseUrl: string) {
    this.ready = this.initialize();
  }

  private async initialize() {
    const sql = neon(this.databaseUrl);
    const rows = await sql`SELECT state FROM application_state WHERE id = ${SNAPSHOT_ID}` as Array<{ state: DatabaseSchema }>;
    if (rows.length === 0) {
      throw new Error('PostgreSQL application_state is empty. Run db:migrate before enabling USE_POSTGRES.');
    }

    this.lastPersistedSnapshot = cloneSnapshot(rows[0].state);
    jsonDb.replaceSnapshot(rows[0].state);
    jsonDb.setPersistenceHook((snapshot) => this.persist(snapshot));
  }

  public async refresh() {
    const refreshSnapshot = async () => {
      const sql = neon(this.databaseUrl);
      const rows = await sql`SELECT state FROM application_state WHERE id = ${SNAPSHOT_ID}` as Array<{ state: DatabaseSchema }>;
      if (rows.length === 0) {
        throw new Error('PostgreSQL application_state is empty. Run db:migrate before enabling USE_POSTGRES.');
      }
      this.lastPersistedSnapshot = cloneSnapshot(rows[0].state);
      jsonDb.replaceSnapshot(rows[0].state);
    };

    const refreshPromise = this.pendingWrite.then(refreshSnapshot, refreshSnapshot);
    this.pendingWrite = refreshPromise;
    await refreshPromise;
  }

  private persist(snapshot: DatabaseSchema): Promise<void> {
    const persistSnapshot = async () => {
      const base = this.lastPersistedSnapshot;
      if (!base) throw new Error('PostgreSQL state has not finished initializing.');
      const sql = neon(this.databaseUrl);
      const localSnapshot = cloneSnapshot(snapshot);

      for (let attempt = 0; attempt < 8; attempt += 1) {
        const rows = await sql`SELECT state FROM application_state WHERE id = ${SNAPSHOT_ID}` as Array<{ state: DatabaseSchema }>;
        if (rows.length === 0) throw new Error('PostgreSQL application_state row is missing.');

        const current = rows[0].state;
        const merged = mergeSnapshot(base, localSnapshot, current);
        const updated = await sql`
          UPDATE application_state
          SET state = ${JSON.stringify(merged)}::jsonb, updated_at = NOW()
          WHERE id = ${SNAPSHOT_ID} AND state = ${JSON.stringify(current)}::jsonb
          RETURNING id
        `;

        if (updated.length > 0) {
          this.lastPersistedSnapshot = localSnapshot;
          return;
        }
      }

      throw new Error('PostgreSQL state changed repeatedly during persistence; retry the operation.');
    };

    this.pendingWrite = this.pendingWrite.then(persistSnapshot, persistSnapshot);
    return this.pendingWrite;
  }

  public flush() {
    return this.pendingWrite;
  }
}
