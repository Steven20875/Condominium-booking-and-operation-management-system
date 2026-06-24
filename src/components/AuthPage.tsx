import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from './ToastContext.tsx';
import FerrofluidBackground from './FerrofluidBackground.tsx';
import { Building, Lock, Mail, User, Phone, Clipboard, ArrowRight, Home, Check, Eye, EyeOff, ShieldCheck, Sparkles, UserCheck, Bell } from 'lucide-react';
import { User as UserType } from '../types.ts';
import { Button, Input } from './ui';

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
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [emailValid, setEmailValid] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const validateEmail = (value: string) => /^\S+@\S+\.\S+$/.test(value);
  const handleEmailChange = (value: string) => {
    setEmail(value);
    setEmailValid(value === '' || validateEmail(value));
  };

  const copyDemoCredentials = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast('Demo credentials copied to clipboard.', 'success');
    } catch {
      toast('Clipboard access failed; please copy manually.', 'warning');
    }
  };

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
                    <Input
                      type="text"
                      label="Verification Pin"
                      variant="glass"
                      placeholder="XXXX"
                      maxLength={4}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      helperText="Enter 4611 to simulate verification"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="secondary"
                      fullWidth
                      onClick={() => setIsEmailVerifying(false)}
                    >
                      Back
                    </Button>
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={handleCompleteVerification}
                      icon={Check}
                      iconPosition="right"
                    >
                      Verify Account
                    </Button>
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
                      <Input
                        type="email"
                        label="Email Address"
                        variant="glass"
                        placeholder="john@condo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        icon={<Mail className="h-4 w-4" />}
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

                  {/* Preloaded credentials guide helper */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="auth-demo-card">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400 font-semibold">Resident Demo</p>
                          <p className="mt-2 text-sm font-semibold text-white">Resident Account</p>
                        </div>
                        <div className="rounded-2xl bg-blue-500/15 p-3 text-blue-300">
                          <UserCheck className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="mt-4 space-y-1 text-slate-300 text-[11px]">
                        <p>Email: <span className="text-white font-semibold">john@condo.com</span></p>
                        <p>Password: <span className="text-white font-semibold">john123</span></p>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyDemoCredentials('john@condo.com:john123')}
                        className="auth-copy-button"
                      >
                        Copy Resident Credentials
                      </button>
                    </div>

                    <div className="auth-demo-card">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400 font-semibold">Administrator Demo</p>
                          <p className="mt-2 text-sm font-semibold text-white">Admin Control</p>
                        </div>
                        <div className="rounded-2xl bg-violet-500/15 p-3 text-violet-300">
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="mt-4 space-y-1 text-slate-300 text-[11px]">
                        <p>Email: <span className="text-white font-semibold">admin@condo.com</span></p>
                        <p>Password: <span className="text-white font-semibold">admin123</span></p>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyDemoCredentials('admin@condo.com:admin123')}
                        className="auth-copy-button"
                      >
                        Copy Admin Credentials
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <Input
                      type="email"
                      label="Email Address"
                      variant="glass"
                      placeholder="john@condo.com"
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
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
                      icon={ArrowRight}
                      iconPosition="right"
                    >
                      {isLoading ? 'Signing In Securely...' : 'Sign In Securely'}
                    </Button>
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
                      <Input
                        type="text"
                        label="Full Legal Name"
                        variant="glass"
                        placeholder="Johnathan Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        icon={User}
                        required
                      />

                      <Input
                        type="tel"
                        label="Mobile Phone"
                        variant="glass"
                        placeholder="+1 (555) 122-874"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        icon={Phone}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        type="email"
                        label="Email Address"
                        variant="glass"
                        placeholder="john@condo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        icon={<Mail className="h-4 w-4" />}
                        required
                      />

                      <Input
                        type="text"
                        label="Unit ID / Suite (Optional)"
                        variant="glass"
                        placeholder="Unit 1204"
                        value={unitNumber}
                        onChange={(e) => setUnitNumber(e.target.value)}
                        icon={Home}
                      />
                    </div>

                    <Input
                      type="password"
                      label="Setup Secure Password"
                      variant="glass"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      icon={Lock}
                      required
                    />

                    <Button
                      type="submit"
                      variant="primary"
                      fullWidth
                      disabled={isLoading}
                      isLoading={isLoading}
                    >
                      {isLoading ? 'Verifying Portfolio...' : 'Begin Secure Enrolment'}
                    </Button>
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
