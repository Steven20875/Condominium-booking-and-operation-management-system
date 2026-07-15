/**
 * sqlite-migrate.ts
 * Utility to migrate JSON `data/db.json` into a simple SQLite schema.
 * This file is optional and requires `sqlite3` package to run.
 */
import fs from 'node:fs';
import path from 'node:path';

const DB_FILE = path.join(process.cwd(), 'data', 'db.json');
const SQLITE_FILE = path.join(process.cwd(), 'data', 'db.sqlite');

async function migrate() {
  if (!fs.existsSync(DB_FILE)) {
    console.error('JSON DB not found at', DB_FILE);
    process.exit(1);
  }

  let sqlite3: any;
  try {
    // dynamic import to avoid a hard dependency
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    sqlite3 = require('sqlite3').verbose();
  } catch (err) {
    console.error('sqlite3 package not installed. Run `npm install sqlite3` to use migration.');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  const db = new sqlite3.Database(SQLITE_FILE);

  db.serialize(() => {
    db.run('PRAGMA foreign_keys = ON');

    db.run('CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT, password TEXT, name TEXT, role TEXT, phone TEXT, unitNumber TEXT, avatarUrl TEXT, createdAt TEXT)');
    db.run('CREATE TABLE IF NOT EXISTS units (id TEXT PRIMARY KEY, name TEXT, type TEXT, description TEXT, price REAL, availability INTEGER, capacity INTEGER, floorNumber INTEGER, status TEXT, images TEXT, createdAt TEXT)');
    db.run('CREATE TABLE IF NOT EXISTS bookings (id TEXT PRIMARY KEY, unitId TEXT, unitName TEXT, residentId TEXT, residentName TEXT, residentEmail TEXT, startDate TEXT, endDate TEXT, totalPrice REAL, status TEXT, guestsCount INTEGER, notes TEXT, createdAt TEXT)');
    db.run('CREATE TABLE IF NOT EXISTS payments (id TEXT PRIMARY KEY, bookingId TEXT, residentId TEXT, residentName TEXT, unitName TEXT, amount REAL, status TEXT, method TEXT, referenceNumber TEXT, paidAt TEXT, createdAt TEXT)');
    db.run('CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, title TEXT, message TEXT, recipientId TEXT, recipientRole TEXT, isRead INTEGER, type TEXT, createdAt TEXT)');
    db.run('CREATE TABLE IF NOT EXISTS maintenance (id TEXT PRIMARY KEY, residentId TEXT, residentName TEXT, unitNumber TEXT, issueType TEXT, description TEXT, priority TEXT, status TEXT, assignedStaff TEXT, createdAt TEXT)');

    const insertUser = db.prepare('REPLACE INTO users VALUES (?,?,?,?,?,?,?,?,?)');
    (data.users || []).forEach((u: any) => insertUser.run(u.id, u.email, u.password || '', u.name, u.role, u.phone || '', u.unitNumber || '', u.avatarUrl || '', u.createdAt || ''));
    insertUser.finalize();

    const insertUnit = db.prepare('REPLACE INTO units VALUES (?,?,?,?,?,?,?,?,?,?)');
    (data.units || []).forEach((u: any) => insertUnit.run(u.id, u.name, u.type, u.description, u.price || 0, u.availability ? 1 : 0, u.capacity || 1, u.floorNumber || 0, u.status || 'Available', JSON.stringify(u.images || []), u.createdAt || ''));
    insertUnit.finalize();

    const insertBooking = db.prepare('REPLACE INTO bookings VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
    (data.bookings || []).forEach((b: any) => insertBooking.run(b.id, b.unitId, b.unitName, b.residentId, b.residentName, b.residentEmail, b.startDate, b.endDate, b.totalPrice || 0, b.status || 'Pending', b.guestsCount || 1, b.notes || '', b.createdAt || ''));
    insertBooking.finalize();

    const insertPayment = db.prepare('REPLACE INTO payments VALUES (?,?,?,?,?,?,?,?,?,?,?)');
    (data.payments || []).forEach((p: any) => insertPayment.run(p.id, p.bookingId, p.residentId, p.residentName, p.unitName, p.amount || 0, p.status || 'Pending', p.method || '', p.referenceNumber || '', p.paidAt || '', p.createdAt || ''));
    insertPayment.finalize();

    const insertNotif = db.prepare('REPLACE INTO notifications VALUES (?,?,?,?,?,?,?,?)');
    (data.notifications || []).forEach((n: any) => insertNotif.run(n.id, n.title, n.message, n.recipientId || 'all', n.recipientRole || 'all', n.isRead ? 1 : 0, n.type || 'info', n.createdAt || ''));
    insertNotif.finalize();

    const insertMaint = db.prepare('REPLACE INTO maintenance VALUES (?,?,?,?,?,?,?,?,?,?)');
    (data.maintenanceRequests || []).forEach((m: any) => insertMaint.run(m.id, m.residentId, m.residentName, m.unitNumber || '', m.issueType || '', m.description || '', m.priority || 'Medium', m.status || 'Pending', m.assignedStaff || '', m.createdAt || ''));
    insertMaint.finalize();

    console.log('Migration complete. SQLite DB written to', SQLITE_FILE);
    db.close();
  });
}

if (require.main === module) {
  migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}
