import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import type { DatabaseSchema } from '../db.ts';

const __filename = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(__filename), '../..');
dotenv.config({ path: path.join(projectRoot, '.env') });
const sourcePath = path.join(projectRoot, 'data', 'db.json');
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required. Migration aborted.');
}

const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8')) as DatabaseSchema;
const requiredCollections: Array<keyof DatabaseSchema> = [
  'users', 'units', 'bookings', 'payments', 'maintenanceRequests', 'notifications', 'activityLogs'
];

for (const collection of requiredCollections) {
  if (!Array.isArray(source[collection])) {
    throw new Error(`Invalid source database: ${collection} must be an array.`);
  }
}

const userIds = new Set(source.users.map((user) => user.id));
const unitIds = new Set(source.units.map((unit) => unit.id));
const bookingIds = new Set(source.bookings.map((booking) => booking.id));

for (const booking of source.bookings) {
  if (!userIds.has(booking.residentId) || !unitIds.has(booking.unitId)) {
    throw new Error(`Invalid booking relationship: ${booking.id}`);
  }
}
for (const payment of source.payments) {
  if (!userIds.has(payment.residentId)) {
    throw new Error(`Invalid payment relationship: ${payment.id}`);
  }
  if (payment.bookingId !== 'manual' && !bookingIds.has(payment.bookingId)) {
    throw new Error(`Invalid payment booking relationship: ${payment.id}`);
  }
}

const postgresState = JSON.parse(JSON.stringify(source)) as DatabaseSchema;
for (const user of postgresState.users) {
  // Local Windows paths are never imported as production-facing references.
  user.governmentIdStorageKey = '';
}

const sql = neon(databaseUrl);
const migrationDir = path.join(projectRoot, 'server', 'db', 'migrations');
const migrationFiles = ['001_initial_schema.sql', '002_government_id_submissions.sql', '003_optional_user_email.sql'];

for (const fileName of migrationFiles) {
  const statements = fs.readFileSync(path.join(migrationDir, fileName), 'utf8')
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);
  for (const statement of statements) {
    await sql.query(statement);
  }
}

const existing = await sql`SELECT id FROM application_state WHERE id = 'application'`;
if (existing.length > 0) {
  throw new Error('PostgreSQL application_state already exists. Refusing to overwrite it.');
}

