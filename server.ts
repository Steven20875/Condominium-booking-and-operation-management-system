/**
 * ONE SPATIAL ILOILO - Backend Server
 * 
 * ARCHITECTURE: Express.js + TypeScript + JSON Database
 * 
 * DESIGN DECISIONS:
 * 
 * 1. EXPRESS.JS (not NestJS/Fastify)
 *    - Lightweight, well-documented framework
 *    - Middleware pattern is industry standard
 *    - Easy to understand and maintain
 *    - Sufficient performance for this use case
 * 
 * 2. JSON DATABASE (not MySQL/PostgreSQL)
 *    - Zero infrastructure overhead (no database server setup)
 *    - Students can understand data by reading db.json
 *    - File-based transactional writes (safe from corruption)
 *    - Perfect for demo/classroom deployment
 * 
 * 3. SERVER-SENT EVENTS (SSE)
 *    - Real-time notifications from server → client
 *    - No WebSocket overhead
 *    - HTTP-based (works through proxies)
 *    - Automatic browser reconnection
 * 
 * 4. MIDDLEWARE PATTERN
 *    - requireAuth: Validate JWT bearer tokens
 *    - CORS: Allow frontend requests
 *    - Static file serving: React build output
 *    - Error handling: Consistent error responses
 * 
 * API ROUTES IMPLEMENTED:
 * - POST /api/auth/login - User authentication
 * - GET /api/auth/verify - Session validation
 * - POST /api/bookings - Create reservations
 * - GET /api/bookings - List bookings
 * - POST /api/payments - Process payments
 * - GET /api/admin/stats - Dashboard analytics
 * - GET /api/notifications/stream - Real-time SSE feed
 * 
 * SECURITY CONSIDERATIONS:
 * - Bearer token validation on protected routes
 * - User ID extracted from token (not trusted from client)
 * - CORS configured for frontend domain
 * - Input validation on all endpoints
 * - Proper HTTP status codes (401, 403, 404, 500)
 * 
 * DATABASE LAYER (server/db.ts):
 * - Centralized data access
 * - Transactional writes prevent data corruption
 * - Event emitter for real-time updates
 * - Default data initialization on startup
 * 
 * DEPLOYMENT:
 * - Runs on Port 3000 (or PORT env var)
 * - Serves React build from dist/
 * - Vite HMR for development hot-reloading
 * 
 * Created by: [Student]
 * Tech Stack: Express.js + TypeScript + Node.js
 */

import express, { Request, Response, NextFunction } from 'express';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import { db, dbEvents, createGovernmentIdSubmission, deleteGovernmentIdSubmission, ensureDatabaseReady, flushDatabase, persistenceMode, refreshDatabase, updateGovernmentIdSubmissionStatus } from './server/db/index.ts';
import { bookingService } from './server/services/BookingService.ts';
import { paymentService } from './server/services/PaymentService.ts';
import { notificationService } from './server/services/NotificationService.ts';
import { GoogleGenAI } from '@google/genai';

// Add environment variables support if needed
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = __dirname;

dotenv.config({ path: path.resolve(projectRoot, '.env') });

const PORT = Number(process.env.PORT) || 3000;
const VITE_HMR_PORT = Number(process.env.VITE_HMR_PORT) || 24678;
const isVercel = Boolean(process.env.VERCEL);
const configuredJwtSecret = process.env.JWT_SECRET;
if (isVercel && !configuredJwtSecret) {
  console.warn('[AUTH] JWT_SECRET is not configured in the production environment. Generating a temporary secret for this runtime; set JWT_SECRET in Vercel to keep sessions stable across deploys.');
}
const JWT_SECRET = configuredJwtSecret || crypto.randomBytes(32).toString('hex');
if (!configuredJwtSecret) {
  console.warn('[AUTH] JWT_SECRET is not configured. Local tokens will be invalidated when the server restarts.');
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = JWT_SECRET;
}
const JWT_EXPIRES_IN = '8h';
const MAX_GOVERNMENT_ID_SIZE_BYTES = 3 * 1024 * 1024;
const MAX_GOVERNMENT_ID_REQUEST_BYTES = MAX_GOVERNMENT_ID_SIZE_BYTES + 64 * 1024;
const firebaseConfigFromEnv = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || '',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.VITE_FIREBASE_APP_ID || '',
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

