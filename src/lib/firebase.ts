import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type Auth,
  type UserCredential,
} from 'firebase/auth';

type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
};

function hasConfigValue(value: string): boolean {
  return Boolean(value && value.trim() && !isPlaceholderValue(value));
}

declare global {
  interface Window {
    __FIREBASE_CONFIG__?: Partial<FirebaseConfig>;
  }
}

function getFirebaseConfig(): FirebaseConfig {
  const runtimeConfig = typeof window !== 'undefined' ? window.__FIREBASE_CONFIG__ : undefined;

  return {
    apiKey: runtimeConfig?.apiKey || import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: runtimeConfig?.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: runtimeConfig?.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: runtimeConfig?.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: runtimeConfig?.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: runtimeConfig?.appId || import.meta.env.VITE_FIREBASE_APP_ID || '',
    measurementId: runtimeConfig?.measurementId || import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
  };
}

function isPlaceholderValue(value: string): boolean {
  const normalized = value.trim();
  if (!normalized) {
    return true;
  }

  const placeholders = [
    'YOUR_FIREBASE_API_KEY',
    'YOUR_PROJECT_ID.firebaseapp.com',
    'YOUR_PROJECT_ID',
    'YOUR_PROJECT_ID.firebasestorage.app',
    'YOUR_MESSAGING_SENDER_ID',
    'YOUR_FIREBASE_APP_ID',
    'YOUR_MEASUREMENT_ID',
  ];

  return placeholders.includes(normalized) || /^REPLACE(_WITH)?_/i.test(normalized);
}

let firebaseConfig = getFirebaseConfig();
const requiredConfigKeys: Array<keyof FirebaseConfig> = ['apiKey', 'authDomain', 'projectId', 'appId'];
let missingConfigKeys = requiredConfigKeys.filter((key) => !firebaseConfig[key] || isPlaceholderValue(firebaseConfig[key]));
let isConfigComplete = missingConfigKeys.length === 0;

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let googleProviderInstance: GoogleAuthProvider | null = null;

function initializeFirebaseAuth() {
  if (typeof window === 'undefined') {
    return;
  }

  if (!isConfigComplete) {
    console.warn('[firebase] Skipping initialization because config is incomplete.', missingConfigKeys);
    app = null;
    authInstance = null;
    googleProviderInstance = null;
    return;
  }

  if (!app) {
    console.log('[firebase] Initializing Firebase app...');
    app = initializeApp(firebaseConfig);
    console.log('[firebase] Firebase config loaded', firebaseConfig);
    console.log('[firebase] Active Firebase projectId:', firebaseConfig.projectId);
  }

  if (!authInstance) {
    authInstance = getAuth(app);
    console.log('[firebase] Auth initialized successfully');
  }

  if (!googleProviderInstance) {
    googleProviderInstance = new GoogleAuthProvider();
    googleProviderInstance.addScope('profile');
    googleProviderInstance.addScope('email');
    googleProviderInstance.setCustomParameters({
      prompt: 'select_account',
    });
    console.log('[firebase] Google provider initialized successfully');
  }
}

