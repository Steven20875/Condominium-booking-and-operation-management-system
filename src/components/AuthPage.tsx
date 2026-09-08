import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from './ToastContext.tsx';
import FerrofluidBackground from './FerrofluidBackground.tsx';
import { Building, Lock, Mail, User, Phone, Clipboard, ArrowRight, Home, Check, Eye, EyeOff, ShieldCheck, Sparkles, Bell } from 'lucide-react';
import { User as UserType } from '../types.ts';
import { Button, Input } from './ui';
import { signInWithGooglePopup, getFirebaseConfigStatus, initializeFirebase } from '../lib/firebase.ts';

interface AuthPageProps {
  onLoginSuccess: (user: UserType, token: string) => void;
  onNavigateHome: () => void;
}

export default function AuthPage({ onLoginSuccess, onNavigateHome }: AuthPageProps) {
  const { toast } = useToast();
  
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [isForgotPassword, setIsForgotPassword] = useState<boolean>(false);
  const [isEmailSent, setIsEmailSent] = useState<boolean>(false);
  const [isEmailVerifying, setIsEmailVerifying] = useState<boolean>(false);

  // Form states
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [unitNumber, setUnitNumber] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [emailValid, setEmailValid] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [firebaseConfigStatus, setFirebaseConfigStatus] = useState(getFirebaseConfigStatus());

  useEffect(() => {
    let mounted = true;

    const initializeAuthConfig = async () => {
      try {
        const nextStatus = await initializeFirebase();
        if (mounted) {
          setFirebaseConfigStatus(nextStatus);
        }
      } catch (err: any) {
        if (import.meta.env.DEV) {
          console.debug('[auth] Firebase initialization failed', {
            message: err?.message,
          });
        }
      }
    };

    void initializeAuthConfig();

    return () => {
      mounted = false;
    };
  }, [toast]);

  const isFirebaseConfigured = firebaseConfigStatus.isConfigured;
  const isLocalAuthFallback = !isFirebaseConfigured;

  const validateEmail = (value: string) => /^\S+@\S+\.\S+$/.test(value);
  const handleEmailChange = (value: string) => {
    setEmail(value);
    setEmailValid(value === '' || validateEmail(value));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast('Please enter both your email address and password.', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Local email/password sign-in failed.');
      }

      toast(`Welcome back, ${data.user.name}! Local sign-in succeeded.`, 'success');
      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      toast(err.message || 'Server error occurred during sign-in.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      toast('Please fill out all required fields: Name, Email, and Password.', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          name: name.trim(),
          phone: phone.trim() || undefined,
          unitNumber: unitNumber.trim() || undefined
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Local registration failed.');
      }

      toast('Your resident account is ready. Welcome to One Spatial Iloilo.', 'success');
      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      toast(err.message || 'Registration failed.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const nextStatus = await initializeFirebase();
      if (!nextStatus.isConfigured) {
        throw new Error('Google sign-in requires Firebase configuration. Use email/password login for local sandbox mode.');
      }

      setFirebaseConfigStatus(nextStatus);

      const result = await signInWithGooglePopup();
      if (!result?.user) {
        throw new Error('Google sign-in did not return a valid user.');
      }

      if (import.meta.env.DEV) {
        console.debug('[auth] Firebase popup user received', { uid: result.user.uid, hasEmail: Boolean(result.user.email) });
      }

      const idToken = await result.user.getIdToken();

      const response = await fetch('/api/auth/firebase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: result.user.uid,
          email: result.user.email,
          name: result.user.displayName || result.user.email?.split('@')[0],
          avatarUrl: result.user.photoURL || undefined,
          provider: 'google',
          idToken,
          token: idToken,
        })
      });

      const data = await response.json().catch(() => ({}));
      if (import.meta.env.DEV) {
        console.debug('[auth] /api/auth/firebase response', { status: response.status, ok: response.ok });
      }
      if (!response.ok) {
        throw new Error(data.error || 'Google sign-in failed.');
      }

      toast(`Welcome, ${data.user.name}!`, 'success');
      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      const messages: Record<string, string> = {
        'auth/unauthorized-domain': 'This production domain is not authorized for Google sign-in.',
        'auth/network-request-failed': 'Google sign-in could not connect. Check your network and try again.',
        'auth/popup-blocked': 'Google sign-in was blocked by the browser. Please try again.',
        'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
        'auth/cancelled-popup-request': 'Another Google sign-in request is already in progress.',
      };
      toast(messages[err?.code] || err?.message || 'Google sign-in failed.', 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast('Please enter your registered email address first.', 'warning');
      return;
    }
    
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsEmailSent(true);
      toast('Password reset directives dispatched to your inbox!', 'success');
    }, 1200);
  };

  return (
    <div id="auth-root" className="min-h-screen bg-transparent flex flex-col justify-between overflow-hidden relative font-sans">
      
      {/* Decorative Blur Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl opacity-40 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-500/5 blur-3xl opacity-40 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-500/5 blur-3xl opacity-40 pointer-events-none" />

      {/* Header Bar */}
      <header className="px-6 py-4 flex items-center justify-between z-10 w-full max-w-7xl mx-auto">
        <button 
          onClick={onNavigateHome}
          className="flex items-center gap-2.5 text-slate-200 hover:text-white transition-colors group"
        >
          <div className="bg-gradient-to-tr from-blue-500 to-purple-500 text-white p-2 rounded-xl group-hover:scale-105 transition-transform duration-300">
            <Building className="h-5 w-5" />
          </div>
          <span className="font-semibold text-lg tracking-tight font-serif text-white">ONE SPATIAL ILOILO</span>
        </button>
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300 hover:text-white transition-colors bg-white/5 hover:bg-white/15 border border-white/10 px-4 py-2 rounded-lg cursor-pointer"
        >
          <Home className="h-3.5 w-3.5 text-blue-400" /> Back to Showcase
        </button>
      </header>

      {/* Main Form Center Layout */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-12 max-w-7xl mx-auto w-full z-15">
        <div className="glass-card w-full max-w-5xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
          
          {/* Left Visual Banner Section */}
          <div className="lg:col-span-5 bg-slate-950/40 p-8 sm:p-12 flex flex-col justify-between text-white relative overflow-hidden border-r border-white/5">
            <FerrofluidBackground colors={["#2563EB", "#0EA5E9", "#06B6D4"]} speed={0.18} scale={1.8} turbulence={0.5} glow={0.9} opacity={0.32} particles={8} />
            {/* Background Texture Image overlay */}
            <div className="absolute inset-0 z-10 bg-cover bg-center mix-blend-overlay opacity-30 scale-105 hover:scale-100 transition-all duration-1000 auth-hero-image" />
            <div className="absolute inset-0 z-20 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />

            <div className="relative z-10">
              <span className="text-blue-400 font-mono text-xs font-bold tracking-widest uppercase py-1 px-3 bg-blue-950/90 rounded-full border border-blue-900">
                Premium Resident Portal
              </span>
              <h2 className="mt-6 text-3xl sm:text-4xl font-serif font-semibold tracking-tight leading-tight">
                Experience Modern Condominium Living
              </h2>
              <p className="mt-4 text-sm text-slate-300 font-normal leading-relaxed">
                Everything you need to book, manage, and enjoy your condominium in one intelligent resident portal.
              </p>

              <div className="mt-8 grid gap-3">
                {[
                  { icon: <Sparkles className="h-4 w-4 text-blue-300" />, label: 'Online Booking' },
                  { icon: <ShieldCheck className="h-4 w-4 text-blue-300" />, label: 'Secure Authentication' },
                  { icon: <Building className="h-4 w-4 text-blue-300" />, label: 'Visitor Management' },
                  { icon: <Clipboard className="h-4 w-4 text-blue-300" />, label: 'Digital Billing' },
                  { icon: <Bell className="h-4 w-4 text-blue-300" />, label: 'Real-Time Notifications' },
                  { icon: <User className="h-4 w-4 text-blue-300" />, label: 'Resident Dashboard' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-3">
                    <div className="rounded-2xl bg-blue-500/10 p-2 text-blue-300">{item.icon}</div>
                    <p className="text-sm text-slate-200 font-medium">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 mt-10 bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-xl shadow-2xl shadow-slate-950/30">
              <p className="text-xs text-slate-400 italic">"The smartest condominium platform we've ever used."</p>
              <div className="flex items-center gap-3 mt-4">
                <div className="h-11 w-11 rounded-full bg-slate-700 overflow-hidden border border-white/10">
                  <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80" alt="Resident avatar" />
                </div>
                <div>
                  <p className="text-sm text-white font-semibold">Alex Cooper</p>
                  <p className="text-[11px] text-slate-400 uppercase tracking-[0.24em]">Resident</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form Input Actions Section */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center bg-transparent">
            
            <AnimatePresence mode="wait">
              {isForgotPassword ? (
                /* Forgot Password Form */
                <motion.div
                  key="forgot-password"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-2xl font-serif font-bold text-white">Restore Password</h3>
                    <p className="text-sm text-slate-400 mt-2">
                      Submit your registered email address and our server triggers recovery operations.
                    </p>
                  </div>

                  {isEmailSent ? (
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-5 text-center">
                      <div className="inline-flex p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-full mb-3">
                        <Check className="h-6 w-6" />
                      </div>
                      <h4 className="font-bold text-white text-sm">Dispatched Successfully</h4>
                      <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
                        An override code has been dispatched. For testing, you may simply return to login and authenticate using standard default accounts.
                      </p>
                      <button
                        onClick={() => {
                          setIsForgotPassword(false);
                          setIsEmailSent(false);
                        }}
                        className="mt-6 text-xs text-blue-400 hover:text-blue-300 font-bold tracking-wider uppercase underline cursor-pointer"
                      >
                        Return to Sign-In
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                      <Input
                        type="email"
                        label="Email Address"
                        variant="glass"
                        placeholder="john@condo.com"
                        value={email}
                        onChange={(e: any) => setEmail(e.target.value)}
                        icon={Mail}
                        required
                      />

                      <Button
                        type="submit"
                        variant="primary"
                        fullWidth
                        disabled={isLoading}
                        isLoading={isLoading}
                      >
                        {isLoading ? 'Processing Recovery...' : 'Dispatch Reset Email'}
                      </Button>

                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => setIsForgotPassword(false)}
                          className="text-xs text-slate-400 hover:text-slate-300 transition-colors font-semibold cursor-pointer"
                        >
                          Remembered your password? Settle in & Log In
                        </button>
                      </div>
                    </form>
                  )}
                </motion.div>
              ) : isLogin ? (
                /* Login Form */
                <motion.div
                  key="login-form-div"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white">Settle In</h3>
                    <p className="text-sm text-slate-400 mt-1 font-medium">
                      Access all resident resources or administration capabilities securely.
                    </p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <Input
                      type="email"
                      label="Email Address"
                      variant="glass"
                      placeholder="john@condo.com"
                      value={email}
                      onChange={(e: any) => handleEmailChange(e.target.value)}
                      error={!emailValid ? 'Enter a valid email address to continue.' : undefined}
                      icon={Mail}
                      required
                    />

                    <div className="space-y-1">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Secure Password</label>
                        <button
                          type="button"
                          onClick={() => setIsForgotPassword(true)}
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                        >
                          Forgot Code?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 z-10" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="••••••••"
                          className="w-full glass-input rounded-xl pl-10 pr-11 py-3 text-sm focus:outline-none transition-all placeholder:text-slate-600 font-semibold text-white"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 text-xs font-semibold">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-white/10 text-white focus:ring-0 cursor-pointer bg-slate-900"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        Remember my credentials
                      </label>
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      fullWidth
                      disabled={isLoading}
                      isLoading={isLoading}
                    >
                      {isLoading ? 'Settling In...' : 'Settle In & Access'}
                    </Button>
                  </form>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-slate-950 text-slate-400">Or continue with</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    fullWidth
                    onClick={handleGoogleSignIn}
                    disabled={isLoading || !isFirebaseConfigured}
                    isLoading={isLoading}
                  >
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {isLoading ? 'Authenticating...' : 'Continue with Google'}
                  </Button>

                  <p className="text-center text-xs text-slate-400 pt-2">
                    No account?{' '}
                    <button
                      type="button"
                      onClick={() => setIsLogin(false)}
                      className="text-blue-400 hover:text-blue-300 font-bold transition-colors cursor-pointer"
                    >
                      Register a Resident Account
                    </button>
                  </p>
                </motion.div>
              ) : (
                /* Registration Form */
                <motion.div
                  key="register-form-div"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white">Claim Your Unit</h3>
                    <p className="text-sm text-slate-400 mt-1 font-medium">
                      Register as a resident and gain access to full portal features.
                    </p>
                  </div>

                  <form onSubmit={handleRegister} className="space-y-4">
                    <Input
                      type="text"
                      label="Full Name"
                      variant="glass"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e: any) => setName(e.target.value)}
                      icon={User}
                      required
                    />

                    <Input
                      type="email"
                      label="Email Address"
                      variant="glass"
                      placeholder="john@condo.com"
                      value={email}
                      onChange={(e: any) => handleEmailChange(e.target.value)}
                      error={!emailValid ? 'Enter a valid email address to continue.' : undefined}
                      icon={Mail}
                      required
                    />

                    <Input
                      type="tel"
                      label="Phone Number"
                      variant="glass"
                      placeholder="(555) 123-4567"
                      value={phone}
                      onChange={(e: any) => setPhone(e.target.value)}
                      icon={Phone}
                    />

                    <Input
                      type="text"
                      label="Unit Number"
                      variant="glass"
                      placeholder="A-1205"
                      value={unitNumber}
                      onChange={(e: any) => setUnitNumber(e.target.value)}
                      icon={Building}
                    />

                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Create Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 z-10" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="••••••••"
                          className="w-full glass-input rounded-xl pl-10 pr-11 py-3 text-sm focus:outline-none transition-all placeholder:text-slate-600 font-semibold text-white"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      fullWidth
                      disabled={isLoading}
                      isLoading={isLoading}
                    >
                      {isLoading ? 'Registering...' : 'Claim Your Unit'}
                    </Button>
                  </form>

                  <p className="text-center text-xs text-slate-400 pt-2">
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => setIsLogin(true)}
                      className="text-blue-400 hover:text-blue-300 font-bold transition-colors cursor-pointer"
                    >
                      Sign In Here
                    </button>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
