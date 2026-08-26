// server.ts
import express from "express";
import path2 from "node:path";
import { fileURLToPath } from "node:url";

// server/db.ts
import fs from "node:fs";
import path from "node:path";
import { EventEmitter } from "events";
var DB_DIR = path.join(process.cwd(), "data");
var DB_FILE = path.join(DB_DIR, "db.json");
var defaultUnits = [
  {
    id: "unit-101",
    name: "The Zenith Suite",
    type: "Studio Deluxe",
    description: "A luxurious open-flow studio on the 10th floor with custom glass partitions, panoramic metropolitan views, and a private step-out balcony.",
    price: 120,
    amenities: ["High-speed Wi-Fi", "King Bed", "Smart TV", "Chef Kitchenette", "Rain Shower", "Private Balcony"],
    availability: true,
    capacity: 2,
    floorNumber: 10,
    status: "Available",
    images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80"],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "unit-102",
    name: "The Grand Horizon Penthouse",
    type: "Penthouse",
    description: "Spanning the top level of the south tower, this ultra-spacious penthouse features double-height ceilings, automated floor-to-ceiling shades, and private plunge pool access.",
    price: 350,
    amenities: ["Private Pool", "24/7 Concierge", "En-suite Jacuzzi", "Wine Cellar", "Dual Balconies", "Heated Floors", "Super King Bed"],
    availability: false,
    capacity: 6,
    floorNumber: 24,
    status: "Booked",
    images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80"],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "unit-103",
    name: "The Oasis Garden Loft",
    type: "1-Bedroom Loft",
    description: "Charming duplex loft featuring exposed structural brickwork, reclaimed timber accents, and a lush private garden terrace perfect for morning coffee.",
    price: 180,
    amenities: ["Garden Terrace", "Exposed Brick Style", "Coffee Station", "Dedicated Workspace", "Smart Locks", "Queen Bed", "In-unit Laundry"],
    availability: true,
    capacity: 3,
    floorNumber: 4,
    status: "Available",
    images: ["https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=800&q=80"],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "unit-104",
    name: "The Solarium Duplex",
    type: "2-Bedroom Suite",
    description: "Bathed in glorious natural light, this southwest-facing duplex offers a spectacular layout ideal for small families or business travelers seeking upscale comfort.",
    price: 240,
    amenities: ["Wraparound Glass", "Kitchen Island", "Home Office Corner", "Walk-in Closet", "Nespresso Machine", "Two Queen Beds", "Bath Tub"],
    availability: true,
    capacity: 4,
    floorNumber: 15,
    status: "Available",
    images: ["https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80"],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "unit-105",
    name: "The Crimson Executive Lounge",
    type: "Executive Studio",
    description: "Sleek, moody minimalist studio designed for corporate leaders. Soundproofed glazing, high-end acoustic systems, and dynamic ambient lighting presets.",
    price: 150,
    amenities: ["Acoustic Soundproofing", "Curved Monitor Workspace", "RGB Diffused Lighting", "Premium Sound System", "Double Bed"],
    availability: true,
    capacity: 2,
    floorNumber: 8,
    status: "Available",
    images: ["https://images.unsplash.com/photo-1502672014263-04e87abe90b3?auto=format&fit=crop&w=800&q=80"],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  }
];
var defaultUsers = [
  {
    id: "user-admin-1",
    email: "admin@condo.com",
    password: "admin123",
    // Clean plain-text mock auth for the sandboxed preview
    name: "GALES URBAN HAVEN",
    role: "admin",
    phone: "+1 (555) 0192-384",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "user-resident-1",
    email: "resident@gmail.com",
    password: "Resident@2026",
    name: "Steven Felarca",
    role: "resident",
    phone: "+1 (555) 0122-874",
    unitNumber: "Unit 1204",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "user-resident-2",
    email: "alice@condo.com",
    password: "alice123",
    name: "Alice Cooper",
    role: "resident",
    phone: "+1 (555) 0144-555",
    unitNumber: "Unit 102",
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  }
];
var defaultBookings = [
  {
    id: "book-1",
    unitId: "unit-102",
    unitName: "The Grand Horizon Penthouse",
    residentId: "user-resident-2",
    residentName: "Alice Cooper",
    residentEmail: "alice@condo.com",
    startDate: "2026-06-01",
    endDate: "2026-06-10",
    totalPrice: 3150,
    status: "Approved",
    guestsCount: 4,
    notes: "Please arrange airport pickup if possible.",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "book-2",
    unitId: "unit-101",
    unitName: "The Zenith Suite",
    residentId: "user-resident-1",
    residentName: "Steven Felarca",
    residentEmail: "resident@gmail.com",
    startDate: "2026-06-15",
    endDate: "2026-06-18",
    totalPrice: 360,
    status: "Pending",
    guestsCount: 2,
    notes: "Celebrating marriage anniversary.",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  }
];
var defaultPayments = [
  {
    id: "pay-1",
    bookingId: "book-1",
    residentId: "user-resident-2",
    residentName: "Alice Cooper",
    unitName: "The Grand Horizon Penthouse",
    amount: 3150,
    totalAmount: 3150,
    paidAmount: 3150,
    remainingBalance: 0,
    downpaymentAmount: 3150,
    status: "Paid",
    method: "Credit Card",
    referenceNumber: "TXN-90812312-AB",
    paidAt: (/* @__PURE__ */ new Date()).toISOString(),
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "pay-2",
    bookingId: "book-2",
    residentId: "user-resident-1",
    residentName: "Steven Felarca",
    unitName: "The Zenith Suite",
    amount: 360,
    totalAmount: 360,
    paidAmount: 0,
    remainingBalance: 360,
    downpaymentAmount: 0,
    status: "Pending",
    method: "Debit Card",
    referenceNumber: "TXN-PENDING-F7",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  }
];
var defaultMaintenance = [
  {
    id: "req-1",
    residentId: "user-resident-1",
    residentName: "Steven Felarca",
    unitNumber: "Unit 1204",
    issueType: "Plumbing",
    description: "Slow water drainage in the master bathroom shower cabin. Seems clogged.",
    priority: "Medium",
    status: "In Progress",
    assignedStaff: "Robert Mclean (Plumber Lead)",
    createdAt: new Date(Date.now() - 48 * 3600 * 1e3).toISOString()
  },
  {
    id: "req-2",
    residentId: "user-resident-2",
    residentName: "Alice Cooper",
    unitNumber: "Unit 102",
    issueType: "HVAC / Cooling",
    description: "The Smart Thermostat triggers an error code E-102 every time cooling is set past 22 degrees centigrade.",
    priority: "High",
    status: "Pending",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  }
];
var defaultNotifications = [
  {
    id: "notif-1",
    title: "Pool Maintenace Complete",
    message: "The outdoor infinity ozone-pool on the 3rd floor deck has passed safety checks and is now fully reopened for swimming hours.",
    recipientId: "all",
    recipientRole: "all",
    isRead: false,
    type: "success",
    createdAt: new Date(Date.now() - 2 * 3600 * 1e3).toISOString()
  },
  {
    id: "notif-2",
    title: "Upcoming AC Duct Cleaning",
    message: "We will conduct localized duct clearing and exhaust disinfection between May 30th and June 2nd. Please check notice boards for timings.",
    recipientId: "all",
    recipientRole: "resident",
    isRead: false,
    type: "info",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  }
];
var defaultLogs = [
  {
    id: "log-1",
    userId: "user-admin-1",
    userName: "Donna Talam",
    userRole: "admin",
    action: "System Initialized",
    details: "The Condominium Booking and Operation Database was deployed.",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  }
];
var dbEvents = new EventEmitter();
var MockDatabase = class {
  constructor() {
    this.data = {
      users: [],
      units: [],
      bookings: [],
      payments: [],
      maintenanceRequests: [],
      notifications: [],
      activityLogs: []
    };
    this.init();
  }
  init() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, "utf-8");
        this.data = JSON.parse(fileContent);
        if (!this.data.users) this.data.users = [];
        if (!this.data.units) this.data.units = [];
        if (!this.data.bookings) this.data.bookings = [];
        if (!this.data.payments) this.data.payments = [];
        if (!this.data.maintenanceRequests) this.data.maintenanceRequests = [];
        if (!this.data.notifications) this.data.notifications = [];
        if (!this.data.activityLogs) this.data.activityLogs = [];
        this.normalizeExistingPayments();
      } else {
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
      console.error("Failed to initialize local JSON database file:", err);
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
  normalizeExistingPayments() {
    let valuesUpdated = false;
    this.data.payments = this.data.payments.map((payment) => {
      const total = typeof payment.totalAmount === "number" ? payment.totalAmount : Number(payment.amount || 0);
      const paid = typeof payment.paidAmount === "number" ? payment.paidAmount : payment.status === "Paid" ? total : 0;
      const remaining = typeof payment.remainingBalance === "number" ? payment.remainingBalance : Math.max(0, total - paid);
      const down = typeof payment.downpaymentAmount === "number" ? payment.downpaymentAmount : payment.status === "Paid" ? paid : 0;
      const normalized = {
        ...payment,
        totalAmount: total,
        paidAmount: paid,
        remainingBalance: remaining,
        downpaymentAmount: down,
        status: payment.status || "Pending",
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
  save() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
      try {
        dbEvents.emit("change", { stats: this.getDashboardStats(), timestamp: Date.now() });
      } catch (err) {
        console.error("dbEvents emit error:", err);
      }
    } catch (err) {
      console.error("Error writing database to disk:", err);
    }
  }
  // --- LOG RELATED ---
  addActivityLog(userId, userName, role, action, details) {
    const log = {
      id: "log-" + Math.random().toString(36).substr(2, 9),
      userId,
      userName,
      userRole: role,
      action,
      details,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.activityLogs.unshift(log);
    if (this.data.activityLogs.length > 200) {
      this.data.activityLogs.pop();
    }
    this.save();
    return log;
  }
  getActivityLogs() {
    return this.data.activityLogs;
  }
  // --- USER RELATED ---
  getUsers() {
    return this.data.users;
  }
  findUserById(id) {
    return this.data.users.find((u) => u.id === id);
  }
  findUserByEmail(email) {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }
  createUser(user) {
    const newUser = {
      id: "user-" + Math.random().toString(36).substr(2, 9),
      email: user.email,
      password: user.password || "password",
      name: user.name,
      role: user.role || "resident",
      phone: user.phone || "",
      unitNumber: user.unitNumber || "",
      avatarUrl: user.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user.name || "user")}`,
      authProvider: user.authProvider || "email",
      authUid: user.authUid || "",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.users.push(newUser);
    this.save();
    this.addActivityLog(newUser.id, newUser.name, newUser.role, "User Registered", `Account created with email ${newUser.email}`);
    return newUser;
  }
  updateUser(id, updates) {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return void 0;
    const original = this.data.users[idx];
    const updated = { ...original, ...updates };
    if (original.password) {
      updated.password = original.password;
    }
    this.data.users[idx] = updated;
    this.save();
    this.addActivityLog(id, updated.name, updated.role, "Profile Updated", "User modified profile settings.");
    return updated;
  }
  deleteUser(id, operatorId, operatorName) {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return false;
    const target = this.data.users[idx];
    this.data.users.splice(idx, 1);
    this.save();
    this.addActivityLog(operatorId, operatorName, "admin", "Resident Deleted", `Removed resident ${target.name} (${target.email})`);
    return true;
  }
  // --- UNIT RELATED ---
  getUnits() {
    return this.data.units;
  }
  findUnitById(id) {
    return this.data.units.find((u) => u.id === id);
  }
  createUnit(unit, operatorId, operatorName) {
    const newUnit = {
      id: "unit-" + Math.random().toString(36).substr(2, 9),
      name: unit.name,
      type: unit.type || "Studio",
      description: unit.description || "",
      price: Number(unit.price) || 120,
      amenities: unit.amenities || [],
      availability: unit.availability !== void 0 ? unit.availability : true,
      capacity: Number(unit.capacity) || 2,
      floorNumber: Number(unit.floorNumber) || 1,
      status: unit.status || "Available",
      images: unit.images && unit.images.length > 0 ? unit.images : ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80"],
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.units.push(newUnit);
    this.save();
    this.addActivityLog(operatorId, operatorName, "admin", "Unit Added", `Created unit ${newUnit.name} on floor ${newUnit.floorNumber}`);
    return newUnit;
  }
  updateUnit(id, updates, operatorId, operatorName) {
    const idx = this.data.units.findIndex((u) => u.id === id);
    if (idx === -1) return void 0;
    const original = this.data.units[idx];
    const updated = {
      ...original,
      ...updates,
      price: updates.price !== void 0 ? Number(updates.price) : original.price,
      capacity: updates.capacity !== void 0 ? Number(updates.capacity) : original.capacity,
      floorNumber: updates.floorNumber !== void 0 ? Number(updates.floorNumber) : original.floorNumber
    };
    this.data.units[idx] = updated;
    this.save();
    this.addActivityLog(operatorId, operatorName, "admin", "Unit Updated", `Modified configurations of "${updated.name}"`);
    return updated;
  }
  deleteUnit(id, operatorId, operatorName) {
    const idx = this.data.units.findIndex((u) => u.id === id);
    if (idx === -1) return false;
    const target = this.data.units[idx];
    this.data.units.splice(idx, 1);
    this.save();
    this.addActivityLog(operatorId, operatorName, "admin", "Unit Deleted", `Deleted unit ${target.name}`);
    return true;
  }
  // --- BOOKING RELATED ---
  getBookings() {
    return this.data.bookings;
  }
  findBookingById(id) {
    return this.data.bookings.find((b) => b.id === id);
  }
  getUserBookings(userId) {
    return this.data.bookings.filter((b) => b.residentId === userId);
  }
  createBooking(booking) {
    const user = this.findUserById(booking.residentId);
    const unit = this.findUnitById(booking.unitId);
    const newBooking = {
      id: "book-" + Math.random().toString(36).substr(2, 9),
      unitId: booking.unitId,
      unitName: unit ? unit.name : "Unknown Unit",
      residentId: booking.residentId,
      residentName: user ? user.name : "Unknown Resident",
      residentEmail: user ? user.email : "Unknown Email",
      startDate: booking.startDate,
      endDate: booking.endDate,
      totalPrice: Number(booking.totalPrice) || 0,
      status: "Pending",
      guestsCount: Number(booking.guestsCount) || 1,
      notes: booking.notes || "",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.bookings.unshift(newBooking);
    const newPayment = {
      id: "pay-" + Math.random().toString(36).substr(2, 9),
      bookingId: newBooking.id,
      residentId: newBooking.residentId,
      residentName: newBooking.residentName,
      unitName: newBooking.unitName,
      amount: newBooking.totalPrice,
      totalAmount: newBooking.totalPrice,
      paidAmount: 0,
      remainingBalance: newBooking.totalPrice,
      downpaymentAmount: 0,
      status: "Pending",
      method: "Credit Card",
      referenceNumber: "TXN-PENDING-" + Math.random().toString(36).substr(2, 6).toUpperCase(),
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.payments.unshift(newPayment);
    this.createNotification({
      title: "New Reservation Pending",
      message: `${newBooking.residentName} submitted a request to book ${newBooking.unitName} from ${newBooking.startDate} to ${newBooking.endDate}.`,
      recipientId: "all",
      recipientRole: "admin",
      type: "info"
    });
    this.save();
    this.addActivityLog(newBooking.residentId, newBooking.residentName || "Resident", "resident", "Booking Created", `Requested booking for ${newBooking.unitName}`);
    return newBooking;
  }
  updateBookingStatus(id, status, operatorId, operatorName) {
    const idx = this.data.bookings.findIndex((b) => b.id === id);
    if (idx === -1) return void 0;
    const booking = this.data.bookings[idx];
    booking.status = status;
    if (status === "Approved") {
      const unit = this.findUnitById(booking.unitId);
      if (unit) {
        unit.status = "Booked";
        unit.availability = false;
      }
      this.createNotification({
        title: "Booking Approved!",
        message: `Your booking for "${booking.unitName}" (${booking.startDate} to ${booking.endDate}) has been approved. Please process payment.`,
        recipientId: booking.residentId,
        recipientRole: "resident",
        type: "success"
      });
    } else if (status === "Rejected" || status === "Cancelled") {
      const unit = this.findUnitById(booking.unitId);
      if (unit && unit.status === "Booked") {
        unit.status = "Available";
        unit.availability = true;
      }
      const payIdx = this.data.payments.findIndex((p) => p.bookingId === booking.id);
      if (payIdx !== -1 && this.data.payments[payIdx].status === "Pending") {
        this.data.payments[payIdx].status = "Failed";
      }
      this.createNotification({
        title: `Booking ${status}`,
        message: `Your reservation request for "${booking.unitName}" has been ${status.toLowerCase()}.`,
        recipientId: booking.residentId,
        recipientRole: "resident",
        type: "alert"
      });
    } else if (status === "Completed") {
      const unit = this.findUnitById(booking.unitId);
      if (unit) {
        unit.status = "Available";
        unit.availability = true;
      }
    }
    this.save();
    const actorRole = this.findUserById(operatorId)?.role || "admin";
    this.addActivityLog(operatorId, operatorName, actorRole, "Booking Status Modified", `Set booking ${id} status to ${status}`);
    return booking;
  }
  // --- PAYMENT RELATED ---
  getPayments() {
    return this.data.payments;
  }
  getUserPayments(userId) {
    return this.data.payments.filter((p) => p.residentId === userId);
  }
  submitPayment(paymentId, method, reference, amountPaid, residentId, residentName) {
    const idx = this.data.payments.findIndex((p) => p.id === paymentId);
    if (idx === -1) return void 0;
    const payment = this.data.payments[idx];
    const remainingBefore = typeof payment.remainingBalance === "number" ? payment.remainingBalance : (typeof payment.totalAmount === "number" ? payment.totalAmount : payment.amount) - (typeof payment.paidAmount === "number" ? payment.paidAmount : 0);
    if (amountPaid <= 0) {
      return void 0;
    }
    if (amountPaid > remainingBefore) {
      return void 0;
    }
    payment.method = method;
    payment.referenceNumber = reference;
    payment.paidAt = (/* @__PURE__ */ new Date()).toISOString();
    payment.paidAmount = (typeof payment.paidAmount === "number" ? payment.paidAmount : 0) + amountPaid;
    payment.totalAmount = typeof payment.totalAmount === "number" ? payment.totalAmount : typeof payment.amount === "number" ? payment.amount : 0;
    payment.remainingBalance = Math.max(0, payment.totalAmount - payment.paidAmount);
    if (!payment.downpaymentAmount || payment.downpaymentAmount <= 0) {
      payment.downpaymentAmount = amountPaid;
    }
    if (payment.paidAmount < payment.totalAmount) {
      payment.status = "Partially Paid";
    } else {
      payment.status = "Paid";
    }
    payment.amount = payment.totalAmount;
    const booking = this.findBookingById(payment.bookingId);
    if (booking) {
      if (payment.status === "Paid") {
        if (booking.status === "Pending" || booking.status === "Partially Paid") {
          booking.status = "Approved";
        }
        const unit = this.findUnitById(booking.unitId);
        if (unit) {
          unit.status = "Booked";
          unit.availability = false;
        }
      } else if (payment.status === "Partially Paid") {
        if (booking.status === "Pending") {
          booking.status = "Partially Paid";
        }
      }
    }
    this.createNotification({
      title: "Payment Received",
      message: `${residentName} submitted a payment of \u20B1${amountPaid.toFixed(2)} for ${payment.unitName || "unit"} (Ref: ${reference}).`,
      recipientId: "all",
      recipientRole: "admin",
      type: "success"
    });
    this.save();
    this.addActivityLog(residentId, residentName, "resident", "Payment Submitted", `Paid \u20B1${amountPaid.toFixed(2)} references ${reference}`);
    return payment;
  }
  generateManualPayment(payment, operatorId, operatorName) {
    const user = this.findUserById(payment.residentId);
    const totalAmount = Number(payment.amount) || 0;
    const newPayment = {
      id: "pay-" + Math.random().toString(36).substr(2, 9),
      bookingId: payment.bookingId || "manual",
      residentId: payment.residentId,
      residentName: user ? user.name : "Unknown Resident",
      unitName: payment.unitName || "General service bill",
      amount: totalAmount,
      totalAmount,
      paidAmount: payment.status === "Paid" ? totalAmount : 0,
      remainingBalance: payment.status === "Paid" ? 0 : totalAmount,
      downpaymentAmount: payment.status === "Paid" ? totalAmount : 0,
      status: payment.status || "Pending",
      method: payment.method || "Credit Card",
      referenceNumber: "TXN-GEN-" + Math.random().toString(36).substr(2, 6).toUpperCase(),
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (payment.status === "Paid") {
      newPayment.paidAt = (/* @__PURE__ */ new Date()).toISOString();
    }
    this.data.payments.unshift(newPayment);
    this.save();
    this.addActivityLog(operatorId, operatorName, "admin", "Invoice Generated", `Created manual invoice of $${newPayment.amount} for resident`);
    return newPayment;
  }
  // --- MAINTENANCE RELATED ---
  getMaintenanceRequests() {
    return this.data.maintenanceRequests;
  }
  getUserMaintenanceRequests(userId) {
    return this.data.maintenanceRequests.filter((r) => r.residentId === userId);
  }
  createMaintenanceRequest(req) {
    const user = this.findUserById(req.residentId);
    const newReq = {
      id: "req-" + Math.random().toString(36).substr(2, 9),
      residentId: req.residentId,
      residentName: user ? user.name : "Unknown Resident",
      unitNumber: req.unitNumber || "General Area",
      issueType: req.issueType || "General Repair",
      description: req.description || "",
      priority: req.priority || "Medium",
      status: "Pending",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.maintenanceRequests.unshift(newReq);
    this.createNotification({
      title: "New Maintenance Request",
      message: `${newReq.residentName} submitted a ${newReq.priority} priority request for ${newReq.issueType} in ${newReq.unitNumber}.`,
      recipientId: "all",
      recipientRole: "admin",
      type: "warning"
    });
    this.save();
    this.addActivityLog(newReq.residentId, newReq.residentName || "Resident", "resident", "Maintenance Filed", `Reported issue: ${newReq.issueType}`);
    return newReq;
  }
  updateMaintenanceStatus(id, updates, operatorId, operatorName) {
    const idx = this.data.maintenanceRequests.findIndex((r) => r.id === id);
    if (idx === -1) return void 0;
    const original = this.data.maintenanceRequests[idx];
    const updated = { ...original, ...updates };
    if (updates.status === "Completed" && !original.resolvedAt) {
      updated.resolvedAt = (/* @__PURE__ */ new Date()).toISOString();
    }
    this.data.maintenanceRequests[idx] = updated;
    this.createNotification({
      title: `Maintenance Request ${updated.status}`,
      message: `Your maintenance ticket concerning "${updated.issueType}" is now: ${updated.status.toUpperCase()}. ${updated.assignedStaff ? `Assigned to: ${updated.assignedStaff}.` : ""}`,
      recipientId: updated.residentId,
      recipientRole: "resident",
      type: updated.status === "Completed" ? "success" : "info"
    });
    this.save();
    const actorRole = this.findUserById(operatorId)?.role || "admin";
    this.addActivityLog(operatorId, operatorName, actorRole, "Maintenance Ticket Updated", `Updated ticket ID: ${id} to state: ${updated.status}`);
    return updated;
  }
  // --- NOTIFICATION RELATED ---
  getNotifications(userId, role) {
    return this.data.notifications.filter((n) => {
      if (n.recipientId === userId) return true;
      if (n.recipientId === "all") {
        if (!n.recipientRole || n.recipientRole === "all") return true;
        if (n.recipientRole === role) return true;
      }
      return false;
    });
  }
  createNotification(n) {
    const newNotif = {
      id: "notif-" + Math.random().toString(36).substr(2, 9),
      title: n.title,
      message: n.message,
      recipientId: n.recipientId || "all",
      recipientRole: n.recipientRole || "all",
      isRead: false,
      type: n.type || "info",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.notifications.unshift(newNotif);
    if (this.data.notifications.length > 500) {
      this.data.notifications.pop();
    }
    this.save();
    return newNotif;
  }
  markNotificationAsRead(notifId, userId) {
    const idx = this.data.notifications.findIndex((n) => n.id === notifId);
    if (idx !== -1) {
      this.data.notifications[idx].isRead = true;
      this.save();
      return true;
    }
    return false;
  }
  markAllNotificationsAsRead(userId, role) {
    this.data.notifications.forEach((n) => {
      if (n.recipientId === userId) n.isRead = true;
      if (n.recipientId === "all" && (!n.recipientRole || n.recipientRole === "all" || n.recipientRole === role)) {
        n.isRead = true;
      }
    });
    this.save();
  }
  // --- ANALYTICS STATS ---
  getDashboardStats() {
    const residents = this.data.users.filter((u) => u.role === "resident");
    const units = this.data.units;
    const bookings = this.data.bookings;
    const payments = this.data.payments;
    const maintenance = this.data.maintenanceRequests;
    const totalRevenue = payments.filter((p) => p.status === "Paid").reduce((sum, p) => sum + p.amount, 0);
    const pendingRequestsCount = maintenance.filter((r) => r.status === "Pending" || r.status === "In Progress").length;
    const unresolvedMaintenance = maintenance.filter((r) => r.status !== "Completed").length;
    const totalInvoices = payments.length;
    const pendingPayments = payments.filter((p) => p.status === "Pending").length;
    const bookedCount = units.filter((u) => u.status === "Booked" || !u.availability).length;
    const occupancyRate = units.length > 0 ? Math.round(bookedCount / units.length * 100) : 0;
    const paidPayments = payments.filter((p) => p.status === "Paid");
    const paidPaymentRevenueByMonth = /* @__PURE__ */ new Map();
    paidPayments.forEach((p) => {
      const dateValue = p.paidAt || p.createdAt;
      const parsedDate = new Date(dateValue);
      if (Number.isNaN(parsedDate.getTime())) {
        return;
      }
      const monthName = parsedDate.toLocaleString("en-US", { month: "short" });
      const monthKey = monthName;
      const existing = paidPaymentRevenueByMonth.get(monthKey) || 0;
      paidPaymentRevenueByMonth.set(monthKey, existing + Number(p.amount || 0));
    });
    const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyRevenue = monthOrder.filter((month) => paidPaymentRevenueByMonth.has(month)).map((month) => ({
      month,
      revenue: Math.round(paidPaymentRevenueByMonth.get(month) || 0)
    }));
    const pendingB = bookings.filter((b) => b.status === "Pending").length;
    const approvedB = bookings.filter((b) => b.status === "Approved").length;
    const completedB = bookings.filter((b) => b.status === "Completed").length;
    const rejectedB = bookings.filter((b) => b.status === "Rejected" || b.status === "Cancelled").length;
    const bookingStatusData = [
      { name: "Pending Approval", value: pendingB },
      { name: "Approved / Active", value: approvedB },
      { name: "Completed Sessions", value: completedB },
      { name: "Cancelled / Rejected", value: rejectedB }
    ];
    const typeCounts = {};
    units.forEach((u) => {
      typeCounts[u.type] = (typeCounts[u.type] || 0) + 1;
    });
    const unitTypeAvailability = Object.keys(typeCounts).map((type) => ({
      type,
      count: typeCounts[type]
    }));
    const lowPriority = maintenance.filter((r) => r.priority === "Low").length;
    const medPriority = maintenance.filter((r) => r.priority === "Medium").length;
    const highPriority = maintenance.filter((r) => r.priority === "High").length;
    const emergencyPriority = maintenance.filter((r) => r.priority === "Emergency").length;
    const maintenancePriorityData = [
      { name: "Low", value: lowPriority },
      { name: "Medium", value: medPriority },
      { name: "High", value: highPriority },
      { name: "Emergency", value: emergencyPriority }
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
};
var db = new MockDatabase();

// server/services/BookingService.ts
var BookingService = class {
  constructor(database = db) {
    this.database = database;
  }
  createBooking(booking) {
    return this.database.createBooking(booking);
  }
  getBookings() {
    return this.database.getBookings();
  }
  findBookingById(id) {
    return this.database.findBookingById(id);
  }
  updateBookingStatus(id, status, operatorId, operatorName) {
    return this.database.updateBookingStatus(id, status, operatorId, operatorName);
  }
  getUserBookings(userId) {
    return this.database.getUserBookings(userId);
  }
};
var bookingService = new BookingService();

// server/services/PaymentService.ts
var PaymentService = class {
  constructor(database = db) {
    this.database = database;
  }
  getPayments() {
    return this.database.getPayments();
  }
  getUserPayments(userId) {
    return this.database.getUserPayments(userId);
  }
  submitPayment(paymentId, method, reference, amountPaid, residentId, residentName) {
    return this.database.submitPayment(paymentId, method, reference, amountPaid, residentId, residentName);
  }
  generateManualPayment(payment, operatorId, operatorName) {
    return this.database.generateManualPayment(payment, operatorId, operatorName);
  }
};
var paymentService = new PaymentService();

// server/services/NotificationService.ts
var NotificationService = class {
  constructor(database = db) {
    this.database = database;
    this.queue = [];
  }
  enqueue(notification) {
    const n = this.database.createNotification(notification);
    this.queue.push(n);
    if (this.queue.length > 200) this.queue.shift();
    return n;
  }
  dequeue() {
    return this.queue.shift();
  }
  getNotifications(userId, role) {
    return this.database.getNotifications(userId, role);
  }
  markAsRead(id, userId) {
    return this.database.markNotificationAsRead(id, userId);
  }
  markAllAsRead(userId, role) {
    return this.database.markAllNotificationsAsRead(userId, role);
  }
};
var notificationService = new NotificationService();

// server.ts
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path2.dirname(__filename);
var projectRoot = __dirname;
dotenv.config({ path: path2.resolve(projectRoot, ".env") });
var PORT = Number(process.env.PORT) || 3e3;
var VITE_HMR_PORT = Number(process.env.VITE_HMR_PORT) || 24678;
var firebaseConfigFromEnv = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.VITE_FIREBASE_APP_ID || "",
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || ""
};
function requireAuth(req, res, next) {
  const authHeader = String(req.headers.authorization || "");
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required. Missing Bearer token." });
  }
  const userId = authHeader.split(" ")[1]?.trim();
  if (!isNonEmptyString(userId)) {
    return res.status(401).json({ error: "Authentication token malformed." });
  }
  const user = db.findUserById(userId);
  if (!user) {
    return res.status(401).json({ error: "User session invalid or expired." });
  }
  req.user = user;
  next();
}
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    const user = req.user;
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Administrator privileges required." });
    }
    next();
  });
}
function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}
function parseNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
function validateFields(body, requiredFields) {
  return requiredFields.filter((key) => {
    const value = body?.[key];
    return value === void 0 || value === null || typeof value === "string" && value.trim() === "";
  });
}
async function createApp() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.post("/api/auth/register", (req, res) => {
    const { email, password, name, phone, unitNumber } = req.body;
    const missing = validateFields(req.body, ["email", "password", "name"]);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(", ")}.` });
    }
    if (!isNonEmptyString(email) || !isNonEmptyString(password) || !isNonEmptyString(name)) {
      return res.status(400).json({ error: "Email, password, and name must be valid non-empty strings." });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const existing = db.findUserByEmail(normalizedEmail);
    if (existing) {
      return res.status(400).json({ error: "An account with this email address already exists." });
    }
    const newUser = db.createUser({
      email: normalizedEmail,
      password,
      name: name.trim(),
      phone: isNonEmptyString(phone) ? phone.trim() : void 0,
      unitNumber: isNonEmptyString(unitNumber) ? unitNumber.trim() : void 0,
      role: "resident"
    });
    const { password: _, ...userSafe } = newUser;
    res.status(201).json({ user: userSafe, token: newUser.id });
  });
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const missing = validateFields(req.body, ["email", "password"]);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(", ")}.` });
    }
    if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
      return res.status(400).json({ error: "Email and password must be valid non-empty strings." });
    }
    const user = db.findUserByEmail(email.trim().toLowerCase());
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid email or password combination." });
    }
    const { password: _, ...userSafe } = user;
    res.status(200).json({ user: userSafe, token: user.id });
  });
  app.get("/api/config/firebase", (_req, res) => {
    res.json({ firebase: firebaseConfigFromEnv });
  });
  app.post("/api/auth/firebase", (req, res) => {
    const { uid, email, name, avatarUrl, provider } = req.body;
    const missing = validateFields(req.body, ["uid", "email"]);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(", ")}.` });
    }
    if (!isNonEmptyString(uid) || !isNonEmptyString(email)) {
      return res.status(400).json({ error: "Firebase UID and email are required." });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const allUsers = db.getUsers();
    const existingUserByUid = allUsers.find((user) => user.authUid === uid);
    const existingUserByEmail = allUsers.find((user) => user.email.toLowerCase() === normalizedEmail);
    const existingUser = existingUserByUid || existingUserByEmail;
    if (existingUser) {
      const isGoogleLogin = provider === "google";
      const nextAuthProvider = existingUser.authProvider || (isGoogleLogin ? "google" : "email");
      const updatedUser = db.updateUser(existingUser.id, {
        name: isNonEmptyString(name) ? String(name).trim() : existingUser.name,
        avatarUrl: isNonEmptyString(avatarUrl) ? String(avatarUrl).trim() : existingUser.avatarUrl,
        authProvider: nextAuthProvider,
        authUid: uid,
        email: normalizedEmail
      });
      if (!updatedUser) {
        return res.status(500).json({ error: "Unable to synchronize the existing account." });
      }
      const { password: _2, ...userSafe2 } = updatedUser;
      return res.status(200).json({ user: userSafe2, token: updatedUser.id });
    }
    const newUser = db.createUser({
      email: normalizedEmail,
      password: Math.random().toString(36).slice(2, 12),
      name: isNonEmptyString(name) ? String(name).trim() : normalizedEmail.split("@")[0],
      avatarUrl: isNonEmptyString(avatarUrl) ? String(avatarUrl).trim() : void 0,
      role: "resident",
      authProvider: provider === "google" ? "google" : "firebase",
      authUid: uid
    });
    const { password: _, ...userSafe } = newUser;
    return res.status(201).json({ user: userSafe, token: newUser.id });
  });
  app.get("/api/auth/me", requireAuth, (req, res) => {
    const user = req.user;
    const { password: _, ...userSafe } = user;
    res.json({ user: userSafe });
  });
  app.put("/api/auth/profile", requireAuth, (req, res) => {
    const user = req.user;
    const { name, phone, unitNumber, avatarUrl } = req.body;
    const updated = db.updateUser(user.id, {
      name: name || user.name,
      phone: phone !== void 0 ? phone : user.phone,
      unitNumber: unitNumber !== void 0 ? unitNumber : user.unitNumber,
      avatarUrl: avatarUrl !== void 0 ? avatarUrl : user.avatarUrl
    });
    if (!updated) {
      return res.status(500).json({ error: "Failed to update user profile." });
    }
    const { password: _, ...userSafe } = updated;
    res.json({ user: userSafe });
  });
  app.get("/api/residents", requireAdmin, (req, res) => {
    const residents = db.getUsers().filter((u) => u.role === "resident");
    const safeResidents = residents.map(({ password, ...rest }) => rest);
    res.json(safeResidents);
  });
  app.get("/api/units", (req, res) => {
    const { type, minPrice, maxPrice, status, search } = req.query;
    let list = db.getUnits();
    if (type) {
      list = list.filter((u) => u.type.toLowerCase() === String(type).toLowerCase());
    }
    if (minPrice) {
      list = list.filter((u) => u.price >= Number(minPrice));
    }
    if (maxPrice) {
      list = list.filter((u) => u.price <= Number(maxPrice));
    }
    if (status) {
      list = list.filter((u) => u.status === String(status));
    }
    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(
        (u) => u.name.toLowerCase().includes(q) || u.description.toLowerCase().includes(q) || u.type.toLowerCase().includes(q)
      );
    }
    res.json(list);
  });
  app.get("/api/units/:id", (req, res) => {
    const unit = db.findUnitById(req.params.id);
    if (!unit) {
      return res.status(404).json({ error: "Condominium unit not found." });
    }
    res.json(unit);
  });
  app.post("/api/units", requireAdmin, (req, res) => {
    const user = req.user;
    const { name, type, description, price, amenities, capacity, floorNumber, status, images } = req.body;
    if (!name || !type || !price) {
      return res.status(400).json({ error: "Please specify required properties: name, type, and price." });
    }
    const unit = db.createUnit({
      name,
      type,
      description,
      price: Number(price),
      amenities: Array.isArray(amenities) ? amenities : [],
      capacity: Number(capacity) || 2,
      floorNumber: Number(floorNumber) || 1,
      status: status || "Available",
      images: Array.isArray(images) ? images : []
    }, user.id, user.name);
    res.status(201).json(unit);
  });
  app.put("/api/units/:id", requireAdmin, (req, res) => {
    const user = req.user;
    const updated = db.updateUnit(req.params.id, req.body, user.id, user.name);
    if (!updated) {
      return res.status(404).json({ error: "Unit not found to update." });
    }
    res.json(updated);
  });
  app.delete("/api/units/:id", requireAdmin, (req, res) => {
    const user = req.user;
    const success = db.deleteUnit(req.params.id, user.id, user.name);
    if (!success) {
      return res.status(404).json({ error: "Unit was not found or could not be deleted." });
    }
    res.json({ success: true, message: "Unit was successfully unlisted." });
  });
  app.get("/api/bookings", requireAuth, (req, res) => {
    const user = req.user;
    if (user.role === "admin") {
      res.json(bookingService.getBookings());
    } else {
      res.json(bookingService.getUserBookings(user.id));
    }
  });
  app.post("/api/bookings", requireAuth, (req, res) => {
    const user = req.user;
    const { unitId, startDate, endDate, totalPrice, guestsCount, notes } = req.body;
    const missing = validateFields(req.body, ["unitId", "startDate", "endDate", "totalPrice"]);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing mandatory fields: ${missing.join(", ")}.` });
    }
    if (!isNonEmptyString(unitId) || !isNonEmptyString(startDate) || !isNonEmptyString(endDate)) {
      return res.status(400).json({ error: "unitId, startDate, and endDate must be valid strings." });
    }
    const priceValue = parseNumber(totalPrice, -1);
    if (priceValue < 0) {
      return res.status(400).json({ error: "totalPrice must be a valid number." });
    }
    const unit = db.findUnitById(unitId);
    if (!unit) {
      return res.status(404).json({ error: "The requested unit does not exist." });
    }
    if (unit.status !== "Available") {
      return res.status(400).json({ error: "This unit is currently unavailable for booking." });
    }
    const booking = bookingService.createBooking({
      unitId,
      residentId: user.id,
      startDate: startDate.trim(),
      endDate: endDate.trim(),
      totalPrice: priceValue,
      guestsCount: Number(guestsCount) || 1,
      notes: isNonEmptyString(notes) ? notes.trim() : ""
    });
    res.status(201).json(booking);
  });
  app.post("/api/inquiries", requireAuth, (req, res) => {
    const user = req.user;
    const { unitId, unitName, type, frequency, message } = req.body;
    const missing = validateFields(req.body, ["unitId"]);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing mandatory field: ${missing.join(", ")}.` });
    }
    const inquiry = {
      id: "inq-" + Math.random().toString(36).substring(2, 11),
      unitId: unitId.trim(),
      unitName: isNonEmptyString(unitName) ? unitName.trim() : "",
      residentId: user.id,
      residentName: user.name,
      type: isNonEmptyString(type) ? type.trim() : "inquire",
      frequency: isNonEmptyString(frequency) ? frequency.trim() : null,
      message: isNonEmptyString(message) ? message.trim() : "",
      status: "Open",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.addActivityLog(user.id, user.name, user.role, "Inquiry Submitted", `Inquiry for ${unitId}`);
    res.status(201).json(inquiry);
  });
  app.post("/api/purchases", requireAuth, (req, res) => {
    const user = req.user;
    const { unitId, unitName, amount, frequency, message } = req.body;
    const missing = validateFields(req.body, ["unitId", "amount"]);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing mandatory fields: ${missing.join(", ")}.` });
    }
    const amountValue = parseNumber(amount, -1);
    if (amountValue < 0) {
      return res.status(400).json({ error: "amount must be a valid numerical value." });
    }
    const purchase = {
      id: "pur-" + Math.random().toString(36).substring(2, 11),
      unitId: unitId.trim(),
      unitName: isNonEmptyString(unitName) ? unitName.trim() : "",
      residentId: user.id,
      residentName: user.name,
      amount: amountValue,
      frequency: isNonEmptyString(frequency) ? frequency.trim() : null,
      message: isNonEmptyString(message) ? message.trim() : "",
      status: "Pending",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.addActivityLog(user.id, user.name, user.role, "Purchase Request", `Purchase request for ${unitId}`);
    res.status(201).json(purchase);
  });
  app.put("/api/bookings/:id/status", requireAuth, (req, res) => {
    const user = req.user;
    const { status } = req.body;
    if (!["Approved", "Rejected", "Cancelled", "Completed"].includes(status)) {
      return res.status(400).json({ error: "Invalid booking status request." });
    }
    const booking = bookingService.findBookingById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: "Reservation ticket not found." });
    }
    if (user.role !== "admin" && booking.residentId !== user.id) {
      return res.status(403).json({ error: "Access denied. You can only alter your own reservations." });
    }
    if (user.role !== "admin" && status === "Approved") {
      return res.status(403).json({ error: "Resident accounts are not authorized to self-approve bookings." });
    }
    const updated = bookingService.updateBookingStatus(req.params.id, status, user.id, user.name);
    res.json(updated);
  });
  app.get("/api/payments", requireAuth, (req, res) => {
    const user = req.user;
    if (user.role === "admin") {
      res.json(paymentService.getPayments());
    } else {
      res.json(paymentService.getUserPayments(user.id));
    }
  });
  app.post("/api/payments/:id/pay", requireAuth, (req, res) => {
    const user = req.user;
    const { method, referenceNumber, amount } = req.body;
    const missing = validateFields(req.body, ["method", "referenceNumber", "amount"]);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing payment fields: ${missing.join(", ")}.` });
    }
    if (!isNonEmptyString(method) || !isNonEmptyString(referenceNumber)) {
      return res.status(400).json({ error: "Payment method and reference number must be valid strings." });
    }
    const amountValue = parseNumber(amount, -1);
    if (amountValue <= 0) {
      return res.status(400).json({ error: "Payment amount must be a valid positive number." });
    }
    const paymentRecord = paymentService.getPayments().find((p) => p.id === req.params.id);
    if (!paymentRecord) {
      return res.status(404).json({ error: "No invoice found with the given ledger ID." });
    }
    const remaining = paymentRecord.remainingBalance ?? paymentRecord.totalAmount - paymentRecord.paidAmount;
    if (amountValue > remaining) {
      return res.status(400).json({ error: "Payment amount exceeds the remaining balance." });
    }
    const payment = paymentService.submitPayment(
      req.params.id,
      method.trim(),
      referenceNumber.trim(),
      amountValue,
      user.id,
      user.name
    );
    if (!payment) {
      return res.status(500).json({ error: "Unable to apply payment at this time." });
    }
    res.json(payment);
  });
  app.get("/api/public/payments/:id", (req, res) => {
    const payment = paymentService.getPayments().find((p) => p.id === req.params.id);
    if (!payment) {
      return res.status(404).json({ error: "Invoice ledger entity not found." });
    }
    res.json(payment);
  });
  app.post("/api/public/payments/:id/pay", (req, res) => {
    const { method, referenceNumber, amount, payorName } = req.body;
    const missing = validateFields(req.body, ["method", "referenceNumber", "amount"]);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing public payment fields: ${missing.join(", ")}.` });
    }
    if (!isNonEmptyString(method) || !isNonEmptyString(referenceNumber)) {
      return res.status(400).json({ error: "Payment method and reference number must be valid strings." });
    }
    const amountValue = parseNumber(amount, -1);
    if (amountValue < 0) {
      return res.status(400).json({ error: "Payment amount must be a valid positive number." });
    }
    const payment = paymentService.submitPayment(
      req.params.id,
      method.trim(),
      referenceNumber.trim(),
      amountValue,
      "qr-payor",
      isNonEmptyString(payorName) ? payorName.trim() : "Gales QR Client"
    );
    if (!payment) {
      return res.status(404).json({ error: "No invoice found with the given ledger ID." });
    }
    res.json(payment);
  });
  app.post("/api/payments/manual", requireAdmin, (req, res) => {
    const user = req.user;
    const { residentId, unitName, amount, status, method } = req.body;
    if (!residentId || !amount) {
      return res.status(400).json({ error: "Please specify target residentId and billing amount." });
    }
    const payment = paymentService.generateManualPayment({
      residentId,
      unitName: unitName || "Periodic Condominium Maintenance Dues",
      amount: Number(amount),
      status: status || "Pending",
      method: method || "Credit Card"
    }, user.id, user.name);
    res.status(201).json(payment);
  });
  app.get("/api/maintenance", requireAuth, (req, res) => {
    const user = req.user;
    if (user.role === "admin") {
      res.json(db.getMaintenanceRequests());
    } else {
      res.json(db.getUserMaintenanceRequests(user.id));
    }
  });
  app.post("/api/maintenance", requireAuth, (req, res) => {
    const user = req.user;
    const { unitNumber, issueType, description, priority } = req.body;
    const missing = validateFields(req.body, ["issueType", "description"]);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing maintenance fields: ${missing.join(", ")}.` });
    }
    if (!isNonEmptyString(issueType) || !isNonEmptyString(description)) {
      return res.status(400).json({ error: "Issue type and description must be valid strings." });
    }
    const normalizedPriority = isNonEmptyString(priority) ? priority.trim() : "Medium";
    const safePriority = ["Low", "Medium", "High", "Emergency"].includes(normalizedPriority) ? normalizedPriority : "Medium";
    const ticket = db.createMaintenanceRequest({
      residentId: user.id,
      unitNumber: isNonEmptyString(unitNumber) ? unitNumber.trim() : user.unitNumber || "Common Spaces",
      issueType: issueType.trim(),
      description: description.trim(),
      priority: safePriority
    });
    res.status(201).json(ticket);
  });
  app.put("/api/maintenance/:id", requireAdmin, (req, res) => {
    const user = req.user;
    const updated = db.updateMaintenanceStatus(req.params.id, req.body, user.id, user.name);
    if (!updated) {
      return res.status(404).json({ error: "Maintenance ticket not found." });
    }
    res.json(updated);
  });
  app.get("/api/notifications", requireAuth, (req, res) => {
    const user = req.user;
    res.json(notificationService.getNotifications(user.id, user.role));
  });
  app.post("/api/notifications/read/:id", requireAuth, (req, res) => {
    const user = req.user;
    const success = notificationService.markAsRead(req.params.id, user.id);
    res.json({ success });
  });
  app.post("/api/notifications/read-all", requireAuth, (req, res) => {
    const user = req.user;
    notificationService.markAllAsRead(user.id, user.role);
    res.json({ success: true, message: "All relevant notifications cleared." });
  });
  app.post("/api/notifications/announce", requireAdmin, (req, res) => {
    const { title, message, type, recipientRole } = req.body;
    const missing = validateFields(req.body, ["title", "message"]);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing announcement fields: ${missing.join(", ")}.` });
    }
    if (!isNonEmptyString(title) || !isNonEmptyString(message)) {
      return res.status(400).json({ error: "Announcement title and message must be valid text." });
    }
    const normalizedRecipientRole = isNonEmptyString(recipientRole) ? recipientRole.trim() : "all";
    const safeRecipientRole = ["admin", "resident", "all"].includes(normalizedRecipientRole) ? normalizedRecipientRole : "all";
    const normalizedType = isNonEmptyString(type) ? type.trim() : "info";
    const safeType = ["info", "success", "warning", "alert"].includes(normalizedType) ? normalizedType : "info";
    const notif = notificationService.enqueue({
      title: title.trim(),
      message: message.trim(),
      recipientId: "all",
      recipientRole: safeRecipientRole,
      type: safeType
    });
    res.status(201).json(notif);
  });
  app.get("/api/dashboard/stats", requireAuth, (req, res) => {
    res.json(db.getDashboardStats());
  });
  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });
  app.get("/api/events", (req, res) => {
    const token = req.query.token && String(req.query.token).trim() || (String(req.headers.authorization || "").startsWith("Bearer ") ? String(req.headers.authorization).split(" ")[1] : "");
    if (!token) {
      return res.status(401).json({ error: "Authentication required for event stream." });
    }
    const user = db.findUserById(token);
    if (!user) {
      return res.status(401).json({ error: "Invalid event stream token." });
    }
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Event stream access restricted to administrators." });
    }
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();
    try {
      res.write("event: stats\n");
      res.write(`data: ${JSON.stringify(db.getDashboardStats())}

`);
    } catch (err) {
      console.error("Failed sending initial SSE payload:", err);
    }
    const onChange = (payload) => {
      try {
        res.write("event: stats\n");
        res.write(`data: ${JSON.stringify(payload?.stats || payload)}

`);
      } catch (err) {
        console.error("SSE write error:", err);
      }
    };
    dbEvents.on("change", onChange);
    req.on("close", () => {
      dbEvents.off("change", onChange);
      try {
        res.end();
      } catch (e) {
      }
    });
  });
  app.get("/api/logs", requireAdmin, (req, res) => {
    res.json(db.getActivityLogs());
  });
  app.post("/api/chatbot", async (req, res) => {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages format." });
    }
    const lastMessage = messages[messages.length - 1];
    const userPrompt = lastMessage ? lastMessage.content || "" : "";
    if (!process.env.GEMINI_API_KEY) {
      setTimeout(() => {
        let reply = "Hello! I am your Gales Urban Haven Virtual Assistant at One Spatial Iloilo. I can help answer questions about renting/leasing, suite features, amenities, location, maintenance response, and payment dues. How can I assist you today?";
        const q = userPrompt.toLowerCase();
        if (q.includes("suite") || q.includes("zenith") || q.includes("loft") || q.includes("rental") || q.includes("lease")) {
          reply = "The Zenith Suite is a signature 1-Bedroom Loft offered by Gales Urban Haven at $120/night. It's fully furnished with a Queen Bed, kitchenette, Wi-Fi, and a widescreen TV, perfect for young professionals or students who want convenience near Mandurriao, Iloilo City.";
        } else if (q.includes("amenit") || q.includes("pool") || q.includes("wifi") || q.includes("gym")) {
          reply = "At One Spatial Iloilo, we offer excellent community amenities: a swimming pool, High-Speed Wi-Fi, 24/7 security, automatic mailboxes, on-duty 20-minute emergency mechanics, and high-quality suites tailored for student and professional urban lifestyles.";
        } else if (q.includes("maintenance") || q.includes("fix") || q.includes("pipe") || q.includes("leak") || q.includes("claim")) {
          reply = "Settle your mind! Our on-duty maintenance crew from Gales Urban Haven guarantees emergency response and resolution inside 20 minutes! Residents can easily post claims by clicking 'Report Apartment Issues' inside the Resident Dashboard.";
        } else if (q.includes("pay") || q.includes("bill") || q.includes("invoice") || q.includes("due") || q.includes("ledger")) {
          reply = "You can securely manage and pay your maintenance dues or unit bills through our integrated 'One Spatial Pay' terminal inside the Resident Dashboard! Simply login, click 'Pay Executive Bill' under the Billing Ledger, and get a modern printable receipt instantly.";
        } else if (q.includes("location") || q.includes("address") || q.includes("city")) {
          reply = "One Spatial Iloilo is ideally situated in Mandurriao, Iloilo City, Iloilo, Philippines. This represents a highly strategic central hub close to prestigious universities, business process outsourcing (BPO) offices, and dining centers, fitting students and professionals perfectly.";
        } else if (q.includes("gales") || q.includes("haven") || q.includes("who are you")) {
          reply = "Gales Urban Haven is your premier property management agency that operates One Spatial Iloilo's digitalized portals, streamlining bookings, ledger tracking, broadcast notices, and technical support.";
        }
        return res.json({ text: reply, isMock: true });
      }, 550);
      return;
    }
    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      const systemInstruction = `
You are the official Virtual Assistant for "Gales Urban Haven" at "One Spatial Iloilo" Condominiums, located in Mandurriao, Iloilo City, Iloilo, Philippines.
The business is Gales Urban Haven, specializing in affordable, accessible, and convenient condominium renting, leasing, and residential property management in Iloilo.
Target customers are young professionals, busy students looking for convenient university housing, and small families.

Key selling points & operating models:
1. Online reservations (e.g., "The Zenith Suite", a premium 1-Bedroom Loft on Floor 4, rate of $120/night, sleeps up to 3, furnished with modern Wi-Fi, Queen Bed, Kitchenette, and TV).
2. Bullet-proof maintenance: Certified mechanics are stationed on-duty 24/7. They resolve emergency resident claims within 20 minutes of submitting through the dashboard!
3. Seamless billing: "One Spatial Pay" handles digital ledgers, automatic invoice generation, and credit card processing, ending paper receipt clutter.
4. Active administrative dashboard: Approved enrollments, instant security broadcast notices, and transparent audit details.

Your tone should be helpful, humble, warm, concise, and focused on property solutions. Do not generate code, do not mention API details (like 'process.env' or system prompt parameters), and do not use long preamble. Keep answers within 2-3 short, conversational paragraphs. Let the visitor know how convenient it is to register and login!
`;
      const contents = messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content || "" }]
      }));
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.7
        }
      });
      res.json({ text: response.text });
    } catch (err) {
      console.error("Gemini chatbot error:", err);
      res.json({
        text: "I am having trouble talking to Gales Urban Haven server right now, but please know that One Spatial Iloilo is fully optimized for your convenience with 24/7 security and 20-minute emergency response service!"
      });
    }
  });
  app.use("/api", (req, res) => {
    res.status(404).json({ error: "API endpoint not found." });
  });
  app.use((err, req, res, next) => {
    console.error("Unhandled server error:", err);
    res.status(500).json({ error: "Internal server error. Please try again later." });
  });
  if (false) {
    const { createServer: createViteServer } = await null;
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { port: VITE_HMR_PORT },
        allowedHosts: ["*"]
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
    console.log("Vite development server loaded as Express middleware.");
  } else {
    const distPath = path2.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path2.join(distPath, "index.html"));
    });
    console.log("Production static file server configured to map to dist/ folder.");
  }
  return app;
}
if (false) {
  createApp().then((app) => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Express Condominium App listening at HTTP on Port ${PORT}`);
    });
  }).catch((err) => {
    console.error("CRITICAL: Server startup failure:", err);
  });
}
export {
  createApp
};
//# sourceMappingURL=server.mjs.map