async function loadFirebaseConfigFromServer() {
  if (typeof window === 'undefined') {
    return;
  }

  console.log('[firebase] Loading environment variables');
  const runtimeConfig = window.__FIREBASE_CONFIG__;
  const envConfig = getFirebaseConfig();
  const resolvedConfig = {
    apiKey: runtimeConfig?.apiKey || envConfig.apiKey || '',
    authDomain: runtimeConfig?.authDomain || envConfig.authDomain || '',
    projectId: runtimeConfig?.projectId || envConfig.projectId || '',
    storageBucket: runtimeConfig?.storageBucket || envConfig.storageBucket || '',
    messagingSenderId: runtimeConfig?.messagingSenderId || envConfig.messagingSenderId || '',
    appId: runtimeConfig?.appId || envConfig.appId || '',
    measurementId: runtimeConfig?.measurementId || envConfig.measurementId || '',
  };

  console.log('[firebase] Firebase config loaded', resolvedConfig);

  if (requiredConfigKeys.every((key) => hasConfigValue(resolvedConfig[key]))) {
    window.__FIREBASE_CONFIG__ = resolvedConfig;
    firebaseConfig = resolvedConfig;
    missingConfigKeys = [];
    isConfigComplete = true;
    initializeFirebaseAuth();
    console.log('[firebase] Firebase initialized successfully');
    return;
  }

  try {
    const response = await fetch('/api/config/firebase');
    if (response.ok) {
      const payload = await response.json();
      const serverConfig = payload?.firebase || payload;
      if (serverConfig) {
        const mergedConfig = {
          apiKey: serverConfig.apiKey || resolvedConfig.apiKey || '',
          authDomain: serverConfig.authDomain || resolvedConfig.authDomain || '',
          projectId: serverConfig.projectId || resolvedConfig.projectId || '',
          storageBucket: serverConfig.storageBucket || resolvedConfig.storageBucket || '',
          messagingSenderId: serverConfig.messagingSenderId || resolvedConfig.messagingSenderId || '',
          appId: serverConfig.appId || resolvedConfig.appId || '',
          measurementId: serverConfig.measurementId || resolvedConfig.measurementId || '',
        };

        window.__FIREBASE_CONFIG__ = mergedConfig;
        firebaseConfig = mergedConfig;
        missingConfigKeys = requiredConfigKeys.filter((key) => !hasConfigValue(mergedConfig[key]));
        isConfigComplete = missingConfigKeys.length === 0;
        initializeFirebaseAuth();
        if (isConfigComplete) {
          console.log('[firebase] Firebase initialized successfully');
        }
      }
    }
  } catch {
    firebaseConfig = resolvedConfig;
    missingConfigKeys = requiredConfigKeys.filter((key) => !hasConfigValue(resolvedConfig[key]));
    isConfigComplete = missingConfigKeys.length === 0;
    initializeFirebaseAuth();
    if (isConfigComplete) {
      console.log('[firebase] Firebase initialized successfully');
    }
  }
}

export function getAuthInstance() {
  if (!authInstance) {
    initializeFirebaseAuth();
  }
  return authInstance;
}

export function getGoogleProvider() {
  if (!googleProviderInstance) {
    initializeFirebaseAuth();
  }
  return googleProviderInstance;
}

export function getFirebaseConfigStatus() {
  return {
    isConfigured: isConfigComplete,
    missingKeys: missingConfigKeys,
  };
}

export async function initializeFirebase() {
  await loadFirebaseConfigFromServer();
  const status = getFirebaseConfigStatus();
  if (status.isConfigured) {
    initializeFirebaseAuth();
  }
  return status;
}

export const isFirebaseConfigured = isConfigComplete;

initializeFirebaseAuth();
void initializeFirebase();

export async function signInWithEmailPassword(email: string, password: string) {
  await initializeFirebase();
  const auth = getAuthInstance();
  if (!auth) {
    throw new Error('Firebase authentication is not configured.');
  }

  return signInWithEmailAndPassword(auth, email, password);
}

export async function createAccountWithEmailPassword(email: string, password: string) {
  await initializeFirebase();
  const auth = getAuthInstance();
  if (!auth) {
    throw new Error('Firebase authentication is not configured.');
  }

  return createUserWithEmailAndPassword(auth, email, password);
}

export async function signInWithGoogle() {
  await initializeFirebase();
  const auth = getAuthInstance();
  const provider = getGoogleProvider();
  if (!auth || !provider) {
    throw new Error('Firebase authentication is not configured.');
  }

  try {
    return await signInWithPopup(auth, provider);
  } catch (error: any) {
    if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/popup-closed-by-user' || error?.message?.includes('popup')) {
      await signInWithRedirect(auth, provider);
      return null as unknown as UserCredential;
    }

    throw error;
  }
}

export async function getGoogleRedirectResult() {
  const auth = getAuthInstance();
  if (!auth) {
    return null;
  }

  return getRedirectResult(auth);
}

export async function signOutFirebaseSession() {
  const auth = getAuthInstance();
  if (!auth) {
    return;
  }

  await firebaseSignOut(auth);
}
