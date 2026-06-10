import express, { Request, Response, NextFunction } from 'express';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { db, dbEvents } from './server/db.ts';
import { GoogleGenAI } from '@google/genai';

// Add environment variables support if needed
import dotenv from 'dotenv';
dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const VITE_HMR_PORT = Number(process.env.VITE_HMR_PORT) || 24678;

// Security helper: mock Auth check middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = String(req.headers.authorization || '');
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Missing Bearer token.' });
  }
  
  const userId = authHeader.split(' ')[1]?.trim();
  if (!isNonEmptyString(userId)) {
    return res.status(401).json({ error: 'Authentication token malformed.' });
  }

  const user = db.findUserById(userId);
  if (!user) {
    return res.status(401).json({ error: 'User session invalid or expired.' });
  }
  
  // Attach user to request
  (req as any).user = user;
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    const user = (req as any).user;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }
    next();
  });
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function parseNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function validateFields(body: any, requiredFields: string[]) {
  return requiredFields.filter(key => {
    const value = body?.[key];
    return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
  });
}

async function startServer() {
  const app = express();

  // Increase payload limits for direct base64 image uploads of condo units
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // --- API ROUTING INTERFACE ---

  // 1. AUTHENTICATION MODULE
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { email, password, name, phone, unitNumber } = req.body;
    const missing = validateFields(req.body, ['email', 'password', 'name']);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}.` });
    }

    if (!isNonEmptyString(email) || !isNonEmptyString(password) || !isNonEmptyString(name)) {
      return res.status(400).json({ error: 'Email, password, and name must be valid non-empty strings.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = db.findUserByEmail(normalizedEmail);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const newUser = db.createUser({
      email: normalizedEmail,
      password,
      name: name.trim(),
      phone: isNonEmptyString(phone) ? phone.trim() : undefined,
      unitNumber: isNonEmptyString(unitNumber) ? unitNumber.trim() : undefined,
      role: 'resident'
    });

    // Strip password from payload
    const { password: _, ...userSafe } = newUser as any;
    res.status(201).json({ user: userSafe, token: newUser.id });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    const missing = validateFields(req.body, ['email', 'password']);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}.` });
    }

    if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
      return res.status(400).json({ error: 'Email and password must be valid non-empty strings.' });
    }

    const user = db.findUserByEmail(email.trim().toLowerCase());
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password combination.' });
    }

    const { password: _, ...userSafe } = user as any;
    res.status(200).json({ user: userSafe, token: user.id });
  });

  app.get('/api/auth/me', requireAuth, (req: Request, res: Response) => {
    const user = (req as any).user;
    const { password: _, ...userSafe } = user;
    res.json({ user: userSafe });
  });

  app.put('/api/auth/profile', requireAuth, (req: Request, res: Response) => {
    const user = (req as any).user;
    const { name, phone, unitNumber, avatarUrl } = req.body;

    const updated = db.updateUser(user.id, {
      name: name || user.name,
      phone: phone !== undefined ? phone : user.phone,
      unitNumber: unitNumber !== undefined ? unitNumber : user.unitNumber,
      avatarUrl: avatarUrl !== undefined ? avatarUrl : user.avatarUrl
    });

    if (!updated) {
      return res.status(500).json({ error: 'Failed to update user profile.' });
    }

    const { password: _, ...userSafe } = updated as any;
    res.json({ user: userSafe });
  });

  app.get('/api/residents', requireAdmin, (req: Request, res: Response) => {
    const residents = db.getUsers().filter(u => u.role === 'resident');
    const safeResidents = residents.map(({ password, ...rest }) => rest);
    res.json(safeResidents);
  });

  // 2. CONDO UNITS MODULE
  app.get('/api/units', (req: Request, res: Response) => {
    const { type, minPrice, maxPrice, status, search } = req.query;
    let list = db.getUnits();

    if (type) {
      list = list.filter(u => u.type.toLowerCase() === String(type).toLowerCase());
    }
    if (minPrice) {
      list = list.filter(u => u.price >= Number(minPrice));
    }
    if (maxPrice) {
      list = list.filter(u => u.price <= Number(maxPrice));
    }
    if (status) {
      list = list.filter(u => u.status === String(status));
    }
    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(u => 
        u.name.toLowerCase().includes(q) || 
        u.description.toLowerCase().includes(q) ||
        u.type.toLowerCase().includes(q)
      );
    }

    res.json(list);
  });

  app.get('/api/units/:id', (req: Request, res: Response) => {
    const unit = db.findUnitById(req.params.id);
    if (!unit) {
      return res.status(404).json({ error: 'Condominium unit not found.' });
    }
    res.json(unit);
  });

  app.post('/api/units', requireAdmin, (req: Request, res: Response) => {
    const user = (req as any).user;
    const { name, type, description, price, amenities, capacity, floorNumber, status, images } = req.body;

    if (!name || !type || !price) {
      return res.status(400).json({ error: 'Please specify required properties: name, type, and price.' });
    }

    const unit = db.createUnit({
      name,
      type,
      description,
      price: Number(price),
      amenities: Array.isArray(amenities) ? amenities : [],
      capacity: Number(capacity) || 2,
      floorNumber: Number(floorNumber) || 1,
      status: status || 'Available',
      images: Array.isArray(images) ? images : []
    }, user.id, user.name);

    res.status(201).json(unit);
  });

  app.put('/api/units/:id', requireAdmin, (req: Request, res: Response) => {
    const user = (req as any).user;
    const updated = db.updateUnit(req.params.id, req.body, user.id, user.name);
    if (!updated) {
      return res.status(404).json({ error: 'Unit not found to update.' });
    }
    res.json(updated);
  });

  app.delete('/api/units/:id', requireAdmin, (req: Request, res: Response) => {
    const user = (req as any).user;
    const success = db.deleteUnit(req.params.id, user.id, user.name);
    if (!success) {
      return res.status(404).json({ error: 'Unit was not found or could not be deleted.' });
    }
    res.json({ success: true, message: 'Unit was successfully unlisted.' });
  });

  // 3. BOOKINGS MODULE
  app.get('/api/bookings', requireAuth, (req: Request, res: Response) => {
    const user = (req as any).user;
    if (user.role === 'admin') {
      res.json(db.getBookings());
    } else {
      res.json(db.getUserBookings(user.id));
    }
  });

  app.post('/api/bookings', requireAuth, (req: Request, res: Response) => {
    const user = (req as any).user;
    const { unitId, startDate, endDate, totalPrice, guestsCount, notes } = req.body;
    const missing = validateFields(req.body, ['unitId', 'startDate', 'endDate', 'totalPrice']);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing mandatory fields: ${missing.join(', ')}.` });
    }

    if (!isNonEmptyString(unitId) || !isNonEmptyString(startDate) || !isNonEmptyString(endDate)) {
      return res.status(400).json({ error: 'unitId, startDate, and endDate must be valid strings.' });
    }

    const priceValue = parseNumber(totalPrice, -1);
    if (priceValue < 0) {
      return res.status(400).json({ error: 'totalPrice must be a valid number.' });
    }

    const unit = db.findUnitById(unitId);
    if (!unit) {
      return res.status(404).json({ error: 'The requested unit does not exist.' });
    }
    if (unit.status !== 'Available') {
      return res.status(400).json({ error: 'This unit is currently unavailable for booking.' });
    }

    const booking = db.createBooking({
      unitId,
      residentId: user.id,
      startDate: startDate.trim(),
      endDate: endDate.trim(),
      totalPrice: priceValue,
      guestsCount: Number(guestsCount) || 1,
      notes: isNonEmptyString(notes) ? notes.trim() : ''
    });

    res.status(201).json(booking);
  });

  // 3b. INQUIRIES & PURCHASES (simple endpoints)
  app.post('/api/inquiries', requireAuth, (req: Request, res: Response) => {
    const user = (req as any).user;
    const { unitId, unitName, type, frequency, message } = req.body;
    const missing = validateFields(req.body, ['unitId']);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing mandatory field: ${missing.join(', ')}.` });
    }

    const inquiry = {
      id: 'inq-' + Math.random().toString(36).substring(2, 11),
      unitId: unitId.trim(),
      unitName: isNonEmptyString(unitName) ? unitName.trim() : '',
      residentId: user.id,
      residentName: user.name,
      type: isNonEmptyString(type) ? type.trim() : 'inquire',
      frequency: isNonEmptyString(frequency) ? frequency.trim() : null,
      message: isNonEmptyString(message) ? message.trim() : '',
      status: 'Open',
      createdAt: new Date().toISOString()
    };
    db.addActivityLog(user.id, user.name, user.role, 'Inquiry Submitted', `Inquiry for ${unitId}`);
    res.status(201).json(inquiry);
  });

  app.post('/api/purchases', requireAuth, (req: Request, res: Response) => {
    const user = (req as any).user;
    const { unitId, unitName, amount, frequency, message } = req.body;
    const missing = validateFields(req.body, ['unitId', 'amount']);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing mandatory fields: ${missing.join(', ')}.` });
    }

    const amountValue = parseNumber(amount, -1);
    if (amountValue < 0) {
      return res.status(400).json({ error: 'amount must be a valid numerical value.' });
    }

    const purchase = {
      id: 'pur-' + Math.random().toString(36).substring(2, 11),
      unitId: unitId.trim(),
      unitName: isNonEmptyString(unitName) ? unitName.trim() : '',
      residentId: user.id,
      residentName: user.name,
      amount: amountValue,
      frequency: isNonEmptyString(frequency) ? frequency.trim() : null,
      message: isNonEmptyString(message) ? message.trim() : '',
      status: 'Pending',
      createdAt: new Date().toISOString()
    };
    db.addActivityLog(user.id, user.name, user.role, 'Purchase Request', `Purchase request for ${unitId}`);
    res.status(201).json(purchase);
  });

  app.put('/api/bookings/:id/status', requireAuth, (req: Request, res: Response) => {
    const user = (req as any).user;
    const { status } = req.body;

    if (!['Approved', 'Rejected', 'Cancelled', 'Completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid booking status request.' });
    }

    const booking = db.findBookingById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Reservation ticket not found.' });
    }

    // Authorization checks
    if (user.role !== 'admin' && booking.residentId !== user.id) {
      return res.status(403).json({ error: 'Access denied. You can only alter your own reservations.' });
    }

    if (user.role !== 'admin' && status === 'Approved') {
      return res.status(403).json({ error: 'Resident accounts are not authorized to self-approve bookings.' });
    }

    const updated = db.updateBookingStatus(req.params.id, status, user.id, user.name);
    res.json(updated);
  });

  // 4. PAYMENTS MODULE
  app.get('/api/payments', requireAuth, (req: Request, res: Response) => {
    const user = (req as any).user;
    if (user.role === 'admin') {
      res.json(db.getPayments());
    } else {
      res.json(db.getUserPayments(user.id));
    }
  });

  app.post('/api/payments/:id/pay', requireAuth, (req: Request, res: Response) => {
    const user = (req as any).user;
    const { method, referenceNumber, amount } = req.body;
    const missing = validateFields(req.body, ['method', 'referenceNumber', 'amount']);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing payment fields: ${missing.join(', ')}.` });
    }

    if (!isNonEmptyString(method) || !isNonEmptyString(referenceNumber)) {
      return res.status(400).json({ error: 'Payment method and reference number must be valid strings.' });
    }

    const amountValue = parseNumber(amount, -1);
    if (amountValue < 0) {
      return res.status(400).json({ error: 'Payment amount must be a valid positive number.' });
    }

    const payment = db.submitPayment(
      req.params.id,
      method.trim(),
      referenceNumber.trim(),
      amountValue,
      user.id,
      user.name
    );

    if (!payment) {
      return res.status(404).json({ error: 'No invoice found with the given ledger ID.' });
    }

    res.json(payment);
  });

  // 4b. PUBLIC PAYMENTS SANDBOX (QR CODE REAL-WORLD PH SIMULATION)
  app.get('/api/public/payments/:id', (req: Request, res: Response) => {
    const payment = db.getPayments().find(p => p.id === req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Invoice ledger entity not found.' });
    }
    res.json(payment);
  });

  app.post('/api/public/payments/:id/pay', (req: Request, res: Response) => {
    const { method, referenceNumber, amount, payorName } = req.body;
    const missing = validateFields(req.body, ['method', 'referenceNumber', 'amount']);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing public payment fields: ${missing.join(', ')}.` });
    }

    if (!isNonEmptyString(method) || !isNonEmptyString(referenceNumber)) {
      return res.status(400).json({ error: 'Payment method and reference number must be valid strings.' });
    }

    const amountValue = parseNumber(amount, -1);
    if (amountValue < 0) {
      return res.status(400).json({ error: 'Payment amount must be a valid positive number.' });
    }

    const payment = db.submitPayment(
      req.params.id,
      method.trim(),
      referenceNumber.trim(),
      amountValue,
      'qr-payor',
      isNonEmptyString(payorName) ? payorName.trim() : 'Gales QR Client'
    );

    if (!payment) {
      return res.status(404).json({ error: 'No invoice found with the given ledger ID.' });
    }

    res.json(payment);
  });

  app.post('/api/payments/manual', requireAdmin, (req: Request, res: Response) => {
    const user = (req as any).user;
    const { residentId, unitName, amount, status, method } = req.body;

    if (!residentId || !amount) {
      return res.status(400).json({ error: 'Please specify target residentId and billing amount.' });
    }

    const payment = db.generateManualPayment({
      residentId,
      unitName: unitName || 'Periodic Condominium Maintenance Dues',
      amount: Number(amount),
      status: status || 'Pending',
      method: method || 'Credit Card'
    }, user.id, user.name);

    res.status(201).json(payment);
  });

  // 5. MAINTENANCE TICKETS MODULE
  app.get('/api/maintenance', requireAuth, (req: Request, res: Response) => {
    const user = (req as any).user;
    if (user.role === 'admin') {
      res.json(db.getMaintenanceRequests());
    } else {
      res.json(db.getUserMaintenanceRequests(user.id));
    }
  });

  app.post('/api/maintenance', requireAuth, (req: Request, res: Response) => {
    const user = (req as any).user;
    const { unitNumber, issueType, description, priority } = req.body;
    const missing = validateFields(req.body, ['issueType', 'description']);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing maintenance fields: ${missing.join(', ')}.` });
    }

    if (!isNonEmptyString(issueType) || !isNonEmptyString(description)) {
      return res.status(400).json({ error: 'Issue type and description must be valid strings.' });
    }

    const normalizedPriority = isNonEmptyString(priority) ? priority.trim() : 'Medium';
    const safePriority = ['Low', 'Medium', 'High', 'Emergency'].includes(normalizedPriority)
      ? normalizedPriority as any
      : 'Medium';

    const ticket = db.createMaintenanceRequest({
      residentId: user.id,
      unitNumber: isNonEmptyString(unitNumber) ? unitNumber.trim() : user.unitNumber || 'Common Spaces',
      issueType: issueType.trim(),
      description: description.trim(),
      priority: safePriority
    });

    res.status(201).json(ticket);
  });

  app.put('/api/maintenance/:id', requireAdmin, (req: Request, res: Response) => {
    const user = (req as any).user;
    const updated = db.updateMaintenanceStatus(req.params.id, req.body, user.id, user.name);
    if (!updated) {
      return res.status(404).json({ error: 'Maintenance ticket not found.' });
    }
    res.json(updated);
  });

  // 6. NOTIFICATIONS MODULE
  app.get('/api/notifications', requireAuth, (req: Request, res: Response) => {
    const user = (req as any).user;
    res.json(db.getNotifications(user.id, user.role));
  });

  app.post('/api/notifications/read/:id', requireAuth, (req: Request, res: Response) => {
    const user = (req as any).user;
    const success = db.markNotificationAsRead(req.params.id, user.id);
    res.json({ success });
  });

  app.post('/api/notifications/read-all', requireAuth, (req: Request, res: Response) => {
    const user = (req as any).user;
    db.markAllNotificationsAsRead(user.id, user.role);
    res.json({ success: true, message: 'All relevant notifications cleared.' });
  });

  app.post('/api/notifications/announce', requireAdmin, (req: Request, res: Response) => {
    const { title, message, type, recipientRole } = req.body;
    const missing = validateFields(req.body, ['title', 'message']);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing announcement fields: ${missing.join(', ')}.` });
    }

    if (!isNonEmptyString(title) || !isNonEmptyString(message)) {
      return res.status(400).json({ error: 'Announcement title and message must be valid text.' });
    }

    const normalizedRecipientRole = isNonEmptyString(recipientRole) ? recipientRole.trim() : 'all';
    const safeRecipientRole = ['admin', 'resident', 'all'].includes(normalizedRecipientRole)
      ? normalizedRecipientRole as any
      : 'all';

    const normalizedType = isNonEmptyString(type) ? type.trim() : 'info';
    const safeType = ['info', 'success', 'warning', 'alert'].includes(normalizedType)
      ? normalizedType as any
      : 'info';

    const notif = db.createNotification({
      title: title.trim(),
      message: message.trim(),
      recipientId: 'all',
      recipientRole: safeRecipientRole,
      type: safeType
    });

    res.status(201).json(notif);
  });

  // 7. SYSTEM PERFORMANCE & AUDITS
  app.get('/api/dashboard/stats', requireAuth, (req: Request, res: Response) => {
    res.json(db.getDashboardStats());
  });

  // Server-Sent Events stream for realtime updates (requires token query or Bearer header)
  app.get('/api/events', (req: Request, res: Response) => {
    const token = (req.query.token && String(req.query.token).trim()) || (String(req.headers.authorization || '').startsWith('Bearer ') ? String(req.headers.authorization).split(' ')[1] : '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required for event stream.' });
    }

    const user = db.findUserById(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid event stream token.' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Event stream access restricted to administrators.' });
    }

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Send initial stats
    try {
      res.write('event: stats\n');
      res.write(`data: ${JSON.stringify(db.getDashboardStats())}\n\n`);
    } catch (err) {
      console.error('Failed sending initial SSE payload:', err);
    }

    const onChange = (payload: any) => {
      try {
        res.write('event: stats\n');
        res.write(`data: ${JSON.stringify(payload?.stats || payload)}\n\n`);
      } catch (err) {
        console.error('SSE write error:', err);
      }
    };

    dbEvents.on('change', onChange);

    req.on('close', () => {
      dbEvents.off('change', onChange);
      try { res.end(); } catch (e) {}
    });
  });

  app.get('/api/logs', requireAdmin, (req: Request, res: Response) => {
    res.json(db.getActivityLogs());
  });

  // 8. CHATBOT ASSISTANT FOR SALES AND OPERATIONS
  app.post('/api/chatbot', async (req: Request, res: Response) => {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format.' });
    }

    const lastMessage = messages[messages.length - 1];
    const userPrompt = lastMessage ? lastMessage.content || '' : '';

    // If key is not set, provide an intelligent, context-aware simulated fallback
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
            'User-Agent': 'aistudio-build',
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

      const contents = messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content || '' }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ text: response.text });
    } catch (err: any) {
      console.error('Gemini chatbot error:', err);
      // Fallback in case of API failure
      res.json({ 
        text: "I am having trouble talking to Gales Urban Haven server right now, but please know that One Spatial Iloilo is fully optimized for your convenience with 24/7 security and 20-minute emergency response service!" 
      });
    }
  });


  // 404 catch for unknown API routes
  app.use('/api', (req: Request, res: Response) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  // Global error handling for unexpected failures
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({ error: 'Internal server error. Please try again later.' });
  });

  // --- VITE DEV MIDDLEWARE / STATIC ASSETS ROUTING ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true, 
        hmr: { port: VITE_HMR_PORT }, 
        allowedHosts: ['*']
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
    console.log('Vite development server loaded as Express middleware.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Production static file server configured to map to dist/ folder.');
  }

  // Bind server listener on standard platform port 3000
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express Condominium App listening at HTTP on Port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('CRITICAL: Server startup failure:', err);
});
