import { db as jsonDb, dbEvents } from '../db.ts';
import { PostgresStateAdapter } from './postgres.ts';
import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL || '';

const isVercel = Boolean(process.env.VERCEL);

const usePostgres =
  String(process.env.USE_POSTGRES || '').toLowerCase() === 'true' ||
  (isVercel && Boolean(databaseUrl));

if (usePostgres && !databaseUrl) {
  console.warn(
    '[DB] USE_POSTGRES=true requires DATABASE_URL, so the app will continue using the JSON database fallback.'
  );
}

let postgresAdapter: PostgresStateAdapter | undefined;

export const db = jsonDb;

export { dbEvents };

export const persistenceMode =
  usePostgres && databaseUrl ? 'postgres' : 'json';

export async function ensureDatabaseReady() {
  if (!usePostgres || !databaseUrl) {
    return;
  }

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

/**
 * Creates a Government ID submission record in PostgreSQL.
 *
 * The actual Government ID file is stored in private Vercel Blob storage.
 * PostgreSQL only stores the generated storage key and metadata.
 */
export async function createGovernmentIdSubmission(record: {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: 'admin' | 'resident';
  userCreatedAt: string;
  storageKey: string;
  mimeType: string;
  originalFileName: string;
  uploadedAt: string;
}) {
  if (!usePostgres || !databaseUrl) {
    throw new Error(
      'PostgreSQL is required for Government ID submissions.'
    );
  }

  const sql = neon(databaseUrl);

  await sql.transaction([
    sql`
      INSERT INTO users (id, email, name, role, created_at)
      VALUES (
        ${record.userId},
        ${record.userEmail || null},
        ${record.userName},
        ${record.userRole},
        ${record.userCreatedAt}
      )
      ON CONFLICT (id) DO NOTHING
    `,
    sql`
      INSERT INTO government_id_submissions
        (
          id,
          user_id,
          storage_key,
          mime_type,
          original_file_name,
          status,
          uploaded_at
        )
      VALUES
        (
          ${record.id},
          ${record.userId},
          ${record.storageKey},
          ${record.mimeType},
          ${record.originalFileName},
          'pending',
          ${record.uploadedAt}
        )
    `
  ]);
}

/**
 * Deletes a Government ID submission record.
 *
 * The associated private Vercel Blob object must be deleted
 * separately by the server upload handler.
 */
export async function deleteGovernmentIdSubmission(
  submissionId: string
) {
  if (!usePostgres || !databaseUrl) {
    return;
  }

  const sql = neon(databaseUrl);

  await sql`
    DELETE FROM government_id_submissions
    WHERE id = ${submissionId}
  `;
}

/**
 * Updates the latest pending Government ID submission.
 *
 * IMPORTANT:
 * Only a submission whose status is currently "pending"
 * can be approved or rejected.
 *
 * This prevents an admin action from accidentally updating
 * an older submission that has already been reviewed.
 */
export async function updateGovernmentIdSubmissionStatus(
  userId: string,
  status: 'verified' | 'rejected',
  reviewedBy: string,
  rejectionReason?: string
) {
  if (!usePostgres || !databaseUrl) {
    return;
  }

  const sql = neon(databaseUrl);

  await sql`
    UPDATE government_id_submissions
    SET
      status = ${status},
      reviewed_at = NOW(),
      reviewed_by = ${reviewedBy},
      rejection_reason = ${
        status === 'rejected'
          ? rejectionReason || null
          : null
      }
    WHERE id = (
      SELECT id
      FROM government_id_submissions
      WHERE user_id = ${userId}
        AND status = 'pending'
      ORDER BY uploaded_at DESC
      LIMIT 1
    )
  `;
}
