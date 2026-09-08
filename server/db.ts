import fs from 'node:fs';
import path from 'node:path';
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

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

interface DatabaseSchema {
  users: User[];
  units: Unit[];
  bookings: Booking[];
  payments: Payment[];
  maintenanceRequests: MaintenanceRequest[];
  notifications: CondoNotification[];
  activityLogs: ActivityLog[];
}

export const dbEvents = new EventEmitter();

class MockDatabase {
  private notificationReadState = new Map<string, Set<string>>();

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
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
        // Ensure any new arrays are initialized
        if (!this.data.users) this.data.users = [];
        if (!this.data.units) this.data.units = [];
        if (!this.data.bookings) this.data.bookings = [];
        if (!this.data.payments) this.data.payments = [];
        if (!this.data.maintenanceRequests) this.data.maintenanceRequests = [];
        if (!this.data.notifications) this.data.notifications = [];
        if (!this.data.activityLogs) this.data.activityLogs = [];

        this.normalizeExistingPayments();
      } else {
        // Start with empty collections until real records are created.
        this.data = {
          users: [],
          units: [],
          bookings: [],
          payments: [],
          maintenanceRequests: [],
          notifications: [],
          activityLogs: []
        };
        this.save();
      }
    } catch (err) {
      console.error('Failed to initialize local JSON database file:', err);
      // Keep the in-memory fallback empty when storage cannot be read.
      this.data = {
        users: [],
        units: [],
        bookings: [],
        payments: [],
        maintenanceRequests: [],
        notifications: [],
        activityLogs: []
      };
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
    }
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
    return this.data.users;
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public findUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(user: Partial<User> & { password?: string }): User {
    const newUser: User = {
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
      createdAt: new Date().toISOString()
    };
    this.data.users.push(newUser);
    this.save();
    this.addActivityLog(newUser.id, newUser.name, newUser.role, 'User Registered', `Account created with email ${newUser.email}`);
    return newUser;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return undefined;
    
    const original = this.data.users[idx];
    const updated = { ...original, ...updates };
    // Keep password
    if (original.password) {
      updated.password = original.password;
    }
    
    this.data.users[idx] = updated;
    this.save();
    this.addActivityLog(id, updated.name, updated.role, 'Profile Updated', 'User modified profile settings.');
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
    const newUnit: Unit = {
      id: 'unit-' + Math.random().toString(36).substr(2, 9),
      name: unit.name!,
      type: unit.type || 'Studio',
      description: unit.description || '',
      price: Number(unit.price) || 120.00,
      amenities: unit.amenities || [],
      availability: unit.availability !== undefined ? unit.availability : true,
      capacity: Number(unit.capacity) || 2,
      floorNumber: Number(unit.floorNumber) || 1,
      status: unit.status || 'Available',
      images: unit.images && unit.images.length > 0 ? unit.images : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'],
      createdAt: new Date().toISOString()
    };
    this.data.units.push(newUnit);
    this.save();
    this.addActivityLog(operatorId, operatorName, 'admin', 'Unit Added', `Created unit ${newUnit.name} on floor ${newUnit.floorNumber}`);
    return newUnit;
  }

  public updateUnit(id: string, updates: Partial<Unit>, operatorId: string, operatorName: string): Unit | undefined {
    const idx = this.data.units.findIndex(u => u.id === id);
    if (idx === -1) return undefined;
    const original = this.data.units[idx];
    
    const updated = { 
      ...original, 
      ...updates,
      price: updates.price !== undefined ? Number(updates.price) : original.price,
      capacity: updates.capacity !== undefined ? Number(updates.capacity) : original.capacity,
      floorNumber: updates.floorNumber !== undefined ? Number(updates.floorNumber) : original.floorNumber,
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
    
    // Create automatic pending payment for tracker
    const newPayment: Payment = {
      id: 'pay-' + Math.random().toString(36).substr(2, 9),
      bookingId: newBooking.id,
      residentId: newBooking.residentId,
      residentName: newBooking.residentName,
      unitName: newBooking.unitName,
      amount: newBooking.totalPrice,
      totalAmount: newBooking.totalPrice,
      paidAmount: 0,
      remainingBalance: newBooking.totalPrice,
      downpaymentAmount: 0,
      status: 'Pending',
      method: 'Credit Card',
      referenceNumber: 'TXN-PENDING-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      createdAt: new Date().toISOString()
    };
    this.data.payments.unshift(newPayment);

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

    // Side effects of status change
    if (status === 'Approved') {
      const unit = this.findUnitById(booking.unitId);
      if (unit) {
        unit.status = 'Booked';
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
      if (unit && unit.status === 'Booked') {
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

  public submitPayment(paymentId: string, method: string, reference: string, amountPaid: number, residentId: string, residentName: string): Payment | undefined {
    const idx = this.data.payments.findIndex(p => p.id === paymentId);
    if (idx === -1) return undefined;
    
    const payment = this.data.payments[idx];
    // Compute remaining based on authoritative fields
    const remainingBefore = (typeof payment.remainingBalance === 'number') ? payment.remainingBalance : ((typeof payment.totalAmount === 'number' ? payment.totalAmount : payment.amount) - (typeof payment.paidAmount === 'number' ? payment.paidAmount : 0));
    if (amountPaid <= 0) {
      return undefined;
    }
    if (amountPaid > remainingBefore) {
      return undefined;
    }

    payment.method = method as any;
    payment.referenceNumber = reference;
    payment.paidAt = new Date().toISOString();
    // Accumulate paid amount and recalc remaining; never overwrite invoice total
    payment.paidAmount = (typeof payment.paidAmount === 'number' ? payment.paidAmount : 0) + amountPaid;
    payment.totalAmount = typeof payment.totalAmount === 'number' ? payment.totalAmount : (typeof payment.amount === 'number' ? payment.amount : 0);
    payment.remainingBalance = Math.max(0, payment.totalAmount - payment.paidAmount);

    // Preserve the first downpayment as the downpaymentAmount; subsequent payments accumulate in paidAmount
    if (!payment.downpaymentAmount || payment.downpaymentAmount <= 0) {
      payment.downpaymentAmount = amountPaid;
    }

    // Set status according to paid vs total
    if (payment.paidAmount < payment.totalAmount) {
      payment.status = 'Partially Paid';
    } else {
      payment.status = 'Paid';
    }

    // Keep `amount` representing the invoice total for compatibility
    payment.amount = payment.totalAmount;

    const booking = this.findBookingById(payment.bookingId);
    if (booking) {
      if (payment.status === 'Paid') {
        if (booking.status === 'Pending' || booking.status === 'Partially Paid') {
          booking.status = 'Approved';
        }
        const unit = this.findUnitById(booking.unitId);
        if (unit) {
          unit.status = 'Booked';
          unit.availability = false;
        }
      } else if (payment.status === 'Partially Paid') {
        if (booking.status === 'Pending') {
          booking.status = 'Partially Paid';
        }
      }
    }

    this.createNotification({
      title: 'Payment Received',
      message: `${residentName} submitted a payment of ₱${amountPaid.toFixed(2)} for ${payment.unitName || 'unit'} (Ref: ${reference}).`,
      recipientId: 'all',
      recipientRole: 'admin',
      type: 'success'
    });

    this.save();
    this.addActivityLog(residentId, residentName, 'resident', 'Payment Submitted', `Paid ₱${amountPaid.toFixed(2)} references ${reference}`);
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

    // Calculate Occupancy Rate: Booked units / Total units
    const bookedCount = units.filter(u => u.status === 'Booked' || !u.availability).length;
    const occupancyRate = units.length > 0 ? Math.round((bookedCount / units.length) * 100) : 0;

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
}

export const db = new MockDatabase();

