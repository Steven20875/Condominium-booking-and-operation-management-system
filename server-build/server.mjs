// server.ts
import express from "express";
import fs2 from "node:fs";
import crypto from "node:crypto";
import path2 from "node:path";
import { fileURLToPath as fileURLToPath2 } from "node:url";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// server/db.ts
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EventEmitter } from "events";
var isVercel = Boolean("1");
var currentFile = fileURLToPath(import.meta.url);
var currentDir = path.dirname(currentFile);
var appRoot = isVercel ? path.join(process.cwd()) : path.join(currentDir, "..");
var PRIMARY_DB_FILE = path.join(appRoot, "data", "db.json");
var BACKUP_DB_CANDIDATES = [
  path.join(appRoot, "data", "db.before-full-dummy-data-cleanup-2026-09-08.json"),
  path.join(appRoot, "data", "db.pre-admin-name-change-2026-09-05.json"),
  path.join(appRoot, "data", "db.backup-2026-08-12.json"),
  path.join(process.cwd(), "data", "db.before-full-dummy-data-cleanup-2026-09-08.json"),
  path.join(process.cwd(), "data", "db.pre-admin-name-change-2026-09-05.json"),
  path.join(process.cwd(), "data", "db.backup-2026-08-12.json"),
  path.join(currentDir, "..", "data", "db.before-full-dummy-data-cleanup-2026-09-08.json"),
  path.join(currentDir, "..", "data", "db.pre-admin-name-change-2026-09-05.json"),
  path.join(currentDir, "..", "data", "db.backup-2026-08-12.json"),
  path.join(currentDir, "data", "db.before-full-dummy-data-cleanup-2026-09-08.json"),
  path.join(currentDir, "data", "db.pre-admin-name-change-2026-09-05.json"),
  path.join(currentDir, "data", "db.backup-2026-08-12.json")
];
function isValidJsonFile(filePath) {
  if (!fs.existsSync(filePath)) return false;
  try {
    JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return true;
  } catch {
    return false;
  }
}
var FALLBACK_DB_FILE = BACKUP_DB_CANDIDATES.find(isValidJsonFile) ?? PRIMARY_DB_FILE;
var DB_FILE = fs.existsSync(PRIMARY_DB_FILE) ? PRIMARY_DB_FILE : FALLBACK_DB_FILE;
var DB_SOURCE = DB_FILE === PRIMARY_DB_FILE ? "primary" : "backup";
var DB_DIR = path.dirname(DB_FILE);
function normalizeUnitStatus(status) {
  const value = typeof status === "string" ? status.trim() : "";
  if (value === "Maintenance") return "Maintenance";
  if (value === "Occupied" || value === "Booked") return "Occupied";
  return "Available";
}
function readDatabaseFile(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const normalizedContent = fileContent.replace(/^\uFEFF/, "");
    const parsed = JSON.parse(normalizedContent);
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
    console.warn("[DB] Unable to read database file:", filePath, error);
    return null;
  }
}
function normalizeGovernmentIdStatus(status) {
  const normalized = typeof status === "string" ? status.trim().toLowerCase() : "";
  if (normalized === "pending" || normalized === "verified" || normalized === "rejected") {
    return normalized;
  }
  return "not_submitted";
}
var dbEvents = new EventEmitter();
var MockDatabase = class {
  constructor() {
    this.notificationReadState = /* @__PURE__ */ new Map();
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
  normalizeUserRecord(user) {
    const status = normalizeGovernmentIdStatus(user.governmentIdStatus ?? (user.hasValidId ? "verified" : "not_submitted"));
    const hasValidId = user.hasValidId ?? status === "verified";
    return {
      id: user.id || "user-unknown",
      email: user.email || "",
      name: user.name || "Unknown User",
      role: user.role || "resident",
      phone: user.phone || "",
      unitNumber: user.unitNumber || "",
      avatarUrl: user.avatarUrl || "",
      authProvider: user.authProvider || "email",
      authUid: user.authUid || "",
      emailVerified: user.emailVerified ?? true,
      hasValidId,
      governmentIdStatus: status,
      governmentIdUrl: user.governmentIdUrl || "",
      governmentIdUploadedAt: user.governmentIdUploadedAt || void 0,
      governmentIdVerifiedAt: user.governmentIdVerifiedAt || void 0,
      governmentIdRejectionReason: user.governmentIdRejectionReason || void 0,
      validIdVerifiedAt: user.validIdVerifiedAt || (status === "verified" ? (/* @__PURE__ */ new Date()).toISOString() : void 0),
      createdAt: user.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
      password: user.password || void 0
    };
  }
  init() {
    const emptyData = {
      users: [],
      units: [],
      bookings: [],
      payments: [],
      maintenanceRequests: [],
      notifications: [],
      activityLogs: []
    };
    console.log("[DB] Environment:", {
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
        console.log("[DB] Counts:", {
          users: this.data.users.length,
          units: this.data.units.length,
          bookings: this.data.bookings.length
        });
        this.normalizeUnitStatuses();
        this.normalizeExistingPayments();
        this.backfillMissingBookingPayments();
      } else if (fs.existsSync(PRIMARY_DB_FILE)) {
        console.warn("[DB] Primary data/db.json exists but was unreadable. Refusing backup override so Vercel does not silently switch to stale credentials.");
        this.data = { ...emptyData };
      } else if (isVercel) {
        console.warn("[DB] Vercel runtime detected without a readable database file. Loading in-memory data only; no filesystem write is attempted.");
        this.data = { ...emptyData };
      } else {
        if (!fs.existsSync(DB_DIR)) {
          fs.mkdirSync(DB_DIR, { recursive: true });
        }
        this.data = { ...emptyData };
        this.save();
      }
    } catch (err) {
      console.error("Failed to initialize JSON database:", err);
      this.data = { ...emptyData };
    }
  }
  normalizeUnitStatuses() {
    let changed = false;
    this.data.units = this.data.units.map((unit) => {
      const normalizedStatus = normalizeUnitStatus(unit.status);
      const needsUpdate = normalizedStatus !== unit.status || Boolean(unit.availability) !== (normalizedStatus === "Available");
      if (needsUpdate) {
        changed = true;
        return {
          ...unit,
          status: normalizedStatus,
          availability: normalizedStatus === "Available" ? true : false
        };
      }
      return unit;
    });
    if (changed) {
      this.save();
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
        method: payment.bookingId ? "Cash" : payment.method || "Cash",
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
  save() {
    try {
      if (this.persistenceHook) {
        void this.persistenceHook(this.getSnapshot()).catch((error) => {
          console.error("[DB] Persistence hook failed:", error);
        });
      }
      if (isVercel) {
        dbEvents.emit("change", { stats: this.getDashboardStats(), timestamp: Date.now() });
        return;
      }
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
      try {
        dbEvents.emit("change", { stats: this.getDashboardStats(), timestamp: Date.now() });
      } catch (emitErr) {
        console.error("dbEvents emit error:", emitErr);
      }
    }
  }
  setPersistenceHook(hook) {
    this.persistenceHook = hook;
  }
  getSnapshot() {
    return JSON.parse(JSON.stringify(this.data));
  }
  replaceSnapshot(snapshot) {
    this.data = JSON.parse(JSON.stringify(snapshot));
    this.data.users = this.data.users.map((user) => this.normalizeUserRecord(user));
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
    return this.data.users.map((user) => this.normalizeUserRecord(user));
  }
  findUserById(id) {
    const user = this.data.users.find((u) => u.id === id);
    return user ? this.normalizeUserRecord(user) : void 0;
  }
  findUserByEmail(email) {
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!normalizedEmail) {
      return void 0;
    }
    const user = this.data.users.find((item) => {
      const currentEmail = typeof item?.email === "string" ? item.email.trim().toLowerCase() : "";
      return currentEmail === normalizedEmail;
    });
    return user ? this.normalizeUserRecord(user) : void 0;
  }
  migratePlaintextPasswords(hashPassword) {
    let migrated = 0;
    this.data.users = this.data.users.map((user) => {
      if (!user.password || user.password.startsWith("$2")) {
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
  createUser(user) {
    const newUser = this.normalizeUserRecord({
      ...user,
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
      hasValidId: user.hasValidId ?? false,
      validIdVerifiedAt: user.validIdVerifiedAt || (user.hasValidId ? (/* @__PURE__ */ new Date()).toISOString() : void 0),
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    this.data.users.push(newUser);
    this.save();
    this.addActivityLog(newUser.id, newUser.name, newUser.role, "User Registered", `Account created with email ${newUser.email}`);
    return newUser;
  }
  updateUser(id, updates) {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return void 0;
    const original = this.data.users[idx];
    const updated = this.normalizeUserRecord({ ...original, ...updates });
    if (original.password) {
      updated.password = original.password;
    }
    this.data.users[idx] = updated;
    this.save();
    this.addActivityLog(id, updated.name, updated.role, "Profile Updated", "User modified profile settings.");
    return updated;
  }
  getPendingGovernmentIdVerifications() {
    return this.data.users.filter((user) => user.role === "resident" && normalizeGovernmentIdStatus(user.governmentIdStatus) === "pending").map((user) => this.normalizeUserRecord(user));
  }
  getGovernmentIdStatusForUser(userId) {
    const user = this.findUserById(userId);
    return user ? normalizeGovernmentIdStatus(user.governmentIdStatus ?? (user.hasValidId ? "verified" : "not_submitted")) : "not_submitted";
  }
  submitGovernmentIdForVerification(userId, filePath, originalFileName, mimeType) {
    const idx = this.data.users.findIndex((user) => user.id === userId);
    if (idx === -1) return void 0;
    const original = this.data.users[idx];
    const updated = this.normalizeUserRecord({
      ...original,
      governmentIdStatus: "pending",
      governmentIdUrl: filePath,
      governmentIdUploadedAt: (/* @__PURE__ */ new Date()).toISOString(),
      governmentIdVerifiedAt: void 0,
      governmentIdRejectionReason: void 0,
      hasValidId: false,
      validIdVerifiedAt: void 0,
      phone: original.phone || "",
      unitNumber: original.unitNumber || ""
    });
    const sanitizedName = String(originalFileName || "government-id").replace(/\s+/g, " ").trim();
    updated.governmentIdUrl = filePath;
    updated.governmentIdUploadedAt = (/* @__PURE__ */ new Date()).toISOString();
    updated.governmentIdRejectionReason = void 0;
    updated.governmentIdVerifiedAt = void 0;
    updated.hasValidId = false;
    updated.validIdVerifiedAt = void 0;
    this.data.users[idx] = updated;
    this.save();
    this.addActivityLog(userId, updated.name, updated.role, "Government ID Submitted", `Submitted a valid government ID for verification (${sanitizedName})`);
    return updated;
  }
  approveGovernmentId(userId) {
    const idx = this.data.users.findIndex((user) => user.id === userId);
    if (idx === -1) return void 0;
    const original = this.data.users[idx];
    const updated = this.normalizeUserRecord({
      ...original,
      governmentIdStatus: "verified",
      governmentIdVerifiedAt: (/* @__PURE__ */ new Date()).toISOString(),
      governmentIdRejectionReason: void 0,
      hasValidId: true,
      validIdVerifiedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    this.data.users[idx] = updated;
    this.save();
    this.addActivityLog(userId, updated.name, updated.role, "Government ID Approved", "Government ID verified and approved by an administrator.");
    return updated;
  }
  rejectGovernmentId(userId, reason) {
    const idx = this.data.users.findIndex((user) => user.id === userId);
    if (idx === -1) return void 0;
    const original = this.data.users[idx];
    const updated = this.normalizeUserRecord({
      ...original,
      governmentIdStatus: "rejected",
      governmentIdRejectionReason: reason || "Please upload a clearer and valid government-issued ID.",
      governmentIdVerifiedAt: void 0,
      hasValidId: false,
      validIdVerifiedAt: void 0
    });
    this.data.users[idx] = updated;
    this.save();
    this.addActivityLog(userId, updated.name, updated.role, "Government ID Rejected", reason || "Government ID was rejected.");
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
    const explicitStatus = normalizeUnitStatus(unit.status);
    const newUnit = {
      id: "unit-" + Math.random().toString(36).substr(2, 9),
      name: unit.name || "Gales Urban Haven Unit 1",
      type: unit.type || "Studio",
      description: unit.description || "",
      price: Number(unit.price) || 120,
      availability: explicitStatus === "Available",
      capacity: Number(unit.capacity) || 2,
      status: explicitStatus,
      images: unit.images && unit.images.length > 0 ? unit.images : ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80"],
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.units.push(newUnit);
    this.save();
    this.addActivityLog(operatorId, operatorName, "admin", "Unit Added", `Created unit ${newUnit.name}`);
    return newUnit;
  }
  updateUnit(id, updates, operatorId, operatorName) {
    const idx = this.data.units.findIndex((u) => u.id === id);
    if (idx === -1) return void 0;
    const original = this.data.units[idx];
    const requestedStatus = normalizeUnitStatus(updates.status ?? original.status);
    const nextStatus = requestedStatus;
    const nextAvailability = nextStatus === "Available";
    const updated = {
      ...original,
      ...updates,
      status: nextStatus,
      availability: nextAvailability,
      price: updates.price !== void 0 ? Number(updates.price) : original.price,
      capacity: updates.capacity !== void 0 ? Number(updates.capacity) : original.capacity
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
  hasOverlappingActiveBooking(unitId, startDate, endDate, excludeBookingId) {
    const requestedStart = new Date(startDate).getTime();
    const requestedEnd = new Date(endDate).getTime();
    if (!Number.isFinite(requestedStart) || !Number.isFinite(requestedEnd)) return false;
    return this.data.bookings.some((booking) => {
      if (booking.unitId !== unitId || booking.id === excludeBookingId) return false;
      if (!["Pending", "Approved", "Partially Paid"].includes(booking.status)) return false;
      const existingStart = new Date(booking.startDate).getTime();
      const existingEnd = new Date(booking.endDate).getTime();
      return Number.isFinite(existingStart) && Number.isFinite(existingEnd) && requestedStart < existingEnd && requestedEnd > existingStart;
    });
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
    this.ensureBookingPayment(newBooking);
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
    this.ensureBookingPayment(booking);
    if (status === "Approved") {
      const unit = this.findUnitById(booking.unitId);
      if (unit) {
        unit.status = "Occupied";
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
      if (unit && unit.status === "Occupied") {
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
  getPaymentByBookingId(bookingId) {
    return this.data.payments.find((p) => p.bookingId === bookingId);
  }
  ensureBookingPayment(booking) {
    const existing = this.getPaymentByBookingId(booking.id);
    const totalAmount = Number(booking.totalPrice || 0);
    if (existing) {
      const paidAmount = Math.max(0, Number(existing.paidAmount || 0));
      const normalizedTotal = Math.max(0, Number(existing.totalAmount || totalAmount || existing.amount || 0));
      const nextRemaining = Math.max(0, normalizedTotal - paidAmount);
      const nextStatus = nextRemaining <= 0 ? "Paid" : paidAmount > 0 ? "Partially Paid" : "Pending";
      const normalizedPayment = {
        ...existing,
        bookingId: booking.id,
        residentId: existing.residentId || booking.residentId,
        residentName: existing.residentName || booking.residentName || "Unknown Resident",
        unitName: existing.unitName || booking.unitName || "Unit",
        amount: normalizedTotal,
        totalAmount: normalizedTotal,
        paidAmount,
        remainingBalance: nextRemaining,
        status: nextStatus,
        method: "Cash",
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
    const newPayment = {
      id: "pay-" + Math.random().toString(36).substr(2, 9),
      bookingId: booking.id,
      residentId: booking.residentId,
      residentName: booking.residentName || "Unknown Resident",
      unitName: booking.unitName || "Unit",
      amount: totalAmount,
      totalAmount,
      paidAmount: 0,
      remainingBalance: totalAmount,
      downpaymentAmount: 0,
      status: "Pending",
      method: "Cash",
      referenceNumber: `CASH-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.payments.unshift(newPayment);
    this.save();
    this.addActivityLog(booking.residentId, booking.residentName || "Resident", "resident", "Ledger Created", `Created automatic cash ledger for booking ${booking.id}`);
    return newPayment;
  }
  backfillMissingBookingPayments() {
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
  generateCashReference(paymentId) {
    return `CASH-${paymentId.replace(/^pay-/, "").slice(0, 8).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  }
  submitPayment(paymentId, method, reference, amountPaid, residentId, residentName) {
    const idx = this.data.payments.findIndex((p) => p.id === paymentId || p.bookingId === paymentId);
    if (idx === -1) return void 0;
    const payment = this.data.payments[idx];
    const totalAmount = Number(payment.totalAmount || payment.amount || 0);
    const remainingBefore = Number(payment.remainingBalance ?? Math.max(0, totalAmount - Number(payment.paidAmount || 0)));
    if (amountPaid <= 0) {
      return void 0;
    }
    if (amountPaid > remainingBefore) {
      return void 0;
    }
    if (payment.status === "Paid") {
      return void 0;
    }
    payment.method = "Cash";
    payment.referenceNumber = reference || this.generateCashReference(payment.id);
    payment.paidAt = (/* @__PURE__ */ new Date()).toISOString();
    payment.paidAmount = Number(payment.paidAmount || 0) + amountPaid;
    payment.totalAmount = totalAmount;
    payment.remainingBalance = Math.max(0, totalAmount - payment.paidAmount);
    if (!payment.downpaymentAmount || payment.downpaymentAmount <= 0) {
      payment.downpaymentAmount = amountPaid;
    }
    payment.status = payment.remainingBalance <= 0 ? "Paid" : payment.paidAmount > 0 ? "Partially Paid" : "Pending";
    payment.amount = payment.totalAmount;
    const booking = this.findBookingById(payment.bookingId);
    if (booking) {
      if (payment.status === "Paid") {
        if (booking.status === "Pending" || booking.status === "Partially Paid") {
          booking.status = "Approved";
        }
        const unit = this.findUnitById(booking.unitId);
        if (unit) {
          unit.status = "Occupied";
          unit.availability = false;
        }
      } else if (payment.status === "Partially Paid") {
        if (booking.status === "Pending") {
          booking.status = "Partially Paid";
        }
      }
    }
    this.createNotification({
      title: "Cash Payment Received",
      message: `${residentName} paid \u20B1${amountPaid.toFixed(2)} in cash for ${payment.unitName || "unit"} (Ref: ${payment.referenceNumber}).`,
      recipientId: "all",
      recipientRole: "admin",
      type: "success"
    });
    this.save();
    this.addActivityLog(residentId, residentName, "resident", "Cash Payment Submitted", `Paid \u20B1${amountPaid.toFixed(2)} cash. Ref: ${payment.referenceNumber}`);
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
      method: payment.method || "Cash",
      referenceNumber: "TXN-GEN-" + Math.random().toString(36).substr(2, 6).toUpperCase(),
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (payment.status === "Paid") {
      newPayment.paidAt = (/* @__PURE__ */ new Date()).toISOString();
    }
    this.data.payments.unshift(newPayment);
    this.save();
    this.addActivityLog(operatorId, operatorName, "admin", "Invoice Generated", `Created manual invoice of \u20B1${newPayment.amount.toFixed(2)} for resident`);
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
  canReceiveNotification(notification, userId, role) {
    if (notification.recipientId === userId) return true;
    if (notification.recipientId !== "all") return false;
    return !notification.recipientRole || notification.recipientRole === "all" || notification.recipientRole === role;
  }
  isNotificationReadForUser(notificationId, userId) {
    return this.notificationReadState.get(notificationId)?.has(userId) ?? false;
  }
  getNotifications(userId, role) {
    return this.data.notifications.filter((notification) => this.canReceiveNotification(notification, userId, role)).map((notification) => ({
      ...notification,
      isRead: this.isNotificationReadForUser(notification.id, userId)
    }));
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
  markNotificationAsRead(notifId, userId, role) {
    const notification = this.data.notifications.find((item) => item.id === notifId);
    if (!notification || !this.canReceiveNotification(notification, userId, role)) {
      return false;
    }
    const readers = this.notificationReadState.get(notifId) || /* @__PURE__ */ new Set();
    readers.add(userId);
    this.notificationReadState.set(notifId, readers);
    return true;
  }
  markAllNotificationsAsRead(userId, role) {
    this.data.notifications.forEach((notification) => {
      if (!this.canReceiveNotification(notification, userId, role)) return;
      const readers = this.notificationReadState.get(notification.id) || /* @__PURE__ */ new Set();
      readers.add(userId);
      this.notificationReadState.set(notification.id, readers);
    });
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
    const occupiedCount = units.filter((u) => u.status === "Occupied" || !u.availability).length;
    const occupancyRate = units.length > 0 ? Math.round(occupiedCount / units.length * 100) : 0;
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
  getDiagnostics() {
    const adminUser = this.data.users.find((u) => u.role === "admin");
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
      adminExists: Boolean(this.data.users.find((u) => u.email === "admin@condo.com"))
    };
  }
};
var db = new MockDatabase();

// server/db/postgres.ts
import { neon } from "@neondatabase/serverless";
var SNAPSHOT_ID = "application";
var PostgresStateAdapter = class {
  constructor(databaseUrl2) {
    this.databaseUrl = databaseUrl2;
    this.pendingWrite = Promise.resolve();
    this.ready = this.initialize();
  }
  async initialize() {
    const sql = neon(this.databaseUrl);
    const rows = await sql`SELECT state FROM application_state WHERE id = ${SNAPSHOT_ID}`;
    if (rows.length === 0) {
      throw new Error("PostgreSQL application_state is empty. Run db:migrate before enabling USE_POSTGRES.");
    }
    db.replaceSnapshot(rows[0].state);
    db.setPersistenceHook((snapshot) => this.persist(snapshot));
  }
  persist(snapshot) {
    this.pendingWrite = this.pendingWrite.then(async () => {
      const sql = neon(this.databaseUrl);
      await sql`
        INSERT INTO application_state (id, state, updated_at)
        VALUES (${SNAPSHOT_ID}, ${JSON.stringify(snapshot)}::jsonb, NOW())
        ON CONFLICT (id) DO UPDATE SET state = EXCLUDED.state, updated_at = NOW()
      `;
    });
    return this.pendingWrite;
  }
  flush() {
    return this.pendingWrite;
  }
};

// server/db/index.ts
var usePostgres = String(process.env.USE_POSTGRES || "").toLowerCase() === "true";
var databaseUrl = process.env.DATABASE_URL || "";
if (usePostgres && !databaseUrl) {
  throw new Error("USE_POSTGRES=true requires DATABASE_URL.");
}
var postgresAdapter = usePostgres ? new PostgresStateAdapter(databaseUrl) : void 0;
var dbReady = postgresAdapter?.ready ?? Promise.resolve();
var db2 = db;

// server/services/BookingService.ts
var BookingService = class {
  constructor(database = db2) {
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
  constructor(database = db2) {
    this.database = database;
  }
  getPayments() {
    return this.database.getPayments();
  }
  getUserPayments(userId) {
    return this.database.getUserPayments(userId);
  }
  getPaymentByBookingId(bookingId) {
    return this.database.getPaymentByBookingId(bookingId);
  }
  ensureBookingPayment(booking) {
    return this.database.ensureBookingPayment(booking);
  }
  generateCashReference(paymentId) {
    return this.database.generateCashReference(paymentId);
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
  constructor(database = db2) {
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
  markAsRead(id, userId, role) {
    return this.database.markNotificationAsRead(id, userId, role);
  }
  markAllAsRead(userId, role) {
    return this.database.markAllNotificationsAsRead(userId, role);
  }
};
var notificationService = new NotificationService();

// server.ts
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
var __filename = fileURLToPath2(import.meta.url);
var __dirname = path2.dirname(__filename);
var projectRoot = __dirname;
dotenv.config({ path: path2.resolve(projectRoot, ".env") });
var PORT = Number(process.env.PORT) || 3e3;
var VITE_HMR_PORT = Number(process.env.VITE_HMR_PORT) || 24678;
var isVercel2 = Boolean("1");
var configuredJwtSecret = process.env.JWT_SECRET;
if (isVercel2 && !configuredJwtSecret) {
  throw new Error("JWT_SECRET must be configured in the production environment.");
}
var JWT_SECRET = configuredJwtSecret || crypto.randomBytes(32).toString("hex");
if (!configuredJwtSecret) {
  console.warn("[AUTH] JWT_SECRET is not configured. Local tokens will be invalidated when the server restarts.");
}
var JWT_EXPIRES_IN = "8h";
var GOVERNMENT_ID_STORAGE_DIR = path2.join(projectRoot, "data", "private", "government-ids");
var MAX_GOVERNMENT_ID_SIZE_BYTES = 5 * 1024 * 1024;
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
  const token = authHeader.slice("Bearer ".length).trim();
  if (!isNonEmptyString(token)) {
    return res.status(401).json({ error: "Authentication token malformed." });
  }
  try {
    const claims = jwt.verify(token, JWT_SECRET, {
      issuer: "one-spatial-iloilo",
      audience: "one-spatial-portal"
    });
    const userId = typeof claims.sub === "string" ? claims.sub : "";
    const user = db2.findUserById(userId);
    if (!user) {
      return res.status(401).json({ error: "User session invalid or expired." });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired authentication token." });
  }
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
function normalizeGovernmentIdStatus2(status) {
  const normalized = typeof status === "string" ? status.trim().toLowerCase() : "";
  if (normalized === "pending" || normalized === "verified" || normalized === "rejected") {
    return normalized;
  }
  return "not_submitted";
}
function getGovernmentIdStatusForUser(user) {
  return normalizeGovernmentIdStatus2(user?.governmentIdStatus ?? (user?.hasValidId ? "verified" : "not_submitted"));
}
function sanitizeUserForApi(user) {
  const { password: _password, governmentIdUrl: _governmentIdUrl, ...safeUser } = user;
  return safeUser;
}
function ensureGovernmentIdStorageDir() {
  const targetDir = GOVERNMENT_ID_STORAGE_DIR;
  if (!fs2.existsSync(targetDir)) {
    fs2.mkdirSync(targetDir, { recursive: true });
  }
  if (isVercel2) {
    console.warn("[FILES] Vercel/serverless environment detected. Private government IDs are stored only in the local filesystem for the current runtime and will not persist across deployments.");
  }
  return targetDir;
}
function getSafeGovernmentIdFilename(name, residentId) {
  const sanitizedBase = String(name || "government-id").replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "government-id";
  return `${residentId}-${Date.now()}-${sanitizedBase}`;
}
function determineGovernmentIdMimeType(mimeType) {
  const normalized = typeof mimeType === "string" ? mimeType.toLowerCase() : "";
  if (["image/jpeg", "image/jpg", "image/png", "application/pdf"].includes(normalized)) {
    return normalized;
  }
  if (normalized === "image/pjpeg") {
    return "image/jpeg";
  }
  return "";
}
function calculateBookingTotal(unitPrice, startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }
  const diffMs = Math.max(end.getTime() - start.getTime(), 0);
  const days = Math.max(1, Math.ceil(diffMs / (1e3 * 60 * 60 * 24)) || 1);
  const base = days * Number(unitPrice || 0);
  const months = /* @__PURE__ */ new Set([start.getMonth(), end.getMonth()]);
  const isHolidayWindow = [...months].some((month) => month === 11 || month === 0);
  const hasSeasonalAddOn = [...months].some((month) => month === 11 || month === 0);
  const holidayDiscountFactor = isHolidayWindow ? 0.9 : 1;
  const seasonalSurcharge = hasSeasonalAddOn ? 250 : 0;
  const total = base * holidayDiscountFactor + seasonalSurcharge;
  return Number(total.toFixed(2));
}
function validateFields(body, requiredFields) {
  return requiredFields.filter((key) => {
    const value = body?.[key];
    return value === void 0 || value === null || typeof value === "string" && value.trim() === "";
  });
}
function createAuthToken(user) {
  return jwt.sign({}, JWT_SECRET, {
    subject: user.id,
    expiresIn: JWT_EXPIRES_IN,
    issuer: "one-spatial-iloilo",
    audience: "one-spatial-portal"
  });
}
async function verifyFirebaseIdentityToken(idToken) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not configured.");
  }
  if (getApps().length === 0) {
    const serviceAccount = JSON.parse(serviceAccountJson);
    initializeApp({ credential: cert(serviceAccount) });
  }
  return getAuth().verifyIdToken(idToken);
}
var loginRateLimit = rateLimit({ windowMs: 15 * 60 * 1e3, limit: 30, standardHeaders: "draft-7", legacyHeaders: false, message: { error: "Too many sign-in attempts. Please try again later." } });
var registrationRateLimit = rateLimit({ windowMs: 60 * 60 * 1e3, limit: 20, standardHeaders: "draft-7", legacyHeaders: false, message: { error: "Too many registration attempts. Please try again later." } });
var sensitiveMutationRateLimit = rateLimit({ windowMs: 15 * 60 * 1e3, limit: 60, standardHeaders: "draft-7", legacyHeaders: false, message: { error: "Too many requests. Please try again later." } });
var migratedPasswords = db2.migratePlaintextPasswords((password) => bcrypt.hashSync(password, 12));
if (migratedPasswords > 0) {
  console.log(`[AUTH] Migrated ${migratedPasswords} plaintext password(s) to bcrypt hashes.`);
}
async function createApp() {
  await dbReady;
  const app = express();
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.post("/api/auth/register", registrationRateLimit, (req, res) => {
    const { email, password, name, phone, unitNumber } = req.body;
    const missing = validateFields(req.body, ["email", "password", "name"]);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(", ")}.` });
    }
    if (!isNonEmptyString(email) || !isNonEmptyString(password) || !isNonEmptyString(name)) {
      return res.status(400).json({ error: "Email, password, and name must be valid non-empty strings." });
    }
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      return res.status(400).json({ error: "Password must be at least 8 characters and include uppercase, lowercase, number, and special character." });
    }
    if (phone !== void 0 && phone !== "" && !/^(09\d{9}|\+639\d{9})$/.test(String(phone).replace(/[\s()-]/g, ""))) {
      return res.status(400).json({ error: "Please enter a valid Philippine phone number." });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const existing = db2.findUserByEmail(normalizedEmail);
    if (existing) {
      return res.status(400).json({ error: "An account with this email address already exists." });
    }
    const newUser = db2.createUser({
      email: normalizedEmail,
      password: bcrypt.hashSync(password, 12),
      name: name.trim(),
      phone: isNonEmptyString(phone) ? phone.trim() : void 0,
      unitNumber: isNonEmptyString(unitNumber) ? unitNumber.trim() : void 0,
      role: "resident"
    });
    const userSafe = sanitizeUserForApi(newUser);
    res.status(201).json({ user: userSafe, token: createAuthToken(newUser) });
  });
  app.post("/api/auth/login", loginRateLimit, (req, res) => {
    const rawEmail = req.body?.email;
    const rawPassword = req.body?.password;
    try {
      const missing = validateFields(req.body, ["email", "password"]);
      if (missing.length > 0) {
        return res.status(400).json({ error: `Missing required fields: ${missing.join(", ")}.` });
      }
      if (!isNonEmptyString(rawEmail) || !isNonEmptyString(rawPassword)) {
        return res.status(400).json({ error: "Email and password must be valid non-empty strings." });
      }
      const email = String(rawEmail).trim().toLowerCase();
      const password = String(rawPassword);
      const user = db2.findUserByEmail(email);
      if (!user || typeof user.password !== "string" || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: "Invalid email or password combination." });
      }
      const userSafe = sanitizeUserForApi(user);
      return res.status(200).json({ user: userSafe, token: createAuthToken(user) });
    } catch (error) {
      console.error("[AUTH] Login exception:", {
        email: typeof rawEmail === "string" ? rawEmail : String(rawEmail ?? ""),
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : void 0
      });
      return res.status(500).json({ error: "Internal server error. Please try again later." });
    }
  });
  app.get("/api/config/firebase", (_req, res) => {
    res.json({ firebase: firebaseConfigFromEnv });
  });
  app.post("/api/auth/firebase", loginRateLimit, async (req, res) => {
    const { name, phone, avatarUrl, provider, idToken } = req.body;
    const missing = validateFields(req.body, ["idToken"]);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(", ")}.` });
    }
    if (!isNonEmptyString(idToken)) {
      return res.status(401).json({ error: "Verified Firebase identity token is required." });
    }
    let verifiedClaims;
    try {
      verifiedClaims = await verifyFirebaseIdentityToken(idToken);
    } catch (error) {
      console.error("[AUTH] Firebase token verification failed:", error instanceof Error ? error.message : String(error));
      return res.status(503).json({ error: "Google sign-in is not configured for this deployment." });
    }
    const uid = verifiedClaims.uid;
    const email = verifiedClaims.email;
    if (!isNonEmptyString(uid) || !isNonEmptyString(email)) {
      return res.status(401).json({ error: "Verified Firebase identity is incomplete." });
    }
    if (verifiedClaims.email_verified !== true) {
      return res.status(403).json({ error: "Please verify your email address before continuing." });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const allUsers = db2.getUsers();
    const existingUserByUid = allUsers.find((user) => user.authUid === uid);
    const existingUserByEmail = allUsers.find((user) => user.email.toLowerCase() === normalizedEmail);
    const existingUser = existingUserByUid || existingUserByEmail;
    if (existingUser) {
      const isGoogleLogin = provider === "google";
      const nextAuthProvider = existingUser.authProvider || (isGoogleLogin ? "google" : "email");
      const updatedUser = db2.updateUser(existingUser.id, {
        name: isNonEmptyString(name) ? String(name).trim() : existingUser.name,
        phone: isNonEmptyString(phone) ? String(phone).trim() : existingUser.phone,
        avatarUrl: isNonEmptyString(avatarUrl) ? String(avatarUrl).trim() : existingUser.avatarUrl,
        authProvider: nextAuthProvider,
        authUid: uid,
        email: normalizedEmail,
        emailVerified: verifiedClaims.email_verified === true
      });
      if (!updatedUser) {
        return res.status(500).json({ error: "Unable to synchronize the existing account." });
      }
      const userSafe2 = sanitizeUserForApi(updatedUser);
      return res.status(200).json({ user: userSafe2, token: createAuthToken(updatedUser) });
    }
    const newUser = db2.createUser({
      email: normalizedEmail,
      password: bcrypt.hashSync(crypto.randomBytes(24).toString("hex"), 12),
      name: isNonEmptyString(name) ? String(name).trim() : normalizedEmail.split("@")[0],
      phone: isNonEmptyString(phone) ? String(phone).trim() : void 0,
      avatarUrl: isNonEmptyString(avatarUrl) ? String(avatarUrl).trim() : void 0,
      role: "resident",
      authProvider: provider === "google" ? "google" : "firebase",
      authUid: uid,
      emailVerified: verifiedClaims.email_verified === true
    });
    const userSafe = sanitizeUserForApi(newUser);
    return res.status(201).json({ user: userSafe, token: createAuthToken(newUser) });
  });
  app.get("/api/auth/me", requireAuth, (req, res) => {
    const user = req.user;
    const userSafe = sanitizeUserForApi(user);
    res.json({ user: userSafe });
  });
  app.put("/api/auth/profile", requireAuth, (req, res) => {
    const user = req.user;
    const { name, phone, unitNumber, avatarUrl } = req.body;
    const updated = db2.updateUser(user.id, {
      name: name || user.name,
      phone: phone !== void 0 ? phone : user.phone,
      unitNumber: unitNumber !== void 0 ? unitNumber : user.unitNumber,
      avatarUrl: avatarUrl !== void 0 ? avatarUrl : user.avatarUrl
    });
    if (!updated) {
      return res.status(500).json({ error: "Failed to update user profile." });
    }
    const userSafe = sanitizeUserForApi(updated);
    res.json({ user: userSafe });
  });
  app.get("/api/profile/verification", requireAuth, (req, res) => {
    const user = db2.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    const status = getGovernmentIdStatusForUser(user);
    const canBook = status === "verified";
    const response = {
      governmentIdStatus: status,
      hasValidId: Boolean(user.hasValidId),
      governmentIdUploadedAt: user.governmentIdUploadedAt || null,
      governmentIdVerifiedAt: user.governmentIdVerifiedAt || null,
      governmentIdRejectionReason: user.governmentIdRejectionReason || null,
      canBook,
      message: status === "not_submitted" ? "Government ID verification is required before you can make a booking." : status === "pending" ? "Your ID has been submitted and is waiting for admin verification." : status === "verified" ? "Your identity has been verified. You may now submit bookings." : "Your submitted ID could not be verified. Please upload a valid government-issued ID and submit it again."
    };
    res.json(response);
  });
  app.post("/api/profile/government-id", sensitiveMutationRateLimit, requireAuth, (req, res) => {
    const user = db2.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    const { fileName, fileData, mimeType, agreesToVerification } = req.body || {};
    const agrees = Boolean(agreesToVerification);
    if (!agrees) {
      db2.updateUser(user.id, {
        governmentIdStatus: "not_submitted",
        governmentIdUploadedAt: void 0,
        governmentIdVerifiedAt: void 0,
        governmentIdRejectionReason: void 0,
        hasValidId: false,
        validIdVerifiedAt: void 0
      });
      return res.status(200).json({
        governmentIdStatus: "not_submitted",
        message: "Government ID verification is required before you can make a booking.",
        canBook: false
      });
    }
    if (!isNonEmptyString(fileName) || !isNonEmptyString(fileData) || !isNonEmptyString(mimeType)) {
      return res.status(400).json({ error: "Please select a valid government-issued ID." });
    }
    const normalizedMime = determineGovernmentIdMimeType(mimeType);
    if (!normalizedMime) {
      return res.status(400).json({ error: "File type not supported. Please upload JPG, JPEG, PNG, or PDF." });
    }
    const match = String(fileData).match(/^data:(.*?);base64,(.*)$/);
    if (!match) {
      return res.status(400).json({ error: "Please select a valid government-issued ID." });
    }
    const rawBuffer = Buffer.from(match[2], "base64");
    if (rawBuffer.length === 0) {
      return res.status(400).json({ error: "Please select a valid government-issued ID." });
    }
    if (rawBuffer.length > MAX_GOVERNMENT_ID_SIZE_BYTES) {
      return res.status(400).json({ error: "File size must not exceed 5 MB." });
    }
    try {
      const storageDir = ensureGovernmentIdStorageDir();
      const safeFilename = getSafeGovernmentIdFilename(fileName, user.id);
      const extension = normalizedMime === "application/pdf" ? ".pdf" : normalizedMime === "image/png" ? ".png" : ".jpg";
      const finalPath = path2.join(storageDir, `${safeFilename}${extension}`);
      fs2.writeFileSync(finalPath, rawBuffer);
      const updatedUser = db2.submitGovernmentIdForVerification(user.id, finalPath, fileName, normalizedMime);
      if (!updatedUser) {
        return res.status(500).json({ error: "Unable to save your government ID for review." });
      }
      return res.status(201).json({
        governmentIdStatus: "pending",
        governmentIdUploadedAt: updatedUser.governmentIdUploadedAt,
        hasValidId: false,
        message: "Your ID has been submitted and is waiting for admin verification.",
        canBook: false
      });
    } catch (error) {
      console.error("[GOVERNMENT_ID] Failed to save resident government ID:", error);
      return res.status(500).json({ error: "Unable to save the uploaded ID. Please try again." });
    }
  });
  app.get("/api/profile/government-id", requireAuth, (req, res) => {
    const user = db2.findUserById(req.user.id);
    if (!user || !user.governmentIdUrl) {
      return res.status(404).json({ error: "No government ID record found for this user." });
    }
    const filePath = String(user.governmentIdUrl);
    if (!fs2.existsSync(filePath)) {
      return res.status(404).json({ error: "Stored government ID file not found." });
    }
    const extension = path2.extname(filePath).toLowerCase();
    const mimeType = extension === ".pdf" ? "application/pdf" : extension === ".png" ? "image/png" : "image/jpeg";
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${path2.basename(filePath)}"`);
    return res.sendFile(filePath);
  });
  app.get("/api/admin/government-id-verifications", requireAdmin, (req, res) => {
    const pending = db2.getPendingGovernmentIdVerifications().map((resident) => ({
      id: resident.id,
      name: resident.name,
      email: resident.email,
      unitNumber: resident.unitNumber || "",
      governmentIdStatus: resident.governmentIdStatus || "not_submitted",
      governmentIdUploadedAt: resident.governmentIdUploadedAt || null,
      governmentIdRejectionReason: resident.governmentIdRejectionReason || null,
      hasValidId: Boolean(resident.hasValidId)
    }));
    res.json(pending);
  });
  app.get("/api/admin/government-id-verifications/:userId", requireAdmin, (req, res) => {
    const targetUser = db2.findUserById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ error: "Resident not found." });
    }
    const residentData = {
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      unitNumber: targetUser.unitNumber || "",
      governmentIdStatus: getGovernmentIdStatusForUser(targetUser),
      governmentIdUrl: targetUser.governmentIdUrl || null,
      governmentIdUploadedAt: targetUser.governmentIdUploadedAt || null,
      governmentIdVerifiedAt: targetUser.governmentIdVerifiedAt || null,
      governmentIdRejectionReason: targetUser.governmentIdRejectionReason || null,
      hasValidId: Boolean(targetUser.hasValidId)
    };
    res.json(residentData);
  });
  app.get("/api/admin/government-id-verifications/:userId/file", requireAdmin, (req, res) => {
    const targetUser = db2.findUserById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ error: "Resident not found." });
    }
    if (!targetUser.governmentIdUrl || !fs2.existsSync(String(targetUser.governmentIdUrl))) {
      return res.status(404).json({ error: "No submitted government ID was found for this resident." });
    }
    const filePath = String(targetUser.governmentIdUrl);
    const extension = path2.extname(filePath).toLowerCase();
    const mimeType = extension === ".pdf" ? "application/pdf" : extension === ".png" ? "image/png" : "image/jpeg";
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${path2.basename(filePath)}"`);
    return res.sendFile(filePath);
  });
  app.post("/api/admin/government-id-verifications/:userId/approve", requireAdmin, (req, res) => {
    const targetUser = db2.findUserById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ error: "Resident not found." });
    }
    const updatedUser = db2.approveGovernmentId(targetUser.id);
    if (!updatedUser) {
      return res.status(500).json({ error: "Unable to approve the resident government ID." });
    }
    res.json({
      governmentIdStatus: "verified",
      governmentIdVerifiedAt: updatedUser.governmentIdVerifiedAt,
      hasValidId: true,
      message: "Government ID has been verified."
    });
  });
  app.post("/api/admin/government-id-verifications/:userId/reject", requireAdmin, (req, res) => {
    const { reason } = req.body || {};
    const targetUser = db2.findUserById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ error: "Resident not found." });
    }
    const updatedUser = db2.rejectGovernmentId(targetUser.id, isNonEmptyString(reason) ? String(reason).trim() : "Please upload a clearer and valid government-issued ID.");
    if (!updatedUser) {
      return res.status(500).json({ error: "Unable to reject the resident government ID." });
    }
    res.json({
      governmentIdStatus: "rejected",
      governmentIdRejectionReason: updatedUser.governmentIdRejectionReason || null,
      hasValidId: false,
      message: "Government ID rejected. Please ask the resident to upload another valid ID."
    });
  });
  app.get("/api/residents", requireAdmin, (req, res) => {
    const residents = db2.getUsers().filter((u) => u.role === "resident");
    const safeResidents = residents.map((resident) => sanitizeUserForApi(resident));
    res.json(safeResidents);
  });
  app.get("/api/units", (req, res) => {
    const { type, minPrice, maxPrice, status, search } = req.query;
    let list = db2.getUnits();
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
    const unit = db2.findUnitById(req.params.id);
    if (!unit) {
      return res.status(404).json({ error: "Condominium unit not found." });
    }
    res.json(unit);
  });
  app.post("/api/units", requireAdmin, (req, res) => {
    const user = req.user;
    const { name, type, description, price, capacity, status, images } = req.body;
    if (!name || !type || !price) {
      return res.status(400).json({ error: "Please specify required properties: name, type, and price." });
    }
    const unit = db2.createUnit({
      name,
      type,
      description,
      price: Number(price),
      capacity: Number(capacity) || 2,
      status: status || "Available",
      images: Array.isArray(images) ? images : []
    }, user.id, user.name);
    res.status(201).json(unit);
  });
  app.put("/api/units/:id", requireAdmin, (req, res) => {
    const user = req.user;
    const updated = db2.updateUnit(req.params.id, req.body, user.id, user.name);
    if (!updated) {
      return res.status(404).json({ error: "Unit not found to update." });
    }
    res.json(updated);
  });
  app.delete("/api/units/:id", requireAdmin, (req, res) => {
    const user = req.user;
    const success = db2.deleteUnit(req.params.id, user.id, user.name);
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
    const user = db2.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    if (user.role !== "resident") {
      return res.status(403).json({ error: "Only resident accounts can create bookings." });
    }
    const { unitId, startDate, endDate, totalPrice, guestsCount, notes } = req.body;
    const missing = validateFields(req.body, ["unitId", "startDate", "endDate", "totalPrice"]);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing mandatory fields: ${missing.join(", ")}.` });
    }
    if (!isNonEmptyString(unitId) || !isNonEmptyString(startDate) || !isNonEmptyString(endDate)) {
      return res.status(400).json({ error: "unitId, startDate, and endDate must be valid strings." });
    }
    const parsedStart = new Date(startDate.trim());
    const parsedEnd = new Date(endDate.trim());
    if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime()) || parsedEnd <= parsedStart) {
      return res.status(400).json({ error: "Booking dates must be valid, and endDate must be after startDate." });
    }
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    if (parsedStart < today) {
      return res.status(400).json({ error: "Bookings cannot start in the past." });
    }
    const durationDays = Math.ceil((parsedEnd.getTime() - parsedStart.getTime()) / (1e3 * 60 * 60 * 24));
    if (durationDays > 365) {
      return res.status(400).json({ error: "Booking duration cannot exceed 365 days." });
    }
    const governmentIdStatus = getGovernmentIdStatusForUser(user);
    if (governmentIdStatus !== "verified") {
      return res.status(403).json({ error: "Government ID verification is required before you can make a booking." });
    }
    const unit = db2.findUnitById(unitId);
    if (!unit) {
      return res.status(404).json({ error: "The requested unit does not exist." });
    }
    const serverCalculatedTotal = calculateBookingTotal(unit.price, startDate.trim(), endDate.trim());
    const priceValue = parseNumber(totalPrice, -1);
    if (priceValue <= 0) {
      return res.status(400).json({ error: "totalPrice must be a valid number." });
    }
    if (Math.abs(priceValue - serverCalculatedTotal) > 0.01) {
      return res.status(400).json({
        error: "Booking total does not match the server-calculated price.",
        expectedTotal: serverCalculatedTotal,
        receivedTotal: priceValue
      });
    }
    if (unit.status !== "Available") {
      return res.status(400).json({ error: "This unit is currently unavailable for booking." });
    }
    const guestCount = Number(guestsCount);
    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > unit.capacity) {
      return res.status(400).json({ error: `guestsCount must be a whole number between 1 and ${unit.capacity}.` });
    }
    if (db2.hasOverlappingActiveBooking(unit.id, startDate.trim(), endDate.trim())) {
      return res.status(409).json({ error: "This unit already has an active booking during the selected dates." });
    }
    const booking = bookingService.createBooking({
      unitId,
      residentId: user.id,
      startDate: startDate.trim(),
      endDate: endDate.trim(),
      totalPrice: serverCalculatedTotal,
      guestsCount: guestCount,
      notes: isNonEmptyString(notes) ? notes.trim() : ""
    });
    res.status(201).json(booking);
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
    if (user.role !== "admin") {
      if (status !== "Cancelled" || booking.status !== "Pending") {
        return res.status(403).json({ error: "Residents may only cancel their own pending bookings." });
      }
    }
    if (user.role === "admin") {
      const allowedTransitions = {
        Pending: ["Approved", "Rejected", "Cancelled"],
        Approved: ["Completed", "Cancelled"],
        "Partially Paid": ["Completed", "Cancelled"],
        Rejected: [],
        Cancelled: [],
        Completed: []
      };
      if (!allowedTransitions[booking.status]?.includes(status)) {
        return res.status(400).json({ error: `Booking cannot transition from ${booking.status} to ${status}.` });
      }
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
  app.post("/api/payments/:id/pay", sensitiveMutationRateLimit, requireAuth, (req, res) => {
    const user = req.user;
    const { method, amount } = req.body;
    const missing = validateFields(req.body, ["amount"]);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing payment field: ${missing.join(", ")}.` });
    }
    const normalizedMethod = String(method ?? "Cash").trim();
    if (normalizedMethod.toLowerCase() !== "cash") {
      return res.status(400).json({ error: "Cash payment only. Please settle in person at the property office or with the Gales cashier." });
    }
    const amountValue = parseNumber(amount, -1);
    if (amountValue <= 0) {
      return res.status(400).json({ error: "Payment amount must be a valid positive number." });
    }
    let paymentRecord = paymentService.getPayments().find((p) => p.id === req.params.id) || paymentService.getPayments().find((p) => p.bookingId === req.params.id);
    if (!paymentRecord) {
      const booking = bookingService.findBookingById(req.params.id);
      if (booking) {
        paymentRecord = paymentService.ensureBookingPayment(booking);
      }
    }
    if (!paymentRecord) {
      return res.status(404).json({ error: "No payment ledger was found for this booking. Please ensure the booking exists and try again." });
    }
    if (user.role !== "admin" && paymentRecord.residentId !== user.id) {
      return res.status(403).json({ error: "Access denied. You can only pay your own invoices." });
    }
    const remaining = Number(paymentRecord.remainingBalance ?? Math.max(0, Number(paymentRecord.totalAmount || paymentRecord.amount || 0) - Number(paymentRecord.paidAmount || 0)));
    if (amountValue > remaining) {
      return res.status(400).json({ error: "Payment amount exceeds the remaining balance." });
    }
    if (paymentRecord.status === "Paid") {
      return res.status(400).json({ error: "This payment ledger is already fully settled." });
    }
    const generatedReference = paymentService.generateCashReference(paymentRecord.id);
    const payment = paymentService.submitPayment(
      paymentRecord.id,
      "Cash",
      generatedReference,
      amountValue,
      user.id,
      user.name
    );
    if (!payment) {
      return res.status(400).json({ error: "Unable to apply the cash payment. Please check the remaining balance and try again." });
    }
    res.json(payment);
  });
  app.get("/api/public/payments/:id", requireAuth, (req, res) => {
    const payment = paymentService.getPayments().find((p) => p.id === req.params.id);
    if (!payment) {
      return res.status(404).json({ error: "Invoice ledger entity not found." });
    }
    const user = req.user;
    if (user.role !== "admin" && payment.residentId !== user.id) {
      return res.status(403).json({ error: "Access denied. You can only view your own payment information." });
    }
    const { residentName: _residentName, unitName: _unitName, ...safePayment } = payment;
    res.json(safePayment);
  });
  app.post("/api/public/payments/:id/pay", (req, res) => {
    res.status(403).json({ error: "Public payment mutation is disabled. Use the authenticated payment endpoint." });
  });
  app.post("/api/payments/manual", sensitiveMutationRateLimit, requireAdmin, (req, res) => {
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
      res.json(db2.getMaintenanceRequests());
    } else {
      res.json(db2.getUserMaintenanceRequests(user.id));
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
    const ticket = db2.createMaintenanceRequest({
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
    const updated = db2.updateMaintenanceStatus(req.params.id, req.body, user.id, user.name);
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
    const success = notificationService.markAsRead(req.params.id, user.id, user.role);
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
    res.json(db2.getDashboardStats());
  });
  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });
  app.get("/api/diagnostics/db-status", requireAdmin, (_req, res) => {
    const diag = db2.getDiagnostics();
    res.status(200).json({ status: "ok", counts: diag.database });
  });
  app.get("/api/events", (req, res) => {
    const token = req.query.token && String(req.query.token).trim() || (String(req.headers.authorization || "").startsWith("Bearer ") ? String(req.headers.authorization).split(" ")[1] : "");
    if (!token) {
      return res.status(401).json({ error: "Authentication required for event stream." });
    }
    let claims;
    try {
      claims = jwt.verify(token, JWT_SECRET, {
        issuer: "one-spatial-iloilo",
        audience: "one-spatial-portal"
      });
    } catch {
      return res.status(401).json({ error: "Invalid or expired event stream token." });
    }
    const user = db2.findUserById(typeof claims.sub === "string" ? claims.sub : "");
    if (!user) return res.status(401).json({ error: "Invalid event stream token." });
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Event stream access restricted to administrators." });
    }
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();
    try {
      res.write("event: stats\n");
      res.write(`data: ${JSON.stringify(db2.getDashboardStats())}

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
    res.json(db2.getActivityLogs());
  });
  app.post("/api/chatbot", sensitiveMutationRateLimit, async (req, res) => {
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
          reply = "The Zenith Suite is a signature 1-Bedroom Loft offered by Gales Urban Haven at \u20B1120.00/night. It's fully furnished with a Queen Bed, kitchenette, Wi-Fi, and a widescreen TV, perfect for young professionals or students who want convenience near Mandurriao, Iloilo City.";
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
1. Online reservations (e.g., "The Zenith Suite", a premium 1-Bedroom Loft on Floor 4, rate of \u20B1120.00/night, sleeps up to 3, furnished with modern Wi-Fi, Queen Bed, Kitchenette, and TV).
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
  app.use("/data/private", (_req, res) => {
    res.status(404).json({ error: "Private files are not publicly accessible." });
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
