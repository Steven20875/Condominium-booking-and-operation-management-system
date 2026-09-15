import type { DatabaseSchema, MockDatabase } from '../db.ts';

/** Shared persistence contract used by the compatibility adapter. */
export interface DatabaseAdapter extends MockDatabase {
  readonly ready: Promise<void>;
  flush(): Promise<void>;
  getSnapshot(): DatabaseSchema;
}

export type { DatabaseSchema };
