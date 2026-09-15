import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import type { DatabaseSchema } from '../db.ts';

const __filename = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(__filename), '../..');
dotenv.config({ path: path.join(projectRoot, '.env') });
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required.');

const source = JSON.parse(fs.readFileSync(path.join(projectRoot, 'data', 'db.json'), 'utf8')) as DatabaseSchema;
const sql = neon(databaseUrl);

const counts = await sql`
  SELECT
    (SELECT COUNT(*)::int FROM users) AS users,
    (SELECT COUNT(*)::int FROM units) AS units,
    (SELECT COUNT(*)::int FROM bookings) AS bookings,
    (SELECT COUNT(*)::int FROM payments) AS payments,
    (SELECT COUNT(*)::int FROM maintenance_requests) AS maintenance,
    (SELECT COUNT(*)::int FROM notifications) AS notifications,
    (SELECT COUNT(*)::int FROM activity_logs) AS activity_logs
`;

const ids = await sql`
  SELECT 'users' AS entity, id FROM users
  UNION ALL SELECT 'units', id FROM units
  UNION ALL SELECT 'bookings', id FROM bookings
  UNION ALL SELECT 'payments', id FROM payments
`;

const expected = {
  users: source.users.length,
  units: source.units.length,
  bookings: source.bookings.length,
  payments: source.payments.length
};
const actual = counts[0] as Record<string, number>;
const expectedIds = new Set([
  ...source.users.map((record) => `users:${record.id}`),
  ...source.units.map((record) => `units:${record.id}`),
  ...source.bookings.map((record) => `bookings:${record.id}`),
  ...source.payments.map((record) => `payments:${record.id}`)
]);
const actualIds = new Set(ids.map((record) => `${record.entity}:${record.id}`));
const missingIds = [...expectedIds].filter((id) => !actualIds.has(id));
const unexpectedIds = [...actualIds].filter((id) => !expectedIds.has(id));

const result = {
  expected,
  actual: { users: actual.users, units: actual.units, bookings: actual.bookings, payments: actual.payments },
  missingIds,
  unexpectedIds,
  governmentIdStatuses: await sql`SELECT id, government_id_status, government_id_rejection_reason FROM users ORDER BY id`
};

console.log(JSON.stringify(result, null, 2));
if (missingIds.length || unexpectedIds.length || expected.users !== actual.users || expected.units !== actual.units || expected.bookings !== actual.bookings || expected.payments !== actual.payments) {
  process.exit(1);
}
