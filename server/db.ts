import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EventEmitter } from 'events';
import { 
  User, 
  Unit, 
  Booking, 
  Payment, 
  MaintenanceRequest, 
  CondoNotification, 
  ActivityLog,
  DashboardStats
} from './types';
const isVercel = Boolean(process.env.VERCEL);
const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);

// Determine the application root directory
// On Vercel, the server-build/server.mjs is bundled and currentDir might be inside the bundle
// We need to find the actual data/ directory relative to the application root
const appRoot = isVercel 
  ? path.join(process.cwd()) // On Vercel, process.cwd() is /var/task (app root)
  : path.join(currentDir, '..'); // Locally, go up from server/ to project root

const PRIMARY_DB_FILE = path.join(appRoot, 'data', 'db.json');
const BACKUP_DB_CANDIDATES = [
  path.join(appRoot, 'data', 'db.before-full-dummy-data-cleanup-2026-09-08.json'),
  path.join(appRoot, 'data', 'db.pre-admin-name-change-2026-09-05.json'),
  path.join(appRoot, 'data', 'db.backup-2026-08-12.json'),
  path.join(process.cwd(), 'data', 'db.before-full-dummy-data-cleanup-2026-09-08.json'),
  path.join(process.cwd(), 'data', 'db.pre-admin-name-change-2026-09-05.json'),
  path.join(process.cwd(), 'data', 'db.backup-2026-08-12.json'),
  path.join(currentDir, '..', 'data', 'db.before-full-dummy-data-cleanup-2026-09-08.json'),
  path.join(currentDir, '..', 'data', 'db.pre-admin-name-change-2026-09-05.json'),
  path.join(currentDir, '..', 'data', 'db.backup-2026-08-12.json'),
  path.join(currentDir, 'data', 'db.before-full-dummy-data-cleanup-2026-09-08.json'),
  path.join(currentDir, 'data', 'db.pre-admin-name-change-2026-09-05.json'),
  path.join(currentDir, 'data', 'db.backup-2026-08-12.json')
];

function isValidJsonFile(filePath: string): boolean {
  if (!fs.existsSync(filePath)) return false;
  try {
    JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return true;
  } catch {
    return false;
  }
}

const FALLBACK_DB_FILE = BACKUP_DB_CANDIDATES.find(isValidJsonFile) ?? PRIMARY_DB_FILE;
const DB_FILE = fs.existsSync(PRIMARY_DB_FILE) ? PRIMARY_DB_FILE : FALLBACK_DB_FILE;
const DB_SOURCE = DB_FILE === PRIMARY_DB_FILE ? 'primary' : 'backup';
const DB_DIR = path.dirname(DB_FILE);

function normalizeUnitStatus(status?: string): 'Available' | 'Occupied' | 'Maintenance' {
  const value = typeof status === 'string' ? status.trim() : '';
  if (value === 'Maintenance') return 'Maintenance';
  if (value === 'Occupied' || value === 'Booked') return 'Occupied';
  return 'Available';
}

function readDatabaseFile(filePath: string): DatabaseSchema | null {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const normalizedContent = fileContent.replace(/^\uFEFF/, '');
    const parsed = JSON.parse(normalizedContent) as Partial<DatabaseSchema>;

    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      units: Array.isArray(parsed.units) ? parsed.units : [],
      bookings: Array.isArray(parsed.bookings) ? parsed.bookings : [],
      payments: Array.isArray(parsed.payments) ? parsed.payments : [],
      maintenanceRequests: Array.isArray(parsed.maintenanceRequests) ? parsed.maintenanceRequests : [],
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
      activityLogs: Array.isArray(parsed.activityLogs) ? parsed.activityLogs : []
    };
  } catch (error) {
    console.warn('[DB] Unable to read database file:', filePath, error);
    return null;
  }
}

export interface DatabaseSchema {
  users: User[];
  units: Unit[];
  bookings: Booking[];
  payments: Payment[];
  maintenanceRequests: MaintenanceRequest[];
  notifications: CondoNotification[];
  activityLogs: ActivityLog[];
}

function normalizeGovernmentIdStatus(status?: string | null): User['governmentIdStatus'] {
  const normalized = typeof status === 'string' ? status.trim().toLowerCase() : '';
  if (normalized === 'pending' || normalized === 'verified' || normalized === 'rejected') {
    return normalized;
  }

  return 'not_submitted';
}

export const dbEvents = new EventEmitter();

export class MockDatabase {
  private notificationReadState = new Map<string, Set<string>>();
  private persistenceHook?: (snapshot: DatabaseSchema) => Promise<void>;

