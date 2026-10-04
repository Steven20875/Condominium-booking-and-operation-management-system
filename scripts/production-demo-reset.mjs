import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const envPath = path.join(projectRoot, '.env');
const envResult = dotenv.config({ path: envPath });
if (envResult.error) {
  console.error('Missing .env file at project root.');
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

const sql = neon(databaseUrl);
const reportPath = path.join(projectRoot, 'data', 'production-demo-reset-report.json');

function asInt(value) {
  return Number(value ?? 0);
}

function safeJson(value) {
  return JSON.parse(JSON.stringify(value));
}

async function getTableNames() {
  const rows = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
  return rows.map((row) => row.table_name);
}

async function getCounts() {
  const tableNames = await getTableNames();
  const counts = {};
  for (const tableName of tableNames) {
    try {
      const result = await sql`SELECT COUNT(*)::int AS count FROM ${sql(tableName)}`;
      counts[tableName] = asInt(result[0]?.count);
    } catch {
      counts[tableName] = null;
    }
  }
  return counts;
}

async function getUserBreakdown() {
  const rows = await sql`SELECT role, COUNT(*)::int AS count FROM users GROUP BY role ORDER BY role`;
  return rows;
}

async function getResidentIds() {
  const rows = await sql`SELECT id, email, name, created_at FROM users WHERE role = 'resident' ORDER BY created_at`;
  return rows;
}

async function getAdminIds() {
  const rows = await sql`SELECT id, email, name, created_at FROM users WHERE role = 'admin' ORDER BY created_at`;
  return rows;
}

async function getUnitSummary() {
  const rows = await sql`SELECT id, name, status, availability, type, floor_number FROM units ORDER BY id`;
  return rows;
}

async function getStateSnapshot() {
  const rows = await sql`SELECT state FROM application_state WHERE id = 'application' LIMIT 1`;
  return rows[0]?.state ?? null;
}

async function resetProductionDemoData() {
  const before = {
    timestamp: new Date().toISOString(),
    tables: await getTableNames(),
    counts: await getCounts(),
    userRoles: await getUserBreakdown(),
    residentUsers: await getResidentIds(),
    adminUsers: await getAdminIds(),
    units: await getUnitSummary(),
    applicationState: await getStateSnapshot(),
  };

  const residentIds = before.residentUsers.map((row) => row.id);
  const residentCount = residentIds.length;

  const transaction = async () => {
    if (residentCount === 0) {
      return {
        status: 'no_residents_to_delete',
        deleted: { residentUsers: 0, bookings: 0, payments: 0, maintenanceRequests: 0, notifications: 0, notificationReads: 0, governmentIdSubmissions: 0, activityLogs: 0 },
      };
    }

    await sql.begin(async (tx) => {
      await tx`DELETE FROM notification_reads WHERE user_id IN ${tx(residentIds)}`;
      await tx`DELETE FROM notifications WHERE recipient_id IN ${tx(residentIds)} OR recipient_role = 'resident'`;
      await tx`DELETE FROM government_id_submissions WHERE user_id IN ${tx(residentIds)}`;
      await tx`DELETE FROM maintenance_requests WHERE resident_id IN ${tx(residentIds)}`;
      await tx`DELETE FROM payments WHERE resident_id IN ${tx(residentIds)}`;
      await tx`DELETE FROM bookings WHERE resident_id IN ${tx(residentIds)}`;
      await tx`DELETE FROM activity_logs WHERE user_id IN ${tx(residentIds)} OR user_role = 'resident'`;
      await tx`DELETE FROM users WHERE role = 'resident'`;

      const adminUsersRows = await tx`SELECT id, email, name, role FROM users WHERE role = 'admin' ORDER BY created_at`;
      const unitRows = await tx`SELECT * FROM units ORDER BY id`;
      const cleanedSnapshot = {
        users: adminUsersRows,
        units: unitRows,
        bookings: [],
        payments: [],
        maintenanceRequests: [],
        notifications: [],
        activityLogs: [],
      };

      const existingState = await tx`SELECT id FROM application_state WHERE id = 'application' LIMIT 1`;
      if (existingState.length > 0) {
        await tx`
          UPDATE application_state
          SET state = ${JSON.stringify(cleanedSnapshot)}::jsonb,
              updated_at = NOW()
          WHERE id = 'application'
        `;
      } else {
        await tx`
          INSERT INTO application_state (id, state, updated_at)
          VALUES ('application', ${JSON.stringify(cleanedSnapshot)}::jsonb, NOW())
        `;
      }
    });

    return {
      status: 'residents_deleted',
      deleted: {
        residentUsers: residentCount,
        bookings: asInt((await sql`SELECT COUNT(*)::int AS count FROM bookings`)[0]?.count),
        payments: asInt((await sql`SELECT COUNT(*)::int AS count FROM payments`)[0]?.count),
        maintenanceRequests: asInt((await sql`SELECT COUNT(*)::int AS count FROM maintenance_requests`)[0]?.count),
        notifications: asInt((await sql`SELECT COUNT(*)::int AS count FROM notifications`)[0]?.count),
        notificationReads: asInt((await sql`SELECT COUNT(*)::int AS count FROM notification_reads`)[0]?.count),
        governmentIdSubmissions: asInt((await sql`SELECT COUNT(*)::int AS count FROM government_id_submissions`)[0]?.count),
        activityLogs: asInt((await sql`SELECT COUNT(*)::int AS count FROM activity_logs`)[0]?.count),
      },
    };
  };

  try {
    const result = await transaction();
    const after = {
      timestamp: new Date().toISOString(),
      counts: await getCounts(),
      userRoles: await getUserBreakdown(),
      residentUsers: await getResidentIds(),
      adminUsers: await getAdminIds(),
      units: await getUnitSummary(),
      applicationState: await getStateSnapshot(),
      result,
    };

    const report = {
      before,
      after,
      summary: {
        residentUsersDeleted: before.residentUsers.length,
        adminUsersRemaining: after.adminUsers.length,
        unitsRemaining: after.units.length,
      },
    };

    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ status: 'ok', reportPath, residentUsersBefore: before.residentUsers.length, adminUsersAfter: after.adminUsers.length }, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({ status: 'error', message }, null, 2));
    process.exitCode = 1;
  }
}

await resetProductionDemoData();