/**
 * MIDDLEWARE: Require valid authentication
 * Extracts and validates Bearer token from Authorization header
 * Attaches user object to request for downstream handlers
 */
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = String(req.headers.authorization || '');
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Missing Bearer token.' });
  }
  
  const token = authHeader.slice('Bearer '.length).trim();
  if (!isNonEmptyString(token)) {
    return res.status(401).json({ error: 'Authentication token malformed.' });
  }

  try {
    const claims = jwt.verify(token, JWT_SECRET, {
      issuer: 'one-spatial-iloilo',
      audience: 'one-spatial-portal'
    }) as jwt.JwtPayload;
    const userId = typeof claims.sub === 'string' ? claims.sub : '';
    const user = db.findUserById(userId);
    if (!user) {
      return res.status(401).json({ error: 'User session invalid or expired.' });
    }

    (req as any).user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
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

function requireDurableUnitStorage(_req: Request, res: Response, next: NextFunction) {
  if (isVercel && persistenceMode !== 'postgres') {
    return res.status(503).json({ error: 'Durable unit storage is not configured. Set DATABASE_URL for the Vercel deployment.' });
  }
  next();
}

async function refreshUnitStorage(_req: Request, res: Response, next: NextFunction) {
  try {
    await refreshDatabase();
    next();
  } catch (error) {
    console.error('[UNITS] Failed to refresh durable unit storage:', error);
    res.status(503).json({ error: 'Unable to load the current unit inventory.' });
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function parseNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeGovernmentIdStatus(status?: string | null): 'not_submitted' | 'pending' | 'verified' | 'rejected' {
  const normalized = typeof status === 'string' ? status.trim().toLowerCase() : '';
  if (normalized === 'pending' || normalized === 'verified' || normalized === 'rejected') {
    return normalized;
  }
  return 'not_submitted';
}

function getGovernmentIdStatusForUser(user: any): 'not_submitted' | 'pending' | 'verified' | 'rejected' {
  return normalizeGovernmentIdStatus(user?.governmentIdStatus ?? (user?.hasValidId ? 'verified' : 'not_submitted'));
}

function sanitizeUserForApi(user: any) {
  const { password: _password, governmentIdStorageKey: _governmentIdStorageKey, ...safeUser } = user;
  return safeUser;
}

function determineGovernmentIdMimeType(mimeType: unknown) {
  const normalized = typeof mimeType === 'string' ? mimeType.toLowerCase() : '';
  if (normalized === 'image/jpeg' || normalized === 'image/jpg' || normalized === 'image/pjpeg') {
    return 'image/jpeg';
  }
  if (normalized === 'image/png' || normalized === 'application/pdf') return normalized;
  return '';
}

function detectGovernmentIdMimeType(file: Buffer) {
  if (file.length >= 3 && file[0] === 0xff && file[1] === 0xd8 && file[2] === 0xff) return 'image/jpeg';
  if (file.length >= 8 && file.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (file.length >= 5 && file.subarray(0, 5).toString('ascii') === '%PDF-') return 'application/pdf';
  return '';
}

class GovernmentIdRequestError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
  }
}

async function readGovernmentIdMultipart(req: Request) {
  const contentType = String(req.headers['content-type'] || '');
  if (!contentType.toLowerCase().startsWith('multipart/form-data;')) {
    throw new GovernmentIdRequestError('Please upload the ID using the file selector.', 400);
  }

  const declaredLength = Number(req.headers['content-length'] || 0);
  if (declaredLength > MAX_GOVERNMENT_ID_REQUEST_BYTES) {
    throw new GovernmentIdRequestError('File size must not exceed 3 MB.', 413);
  }

  const chunks: Buffer[] = [];
  let totalBytes = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buffer.length;
    if (totalBytes > MAX_GOVERNMENT_ID_REQUEST_BYTES) {
      throw new GovernmentIdRequestError('File size must not exceed 3 MB.', 413);
    }
    chunks.push(buffer);
  }

  let formData: FormData;
  try {
    const multipartRequest = new globalThis.Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': contentType },
      body: Buffer.concat(chunks)
    });
    formData = await multipartRequest.formData();
  } catch {
    throw new GovernmentIdRequestError('The uploaded form could not be read. Please try again.', 400);
  }

  const fileValue = formData.get('file');
  if (!fileValue || typeof fileValue === 'string') {
    throw new GovernmentIdRequestError('Please select a valid government-issued ID.', 400);
  }
  if (formData.get('agreesToVerification') !== 'true') {
    throw new GovernmentIdRequestError('Please agree to submit your ID for verification.', 400);
  }
  if (fileValue.size === 0) {
    throw new GovernmentIdRequestError('The selected file is empty.', 400);
  }
  if (fileValue.size > MAX_GOVERNMENT_ID_SIZE_BYTES) {
    throw new GovernmentIdRequestError('File size must not exceed 3 MB.', 413);
  }

  const bytes = Buffer.from(await fileValue.arrayBuffer());
  const detectedMimeType = detectGovernmentIdMimeType(bytes);
  const declaredMimeType = determineGovernmentIdMimeType(fileValue.type);
  if (!detectedMimeType || (declaredMimeType && declaredMimeType !== detectedMimeType)) {
    throw new GovernmentIdRequestError('File type not supported. Please upload a valid JPG, PNG, or PDF.', 415);
  }

  const originalFileName = fileValue.name.replace(/[\\/\u0000-\u001f\u007f]/g, '_').slice(0, 255) || 'government-id';
  return { buffer: bytes, originalFileName, mimeType: detectedMimeType };
}

function getPrivateGovernmentIdBucket() {
  const bucketName = process.env.GOVERNMENT_ID_STORAGE_BUCKET;
  if (!bucketName) throw new Error('Government ID storage is not configured.');

  const app = getApps()[0] || initializeApp({
    credential: cert(parseFirebaseServiceAccount()),
    storageBucket: bucketName
  });
  return getStorage(app).bucket(bucketName);
}

function governmentIdExtension(mimeType: string) {
  if (mimeType === 'application/pdf') return '.pdf';
  if (mimeType === 'image/png') return '.png';
  return '.jpg';
}

async function deletePrivateGovernmentId(storageKey: string) {
  try {
    await getPrivateGovernmentIdBucket().file(storageKey).delete({ ignoreNotFound: true });
  } catch {
    console.error('[GOVERNMENT_ID] Uploaded object cleanup failed.');
  }
}

