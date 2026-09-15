import { neon } from '@neondatabase/serverless';
import { db as jsonDb, type DatabaseSchema } from '../db.ts';

const SNAPSHOT_ID = 'application';

export class PostgresStateAdapter {
  public readonly ready: Promise<void>;
  private pendingWrite: Promise<void> = Promise.resolve();

  constructor(private readonly databaseUrl: string) {
    this.ready = this.initialize();
  }

  private async initialize() {
    const sql = neon(this.databaseUrl);
    const rows = await sql`SELECT state FROM application_state WHERE id = ${SNAPSHOT_ID}` as Array<{ state: DatabaseSchema }>;
    if (rows.length === 0) {
      throw new Error('PostgreSQL application_state is empty. Run db:migrate before enabling USE_POSTGRES.');
    }

    jsonDb.replaceSnapshot(rows[0].state);
    jsonDb.setPersistenceHook((snapshot) => this.persist(snapshot));
  }

  private persist(snapshot: DatabaseSchema): Promise<void> {
    this.pendingWrite = this.pendingWrite.then(async () => {
      const sql = neon(this.databaseUrl);
      await sql`
        INSERT INTO application_state (id, state, updated_at)
        VALUES (${SNAPSHOT_ID}, ${JSON.stringify(snapshot)}::jsonb, NOW())
        ON CONFLICT (id) DO UPDATE SET state = EXCLUDED.state, updated_at = NOW()
      `;
    });
    return this.pendingWrite;
  }

  public flush() {
    return this.pendingWrite;
  }
}