  private normalizeUserRecord(user: Partial<User>): User {
    const status = normalizeGovernmentIdStatus(user.governmentIdStatus ?? (user.hasValidId ? 'verified' : 'not_submitted'));
    const hasValidId = user.hasValidId ?? status === 'verified';

    return {
      id: user.id || 'user-unknown',
      email: user.email || '',
      name: user.name || 'Unknown User',
      role: user.role || 'resident',
      phone: user.phone || '',
      unitNumber: user.unitNumber || '',
      avatarUrl: user.avatarUrl || '',
      authProvider: user.authProvider || 'email',
      authUid: user.authUid || '',
      emailVerified: user.emailVerified ?? true,
      hasValidId,
      governmentIdStatus: status,
      governmentIdUrl: user.governmentIdUrl || '',
      governmentIdUploadedAt: user.governmentIdUploadedAt || undefined,
      governmentIdVerifiedAt: user.governmentIdVerifiedAt || undefined,
      governmentIdRejectionReason: user.governmentIdRejectionReason || undefined,
      validIdVerifiedAt: user.validIdVerifiedAt || (status === 'verified' ? new Date().toISOString() : undefined),
      createdAt: user.createdAt || new Date().toISOString(),
      password: user.password || undefined,
    };
  }

  private data: DatabaseSchema = {
    users: [],
    units: [],
    bookings: [],
    payments: [],
    maintenanceRequests: [],
    notifications: [],
    activityLogs: []
  };
  constructor() {
    this.init();
  }

  private init() {
    const emptyData: DatabaseSchema = {
      users: [],
      units: [],
      bookings: [],
      payments: [],
      maintenanceRequests: [],
      notifications: [],
      activityLogs: []
    };

    console.log('[DB] Environment:', {
      isVercel,
      cwd: process.cwd(),
      currentDir,
      dbFile: DB_FILE,
      dbSource: DB_SOURCE,
      exists: fs.existsSync(DB_FILE)
    });

    try {
      const parsedDb = readDatabaseFile(DB_FILE);
      if (parsedDb) {
        this.data = parsedDb;
        this.data.users = this.data.users.map((user) => this.normalizeUserRecord(user));
        console.log('[DB] Counts:', {
          users: this.data.users.length,
          units: this.data.units.length,
          bookings: this.data.bookings.length
        });

        this.normalizeUnitStatuses();
        this.normalizeExistingPayments();
        this.backfillMissingBookingPayments();
      } else if (fs.existsSync(PRIMARY_DB_FILE)) {
        console.warn('[DB] Primary data/db.json exists but was unreadable. Refusing backup override so Vercel does not silently switch to stale credentials.');
        this.data = { ...emptyData };
      } else if (isVercel) {
        console.warn('[DB] Vercel runtime detected without a readable database file. Loading in-memory data only; no filesystem write is attempted.');
        this.data = { ...emptyData };
      } else {
        if (!fs.existsSync(DB_DIR)) {
          fs.mkdirSync(DB_DIR, { recursive: true });
        }

        this.data = { ...emptyData };
        this.save();
      }
    } catch (err) {
      console.error('Failed to initialize JSON database:', err);
      this.data = { ...emptyData };
    }
  }

  private normalizeUnitStatuses() {
    let changed = false;

    this.data.units = this.data.units.map((unit) => {
      const normalizedStatus = normalizeUnitStatus(unit.status);
      const needsUpdate = normalizedStatus !== unit.status || Boolean(unit.availability) !== (normalizedStatus === 'Available');

      if (needsUpdate) {
        changed = true;
        return {
          ...unit,
          status: normalizedStatus,
          availability: normalizedStatus === 'Available' ? true : false
        };
      }

      return unit;
    });

    if (changed) {
      this.save();
    }
  }

