import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from './ToastContext.tsx';
import { Building, Lock, Mail, User, ArrowRight, Home, Check, Eye, EyeOff } from 'lucide-react';
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
  const [registrationSuccess, setRegistrationSuccess] = useState<{ user: UserType; token: string } | null>(null);

  // Form states
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [recoveryEmail, setRecoveryEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
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

  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const passwordStrength = Object.values(passwordChecks).filter(Boolean).length >= 5
    ? 'Strong'
    : Object.values(passwordChecks).filter(Boolean).length >= 3
      ? 'Fair'
      : 'Weak';
  const registrationErrors = {
    name: !name.trim() ? 'Full Name is required.' : '',
    password: Object.values(passwordChecks).every(Boolean) ? '' : 'Password does not meet all requirements.',
    confirmPassword: confirmPassword && confirmPassword !== password ? 'Passwords do not match.' : '',
    terms: !termsAccepted ? 'You must accept the Terms of Service and Privacy Policy.' : '',
  };

  const hasRegistrationErrors = Object.values(registrationErrors).some(Boolean) || !name.trim() || !password || !confirmPassword;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim() || !password) {
      toast('Please enter your email address or Resident ID and password.', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: loginIdentifier.trim(), password })
      });

      const text = await response.text();
      let data: any = {};
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          const snippet = text.trim().replace(/\s+/g, ' ').slice(0, 220);
          throw new Error(snippet || 'The server returned an unexpected non-JSON response.');
        }
      }

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
    if (hasRegistrationErrors) {
      toast('Please correct the highlighted registration fields before continuing.', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          name: name.trim()
        })
      });

      const text = await response.text();
      let data: any = {};
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          const snippet = text.trim().replace(/\s+/g, ' ').slice(0, 220);
          throw new Error(snippet || 'The server returned an unexpected non-JSON response.');
        }
      }

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      setRegistrationSuccess({ user: data.user as UserType, token: String(data.token || '') });
      toast('Account created successfully.', 'success');
    } catch (err: any) {
      toast(err.message || 'Registration failed.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const continueAfterRegistration = () => {
    if (!registrationSuccess) return;
    onLoginSuccess(registrationSuccess.user, registrationSuccess.token);
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

      const text = await response.text();
      let data: any = {};
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          const snippet = text.trim().replace(/\s+/g, ' ').slice(0, 220);
          throw new Error(snippet || 'The server returned an unexpected non-JSON response.');
        }
      }
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
    if (!recoveryEmail) {
      toast('Please enter your registered email address first.', 'warning');
      return;
    }
    
    setIsLoading(false);
    setIsEmailSent(true);
    toast('Password reset is not available in the local demo. Please contact the administrator.', 'warning');
  };

  return (
    <div id="auth-root" className="relative flex min-h-svh flex-col justify-between overflow-x-hidden bg-transparent font-sans">
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/one-spatial-iloilo-hero.jpg')" }}
      />
      <div aria-hidden="true" className="fixed inset-0 z-0 bg-slate-950/45" />
      <div aria-hidden="true" className="fixed inset-0 z-0 bg-gradient-to-b from-slate-950/20 via-slate-950/25 to-slate-950/55" />

      {/* Header Bar */}
      <header className="absolute right-0 top-0 z-30 flex w-full items-center justify-end px-4 py-4 sm:px-6">
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300 hover:text-white transition-colors bg-white/5 hover:bg-white/15 border border-white/10 px-4 py-2 rounded-lg cursor-pointer"
        >
          <Home className="h-3.5 w-3.5 text-blue-400" /> Back to Showcase
        </button>
      </header>

      {/* Main Form Center Layout */}
      <main className="z-10 mx-auto flex min-h-svh w-full flex-1 items-start justify-center px-4 py-20 sm:items-center sm:px-6">
        <div className="w-full max-w-md rounded-3xl border border-white/15 bg-slate-950/75 p-6 shadow-2xl shadow-slate-950/50 backdrop-blur-2xl sm:p-8">
          <div className="w-full">
            {!isForgotPassword && (
              <div className="mb-7 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-blue-200 shadow-lg shadow-black/20">
                  <Building className="h-6 w-6" aria-hidden="true" />
                </div>
                <p className="font-serif text-sm font-semibold tracking-[0.12em] text-white">ONE SPATIAL ILOILO</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-200/90">Premium Resident Portal</p>
              </div>
            )}
            
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
                      Password reset is not available in the local demo. Contact the administrator for account recovery.
                    </p>
                  </div>

                  {isEmailSent ? (
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-5 text-center">
                      <div className="inline-flex p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-full mb-3">
                        <Check className="h-6 w-6" />
                      </div>
                      <h4 className="font-bold text-white text-sm">Password Reset Unavailable</h4>
                      <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
                        No email or reset token was sent. Return to sign-in or contact the administrator for help recovering the account.
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
                        value={recoveryEmail}
                        onChange={(e: any) => setRecoveryEmail(e.target.value)}
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
                      Securely access your resident bookings, payments, and community services.
                    </p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <Input
                      id="login-identifier"
                      type="text"
                      label="Email or Resident ID"
                      variant="glass"
                      placeholder="Email address or Resident ID"
                      autoComplete="username"
                      value={loginIdentifier}
                      onChange={(e: any) => setLoginIdentifier(e.target.value)}
                      icon={User}
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
                    className="h-12 rounded-lg bg-white text-slate-900 border-slate-200 shadow-sm normal-case tracking-normal font-semibold hover:bg-slate-50 hover:border-slate-300 transition-colors"
                  >
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="text-[#1F1F1F]">{isLoading ? 'Authenticating...' : 'Continue with Google'}</span>
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
              ) : registrationSuccess ? (
                <motion.div
                  key="registration-success"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 text-center"
                >
                  <div className="mx-auto inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 p-4 text-emerald-300">
                    <Check className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-serif font-bold text-white">Account Created Successfully</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">
                      Your resident account is ready. Save your Resident ID; use it with your password when you sign in again.
                    </p>
                  </div>
                  <div className="rounded-xl border border-blue-400/20 bg-blue-400/10 p-4 text-left">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Resident ID</p>
                    <p className="mt-1 break-all font-mono text-sm font-bold text-white">{registrationSuccess.user.id}</p>
                  </div>
                  <Button type="button" variant="primary" fullWidth onClick={continueAfterRegistration}>
                    Continue to Resident Portal
                  </Button>
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
                    <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white">Create Your Resident Account</h3>
                    <p className="text-sm text-slate-400 mt-1 font-medium">
                      Create an account to browse and reserve units, book staycations, manage payments, submit maintenance requests, receive notifications, and access the Resident Portal.
                    </p>
                  </div>

                  <form onSubmit={handleRegister} className="space-y-4">
                    <Input
                      id="register-full-name"
                      type="text"
                      label="Full Name"
                      variant="glass"
                      placeholder="John Doe"
                      autoComplete="name"
                      value={name}
                      onChange={(e: any) => setName(e.target.value)}
                      error={registrationErrors.name || undefined}
                      icon={User}
                      required
                    />

                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Create Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 z-10" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          autoComplete="new-password"
                          aria-describedby="password-requirements"
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
                      <div id="password-requirements" className="rounded-xl border border-white/10 bg-white/5 p-3 text-[11px] text-slate-300">
                        <div className="mb-2 flex items-center justify-between">
                          <span>Password strength</span>
                          <span className={passwordStrength === 'Strong' ? 'text-emerald-300' : passwordStrength === 'Fair' ? 'text-amber-300' : 'text-rose-300'}>{passwordStrength}</span>
                        </div>
                        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                          {Object.entries({ length: 'Minimum 8 characters', uppercase: 'At least one uppercase letter', lowercase: 'At least one lowercase letter', number: 'At least one number', special: 'At least one special character' }).map(([key, label]) => (
                            <span key={key} className={passwordChecks[key as keyof typeof passwordChecks] ? 'text-emerald-300' : 'text-slate-400'}>
                              {passwordChecks[key as keyof typeof passwordChecks] ? '✓' : '○'} {label}
                            </span>
                          ))}
                        </div>
                      </div>
                      {registrationErrors.password && <p className="text-xs text-rose-300">{registrationErrors.password}</p>}
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="confirm-password" className="text-xs font-semibold uppercase tracking-wider text-slate-300">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 z-10" />
                        <input
                          id="confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          autoComplete="new-password"
                          placeholder="••••••••"
                          className="w-full glass-input rounded-xl pl-10 pr-11 py-3 text-sm focus:outline-none transition-all placeholder:text-slate-600 font-semibold text-white"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors" aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}>
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {registrationErrors.confirmPassword && <p className="text-xs text-rose-300">{registrationErrors.confirmPassword}</p>}
                    </div>

                    <label className="flex items-start gap-2 text-xs leading-relaxed text-slate-300">
                      <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-white/20 bg-slate-900 text-blue-500" />
                      <span>I agree to the <button type="button" className="text-blue-300 underline" onClick={() => toast('Terms of Service will be published for the production release.', 'info')}>Terms of Service</button> and <button type="button" className="text-blue-300 underline" onClick={() => toast('Privacy Policy will be published for the production release.', 'info')}>Privacy Policy</button>.</span>
                    </label>
                    {registrationErrors.terms && <p className="text-xs text-rose-300">{registrationErrors.terms}</p>}

                    <Button
                      type="submit"
                      variant="primary"
                      fullWidth
                      disabled={isLoading || hasRegistrationErrors}
                      isLoading={isLoading}
                    >
                      {isLoading ? 'Creating Account...' : 'Create Account'}
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