const dataStatements = [
  sql`INSERT INTO application_state (id, state, updated_at) VALUES ('application', ${JSON.stringify(postgresState)}::jsonb, NOW())`,
  ...source.users.map((user) => sql`INSERT INTO users (id, email, password_hash, name, role, phone, unit_number, avatar_url, auth_provider, auth_uid, has_valid_id, government_id_status, government_id_uploaded_at, government_id_verified_at, government_id_rejection_reason, valid_id_verified_at, created_at) VALUES (${user.id}, ${user.email || null}, ${user.password || null}, ${user.name}, ${user.role}, ${user.phone || null}, ${user.unitNumber || null}, ${user.avatarUrl || null}, ${user.authProvider || null}, ${user.authUid || null}, ${Boolean(user.hasValidId)}, ${user.governmentIdStatus || 'not_submitted'}, ${user.governmentIdUploadedAt || null}, ${user.governmentIdVerifiedAt || null}, ${user.governmentIdRejectionReason || null}, ${user.validIdVerifiedAt || null}, ${user.createdAt}) ON CONFLICT (id) DO NOTHING`),
  ...source.units.map((unit) => sql`INSERT INTO units (id, name, type, description, price, availability, capacity, status, images, amenities, floor_number, created_at) VALUES (${unit.id}, ${unit.name}, ${unit.type}, ${unit.description}, ${unit.price}, ${unit.availability}, ${unit.capacity}, ${unit.status}, ${JSON.stringify(unit.images || [])}::jsonb, ${unit.amenities ? JSON.stringify(unit.amenities) : null}::jsonb, ${unit.floorNumber || null}, ${unit.createdAt}) ON CONFLICT (id) DO NOTHING`),
  ...source.bookings.map((booking) => sql`INSERT INTO bookings (id, unit_id, resident_id, start_date, end_date, total_price, status, guests_count, notes, created_at) VALUES (${booking.id}, ${booking.unitId}, ${booking.residentId}, ${booking.startDate}, ${booking.endDate}, ${booking.totalPrice}, ${booking.status}, ${booking.guestsCount}, ${booking.notes || ''}, ${booking.createdAt}) ON CONFLICT (id) DO NOTHING`),
  ...source.payments.map((payment) => sql`INSERT INTO payments (id, booking_id, resident_id, unit_name, amount, total_amount, paid_amount, remaining_balance, downpayment_amount, status, method, reference_number, paid_at, created_at) VALUES (${payment.id}, ${payment.bookingId === 'manual' ? null : payment.bookingId}, ${payment.residentId}, ${payment.unitName || null}, ${payment.amount}, ${payment.totalAmount}, ${payment.paidAmount}, ${payment.remainingBalance}, ${payment.downpaymentAmount}, ${payment.status}, ${payment.method}, ${payment.referenceNumber}, ${payment.paidAt || null}, ${payment.createdAt}) ON CONFLICT (id) DO NOTHING`),
  ...source.maintenanceRequests.map((request) => sql`INSERT INTO maintenance_requests (id, resident_id, unit_number, issue_type, description, priority, status, assigned_staff, resolved_at, images, created_at) VALUES (${request.id}, ${request.residentId}, ${request.unitNumber || null}, ${request.issueType}, ${request.description}, ${request.priority}, ${request.status}, ${request.assignedStaff || null}, ${request.resolvedAt || null}, ${request.images ? JSON.stringify(request.images) : null}::jsonb, ${request.createdAt}) ON CONFLICT (id) DO NOTHING`),
  ...source.notifications.map((notification) => sql`INSERT INTO notifications (id, title, message, recipient_id, recipient_role, type, created_at) VALUES (${notification.id}, ${notification.title}, ${notification.message}, ${notification.recipientId}, ${notification.recipientRole || null}, ${notification.type}, ${notification.createdAt}) ON CONFLICT (id) DO NOTHING`),
  ...source.activityLogs.map((log) => sql`INSERT INTO activity_logs (id, user_id, user_name, user_role, action, details, created_at) VALUES (${log.id}, ${log.userId}, ${log.userName}, ${log.userRole}, ${log.action}, ${log.details}, ${log.createdAt}) ON CONFLICT (id) DO NOTHING`),
  ...source.users.filter((user) => user.governmentIdStatus && user.governmentIdStatus !== 'not_submitted').map((user) => sql`INSERT INTO government_id_submissions (id, user_id, storage_key, mime_type, original_file_name, status, uploaded_at, reviewed_at, rejection_reason) VALUES (${`legacy-${user.id}`}, ${user.id}, ${`government-ids/${user.id}/legacy-reference`}, 'application/octet-stream', NULL, ${user.governmentIdStatus}, ${user.governmentIdUploadedAt || user.createdAt}, ${user.governmentIdVerifiedAt || null}, ${user.governmentIdRejectionReason || null}) ON CONFLICT (id) DO NOTHING`)
];

await sql.transaction(dataStatements);

console.log(`Users imported: ${source.users.length}`);
console.log(`Units imported: ${source.units.length}`);
console.log(`Bookings imported: ${source.bookings.length}`);
console.log(`Payments imported: ${source.payments.length}`);
console.log(`Maintenance requests imported: ${source.maintenanceRequests.length}`);
console.log(`Notifications imported: ${source.notifications.length}`);
console.log(`Activity logs imported: ${source.activityLogs.length}`);
console.log(`Government ID records imported: ${source.users.filter((user) => user.governmentIdStatus && user.governmentIdStatus !== 'not_submitted').length}`);
console.log('Validation: source relationships and required collections passed.');