  private normalizeExistingPayments() {
    let valuesUpdated = false;

    this.data.payments = this.data.payments.map((payment: any) => {
      // Normalize to authoritative fields. Ensure `amount` remains equal to the
      // invoice total (totalAmount) to avoid confusing `amount` with the last
      // payment value.
      const total = typeof payment.totalAmount === 'number' ? payment.totalAmount : Number(payment.amount || 0);
      const paid = typeof payment.paidAmount === 'number' ? payment.paidAmount : (payment.status === 'Paid' ? total : 0);
      const remaining = typeof payment.remainingBalance === 'number' ? payment.remainingBalance : Math.max(0, total - paid);
      const down = typeof payment.downpaymentAmount === 'number' ? payment.downpaymentAmount : (payment.status === 'Paid' ? paid : 0);

      const normalized = {
        ...payment,
        totalAmount: total,
        paidAmount: paid,
        remainingBalance: remaining,
        downpaymentAmount: down,
        status: payment.status || 'Pending',
        method: payment.bookingId ? 'Cash' : (payment.method || 'Cash'),
        referenceNumber: payment.referenceNumber || `CASH-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        // keep `amount` as the invoice total for backward-compatibility
        amount: total
      };

      if (JSON.stringify(normalized) !== JSON.stringify(payment)) {
        valuesUpdated = true;
      }
      return normalized;
    });

    if (valuesUpdated) {
      this.save();
    }
  }

  private save() {
    try {
      if (this.persistenceHook) {
        void this.persistenceHook(this.getSnapshot()).catch((error) => {
          console.error('[DB] Persistence hook failed:', error);
        });
      }

      if (isVercel) {
        dbEvents.emit('change', { stats: this.getDashboardStats(), timestamp: Date.now() });
        return;
      }

      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
      // Emit a change event so external listeners (SSE/websockets) can react
      try {
        dbEvents.emit('change', { stats: this.getDashboardStats(), timestamp: Date.now() });
      } catch (err) {
        // swallow emitter errors
        console.error('dbEvents emit error:', err);
      }
    } catch (err) {
      console.error('Error writing database to disk:', err);
      try {
        dbEvents.emit('change', { stats: this.getDashboardStats(), timestamp: Date.now() });
      } catch (emitErr) {
        console.error('dbEvents emit error:', emitErr);
      }
    }
  }

  public setPersistenceHook(hook?: (snapshot: DatabaseSchema) => Promise<void>) {
    this.persistenceHook = hook;
  }

  public getSnapshot(): DatabaseSchema {
    return JSON.parse(JSON.stringify(this.data)) as DatabaseSchema;
  }

  public replaceSnapshot(snapshot: DatabaseSchema) {
    this.data = JSON.parse(JSON.stringify(snapshot)) as DatabaseSchema;
    this.data.users = this.data.users.map((user) => this.normalizeUserRecord(user));
  }

  // --- LOG RELATED ---
  public addActivityLog(userId: string, userName: string, role: 'admin' | 'resident', action: string, details: string) {
    const log: ActivityLog = {
      id: 'log-' + Math.random().toString(36).substr(2, 9),
      userId,
      userName,
      userRole: role,
      action,
      details,
      createdAt: new Date().toISOString()
    };
    this.data.activityLogs.unshift(log);
    // Limit to 200 logs for size efficiency
    if (this.data.activityLogs.length > 200) {
      this.data.activityLogs.pop();
    }
    this.save();
    return log;
  }

  public getActivityLogs(): ActivityLog[] {
    return this.data.activityLogs;
  }

  // --- USER RELATED ---
  public getUsers(): User[] {
    return this.data.users.map((user) => this.normalizeUserRecord(user));
  }

  public findUserById(id: string): User | undefined {
    const user = this.data.users.find(u => u.id === id);
    return user ? this.normalizeUserRecord(user) : undefined;
  }

  public findUserByEmail(email: string): User | undefined {
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!normalizedEmail) {
      return undefined;
    }

    const user = this.data.users.find((item) => {
      const currentEmail = typeof item?.email === 'string' ? item.email.trim().toLowerCase() : '';
      return currentEmail === normalizedEmail;
    });

    return user ? this.normalizeUserRecord(user) : undefined;
  }

  public migratePlaintextPasswords(hashPassword: (password: string) => string): number {
    let migrated = 0;

    this.data.users = this.data.users.map((user) => {
      if (!user.password || user.password.startsWith('$2')) {
        return user;
      }

      migrated += 1;
      return { ...user, password: hashPassword(user.password) };
    });

    if (migrated > 0) {
      this.save();
    }

    return migrated;
  }

  public createUser(user: Partial<User> & { password?: string }): User {
    const newUser = this.normalizeUserRecord({
      ...user,
      id: 'user-' + Math.random().toString(36).substr(2, 9),
      email: user.email!,
      password: user.password || 'password',
      name: user.name!,
      role: user.role || 'resident',
      phone: user.phone || '',
      unitNumber: user.unitNumber || '',
      avatarUrl: user.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user.name || 'user')}`,
      authProvider: user.authProvider || 'email',
      authUid: user.authUid || '',
      hasValidId: user.hasValidId ?? false,
      validIdVerifiedAt: user.validIdVerifiedAt || (user.hasValidId ? new Date().toISOString() : undefined),
      createdAt: new Date().toISOString()
    });
    this.data.users.push(newUser);
    this.save();
    this.addActivityLog(newUser.id, newUser.name, newUser.role, 'User Registered', `Account created with email ${newUser.email}`);
    return newUser;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return undefined;
    
    const original = this.data.users[idx];
    const updated = this.normalizeUserRecord({ ...original, ...updates });
    // Keep password
    if (original.password) {
      updated.password = original.password;
    }
    
    this.data.users[idx] = updated;
    this.save();
    this.addActivityLog(id, updated.name, updated.role, 'Profile Updated', 'User modified profile settings.');
    return updated;
  }

  public getPendingGovernmentIdVerifications(): User[] {
    return this.data.users
      .filter((user) => user.role === 'resident' && normalizeGovernmentIdStatus(user.governmentIdStatus) === 'pending')
      .map((user) => this.normalizeUserRecord(user));
  }

  public getGovernmentIdStatusForUser(userId: string): User['governmentIdStatus'] {
    const user = this.findUserById(userId);
    return user ? normalizeGovernmentIdStatus(user.governmentIdStatus ?? (user.hasValidId ? 'verified' : 'not_submitted')) : 'not_submitted';
  }

  public submitGovernmentIdForVerification(userId: string, filePath: string, originalFileName: string, mimeType: string): User | undefined {
    const idx = this.data.users.findIndex((user) => user.id === userId);
    if (idx === -1) return undefined;

    const original = this.data.users[idx];
    const updated = this.normalizeUserRecord({
      ...original,
      governmentIdStatus: 'pending',
      governmentIdUrl: filePath,
      governmentIdUploadedAt: new Date().toISOString(),
      governmentIdVerifiedAt: undefined,
      governmentIdRejectionReason: undefined,
      hasValidId: false,
      validIdVerifiedAt: undefined,
      phone: original.phone || '',
      unitNumber: original.unitNumber || ''
    });

    const sanitizedName = String(originalFileName || 'government-id').replace(/\s+/g, ' ').trim();
    updated.governmentIdUrl = filePath;
    updated.governmentIdUploadedAt = new Date().toISOString();
    updated.governmentIdRejectionReason = undefined;
    updated.governmentIdVerifiedAt = undefined;
    updated.hasValidId = false;
    updated.validIdVerifiedAt = undefined;

    this.data.users[idx] = updated;
    this.save();
    this.addActivityLog(userId, updated.name, updated.role, 'Government ID Submitted', `Submitted a valid government ID for verification (${sanitizedName})`);
    return updated;
  }

  public approveGovernmentId(userId: string): User | undefined {
    const idx = this.data.users.findIndex((user) => user.id === userId);
    if (idx === -1) return undefined;

    const original = this.data.users[idx];
    const updated = this.normalizeUserRecord({
      ...original,
      governmentIdStatus: 'verified',
      governmentIdVerifiedAt: new Date().toISOString(),
      governmentIdRejectionReason: undefined,
      hasValidId: true,
      validIdVerifiedAt: new Date().toISOString()
    });

    this.data.users[idx] = updated;
    this.save();
    this.addActivityLog(userId, updated.name, updated.role, 'Government ID Approved', 'Government ID verified and approved by an administrator.');
    return updated;
  }

  public rejectGovernmentId(userId: string, reason?: string): User | undefined {
    const idx = this.data.users.findIndex((user) => user.id === userId);
    if (idx === -1) return undefined;

    const original = this.data.users[idx];
    const updated = this.normalizeUserRecord({
      ...original,
      governmentIdStatus: 'rejected',
      governmentIdRejectionReason: reason || 'Please upload a clearer and valid government-issued ID.',
      governmentIdVerifiedAt: undefined,
      hasValidId: false,
      validIdVerifiedAt: undefined
    });

    this.data.users[idx] = updated;
    this.save();
    this.addActivityLog(userId, updated.name, updated.role, 'Government ID Rejected', reason || 'Government ID was rejected.');
    return updated;
  }

  public deleteUser(id: string, operatorId: string, operatorName: string): boolean {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return false;
    const target = this.data.users[idx];
    this.data.users.splice(idx, 1);
    this.save();
    this.addActivityLog(operatorId, operatorName, 'admin', 'Resident Deleted', `Removed resident ${target.name} (${target.email})`);
    return true;
  }

  // --- UNIT RELATED ---
  public getUnits(): Unit[] {
    return this.data.units;
  }

  public findUnitById(id: string): Unit | undefined {
    return this.data.units.find(u => u.id === id);
  }

  public createUnit(unit: Partial<Unit>, operatorId: string, operatorName: string): Unit {
    const explicitStatus = normalizeUnitStatus(unit.status);
    const newUnit: Unit = {
      id: 'unit-' + Math.random().toString(36).substr(2, 9),
      name: unit.name || 'Gales Urban Haven Unit 1',
      type: unit.type || 'Studio',
      description: unit.description || '',
      price: Number(unit.price) || 120.00,
      availability: explicitStatus === 'Available',
      capacity: Number(unit.capacity) || 2,
      status: explicitStatus,
      images: unit.images && unit.images.length > 0 ? unit.images : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'],
      createdAt: new Date().toISOString()
    };
    this.data.units.push(newUnit);
    this.save();
    this.addActivityLog(operatorId, operatorName, 'admin', 'Unit Added', `Created unit ${newUnit.name}`);
    return newUnit;
  }

  public updateUnit(id: string, updates: Partial<Unit>, operatorId: string, operatorName: string): Unit | undefined {
    const idx = this.data.units.findIndex(u => u.id === id);
    if (idx === -1) return undefined;
    const original = this.data.units[idx];
    const requestedStatus = normalizeUnitStatus(updates.status ?? original.status);
    const nextStatus = requestedStatus;
    const nextAvailability = nextStatus === 'Available';

    const updated = {
      ...original,
      ...updates,
      status: nextStatus,
      availability: nextAvailability,
      price: updates.price !== undefined ? Number(updates.price) : original.price,
      capacity: updates.capacity !== undefined ? Number(updates.capacity) : original.capacity,
    };
    
    this.data.units[idx] = updated;
    this.save();
    this.addActivityLog(operatorId, operatorName, 'admin', 'Unit Updated', `Modified configurations of "${updated.name}"`);
    return updated;
  }

  public deleteUnit(id: string, operatorId: string, operatorName: string): boolean {
    const idx = this.data.units.findIndex(u => u.id === id);
    if (idx === -1) return false;
    const target = this.data.units[idx];
    this.data.units.splice(idx, 1);
    this.save();
    this.addActivityLog(operatorId, operatorName, 'admin', 'Unit Deleted', `Deleted unit ${target.name}`);
    return true;
  }

  // --- BOOKING RELATED ---
  public getBookings(): Booking[] {
    return this.data.bookings;
  }

  public findBookingById(id: string): Booking | undefined {
    return this.data.bookings.find(b => b.id === id);
  }

  public getUserBookings(userId: string): Booking[] {
    return this.data.bookings.filter(b => b.residentId === userId);
  }

  public hasOverlappingActiveBooking(unitId: string, startDate: string, endDate: string, excludeBookingId?: string): boolean {
    const requestedStart = new Date(startDate).getTime();
    const requestedEnd = new Date(endDate).getTime();
    if (!Number.isFinite(requestedStart) || !Number.isFinite(requestedEnd)) return false;

    return this.data.bookings.some((booking) => {
      if (booking.unitId !== unitId || booking.id === excludeBookingId) return false;
      if (!['Pending', 'Approved', 'Partially Paid'].includes(booking.status)) return false;

      const existingStart = new Date(booking.startDate).getTime();
      const existingEnd = new Date(booking.endDate).getTime();
      return Number.isFinite(existingStart) && Number.isFinite(existingEnd)
        && requestedStart < existingEnd
        && requestedEnd > existingStart;
    });
  }

  public createBooking(booking: Partial<Booking>): Booking {
    const user = this.findUserById(booking.residentId!);
    const unit = this.findUnitById(booking.unitId!);
    
    const newBooking: Booking = {
      id: 'book-' + Math.random().toString(36).substr(2, 9),
      unitId: booking.unitId!,
      unitName: unit ? unit.name : 'Unknown Unit',
      residentId: booking.residentId!,
      residentName: user ? user.name : 'Unknown Resident',
      residentEmail: user ? user.email : 'Unknown Email',
      startDate: booking.startDate!,
      endDate: booking.endDate!,
      totalPrice: Number(booking.totalPrice) || 0,
      status: 'Pending',
      guestsCount: Number(booking.guestsCount) || 1,
      notes: booking.notes || '',
      createdAt: new Date().toISOString()
    };
    
    this.data.bookings.unshift(newBooking);
    this.ensureBookingPayment(newBooking);

    // Create automatic system notification for Admin
    this.createNotification({
      title: 'New Reservation Pending',
      message: `${newBooking.residentName} submitted a request to book ${newBooking.unitName} from ${newBooking.startDate} to ${newBooking.endDate}.`,
      recipientId: 'all',
      recipientRole: 'admin',
      type: 'info'
    });

    this.save();
    this.addActivityLog(newBooking.residentId, newBooking.residentName || 'Resident', 'resident', 'Booking Created', `Requested booking for ${newBooking.unitName}`);
    return newBooking;
  }

  public updateBookingStatus(id: string, status: 'Approved' | 'Rejected' | 'Cancelled' | 'Completed', operatorId: string, operatorName: string): Booking | undefined {
    const idx = this.data.bookings.findIndex(b => b.id === id);
    if (idx === -1) return undefined;
    
    const booking = this.data.bookings[idx];
    booking.status = status;
    this.ensureBookingPayment(booking);

    // Side effects of status change
    if (status === 'Approved') {
      const unit = this.findUnitById(booking.unitId);
      if (unit) {
        unit.status = 'Occupied';
        unit.availability = false;
      }
      this.createNotification({
        title: 'Booking Approved!',
        message: `Your booking for "${booking.unitName}" (${booking.startDate} to ${booking.endDate}) has been approved. Please process payment.`,
        recipientId: booking.residentId,
        recipientRole: 'resident',
        type: 'success'
      });
    } else if (status === 'Rejected' || status === 'Cancelled') {
      const unit = this.findUnitById(booking.unitId);
      if (unit && unit.status === 'Occupied') {
        unit.status = 'Available';
        unit.availability = true;
      }
      
      // Update payment status if cancelled/rejected and still pending
      const payIdx = this.data.payments.findIndex(p => p.bookingId === booking.id);
      if (payIdx !== -1 && this.data.payments[payIdx].status === 'Pending') {
        this.data.payments[payIdx].status = 'Failed';
      }

      this.createNotification({
        title: `Booking ${status}`,
        message: `Your reservation request for "${booking.unitName}" has been ${status.toLowerCase()}.`,
        recipientId: booking.residentId,
        recipientRole: 'resident',
        type: 'alert'
      });
    } else if (status === 'Completed') {
      const unit = this.findUnitById(booking.unitId);
      if (unit) {
        unit.status = 'Available';
        unit.availability = true;
      }
    }

    this.save();
    const actorRole = this.findUserById(operatorId)?.role || 'admin';
    this.addActivityLog(operatorId, operatorName, actorRole, 'Booking Status Modified', `Set booking ${id} status to ${status}`);
    return booking;
  }

  // --- PAYMENT RELATED ---
  public getPayments(): Payment[] {
    return this.data.payments;
  }

  public getUserPayments(userId: string): Payment[] {
    return this.data.payments.filter(p => p.residentId === userId);
  }

  public getPaymentByBookingId(bookingId: string): Payment | undefined {
    return this.data.payments.find((p) => p.bookingId === bookingId);
  }

  public ensureBookingPayment(booking: Booking): Payment {
    const existing = this.getPaymentByBookingId(booking.id);
    const totalAmount = Number(booking.totalPrice || 0);

    if (existing) {
      const paidAmount = Math.max(0, Number(existing.paidAmount || 0));
      const normalizedTotal = Math.max(0, Number(existing.totalAmount || totalAmount || existing.amount || 0));
      const nextRemaining = Math.max(0, normalizedTotal - paidAmount);
      const nextStatus: Payment['status'] = nextRemaining <= 0 ? 'Paid' : (paidAmount > 0 ? 'Partially Paid' : 'Pending');

      const normalizedPayment: Payment = {
        ...existing,
        bookingId: booking.id,
        residentId: existing.residentId || booking.residentId,
        residentName: existing.residentName || booking.residentName || 'Unknown Resident',
        unitName: existing.unitName || booking.unitName || 'Unit',
        amount: normalizedTotal,
        totalAmount: normalizedTotal,
        paidAmount,
        remainingBalance: nextRemaining,
        status: nextStatus,
        method: 'Cash',
        referenceNumber: existing.referenceNumber || `CASH-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        createdAt: existing.createdAt || booking.createdAt
      };

      if (JSON.stringify(existing) !== JSON.stringify(normalizedPayment)) {
        const idx = this.data.payments.findIndex((p) => p.id === existing.id);
        this.data.payments[idx] = normalizedPayment;
        this.save();
      }

      return normalizedPayment;
    }

    const newPayment: Payment = {
      id: 'pay-' + Math.random().toString(36).substr(2, 9),
      bookingId: booking.id,
      residentId: booking.residentId,
      residentName: booking.residentName || 'Unknown Resident',
      unitName: booking.unitName || 'Unit',
      amount: totalAmount,
      totalAmount: totalAmount,
      paidAmount: 0,
      remainingBalance: totalAmount,
      downpaymentAmount: 0,
      status: 'Pending',
      method: 'Cash',
      referenceNumber: `CASH-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      createdAt: new Date().toISOString()
    };

    this.data.payments.unshift(newPayment);
    this.save();
    this.addActivityLog(booking.residentId, booking.residentName || 'Resident', 'resident', 'Ledger Created', `Created automatic cash ledger for booking ${booking.id}`);
    return newPayment;
  }

  public backfillMissingBookingPayments(): void {
    let changed = false;

    for (const booking of this.data.bookings) {
      const existing = this.getPaymentByBookingId(booking.id);
      if (!existing) {
        this.ensureBookingPayment(booking);
        changed = true;
      }
    }

    if (changed) {
      this.save();
    }
  }

  public generateCashReference(paymentId: string): string {
    return `CASH-${paymentId.replace(/^pay-/, '').slice(0, 8).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  }

  public submitPayment(paymentId: string, method: string, reference: string, amountPaid: number, residentId: string, residentName: string): Payment | undefined {
    const idx = this.data.payments.findIndex(p => p.id === paymentId || p.bookingId === paymentId);
    if (idx === -1) return undefined;
    
    const payment = this.data.payments[idx];
    const totalAmount = Number(payment.totalAmount || payment.amount || 0);
    const remainingBefore = Number(payment.remainingBalance ?? Math.max(0, totalAmount - (Number(payment.paidAmount || 0))));

    if (amountPaid <= 0) {
      return undefined;
    }
    if (amountPaid > remainingBefore) {
      return undefined;
    }
    if (payment.status === 'Paid') {
      return undefined;
    }

    payment.method = 'Cash';
    payment.referenceNumber = reference || this.generateCashReference(payment.id);
    payment.paidAt = new Date().toISOString();
    payment.paidAmount = Number(payment.paidAmount || 0) + amountPaid;
    payment.totalAmount = totalAmount;
    payment.remainingBalance = Math.max(0, totalAmount - payment.paidAmount);

    if (!payment.downpaymentAmount || payment.downpaymentAmount <= 0) {
      payment.downpaymentAmount = amountPaid;
    }

    payment.status = payment.remainingBalance <= 0 ? 'Paid' : (payment.paidAmount > 0 ? 'Partially Paid' : 'Pending');
    payment.amount = payment.totalAmount;

    const booking = this.findBookingById(payment.bookingId);
    if (booking) {
      if (payment.status === 'Paid') {
        if (booking.status === 'Pending' || booking.status === 'Partially Paid') {
          booking.status = 'Approved';
        }
        const unit = this.findUnitById(booking.unitId);
        if (unit) {
          unit.status = 'Occupied';
          unit.availability = false;
        }
      } else if (payment.status === 'Partially Paid') {
        if (booking.status === 'Pending') {
          booking.status = 'Partially Paid';
        }
      }
    }

    this.createNotification({
      title: 'Cash Payment Received',
      message: `${residentName} paid ₱${amountPaid.toFixed(2)} in cash for ${payment.unitName || 'unit'} (Ref: ${payment.referenceNumber}).`,
      recipientId: 'all',
      recipientRole: 'admin',
      type: 'success'
    });

    this.save();
    this.addActivityLog(residentId, residentName, 'resident', 'Cash Payment Submitted', `Paid ₱${amountPaid.toFixed(2)} cash. Ref: ${payment.referenceNumber}`);
    return payment;
  }

  public generateManualPayment(payment: Partial<Payment>, operatorId: string, operatorName: string): Payment {
    const user = this.findUserById(payment.residentId!);
    const totalAmount = Number(payment.amount) || 0;
    const newPayment: Payment = {
      id: 'pay-' + Math.random().toString(36).substr(2, 9),
      bookingId: payment.bookingId || 'manual',
      residentId: payment.residentId!,
      residentName: user ? user.name : 'Unknown Resident',
      unitName: payment.unitName || 'General service bill',
      amount: totalAmount,
      totalAmount,
      paidAmount: payment.status === 'Paid' ? totalAmount : 0,
      remainingBalance: payment.status === 'Paid' ? 0 : totalAmount,
      downpaymentAmount: payment.status === 'Paid' ? totalAmount : 0,
      status: payment.status || 'Pending',
      method: payment.method || 'Credit Card',
      referenceNumber: 'TXN-GEN-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      createdAt: new Date().toISOString()
    };
    if (payment.status === 'Paid') {
      newPayment.paidAt = new Date().toISOString();
    }
    this.data.payments.unshift(newPayment);
    this.save();
    this.addActivityLog(operatorId, operatorName, 'admin', 'Invoice Generated', `Created manual invoice of ₱${newPayment.amount.toFixed(2)} for resident`);
    return newPayment;
  }

  // --- MAINTENANCE RELATED ---
  public getMaintenanceRequests(): MaintenanceRequest[] {
    return this.data.maintenanceRequests;
  }

  public getUserMaintenanceRequests(userId: string): MaintenanceRequest[] {
    return this.data.maintenanceRequests.filter(r => r.residentId === userId);
  }

  public createMaintenanceRequest(req: Partial<MaintenanceRequest>): MaintenanceRequest {
    const user = this.findUserById(req.residentId!);
    const newReq: MaintenanceRequest = {
      id: 'req-' + Math.random().toString(36).substr(2, 9),
      residentId: req.residentId!,
      residentName: user ? user.name : 'Unknown Resident',
      unitNumber: req.unitNumber || 'General Area',
      issueType: req.issueType || 'General Repair',
      description: req.description || '',
      priority: req.priority || 'Medium',
      status: 'Pending',
      createdAt: new Date().toISOString()
    };
    this.data.maintenanceRequests.unshift(newReq);

    // Notify admins
    this.createNotification({
      title: 'New Maintenance Request',
      message: `${newReq.residentName} submitted a ${newReq.priority} priority request for ${newReq.issueType} in ${newReq.unitNumber}.`,
      recipientId: 'all',
      recipientRole: 'admin',
      type: 'warning'
    });

    this.save();
    this.addActivityLog(newReq.residentId, newReq.residentName || 'Resident', 'resident', 'Maintenance Filed', `Reported issue: ${newReq.issueType}`);
    return newReq;
  }

  public updateMaintenanceStatus(id: string, updates: Partial<MaintenanceRequest>, operatorId: string, operatorName: string): MaintenanceRequest | undefined {
    const idx = this.data.maintenanceRequests.findIndex(r => r.id === id);
    if (idx === -1) return undefined;
    const original = this.data.maintenanceRequests[idx];
    
    const updated = { ...original, ...updates };
    if (updates.status === 'Completed' && !original.resolvedAt) {
      updated.resolvedAt = new Date().toISOString();
    }
    
    this.data.maintenanceRequests[idx] = updated;

    // Send notification to Resident
    this.createNotification({
      title: `Maintenance Request ${updated.status}`,
      message: `Your maintenance ticket concerning "${updated.issueType}" is now: ${updated.status.toUpperCase()}. ${updated.assignedStaff ? `Assigned to: ${updated.assignedStaff}.` : ''}`,
      recipientId: updated.residentId,
      recipientRole: 'resident',
      type: updated.status === 'Completed' ? 'success' : 'info'
    });

    this.save();
    const actorRole = this.findUserById(operatorId)?.role || 'admin';
    this.addActivityLog(operatorId, operatorName, actorRole, 'Maintenance Ticket Updated', `Updated ticket ID: ${id} to state: ${updated.status}`);
    return updated;
  }

  // --- NOTIFICATION RELATED ---
  private canReceiveNotification(notification: CondoNotification, userId: string, role: string): boolean {
    if (notification.recipientId === userId) return true;
    if (notification.recipientId !== 'all') return false;
    return !notification.recipientRole || notification.recipientRole === 'all' || notification.recipientRole === role;
  }

  private isNotificationReadForUser(notificationId: string, userId: string): boolean {
    return this.notificationReadState.get(notificationId)?.has(userId) ?? false;
  }

  public getNotifications(userId: string, role: string): CondoNotification[] {
    return this.data.notifications
      .filter(notification => this.canReceiveNotification(notification, userId, role))
      .map(notification => ({
        ...notification,
        isRead: this.isNotificationReadForUser(notification.id, userId)
      }));
  }

  public createNotification(n: Partial<CondoNotification>): CondoNotification {
    const newNotif: CondoNotification = {
      id: 'notif-' + Math.random().toString(36).substr(2, 9),
      title: n.title!,
      message: n.message!,
      recipientId: n.recipientId || 'all',
      recipientRole: n.recipientRole || 'all',
      isRead: false,
      type: n.type || 'info',
      createdAt: new Date().toISOString()
    };
    this.data.notifications.unshift(newNotif);
    
    // limit max notifications
    if (this.data.notifications.length > 500) {
      this.data.notifications.pop();
    }
    
    this.save();
    return newNotif;
  }

  public markNotificationAsRead(notifId: string, userId: string, role: string): boolean {
    const notification = this.data.notifications.find(item => item.id === notifId);
    if (!notification || !this.canReceiveNotification(notification, userId, role)) {
      return false;
    }

    const readers = this.notificationReadState.get(notifId) || new Set<string>();
    readers.add(userId);
    this.notificationReadState.set(notifId, readers);
    return true;
  }

  public markAllNotificationsAsRead(userId: string, role: string): void {
    this.data.notifications.forEach(notification => {
      if (!this.canReceiveNotification(notification, userId, role)) return;

      const readers = this.notificationReadState.get(notification.id) || new Set<string>();
      readers.add(userId);
      this.notificationReadState.set(notification.id, readers);
    });
  }

  // --- ANALYTICS STATS ---
  public getDashboardStats(): DashboardStats {
    const residents = this.data.users.filter(u => u.role === 'resident');
    const units = this.data.units;
    const bookings = this.data.bookings;
    const payments = this.data.payments;
    const maintenance = this.data.maintenanceRequests;

    const totalRevenue = payments
      .filter(p => p.status === 'Paid')
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingRequestsCount = maintenance.filter(r => r.status === 'Pending' || r.status === 'In Progress').length;
    const unresolvedMaintenance = maintenance.filter(r => r.status !== 'Completed').length;
    const totalInvoices = payments.length;
    const pendingPayments = payments.filter(p => p.status === 'Pending').length;

    // Calculate occupancy rate from active occupied inventory.
    const occupiedCount = units.filter(u => u.status === 'Occupied' || !u.availability).length;
    const occupancyRate = units.length > 0 ? Math.round((occupiedCount / units.length) * 100) : 0;

    // Derived monthly revenue from valid paid payment records only.
    const paidPayments = payments.filter(p => p.status === 'Paid');
    const paidPaymentRevenueByMonth = new Map<string, number>();

    paidPayments.forEach(p => {
      const dateValue = p.paidAt || p.createdAt;
      const parsedDate = new Date(dateValue);
      if (Number.isNaN(parsedDate.getTime())) {
        return;
      }

      const monthName = parsedDate.toLocaleString('en-US', { month: 'short' });
      const monthKey = monthName;
      const existing = paidPaymentRevenueByMonth.get(monthKey) || 0;
      paidPaymentRevenueByMonth.set(monthKey, existing + Number(p.amount || 0));
    });

    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyRevenue = monthOrder
      .filter(month => paidPaymentRevenueByMonth.has(month))
      .map(month => ({
        month,
        revenue: Math.round(paidPaymentRevenueByMonth.get(month) || 0)
      }));

    // Status distributions from actual booking records.
    const pendingB = bookings.filter(b => b.status === 'Pending').length;
    const approvedB = bookings.filter(b => b.status === 'Approved').length;
    const completedB = bookings.filter(b => b.status === 'Completed').length;
    const rejectedB = bookings.filter(b => b.status === 'Rejected' || b.status === 'Cancelled').length;

    const bookingStatusData = [
      { name: 'Pending Approval', value: pendingB },
      { name: 'Approved / Active', value: approvedB },
      { name: 'Completed Sessions', value: completedB },
      { name: 'Cancelled / Rejected', value: rejectedB }
    ];

    // Unit category distribution counts
    const typeCounts: Record<string, number> = {};
    units.forEach(u => {
      typeCounts[u.type] = (typeCounts[u.type] || 0) + 1;
    });
    const unitTypeAvailability = Object.keys(typeCounts).map(type => ({
      type,
      count: typeCounts[type]
    }));

    // Maintenance requests counts by priority
    const lowPriority = maintenance.filter(r => r.priority === 'Low').length;
    const medPriority = maintenance.filter(r => r.priority === 'Medium').length;
    const highPriority = maintenance.filter(r => r.priority === 'High').length;
    const emergencyPriority = maintenance.filter(r => r.priority === 'Emergency').length;

    const maintenancePriorityData = [
      { name: 'Low', value: lowPriority },
      { name: 'Medium', value: medPriority },
      { name: 'High', value: highPriority },
      { name: 'Emergency', value: emergencyPriority }
    ];

    return {
      totalResidents: residents.length,
      totalUnits: units.length,
      totalBookings: bookings.length,
      totalRevenue,
      totalInvoices,
      pendingPayments,
      occupancyRate,
      pendingRequestsCount,
      unresolvedMaintenance,
      monthlyRevenue,
      bookingStatusData,
      unitTypeAvailability,
      maintenancePriorityData
    };
  }

  public getDiagnostics() {
    const adminUser = this.data.users.find(u => u.role === 'admin');
    return {
      environment: {
        isVercel,
        cwd: process.cwd(),
        dbFile: DB_FILE,
        dbSource: DB_SOURCE
      },
      database: {
        exists: fs.existsSync(DB_FILE),
        userCount: this.data.users.length,
        unitCount: this.data.units.length,
        bookingCount: this.data.bookings.length
      },
      adminUser: adminUser ? {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role
      } : null,
      adminExists: Boolean(this.data.users.find(u => u.email === 'admin@condo.com'))
    };
  }
}

export const db = new MockDatabase();

