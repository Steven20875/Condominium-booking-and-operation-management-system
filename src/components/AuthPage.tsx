import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from './ToastContext.tsx';
import { Building, Lock, Mail, User, Phone, Clipboard, ArrowRight, Home, ChevronRight, Check } from 'lucide-react';
import { User as UserType } from '../types.ts';

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
  const [verificationCode, setVerificationCode] = useState<string>('');

  // Form states
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [unitNumber, setUnitNumber] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast('Please enter both your email address and password.', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed. Please verify credentials.');
      }

      toast(`Welcome back, ${data.user.name}! Enjoy your stay.`, 'success');
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
      // Step: Simulated Email Verification before full completion
      setIsEmailVerifying(true);
      toast('A dynamic verification pin was dispatched to your email address.', 'info');
    } catch (err: any) {
      toast(err.message || 'Registration failed.', 'error');
      setIsLoading(false);
    }
  };

  const handleCompleteVerification = async () => {
    if (verificationCode.trim() !== '4611') {
      toast('Invalid security pin. Entering 4611 overrides verification safely.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, phone, unitNumber })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Account registration failed.');
      }

      toast('Email verified and resident account initialized successfully!', 'success');
      setIsEmailVerifying(false);
      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      toast(err.message, 'error');
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
            {/* Background Texture Image overlay */}
            <div className="absolute inset-0 z-0 bg-cover bg-center mix-blend-overlay opacity-30 scale-105 hover:scale-100 transition-all duration-1000 auth-hero-image" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent z-1" />

            <div className="relative z-10">
              <span className="text-blue-400 font-mono text-xs font-bold tracking-widest uppercase py-1 px-3 bg-blue-950/80 rounded-full border border-blue-900">
                Gales Urban Haven
              </span>
              <h2 className="mt-6 text-3xl sm:text-4xl font-serif font-semibold tracking-tight leading-tight">
                Refined Urban Living. Centralized Portal.
              </h2>
              <p className="mt-4 text-sm text-slate-300 font-normal leading-relaxed">
                Welcome to One Spatial Iloilo's official management engine. Settle digital assessments, reserve convenient student and professional suites, request immediate maintenance, and view active announcements on an integrated platform.
              </p>
            </div>

            <div className="relative z-10 mt-12 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
              <p className="text-xs text-slate-400 italic">"The automated booking platform made booking the Grand Horizon Suite incredibly straightforward."</p>
              <div className="flex items-center gap-2 mt-3">
                <div className="h-6 w-6 rounded-full bg-slate-700 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80" alt="avatar" />
                </div>
                <div>
                  <p className="text-xs font-semibold">Alice Cooper</p>
                  <p className="text-[10px] text-slate-400">Resident of Level 24</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form Input Actions Section */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center bg-transparent">
            
            <AnimatePresence mode="wait">
              {isEmailVerifying ? (
                /* Dynamic Verification Overlay */
                <motion.div 
                  key="verify-email" 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-6"
                >
                  <div>
                    <span className="text-xs font-mono font-bold tracking-widest uppercase text-blue-400">Step 2: Security Validation</span>
                    <h3 className="text-2xl font-serif font-bold text-white mt-1">Check Your Inbox</h3>
                    <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                      We’ve simulated routing an authentication pin to you. To confirm your identity and register safely, please insert the verification code below.
                    </p>
                  </div>
                  
                  <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex gap-4 items-start">
                    <Clipboard className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-slate-300 leading-normal">
                      <strong className="text-white">Quick-Pass Override:</strong> In this testing container, enter the security code <strong className="font-mono text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/20">4611</strong> to simulate verification validation.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Verification Pin</label>
                    <input
                      type="text"
                      className="w-full glass-input placeholder:text-slate-500 focus:outline-none transition-all duration-250 px-4 py-3 rounded-xl font-mono text-center text-xl tracking-widest"
                      placeholder="XXXX"
                      maxLength={4}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEmailVerifying(false)}
                      className="flex-1 glass-button-secondary font-semibold px-4 py-3 rounded-xl transition-colors text-sm cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleCompleteVerification}
                      className="flex-1 glass-button-primary font-semibold px-4 py-3 rounded-xl transition-all shadow-md text-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Verify Account <Check className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              ) : isForgotPassword ? (
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
                    <p className="text-sm text-slate-450 mt-2">
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
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                          <input
                            type="email"
                            required
                            placeholder="john@condo.com"
                            className="w-full glass-input pl-10 pr-4 py-3 text-sm focus:outline-none transition-all placeholder:text-slate-500 font-semibold"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full glass-button-primary disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all shadow-md text-sm flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isLoading ? 'Processing Recovery...' : 'Dispatch Reset Email'}
                      </button>

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

                  {/* Preloaded credentials guide helper */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs space-y-2">
                    <p className="font-bold text-slate-200">Demo Account Profiles:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEmail('john@condo.com');
                          setPassword('john123');
                        }}
                        className="text-left bg-white/5 p-2 rounded-lg border border-white/10 hover:bg-white/15 hover:border-blue-400/50 transition-colors cursor-pointer"
                      >
                        <p className="font-semibold text-white">🔑 John Doe (Resident)</p>
                        <p className="text-slate-400 font-mono mt-0.5 text-[10px]">Email: john@condo.com <br/>Pass: john123</p>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          setEmail('admin@condo.com');
                          setPassword('admin123');
                        }}
                        className="text-left bg-white/5 p-2 rounded-lg border border-white/10 hover:bg-white/15 hover:border-purple-400/50 transition-colors cursor-pointer"
                      >
                        <p className="font-semibold text-white">🔑 Sarah J. (Admin)</p>
                        <p className="text-slate-400 font-mono mt-0.5 text-[10px]">Email: admin@condo.com <br/>Pass: admin123</p>
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                          type="email"
                          required
                          placeholder="john@condo.com"
                          className="w-full glass-input rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none transition-all placeholder:text-slate-600 font-semibold text-white"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
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
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          className="w-full glass-input rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none transition-all placeholder:text-slate-600 font-semibold text-white"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
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

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full glass-button-primary disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all shadow-md text-sm mt-3 flex items-center justify-center gap-2 group cursor-pointer"
                    >
                      {isLoading ? 'Signing you in...' : 'Sign In To Premium Gate'}
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </form>

                  <div className="text-center pt-2 border-t border-white/5">
                    <p className="text-xs text-slate-400 font-medium font-sans">
                      New addition to One Spatial Iloilo?{' '}
                      <button
                        onClick={() => setIsLogin(false)}
                        className="text-blue-400 hover:underline hover:text-blue-300 font-bold cursor-pointer"
                      >
                        Register your portfolio here
                      </button>
                    </p>
                  </div>
                </motion.div>
              ) : (
                /* Registration Form */
                <motion.div
                  key="register-form-div"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4 md:space-y-6"
                >
                  <div>
                    <h3 className="text-2xl font-serif font-bold text-white">Resident Enrolment</h3>
                    <p className="text-sm text-slate-400 mt-1">
                      Register your portfolio to access scheduling and maintenance utilities instantly.
                    </p>
                  </div>

                  <form onSubmit={handleRegister} className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Full Legal Name</label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                          <input
                            type="text"
                            required
                            placeholder="Johnathan Doe"
                            className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-all placeholder:text-slate-600 font-semibold text-white"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Mobile Phone</label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                          <input
                            type="tel"
                            placeholder="+1 (555) 122-874"
                            className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-all placeholder:text-slate-600 font-semibold text-white"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                          <input
                            type="email"
                            required
                            placeholder="john@condo.com"
                            className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-all placeholder:text-slate-600 font-semibold text-white"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Unit ID / Suite (Optional)</label>
                        <div className="relative">
                          <Home className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                          <input
                            type="text"
                            placeholder="Unit 1204"
                            className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-all placeholder:text-slate-600 font-semibold text-white"
                            value={unitNumber}
                            onChange={(e) => setUnitNumber(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Setup Secure Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-all placeholder:text-slate-600 font-semibold text-white"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full glass-button-primary disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all shadow-md text-sm mt-4 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isLoading ? 'Verifying Portfolio...' : 'Begin Secure Enrolment'}
                    </button>
                  </form>

                  <div className="text-center pt-2 border-t border-white/5">
                    <p className="text-xs text-slate-400 font-medium font-sans">
                      Already registered your residence profile?{' '}
                      <button
                        onClick={() => setIsLogin(true)}
                        className="text-blue-400 hover:underline hover:text-blue-400 font-bold cursor-pointer"
                      >
                        Sign in instantly
                      </button>
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </main>

      {/* Footer copyright links */}
      <footer className="w-full text-center py-6 text-xs text-slate-500 select-none">
        © 2026 Gales Urban Haven — One Spatial Iloilo Property Management System. All rights reserved.
      </footer>
    </div>
  );
}
