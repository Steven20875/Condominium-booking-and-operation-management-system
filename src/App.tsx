import React, { useState, useEffect, useCallback } from 'react';
import { ToastProvider, useToast } from './components/ToastContext.tsx';
import LandingPage from './components/LandingPage.tsx';
import AuthPage from './components/AuthPage.tsx';
import ResidentDashboard from './components/ResidentDashboard.tsx';
import AdminDashboard from './components/AdminDashboard.tsx';
import AmbientBackground from './components/AmbientBackground.tsx';
import { User } from './types.ts';
import Chatbot from './components/Chatbot.tsx';
import { signOutFirebaseSession, watchFirebaseAuthState } from './lib/firebase.ts';

/**
 * Split Content component to ensure context hooks are safely located under the ToastProvider tree
 */
function AppContent() {
  const { toast } = useToast();

  // App routing views: 'landing' | 'auth'
  const [currentView, setCurrentView] = useState<'landing' | 'auth'>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [pendingBookingRedirect, setPendingBookingRedirect] = useState<boolean>(false);

  // Restore authenticated session from localStorage
  useEffect(() => {
    const controller = new AbortController();
    const timeoutHandle = window.setTimeout(() => {
      controller.abort();
      setIsInitializing(false);
    }, 4000);

    try {
      const savedToken = localStorage.getItem('vista_token');
      const savedUser = localStorage.getItem('vista_user');

      if (savedToken && savedUser) {
        setToken(savedToken);
        const parsedUser = JSON.parse(savedUser) as User;
        
        // Verify token is valid with backend auth me validation check
        fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${savedToken}` },
          signal: controller.signal
        })
          .then(async (res) => {
            const data = await res.json();
            if (res.ok && data.user) {
              setUser(data.user);
              localStorage.setItem('vista_user', JSON.stringify(data.user));
            } else {
              localStorage.removeItem('vista_token');
              localStorage.removeItem('vista_user');
              toast('Session expired. Please sign in again.', 'warning');
            }
          })
          .catch(() => {
            setUser(parsedUser);
          })
          .finally(() => {
            setIsInitializing(false);
            window.clearTimeout(timeoutHandle);
          });
      } else {
        setIsInitializing(false);
        window.clearTimeout(timeoutHandle);
      }
    } catch {
      setIsInitializing(false);
      window.clearTimeout(timeoutHandle);
    }

    return () => {
      window.clearTimeout(timeoutHandle);
      controller.abort();
    };
  }, [toast]);

  // Watch Firebase auth state changes for fallback session sync
  useEffect(() => {
    let active = true;

    const unsubscribe = watchFirebaseAuthState((firebaseUser) => {
      if (!active || !firebaseUser || !firebaseUser.email) {
        return;
      }

      const savedToken = localStorage.getItem('vista_token');
      if (savedToken) {
        return;
      }

      void firebaseUser.getIdToken().then((idToken) => fetch('/api/auth/firebase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Resident',
          avatarUrl: firebaseUser.photoURL || undefined,
          provider: 'google',
          idToken,
        }),
      }))
        .then(async (response) => {
          const data = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(data.error || 'Google sign-in failed.');
          }

          const loggedInUser = data.user as User;
          const sessionToken = String(data.token || '');
          if (!loggedInUser || !sessionToken) {
            return;
          }

          setUser(loggedInUser);
          setToken(sessionToken);
          setCurrentView('auth');
          localStorage.setItem('vista_token', sessionToken);
          localStorage.setItem('vista_user', JSON.stringify(loggedInUser));
        })
        .catch((error: any) => {
          if (import.meta.env.DEV) {
            console.debug('[app] Firebase auth state sync failed', {
              code: error?.code,
              message: error?.message,
            });
          }
        });
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [toast]);

  useEffect(() => {
    if (pendingBookingRedirect && user && token) {
      const timeoutHandle = window.setTimeout(() => {
        setPendingBookingRedirect(false);
      }, 0);

      return () => window.clearTimeout(timeoutHandle);
    }
  }, [pendingBookingRedirect, user, token]);

  const handleBookingRedirect = () => {
    setPendingBookingRedirect(true);

    if (user && token) {
      return;
    }

    setCurrentView('auth');
  };

  const handleLoginSuccess = useCallback((loggedInUser: User, sessionToken: string) => {
    setUser(loggedInUser);
    setToken(sessionToken);
    setCurrentView('auth');
    localStorage.setItem('vista_token', sessionToken);
    localStorage.setItem('vista_user', JSON.stringify(loggedInUser));
  }, []);

  const handleLogout = async () => {
    try {
      await signOutFirebaseSession();
    } catch {
      // Ignore sign-out issues and still clear local session.
    }

    setUser(null);
    setToken('');
    setPendingBookingRedirect(false);
    localStorage.removeItem('vista_token');
    localStorage.removeItem('vista_user');
    setCurrentView('auth');
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('vista_user', JSON.stringify(updatedUser));
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center text-white space-y-4 select-none">
        <div className="p-3 bg-white/10 border border-white/10 text-emerald-400 rounded-2xl animate-spin backdrop-blur-md">
          <svg className="h-6 w-6 stroke-emerald-400 fill-none" viewBox="0 0 24 24" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25"></circle>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
          </svg>
        </div>
        <p className="text-xs uppercase tracking-widest font-mono text-slate-400">Restoring Secure Tunnel...</p>
      </div>
    );
  }

  // Determine shown UI node depending on auth states and routes
  let viewContent: React.ReactNode;

  if (user && token) {
    if (user.role === 'admin') {
      viewContent = (
        <AdminDashboard 
          user={user} 
          token={token} 
          onLogout={handleLogout} 
        />
      );
    } else {
      viewContent = (
        <ResidentDashboard 
          user={user} 
          token={token} 
          onLogout={handleLogout} 
          onUpdateUser={handleUpdateUser}
          initialActiveTab={pendingBookingRedirect ? 'browse' : undefined}
        />
      );
    }
  } else {
    // Routing for unauthenticated public flow
    switch (currentView) {
      case 'auth':
        viewContent = (
          <AuthPage 
            onLoginSuccess={handleLoginSuccess} 
            onNavigateHome={() => setCurrentView('landing')} 
          />
        );
        break;
      case 'landing':
      default:
        viewContent = (
          <LandingPage 
            onLoginClick={() => setCurrentView('auth')} 
            onBrowseClick={handleBookingRedirect}
          />
        );
        break;
    }
  }

  return (
    <AmbientBackground>
      {viewContent}
      <Chatbot user={user} />
    </AmbientBackground>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
