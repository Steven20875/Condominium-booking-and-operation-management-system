import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendEmailVerification,
  reload,
  type Auth,
  type UserCredential,
  type User as FirebaseUser,
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
    if (import.meta.env.DEV) {
      console.debug('[firebase] Initializing Firebase app...');
    }
    app = initializeApp(firebaseConfig);
    if (import.meta.env.DEV) {
      console.debug('[firebase] Active Firebase projectId:', firebaseConfig.projectId);
      console.debug('[firebase] Active Firebase authDomain:', firebaseConfig.authDomain);
    }
  }

  if (!authInstance) {
    authInstance = getAuth(app);
    if (import.meta.env.DEV) {
      console.debug('[firebase] Auth initialized successfully');
    }
  }

  if (!googleProviderInstance) {
    googleProviderInstance = new GoogleAuthProvider();
    googleProviderInstance.addScope('profile');
    googleProviderInstance.addScope('email');
    googleProviderInstance.setCustomParameters({
      prompt: 'select_account',
    });
    if (import.meta.env.DEV) {
      console.debug('[firebase] Google provider initialized successfully');
    }
  }
}

async function loadFirebaseConfigFromServer() {
  if (typeof window === 'undefined') {
    return;
  }

  if (import.meta.env.DEV) {
    console.debug('[firebase] Loading environment variables');
  }
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

  if (import.meta.env.DEV) {
    console.debug('[firebase] Firebase config resolved', {
      projectId: resolvedConfig.projectId,
      authDomain: resolvedConfig.authDomain,
      hasApiKey: hasConfigValue(resolvedConfig.apiKey),
      hasAppId: hasConfigValue(resolvedConfig.appId),
    });
  }

  if (requiredConfigKeys.every((key) => hasConfigValue(resolvedConfig[key]))) {
    window.__FIREBASE_CONFIG__ = resolvedConfig;
    firebaseConfig = resolvedConfig;
    missingConfigKeys = [];
    isConfigComplete = true;
    initializeFirebaseAuth();
    if (import.meta.env.DEV) {
      console.debug('[firebase] Firebase initialized successfully');
    }
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
          if (import.meta.env.DEV) {
            console.debug('[firebase] Firebase initialized successfully');
          }
        }
      }
    }
  } catch {
    firebaseConfig = resolvedConfig;
    missingConfigKeys = requiredConfigKeys.filter((key) => !hasConfigValue(resolvedConfig[key]));
    isConfigComplete = missingConfigKeys.length === 0;
    initializeFirebaseAuth();
    if (isConfigComplete) {
      if (import.meta.env.DEV) {
        console.debug('[firebase] Firebase initialized successfully');
      }
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

export async function sendFirebaseEmailVerification(user: FirebaseUser) {
  await initializeFirebase();

  const auth = getAuthInstance();

  if (!auth) {
    throw new Error('Firebase authentication is not configured.');
  }

  if (!user) {
    throw new Error('Firebase user is not available.');
  }

  try {
    await sendEmailVerification(user);

    console.log('[firebase] Verification email sent successfully', {
      email: user.email,
      uid: user.uid,
    });

    return true;
  } catch (error: any) {
    console.error('[firebase] Verification email failed', {
      code: error?.code,
      message: error?.message,
    });

    throw error;
  }
}

export async function refreshFirebaseEmailVerification() {
  const auth = getAuthInstance();
  if (!auth?.currentUser) {
    throw new Error('Firebase account is not available.');
  }

  await reload(auth.currentUser);
  return {
    user: auth.currentUser,
    emailVerified: Boolean(auth.currentUser?.emailVerified),
    idToken: await auth.currentUser?.getIdToken(true),
  };
}

export async function signInWithGooglePopup(): Promise<UserCredential> {
  await initializeFirebase();
  const auth = getAuthInstance();
  const provider = getGoogleProvider();
  if (!auth || !provider) {
    throw new Error('Firebase authentication is not configured.');
  }

  if (import.meta.env.DEV) {
    console.debug('[firebase] Opening Google sign-in popup...');
  }

  const result = await signInWithPopup(auth, provider);

  if (import.meta.env.DEV) {
    console.debug('[firebase] Google popup result', { hasUser: Boolean(result?.user), uid: result?.user?.uid });
  }

  return result;
}

export async function getGoogleIdTokenFromPopup(): Promise<string> {
  const result = await signInWithGooglePopup();
  return result.user.getIdToken();
}

export function getCurrentFirebaseUser() {
  const auth = getAuthInstance();
  return auth ? auth.currentUser : null;
}

export function watchFirebaseAuthState(callback: (user: FirebaseUser | null) => void) {
  const auth = getAuthInstance();
  if (!auth) {
    callback(null);
    return () => undefined;
  }

  return onAuthStateChanged(auth, (user) => {
    if (import.meta.env.DEV) {
      console.debug('[firebase] Auth state changed', { hasUser: Boolean(user), uid: user?.uid ?? null });
    }
    callback(user);
  });
}

export async function signOutFirebaseSession() {
  const auth = getAuthInstance();
  if (!auth) {
    return;
  }

  await firebaseSignOut(auth);
}