async function sendPrivateGovernmentId(res: Response, storageKey: string) {
  const extension = path.extname(storageKey).toLowerCase();
  const mimeType = extension === '.pdf' ? 'application/pdf' : extension === '.png' ? 'image/png' : extension === '.jpg' ? 'image/jpeg' : '';
  if (!mimeType || !storageKey.startsWith('government-ids/')) {
    return res.status(404).json({ error: 'No submitted government ID was found for this resident.' });
  }

  try {
    const [fileBuffer] = await getPrivateGovernmentIdBucket().file(storageKey).download();
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="government-id${extension}"`);
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.send(fileBuffer);
  } catch {
    return res.status(404).json({ error: 'No submitted government ID was found for this resident.' });
  }
}

function calculateBookingTotal(unitPrice: number, startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  const diffMs = Math.max(end.getTime() - start.getTime(), 0);
  const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)) || 1);
  const base = days * Number(unitPrice || 0);

  const months = new Set([start.getMonth(), end.getMonth()]);
  const isHolidayWindow = [...months].some((month) => month === 11 || month === 0);
  const hasSeasonalAddOn = [...months].some((month) => month === 11 || month === 0);

  const holidayDiscountFactor = isHolidayWindow ? 0.9 : 1;
  const seasonalSurcharge = hasSeasonalAddOn ? 250 : 0;
  const total = base * holidayDiscountFactor + seasonalSurcharge;

  return Number(total.toFixed(2));
}

function validateFields(body: any, requiredFields: string[]) {
  return requiredFields.filter(key => {
    const value = body?.[key];
    return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
  });
}

function createAuthToken(user: { id: string; role: string }) {
  return jwt.sign({}, JWT_SECRET, {
    subject: user.id,
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'one-spatial-iloilo',
    audience: 'one-spatial-portal'
  });
}

function parseFirebaseServiceAccount(): Record<string, any> {
  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!rawServiceAccount || !rawServiceAccount.trim()) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not configured.');
  }

  try {
    return JSON.parse(rawServiceAccount);
  } catch {
    const normalized = rawServiceAccount
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t');

    try {
      return JSON.parse(normalized);
    } catch {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON. Check the Vercel environment variable formatting.');
    }
  }
}

async function verifyFirebaseIdentityToken(idToken: string) {
  const serviceAccount = parseFirebaseServiceAccount();

  if (getApps().length === 0) {
    initializeApp({ credential: cert(serviceAccount) });
  }

  return getAuth().verifyIdToken(idToken);
}

const loginRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many sign-in attempts. Please try again later.' } });
const registrationRateLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many registration attempts. Please try again later.' } });
const sensitiveMutationRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 60, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many requests. Please try again later.' } });

export async function createApp() {
  await ensureDatabaseReady();
  const migratedPasswords = db.migratePlaintextPasswords((password) => bcrypt.hashSync(password, 12));
  if (migratedPasswords > 0) {
    console.log(`[AUTH] Migrated ${migratedPasswords} plaintext password(s) to bcrypt hashes.`);
  }

  const app = express();

  // Increase payload limits for direct base64 image uploads of condo units
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = typeof req.headers.origin === 'string' ? req.headers.origin : '';
    const isLocalHost = /^https?:\/\/localhost(?::\d+)?$/.test(origin) || /^https?:\/\/127\.0\.0\.1(?::\d+)?$/.test(origin);
    const isVercelOrigin = /^https?:\/\/.*\.vercel\.app$/i.test(origin);

    if (!origin || isLocalHost || isVercelOrigin) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    }

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    next();
  });

  // --- API ROUTING INTERFACE ---

  // 1. AUTHENTICATION MODULE
  app.post('/api/auth/register', registrationRateLimit, (req: Request, res: Response) => {
    const { password, name } = req.body;
    const missing = validateFields(req.body, ['password', 'name']);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}.` });
    }

    if (!isNonEmptyString(password) || !isNonEmptyString(name)) {
      return res.status(400).json({ error: 'Full Name and Password must be valid non-empty strings.' });
    }

    if (name.trim().length > 120) {
      return res.status(400).json({ error: 'Full Name must be 120 characters or fewer.' });
    }

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.' });
    }

    const newUser = db.createUser({
      email: '',
      password: bcrypt.hashSync(password, 12),
      name: name.trim(),
      role: 'resident'
    });

    // Strip password from payload
    const userSafe = sanitizeUserForApi(newUser);
    res.status(201).json({ user: userSafe, token: createAuthToken(newUser) });
  });

  app.post('/api/auth/login', loginRateLimit, (req: Request, res: Response) => {
    const rawIdentifier = req.body?.identifier ?? req.body?.email;
    const rawPassword = req.body?.password;

    try {
      const missing = validateFields({ identifier: rawIdentifier, password: rawPassword }, ['identifier', 'password']);
      if (missing.length > 0) {
        return res.status(400).json({ error: 'Resident ID or email and password are required.' });
      }

      if (!isNonEmptyString(rawIdentifier) || !isNonEmptyString(rawPassword)) {
        return res.status(400).json({ error: 'Resident ID or email and password must be valid non-empty strings.' });
      }

      const identifier = String(rawIdentifier).trim();
      const password = String(rawPassword);
      const isEmailLogin = identifier.includes('@');
      const user = isEmailLogin ? db.findUserByEmail(identifier.toLowerCase()) : db.findUserById(identifier);

      if (!user || typeof user.password !== 'string' || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: 'Invalid email or password combination.' });
      }
      if (!isEmailLogin && user.role !== 'resident') {
        return res.status(401).json({ error: 'Invalid email or password combination.' });
      }

      const userSafe = sanitizeUserForApi(user);
      return res.status(200).json({ user: userSafe, token: createAuthToken(user) });
    } catch (error) {
      console.error('[AUTH] Login exception:', {
        identifier: typeof rawIdentifier === 'string' ? rawIdentifier : String(rawIdentifier ?? ''),
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return res.status(500).json({ error: 'Internal server error. Please try again later.' });
    }
  });

  app.get('/api/config/firebase', (_req: Request, res: Response) => {
    res.json({ firebase: firebaseConfigFromEnv });
  });

  app.post('/api/auth/firebase', loginRateLimit, async (req: Request, res: Response) => {
    const { name, phone, avatarUrl, provider, idToken } = req.body;
    const missing = validateFields(req.body, ['idToken']);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}.` });
    }

    if (!isNonEmptyString(idToken)) {
      return res.status(401).json({ error: 'Verified Firebase identity token is required.' });
    }

    let verifiedClaims;
    try {
      verifiedClaims = await verifyFirebaseIdentityToken(idToken);
    } catch (error) {
      console.error('[AUTH] Firebase token verification failed:', error instanceof Error ? error.message : String(error));
      return res.status(503).json({ error: 'Google sign-in is not configured for this deployment.' });
    }

    try {
      const uid = verifiedClaims.uid;
      const email = verifiedClaims.email;
      if (!isNonEmptyString(uid) || !isNonEmptyString(email)) {
        return res.status(401).json({ error: 'Verified Firebase identity is incomplete.' });
      }

      if (verifiedClaims.email_verified !== true) {
        return res.status(403).json({ error: 'Please verify your email address before continuing.' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const allUsers = db.getUsers();
      const existingUserByUid = allUsers.find((user) => user.authUid === uid);
      const existingUserByEmail = allUsers.find((user) => user.email.toLowerCase() === normalizedEmail);
      const existingUser = existingUserByUid || existingUserByEmail;

      if (existingUser) {
        const isGoogleLogin = provider === 'google';
        const nextAuthProvider = existingUser.authProvider || (isGoogleLogin ? 'google' : 'email');
        const updatedUser = db.updateUser(existingUser.id, {
          name: isNonEmptyString(name) ? String(name).trim() : existingUser.name,
          phone: isNonEmptyString(phone) ? String(phone).trim() : existingUser.phone,
          avatarUrl: isNonEmptyString(avatarUrl) ? String(avatarUrl).trim() : existingUser.avatarUrl,
          authProvider: nextAuthProvider,
          authUid: uid,
          email: normalizedEmail,
          emailVerified: verifiedClaims.email_verified === true,
        });

        if (!updatedUser) {
          return res.status(500).json({ error: 'Unable to synchronize the existing account.' });
        }

        const userSafe = sanitizeUserForApi(updatedUser);
        return res.status(200).json({ user: userSafe, token: createAuthToken(updatedUser) });
      }

      const newUser = db.createUser({
        email: normalizedEmail,
        password: bcrypt.hashSync(crypto.randomBytes(24).toString('hex'), 12),
        name: isNonEmptyString(name) ? String(name).trim() : normalizedEmail.split('@')[0],
        phone: isNonEmptyString(phone) ? String(phone).trim() : undefined,
        avatarUrl: isNonEmptyString(avatarUrl) ? String(avatarUrl).trim() : undefined,
        role: 'resident',
        authProvider: provider === 'google' ? 'google' : 'firebase',
        authUid: uid,
        emailVerified: verifiedClaims.email_verified === true
      });

      const userSafe = sanitizeUserForApi(newUser);
      return res.status(201).json({ user: userSafe, token: createAuthToken(newUser) });
    } catch (error) {
      console.error('[AUTH] Firebase user synchronization failed:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        persistenceMode: process.env.USE_POSTGRES === 'true' ? 'postgres' : 'json',
        hasFirebaseServiceAccount: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()),
      });
      return res.status(500).json({
        error: 'Unable to synchronize the Firebase account.',
        code: 'FIREBASE_USER_SYNC_FAILED'
      });
    }
  });

  app.get('/api/auth/me', requireAuth, (req: Request, res: Response) => {
    const user = (req as any).user;
    const userSafe = sanitizeUserForApi(user);
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

    const userSafe = sanitizeUserForApi(updated);
    res.json({ user: userSafe });
  });

  app.get('/api/profile/verification', requireAuth, (req: Request, res: Response) => {
    const user = db.findUserById((req as any).user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const status = getGovernmentIdStatusForUser(user);
    const canBook = status === 'verified';
    const response = {
      governmentIdStatus: status,
      hasValidId: Boolean(user.hasValidId),
      governmentIdUploadedAt: user.governmentIdUploadedAt || null,
      governmentIdVerifiedAt: user.governmentIdVerifiedAt || null,
      governmentIdRejectionReason: user.governmentIdRejectionReason || null,
      canBook,
      message: status === 'not_submitted'
        ? 'Government ID verification is required before you can make a booking.'
        : status === 'pending'
          ? 'Your ID has been submitted and is waiting for admin verification.'
          : status === 'verified'
            ? 'Your identity has been verified. You may now submit bookings.'
            : 'Your submitted ID could not be verified. Please upload a valid government-issued ID and submit it again.'
    };

    res.json(response);
  });

  app.post('/api/profile/government-id', sensitiveMutationRateLimit, requireAuth, async (req: Request, res: Response) => {
    const user = db.findUserById((req as any).user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    if (user.role !== 'resident') {
      return res.status(403).json({ error: 'Only residents can submit a Government ID.' });
    }
    if (getGovernmentIdStatusForUser(user) === 'pending') {
      return res.status(409).json({ error: 'Your Government ID is already pending review.' });
    }
    if (persistenceMode !== 'postgres') {
      return res.status(503).json({ error: 'Government ID verification is unavailable because PostgreSQL storage is not configured.' });
    }

    let uploadedId: Awaited<ReturnType<typeof readGovernmentIdMultipart>>;
    try {
      uploadedId = await readGovernmentIdMultipart(req);
    } catch (error) {
      if (error instanceof GovernmentIdRequestError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(400).json({ error: 'Unable to read the selected Government ID. Please try again.' });
    }

    const storageKey = `government-ids/${user.id}/${crypto.randomUUID()}${governmentIdExtension(uploadedId.mimeType)}`;
    let bucket;
    try {
      bucket = getPrivateGovernmentIdBucket();
      await bucket.file(storageKey).save(uploadedId.buffer, {
        resumable: false,
        metadata: {
          contentType: uploadedId.mimeType,
          cacheControl: 'private, no-store, max-age=0'
        }
      });
    } catch (error) {
      const storageError = error as {
        code?: unknown;
        message?: unknown;
      };

      console.error(
        '[GOVERNMENT_ID] Private object upload failed:',
        `code=${String(storageError.code ?? 'unknown')}`,
        `message=${String(storageError.message ?? error)}`
      );

      return res.status(503).json({
        error: 'Government ID storage is unavailable. Please try again later.'
      });
    }

    const submissionId = crypto.randomUUID();
    const uploadedAt = new Date().toISOString();
    try {
      await createGovernmentIdSubmission({
        id: submissionId,
        userId: user.id,
        storageKey,
        mimeType: uploadedId.mimeType,
        originalFileName: uploadedId.originalFileName,
        uploadedAt
      });

      const updatedUser = db.submitGovernmentIdForVerification(user.id, storageKey, uploadedId.originalFileName, uploadedId.mimeType);
      if (!updatedUser) {
        throw new Error('User record could not be updated.');
      }
      await flushDatabase();

      return res.status(201).json({
        governmentIdStatus: 'pending',
        governmentIdUploadedAt: updatedUser.governmentIdUploadedAt,
        hasValidId: false,
        message: 'Your ID has been submitted and is waiting for admin verification.',
        canBook: false
      });
    } catch {
      await deleteGovernmentIdSubmission(submissionId).catch(() => undefined);
      await deletePrivateGovernmentId(storageKey);
      console.error('[GOVERNMENT_ID] Database update failed after private upload.');
      return res.status(500).json({ error: 'The file uploaded, but its verification record could not be saved. Please try again.' });
    }
  });

  app.get('/api/profile/government-id', requireAuth, async (req: Request, res: Response) => {
    const user = db.findUserById((req as any).user.id);
    if (!user || !user.governmentIdStorageKey) {
      return res.status(404).json({ error: 'No government ID record found for this user.' });
    }
    return sendPrivateGovernmentId(res, user.governmentIdStorageKey);
  });

  app.get('/api/admin/government-id-verifications', requireAdmin, (req: Request, res: Response) => {
    const pending = db.getPendingGovernmentIdVerifications().map((resident) => ({
      id: resident.id,
      name: resident.name,
      email: resident.email,
      unitNumber: resident.unitNumber || '',
      governmentIdStatus: resident.governmentIdStatus || 'not_submitted',
      governmentIdUploadedAt: resident.governmentIdUploadedAt || null,
      governmentIdRejectionReason: resident.governmentIdRejectionReason || null,
      hasValidId: Boolean(resident.hasValidId)
    }));

    res.json(pending);
  });

  app.get('/api/admin/government-id-verifications/:userId', requireAdmin, (req: Request, res: Response) => {
    const targetUser = db.findUserById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Resident not found.' });
    }

    const residentData = {
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      unitNumber: targetUser.unitNumber || '',
      governmentIdStatus: getGovernmentIdStatusForUser(targetUser),
      hasGovernmentId: Boolean(targetUser.governmentIdStorageKey),
      governmentIdUploadedAt: targetUser.governmentIdUploadedAt || null,
      governmentIdVerifiedAt: targetUser.governmentIdVerifiedAt || null,
      governmentIdRejectionReason: targetUser.governmentIdRejectionReason || null,
      hasValidId: Boolean(targetUser.hasValidId)
    };

    res.json(residentData);
  });

  app.get('/api/admin/government-id-verifications/:userId/file', requireAdmin, async (req: Request, res: Response) => {
    const targetUser = db.findUserById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Resident not found.' });
    }
    if (!targetUser.governmentIdStorageKey) {
      return res.status(404).json({ error: 'No submitted government ID was found for this resident.' });
    }
    return sendPrivateGovernmentId(res, targetUser.governmentIdStorageKey);
  });

  app.post('/api/admin/government-id-verifications/:userId/approve', requireAdmin, async (req: Request, res: Response) => {
    const targetUser = db.findUserById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Resident not found.' });
    }

    const updatedUser = db.approveGovernmentId(targetUser.id);
    if (!updatedUser) {
      return res.status(500).json({ error: 'Unable to approve the resident government ID.' });
    }

    try {
      await flushDatabase();
      await updateGovernmentIdSubmissionStatus(targetUser.id, 'verified', (req as any).user.id);
    } catch {
      return res.status(500).json({ error: 'Unable to persist the Government ID verification decision.' });
    }

    res.json({
      governmentIdStatus: 'verified',
      governmentIdVerifiedAt: updatedUser.governmentIdVerifiedAt,
      hasValidId: true,
      message: 'Government ID has been verified.'
    });
  });

  app.post('/api/admin/government-id-verifications/:userId/reject', requireAdmin, async (req: Request, res: Response) => {
    const { reason } = req.body || {};
    const targetUser = db.findUserById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Resident not found.' });
    }

    const updatedUser = db.rejectGovernmentId(targetUser.id, isNonEmptyString(reason) ? String(reason).trim() : 'Please upload a clearer and valid government-issued ID.');
    if (!updatedUser) {
      return res.status(500).json({ error: 'Unable to reject the resident government ID.' });
    }

    try {
      await flushDatabase();
      await updateGovernmentIdSubmissionStatus(targetUser.id, 'rejected', (req as any).user.id, isNonEmptyString(reason) ? String(reason).trim() : 'Please upload a clearer and valid government-issued ID.');
    } catch {
      return res.status(500).json({ error: 'Unable to persist the Government ID verification decision.' });
    }

    res.json({
      governmentIdStatus: 'rejected',
      governmentIdRejectionReason: updatedUser.governmentIdRejectionReason || null,
      hasValidId: false,
      message: 'Government ID rejected. Please ask the resident to upload another valid ID.'
    });
  });

  app.get('/api/residents', requireAdmin, (req: Request, res: Response) => {
    const residents = db.getUsers().filter(u => u.role === 'resident');
    const safeResidents = residents.map((resident) => sanitizeUserForApi(resident));
    res.json(safeResidents);
  });

  // 2. CONDO UNITS MODULE
  app.get('/api/units', requireDurableUnitStorage, refreshUnitStorage, (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
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

  app.get('/api/units/:id', requireDurableUnitStorage, refreshUnitStorage, (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    const unit = db.findUnitById(req.params.id);
    if (!unit) {
      return res.status(404).json({ error: 'Condominium unit not found.' });
    }
    res.json(unit);
  });

  app.post('/api/units', requireAdmin, requireDurableUnitStorage, refreshUnitStorage, async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { name, type, description, price, capacity, status, images } = req.body;

    if (!name || !type || !price) {
      return res.status(400).json({ error: 'Please specify required properties: name, type, and price.' });
    }

    try {
      const unit = db.createUnit({
        name,
        type,
        description,
        price: Number(price),
        capacity: Number(capacity) || 2,
        status: status || 'Available',
        images: Array.isArray(images) ? images : []
      }, user.id, user.name);
      await flushDatabase();
      res.status(201).json(unit);
    } catch (error) {
      console.error('[UNITS] Failed to persist created unit:', error);
      res.status(500).json({ error: 'Unable to persist the new unit.' });
    }
  });


  app.put('/api/units/:id', requireAdmin, requireDurableUnitStorage, refreshUnitStorage, async (req: Request, res: Response) => {
    const user = (req as any).user;
    try {
      const updated = db.updateUnit(req.params.id, req.body, user.id, user.name);
      if (!updated) {
        return res.status(404).json({ error: 'Unit not found to update.' });
      }
      await flushDatabase();
      res.json(updated);
    } catch (error) {
      console.error('[UNITS] Failed to persist updated unit:', error);
      res.status(500).json({ error: 'Unable to persist the unit update.' });
    }
  });

  app.delete('/api/units/:id', requireAdmin, requireDurableUnitStorage, refreshUnitStorage, async (req: Request, res: Response) => {
    const user = (req as any).user;
    try {
      const success = db.deleteUnit(req.params.id, user.id, user.name);
      if (!success) {
        return res.status(404).json({ error: 'Unit was not found or could not be deleted.' });
      }
      await flushDatabase();
      res.json({ success: true, message: 'Unit was successfully unlisted.' });
    } catch (error) {
      console.error('[UNITS] Failed to persist deleted unit:', error);
      res.status(500).json({ error: 'Unable to persist the unit deletion.' });
    }
  });

  // 3. BOOKINGS MODULE
  app.get('/api/bookings', requireAuth, (req: Request, res: Response) => {
    const user = (req as any).user;
    if (user.role === 'admin') {
      res.json(bookingService.getBookings());
    } else {
      res.json(bookingService.getUserBookings(user.id));
    }
  });

  app.post('/api/bookings', requireAuth, (req: Request, res: Response) => {
    const user = db.findUserById((req as any).user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    if (user.role !== 'resident') {
      return res.status(403).json({ error: 'Only resident accounts can create bookings.' });
    }

    const { unitId, startDate, endDate, totalPrice, guestsCount, notes } = req.body;
    const missing = validateFields(req.body, ['unitId', 'startDate', 'endDate', 'totalPrice']);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing mandatory fields: ${missing.join(', ')}.` });
    }

    if (!isNonEmptyString(unitId) || !isNonEmptyString(startDate) || !isNonEmptyString(endDate)) {
      return res.status(400).json({ error: 'unitId, startDate, and endDate must be valid strings.' });
    }

    const parsedStart = new Date(startDate.trim());
    const parsedEnd = new Date(endDate.trim());
    if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime()) || parsedEnd <= parsedStart) {
      return res.status(400).json({ error: 'Booking dates must be valid, and endDate must be after startDate.' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parsedStart < today) {
      return res.status(400).json({ error: 'Bookings cannot start in the past.' });
    }

    const durationDays = Math.ceil((parsedEnd.getTime() - parsedStart.getTime()) / (1000 * 60 * 60 * 24));
    if (durationDays > 365) {
      return res.status(400).json({ error: 'Booking duration cannot exceed 365 days.' });
    }

    const governmentIdStatus = getGovernmentIdStatusForUser(user);
    if (governmentIdStatus !== 'verified') {
      return res.status(403).json({ error: 'Government ID verification is required before you can make a booking.' });
    }

    const unit = db.findUnitById(unitId);
    if (!unit) {
      return res.status(404).json({ error: 'The requested unit does not exist.' });
    }

    const serverCalculatedTotal = calculateBookingTotal(unit.price, startDate.trim(), endDate.trim());
    const priceValue = parseNumber(totalPrice, -1);
    if (priceValue <= 0) {
      return res.status(400).json({ error: 'totalPrice must be a valid number.' });
    }
    if (Math.abs(priceValue - serverCalculatedTotal) > 0.01) {
      return res.status(400).json({
        error: 'Booking total does not match the server-calculated price.',
        expectedTotal: serverCalculatedTotal,
        receivedTotal: priceValue
      });
    }

    if (unit.status !== 'Available') {
      return res.status(400).json({ error: 'This unit is currently unavailable for booking.' });
    }

    const guestCount = Number(guestsCount);
    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > unit.capacity) {
      return res.status(400).json({ error: `guestsCount must be a whole number between 1 and ${unit.capacity}.` });
    }

    if (db.hasOverlappingActiveBooking(unit.id, startDate.trim(), endDate.trim())) {
      return res.status(409).json({ error: 'This unit already has an active booking during the selected dates.' });
    }

    const booking = bookingService.createBooking({
      unitId,
      residentId: user.id,
      startDate: startDate.trim(),
      endDate: endDate.trim(),
      totalPrice: serverCalculatedTotal,
      guestsCount: guestCount,
      notes: isNonEmptyString(notes) ? notes.trim() : ''
    });

    res.status(201).json(booking);
  });

  app.put('/api/bookings/:id/status', requireAuth, (req: Request, res: Response) => {
    const user = (req as any).user;
    const { status } = req.body;

    if (!['Approved', 'Rejected', 'Cancelled', 'Completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid booking status request.' });
    }

    const booking = bookingService.findBookingById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Reservation ticket not found.' });
    }

    // Authorization checks
    if (user.role !== 'admin' && booking.residentId !== user.id) {
      return res.status(403).json({ error: 'Access denied. You can only alter your own reservations.' });
    }

    if (user.role !== 'admin') {
      if (status !== 'Cancelled' || booking.status !== 'Pending') {
        return res.status(403).json({ error: 'Residents may only cancel their own pending bookings.' });
      }
    }

    if (user.role === 'admin') {
      const allowedTransitions: Record<string, string[]> = {
        Pending: ['Approved', 'Rejected', 'Cancelled'],
        Approved: ['Completed', 'Cancelled'],
        'Partially Paid': ['Completed', 'Cancelled'],
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

  // 4. PAYMENTS MODULE
  app.get('/api/payments', requireAuth, (req: Request, res: Response) => {
    const user = (req as any).user;
    if (user.role === 'admin') {
      res.json(paymentService.getPayments());
    } else {
      res.json(paymentService.getUserPayments(user.id));
    }
  });

  app.post('/api/payments/:id/pay', sensitiveMutationRateLimit, requireAuth, (req: Request, res: Response) => {
    const user = (req as any).user;
    const { method, amount } = req.body;
    const missing = validateFields(req.body, ['amount']);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing payment field: ${missing.join(', ')}.` });
    }

    const normalizedMethod = String(method ?? 'Cash').trim();
    if (normalizedMethod.toLowerCase() !== 'cash') {
      return res.status(400).json({ error: 'Cash payment only. Please settle in person at the property office or with the Gales cashier.' });
    }

    const amountValue = parseNumber(amount, -1);
    if (amountValue <= 0) {
      return res.status(400).json({ error: 'Payment amount must be a valid positive number.' });
    }

    let paymentRecord = paymentService.getPayments().find((p: any) => p.id === req.params.id)
      || paymentService.getPayments().find((p: any) => p.bookingId === req.params.id);

    if (!paymentRecord) {
      const booking = bookingService.findBookingById(req.params.id);
      if (booking) {
        paymentRecord = paymentService.ensureBookingPayment(booking);
      }
    }

    if (!paymentRecord) {
      return res.status(404).json({ error: 'No payment ledger was found for this booking. Please ensure the booking exists and try again.' });
    }

    if (user.role !== 'admin' && paymentRecord.residentId !== user.id) {
      return res.status(403).json({ error: 'Access denied. You can only pay your own invoices.' });
    }

    const remaining = Number(paymentRecord.remainingBalance ?? Math.max(0, Number(paymentRecord.totalAmount || paymentRecord.amount || 0) - Number(paymentRecord.paidAmount || 0)));
    if (amountValue > remaining) {
      return res.status(400).json({ error: 'Payment amount exceeds the remaining balance.' });
    }
    if (paymentRecord.status === 'Paid') {
      return res.status(400).json({ error: 'This payment ledger is already fully settled.' });
    }

    const generatedReference = paymentService.generateCashReference(paymentRecord.id);
    const payment = paymentService.submitPayment(
      paymentRecord.id,
      'Cash',
      generatedReference,
      amountValue,
      user.id,
      user.name
    );

    if (!payment) {
      return res.status(400).json({ error: 'Unable to apply the cash payment. Please check the remaining balance and try again.' });
    }

    res.json(payment);
  });

  // 4b. PUBLIC PAYMENTS SANDBOX (QR CODE REAL-WORLD PH SIMULATION)
  app.get('/api/public/payments/:id', requireAuth, (req: Request, res: Response) => {
    const payment = paymentService.getPayments().find((p: any) => p.id === req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Invoice ledger entity not found.' });
    }

    const user = (req as any).user;
    if (user.role !== 'admin' && payment.residentId !== user.id) {
      return res.status(403).json({ error: 'Access denied. You can only view your own payment information.' });
    }

    const { residentName: _residentName, unitName: _unitName, ...safePayment } = payment;
    res.json(safePayment);
  });

  app.post('/api/public/payments/:id/pay', (req: Request, res: Response) => {
    res.status(403).json({ error: 'Public payment mutation is disabled. Use the authenticated payment endpoint.' });
  });

  app.post('/api/payments/manual', sensitiveMutationRateLimit, requireAdmin, (req: Request, res: Response) => {
    const user = (req as any).user;
    const { residentId, unitName, amount, status, method } = req.body;

    if (!residentId || !amount) {
      return res.status(400).json({ error: 'Please specify target residentId and billing amount.' });
    }

    const payment = paymentService.generateManualPayment({
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
    res.json(notificationService.getNotifications(user.id, user.role));
  });

  app.post('/api/notifications/read/:id', requireAuth, (req: Request, res: Response) => {
    const user = (req as any).user;
    const success = notificationService.markAsRead(req.params.id, user.id, user.role);
    res.json({ success });
  });

  app.post('/api/notifications/read-all', requireAuth, (req: Request, res: Response) => {
    const user = (req as any).user;
    notificationService.markAllAsRead(user.id, user.role);
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

    const notif = notificationService.enqueue({
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

  // Lightweight health check for Render / load balancers
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  // Diagnostic endpoint for troubleshooting database loading on production
  app.get('/api/diagnostics/db-status', requireAdmin, (_req: Request, res: Response) => {
    const diag = db.getDiagnostics();
    res.status(200).json({ status: 'ok', counts: diag.database });
  });

  // Server-Sent Events stream for realtime updates (requires token query or Bearer header)
  app.get('/api/events', (req: Request, res: Response) => {
    const token = (req.query.token && String(req.query.token).trim()) || (String(req.headers.authorization || '').startsWith('Bearer ') ? String(req.headers.authorization).split(' ')[1] : '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required for event stream.' });
    }

    let claims: jwt.JwtPayload;
    try {
      claims = jwt.verify(token, JWT_SECRET, {
        issuer: 'one-spatial-iloilo',
        audience: 'one-spatial-portal'
      }) as jwt.JwtPayload;
    } catch {
      return res.status(401).json({ error: 'Invalid or expired event stream token.' });
    }

    const user = db.findUserById(typeof claims.sub === 'string' ? claims.sub : '');
    if (!user) return res.status(401).json({ error: 'Invalid event stream token.' });

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
  app.post('/api/chatbot', sensitiveMutationRateLimit, async (req: Request, res: Response) => {
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
          reply = "The Zenith Suite is a signature 1-Bedroom Loft offered by Gales Urban Haven at ₱120.00/night. It's fully furnished with a Queen Bed, kitchenette, Wi-Fi, and a widescreen TV, perfect for young professionals or students who want convenience near Mandurriao, Iloilo City.";
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
1. Online reservations (e.g., "The Zenith Suite", a premium 1-Bedroom Loft on Floor 4, rate of ₱120.00/night, sleeps up to 3, furnished with modern Wi-Fi, Queen Bed, Kitchenette, and TV).
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

  app.use('/data/private', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'Private files are not publicly accessible.' });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
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

  return app;
}

if (process.env.VERCEL !== '1') {
  createApp().then((app) => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Express Condominium App listening at HTTP on Port ${PORT}`);
    });
  }).catch(err => {
    console.error('CRITICAL: Server startup failure:', err);
  });
}
