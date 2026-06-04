import fs from 'node:fs';
import path from 'node:path';
import { 
  User, 
  Unit, 
  Booking, 
  Payment, 
  MaintenanceRequest, 
  CondoNotification, 
  ActivityLog,
  DashboardStats
} from '../src/types.ts';

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

const defaultUnits: Unit[] = [
  {
    id: 'unit-101',
    name: 'The Zenith Suite',
    type: 'Studio Deluxe',
    description: 'A luxurious open-flow studio on the 10th floor with custom glass partitions, panoramic metropolitan views, and a private step-out balcony.',
    price: 120.00,
    amenities: ['High-speed Wi-Fi', 'King Bed', 'Smart TV', 'Chef Kitchenette', 'Rain Shower', 'Private Balcony'],
    availability: true,
    capacity: 2,
    floorNumber: 10,
    status: 'Available',
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'unit-102',
    name: 'The Grand Horizon Penthouse',
    type: 'Penthouse',
    description: 'Spanning the top level of the south tower, this ultra-spacious penthouse features double-height ceilings, automated floor-to-ceiling shades, and private plunge pool access.',
    price: 350.00,
    amenities: ['Private Pool', '24/7 Concierge', 'En-suite Jacuzzi', 'Wine Cellar', 'Dual Balconies', 'Heated Floors', 'Super King Bed'],
    availability: false,
    capacity: 6,
    floorNumber: 24,
    status: 'Booked',
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'unit-103',
    name: 'The Oasis Garden Loft',
    type: '1-Bedroom Loft',
    description: 'Charming duplex loft featuring exposed structural brickwork, reclaimed timber accents, and a lush private garden terrace perfect for morning coffee.',
    price: 180.00,
    amenities: ['Garden Terrace', 'Exposed Brick Style', 'Coffee Station', 'Dedicated Workspace', 'Smart Locks', 'Queen Bed', 'In-unit Laundry'],
    availability: true,
    capacity: 3,
    floorNumber: 4,
    status: 'Available',
    images: ['https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=800&q=80'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'unit-104',
    name: 'The Solarium Duplex',
    type: '2-Bedroom Suite',
    description: 'Bathed in glorious natural light, this southwest-facing duplex offers a spectacular layout ideal for small families or business travelers seeking upscale comfort.',
    price: 240.00,
    amenities: ['Wraparound Glass', 'Kitchen Island', 'Home Office Corner', 'Walk-in Closet', 'Nespresso Machine', 'Two Queen Beds', 'Bath Tub'],
    availability: true,
    capacity: 4,
    floorNumber: 15,
    status: 'Available',
    images: ['https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'unit-105',
    name: 'The Crimson Executive Lounge',
    type: 'Executive Studio',
    description: 'Sleek, moody minimalist studio designed for corporate leaders. Soundproofed glazing, high-end acoustic systems, and dynamic ambient lighting presets.',
    price: 150.00,
    amenities: ['Acoustic Soundproofing', 'Curved Monitor Workspace', 'RGB Diffused Lighting', 'Premium Sound System', 'Double Bed'],
    availability: true,
    capacity: 2,
    floorNumber: 8,
    status: 'Available',
    images: ['https://images.unsplash.com/photo-1502672014263-04e87abe90b3?auto=format&fit=crop&w=800&q=80'],
    createdAt: new Date().toISOString()
  }
];

const defaultUsers: User[] = [
  {
    id: 'user-admin-1',
    email: 'admin@condo.com',
    password: 'admin123', // Clean plain-text mock auth for the sandboxed preview
    name: 'GALES URBAN HAVEN',
    role: 'admin',
    phone: '+1 (555) 0192-384',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-resident-1',
    email: 'teben@gmail.com',
    password: 'teben123',
    name: 'Steven Felarca',
    role: 'resident',
    phone: '+1 (555) 0122-874',
    unitNumber: 'Unit 1204',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-resident-2',
    email: 'alice@condo.com',
    password: 'alice123',
    name: 'Alice Cooper',
    role: 'resident',
    phone: '+1 (555) 0144-555',
    unitNumber: 'Unit 102',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80',
    createdAt: new Date().toISOString()
  }
];

const defaultBookings: Booking[] = [
  {
    id: 'book-1',
    unitId: 'unit-102',
    unitName: 'The Grand Horizon Penthouse',
    residentId: 'user-resident-2',
    residentName: 'Alice Cooper',
    residentEmail: 'alice@condo.com',
    startDate: '2026-06-01',
    endDate: '2026-06-10',
    totalPrice: 3150.00,
    status: 'Approved',
    guestsCount: 4,
    notes: 'Please arrange airport pickup if possible.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'book-2',
    unitId: 'unit-101',
    unitName: 'The Zenith Suite',
    residentId: 'user-resident-1',
    residentName: 'Steven Felarca',
    residentEmail: 'john@condo.com',
    startDate: '2026-06-15',
    endDate: '2026-06-18',
    totalPrice: 360.00,
    status: 'Pending',
    guestsCount: 2,
    notes: 'Celebrating marriage anniversary.',
    createdAt: new Date().toISOString()
  }
];

const defaultPayments: Payment[] = [
  {
    id: 'pay-1',
    bookingId: 'book-1',
    residentId: 'user-resident-2',
    residentName: 'Alice Cooper',
    unitName: 'The Grand Horizon Penthouse',
    amount: 3150.00,
    status: 'Paid',
    method: 'Credit Card',
    referenceNumber: 'TXN-90812312-AB',
    paidAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  },
  {
    id: 'pay-2',
    bookingId: 'book-2',
    residentId: 'user-resident-1',
    residentName: 'Steven Felarca',
    unitName: 'The Zenith Suite',
    amount: 360.00,
    status: 'Pending',
    method: 'Debit Card',
    referenceNumber: 'TXN-PENDING-F7',
    createdAt: new Date().toISOString()
  }
];

const defaultMaintenance: MaintenanceRequest[] = [
  {
    id: 'req-1',
    residentId: 'user-resident-1',
    residentName: 'Steven Felarca',
    unitNumber: 'Unit 1204',
    issueType: 'Plumbing',
    description: 'Slow water drainage in the master bathroom shower cabin. Seems clogged.',
    priority: 'Medium',
    status: 'In Progress',
    assignedStaff: 'Robert Mclean (Plumber Lead)',
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString()
  },
  {
    id: 'req-2',
    residentId: 'user-resident-2',
    residentName: 'Alice Cooper',
    unitNumber: 'Unit 102',
    issueType: 'HVAC / Cooling',
    description: 'The Smart Thermostat triggers an error code E-102 every time cooling is set past 22 degrees centigrade.',
    priority: 'High',
    status: 'Pending',
    createdAt: new Date().toISOString()
  }
];

const defaultNotifications: CondoNotification[] = [
  {
    id: 'notif-1',
    title: 'Pool Maintenace Complete',
    message: 'The outdoor infinity ozone-pool on the 3rd floor deck has passed safety checks and is now fully reopened for swimming hours.',
    recipientId: 'all',
    recipientRole: 'all',
    isRead: false,
    type: 'success',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
  },
  {
    id: 'notif-2',
    title: 'Upcoming AC Duct Cleaning',
    message: 'We will conduct localized duct clearing and exhaust disinfection between May 30th and June 2nd. Please check notice boards for timings.',
    recipientId: 'all',
    recipientRole: 'resident',
    isRead: false,
    type: 'info',
    createdAt: new Date().toISOString()
  }
];

const defaultLogs: ActivityLog[] = [
  {
    id: 'log-1',
    userId: 'user-admin-1',
    userName: 'Donna Talam',
    userRole: 'admin',
    action: 'System Initialized',
    details: 'The Condominium Booking and Operation Database was deployed.',
    createdAt: new Date().toISOString()
  }
];

class MockDatabase {
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
      } else {
        // Seed database
        this.data = {
          users: defaultUsers,
          units: defaultUnits,
          bookings: defaultBookings,
          payments: defaultPayments,
          maintenanceRequests: defaultMaintenance,
          notifications: defaultNotifications,
          activityLogs: defaultLogs
        };
        this.save();
      }
    } catch (err) {
      console.error('Failed to initialize local JSON database file:', err);
      // Fallback in-memory
      this.data = {
        users: defaultUsers,
        units: defaultUnits,
        bookings: defaultBookings,
        payments: defaultPayments,
        maintenanceRequests: defaultMaintenance,
        notifications: defaultNotifications,
        activityLogs: defaultLogs
      };
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
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
    payment.status = 'Paid';
    payment.method = method as any;
    payment.referenceNumber = reference;
    payment.amount = amountPaid;
    payment.paidAt = new Date().toISOString();

    // Auto update booking if payment was fully paid
    const booking = this.findBookingById(payment.bookingId);
    if (booking && booking.status === 'Pending') {
      booking.status = 'Approved';
      // Mark Unit booked
      const unit = this.findUnitById(booking.unitId);
      if (unit) {
        unit.status = 'Booked';
        unit.availability = false;
      }
    }

    // Notify admins
    this.createNotification({
      title: 'Payment Received',
      message: `${residentName} submitted a payment of $${amountPaid} for ${payment.unitName || 'unit'} (Ref: ${reference}).`,
      recipientId: 'all',
      recipientRole: 'admin',
      type: 'success'
    });

    this.save();
    this.addActivityLog(residentId, residentName, 'resident', 'Payment Submitted', `Paid $${amountPaid} references ${reference}`);
    return payment;
  }

  public generateManualPayment(payment: Partial<Payment>, operatorId: string, operatorName: string): Payment {
    const user = this.findUserById(payment.residentId!);
    const newPayment: Payment = {
      id: 'pay-' + Math.random().toString(36).substr(2, 9),
      bookingId: payment.bookingId || 'manual',
      residentId: payment.residentId!,
      residentName: user ? user.name : 'Unknown Resident',
      unitName: payment.unitName || 'General service bill',
      amount: Number(payment.amount) || 0,
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
    this.addActivityLog(operatorId, operatorName, 'admin', 'Invoice Generated', `Created manual invoice of $${newPayment.amount} for resident`);
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
  public getNotifications(userId: string, role: string): CondoNotification[] {
    return this.data.notifications.filter(n => {
      // Return alerts addressed directly to user
      if (n.recipientId === userId) return true;
      // Return global alerts
      if (n.recipientId === 'all') {
        if (!n.recipientRole || n.recipientRole === 'all') return true;
        if (n.recipientRole === role) return true;
      }
      return false;
    });
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

  public markNotificationAsRead(notifId: string, userId: string): boolean {
    const idx = this.data.notifications.findIndex(n => n.id === notifId);
    if (idx !== -1) {
      this.data.notifications[idx].isRead = true;
      this.save();
      return true;
    }
    return false;
  }

  public markAllNotificationsAsRead(userId: string, role: string): void {
    this.data.notifications.forEach(n => {
      if (n.recipientId === userId) n.isRead = true;
      if (n.recipientId === 'all' && (!n.recipientRole || n.recipientRole === 'all' || n.recipientRole === role)) {
        n.isRead = true;
      }
    });
    this.save();
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

    // Build monthly revenue charts (mock standard progression)
    const monthlyRevenue = [
      { month: 'Jan', revenue: 6200 },
      { month: 'Feb', revenue: 7800 },
      { month: 'Mar', revenue: 9400 },
      { month: 'Apr', revenue: 11200 },
      { month: 'May', revenue: totalRevenue > 0 ? Math.round(totalRevenue * 0.9) : 13500 },
      { month: 'Jun (Proj)', revenue: Math.round(totalRevenue) || 15000 }
    ];

    // Status distributions
    const pendingB = bookings.filter(b => b.status === 'Pending').length;
    const approvedB = bookings.filter(b => b.status === 'Approved').length;
    const completedB = bookings.filter(b => b.status === 'Completed').length;
    const rejectedB = bookings.filter(b => b.status === 'Rejected' || b.status === 'Cancelled').length;

    const bookingStatusData = [
      { name: 'Pending Approval', value: pendingB || 1 },
      { name: 'Approved / Active', value: approvedB || 2 },
      { name: 'Completed Sessions', value: completedB || 3 },
      { name: 'Cancelled / Rejected', value: rejectedB || 1 }
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
      { name: 'Low', value: lowPriority || 1 },
      { name: 'Medium', value: medPriority || 2 },
      { name: 'High', value: highPriority || 1 },
      { name: 'Emergency', value: emergencyPriority || 0 }
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

