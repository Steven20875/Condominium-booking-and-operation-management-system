import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building, Calendar, UserCheck, ShieldCheck, AreaChart, Wrench, Bell, Phone, MapPin, Mail, Sparkles, ChevronDown, ChevronUp, ArrowUpRight, CreditCard, Menu, X
} from 'lucide-react';
import FerrofluidBackground from './FerrofluidBackground.tsx';

interface LandingPageProps {
  onLoginClick: () => void;
  onBrowseClick: () => void;
}

const whyChooseData = [
  { icon: Calendar, title: 'Online Booking', description: 'Reserve units in seconds with real-time availability and secure confirmation.' },
  { icon: UserCheck, title: 'Resident Portal', description: 'A central dashboard for residents to manage bookings, announcements, and service requests.' },
  { icon: CreditCard, title: 'Digital Payments', description: 'Secure billing and payment flows for deposits, utilities, and rent statements.' },
  { icon: Wrench, title: 'Maintenance Requests', description: 'Streamlined service tickets with live progress updates and technician assignment.' },
  { icon: Bell, title: 'Guest Access (Planned)', description: 'Guest registration and access approvals are planned for a future release.' },
  { icon: AreaChart, title: 'Analytics Dashboard', description: 'Executive metrics for occupancy, revenue, and resident satisfaction trends.' },
  { icon: ShieldCheck, title: 'Secure Authentication', description: 'Role-based access for residents, admins, and operations staff.' },
  { icon: Mail, title: 'Announcements', description: 'Broadcast urgent updates and community notices instantly to every resident.' }
];

const processSteps = [
  { title: 'Create Account', description: 'Register your resident profile and verify credentials through the secure portal.', icon: UserCheck },
  { title: 'Choose a Unit', description: 'Browse curated residences and compare pricing, amenities, and availability.', icon: Building },
  { title: 'Submit Requirements', description: 'Upload necessary documentation and finalize reservation details online.', icon: Mail },
  { title: 'Move In', description: 'Complete check-in, receive access details, and settle into premium condominium living.', icon: ArrowUpRight }
];

const faqItems = [
  { question: 'How do I book a condo unit?', answer: 'Use the Book Your Unit button to access live listings, choose your preferred suite, and submit a secure reservation request in minutes.' },
  { question: 'What payment methods are accepted?', answer: 'We support digital payment channels for bookings, maintenance fees, and security deposits through our secure billing system.' },
  { question: 'What documents do I need for move-in?', answer: 'Typically you need a valid ID, residency details, and proof of payment to complete the booking process with our operations team.' },
  { question: 'How does maintenance support work?', answer: 'Submit a request through the portal and our maintenance team will triage, assign, and update status in real time until resolution.' },
  { question: 'Can guests be registered in advance?', answer: 'Guest registration is planned for a future release. Contact the property office for current access procedures.' }
];

export default function LandingPage({ onLoginClick, onBrowseClick }: LandingPageProps) {
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Map simulation
  const [mapLatitude, setMapLatitude] = useState(37.7749);
  const [mapLongitude, setMapLongitude] = useState(-122.4194);
  const [mapZoom, setMapZoom] = useState(13);

  return (
    <div id="landing-root" className="min-h-screen overflow-x-hidden bg-transparent text-slate-200 font-sans selection:bg-blue-600 selection:text-white">
      
      {/* HEADER SECTION */}
      <nav id="landing-nav" className="sticky top-0 z-50 min-h-[78px] border-b border-white/10 bg-slate-950/25 backdrop-blur-xl transition-all duration-500">
        <div className="relative mx-auto grid min-h-[78px] max-w-7xl grid-cols-[1fr_auto] items-center gap-4 px-4 sm:px-6 md:grid-cols-[1fr_auto_1fr]">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="bg-gradient-to-tr from-blue-500 to-cyan-400 text-white p-3 rounded-2xl shadow-lg shadow-blue-500/20">
              <Building className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[10px] uppercase tracking-[0.24em] text-slate-400 sm:text-[11px] sm:tracking-[0.4em]">One Spatial</p>
              <p className="font-serif text-base font-semibold text-white sm:text-lg">Iloilo</p>
            </div>
          </div>

          <div className="hidden items-center justify-center gap-8 md:flex">
            <a href="#hero" className="group relative text-sm font-semibold text-slate-300 transition-colors hover:text-white">
              Home
              <span className="absolute left-0 -bottom-1 h-0.5 w-full scale-x-0 bg-blue-400 transition-transform duration-300 group-hover:scale-x-100" />
            </a>
            <a href="#about" className="group relative text-sm font-semibold text-slate-300 transition-colors hover:text-white">
              About
              <span className="absolute left-0 -bottom-1 h-0.5 w-full scale-x-0 bg-blue-400 transition-transform duration-300 group-hover:scale-x-100" />
            </a>
            <a href="#access" className="group relative text-sm font-semibold text-slate-300 transition-colors hover:text-white">
              Get Started
              <span className="absolute left-0 -bottom-1 h-0.5 w-full scale-x-0 bg-blue-400 transition-transform duration-300 group-hover:scale-x-100" />
            </a>
            <a href="#features" className="group relative text-sm font-semibold text-slate-300 transition-colors hover:text-white">
              Features
              <span className="absolute left-0 -bottom-1 h-0.5 w-full scale-x-0 bg-blue-400 transition-transform duration-300 group-hover:scale-x-100" />
            </a>
            <a href="#contact" className="group relative text-sm font-semibold text-slate-300 transition-colors hover:text-white">
              Contact
              <span className="absolute left-0 -bottom-1 h-0.5 w-full scale-x-0 bg-blue-400 transition-transform duration-300 group-hover:scale-x-100" />
            </a>
          </div>

          <div className="flex items-center justify-self-end gap-2 sm:gap-3">
            <button 
              onClick={onLoginClick}
              className="rounded-[16px] border border-white/10 bg-white/10 px-3 py-2.5 text-sm font-semibold text-slate-200 transition-all hover:bg-white/20 hover:text-white sm:px-5 sm:py-3"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              aria-expanded={isMobileMenuOpen}
              aria-controls="landing-mobile-menu"
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="inline-flex h-11 w-11 items-center justify-center rounded-[16px] border border-white/10 bg-white/10 text-slate-200 transition-colors hover:bg-white/20 hover:text-white md:hidden"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                id="landing-mobile-menu"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute inset-x-4 top-[calc(100%-1px)] z-50 rounded-2xl border border-white/10 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-xl md:hidden"
              >
                {[
                  ['Home', '#hero'],
                  ['About', '#about'],
                  ['Get Started', '#access'],
                  ['Features', '#features'],
                  ['Contact', '#contact']
                ].map(([label, href]) => (
                  <a
                    key={href}
                    href={href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    {label}
                  </a>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section id="hero" className="relative overflow-hidden px-4 py-16 text-white select-none sm:px-6 md:py-32">
        <FerrofluidBackground
          colors={["#2563EB", "#0EA5E9", "#06B6D4"]}
          speed={0.25}
          scale={2}
          turbulence={0.6}
          glow={1.2}
          opacity={0.5}
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.16),transparent_42%),linear-gradient(180deg,rgba(15,23,42,0.94),rgba(15,23,42,0.98))] z-0" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.14),transparent_24%)] opacity-90" />

        <div className="absolute top-12 left-1/2 -translate-x-1/2 rounded-full w-[420px] h-[420px] bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-20 top-16 rounded-full w-56 h-56 bg-cyan-400/10 blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.65 }}
            className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/30 px-4 py-2 text-xs uppercase tracking-[0.32em] text-slate-300 shadow-xl shadow-slate-950/40"
          >
            <Sparkles className="h-4 w-4 text-cyan-300" />
            <span>Condo Booking & Operations, Reimagined</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-serif font-black tracking-tight leading-[0.95]"
          >
            Smart Condominium Living,
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">Simplified.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.2 }}
            className="mx-auto mt-6 max-w-3xl text-base sm:text-lg text-slate-300 tracking-normal leading-8"
          >
            Book units, manage reservations, monitor residents, and experience seamless condominium living—all from one intelligent platform built for modern condominium communities.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={onBrowseClick}
              className="relative overflow-hidden rounded-[16px] bg-gradient-to-r from-blue-500 to-cyan-400 px-8 py-4 text-sm font-semibold text-white shadow-[0_25px_75px_rgba(59,130,246,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_32px_100px_rgba(59,130,246,0.25)]"
            >
              Book Your Unit
              <span className="ml-2 inline-flex"><ArrowUpRight className="h-4 w-4" /></span>
            </button>
            <button
              onClick={onLoginClick}
              className="rounded-[16px] border border-white/15 bg-white/10 px-8 py-4 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/15 hover:shadow-lg hover:shadow-slate-900/20"
            >
              Explore Features
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.4 }}
            className="mx-auto mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl"
          >
            {[
              { label: 'Live Availability', icon: Calendar },
              { label: 'Resident Portal', icon: UserCheck },
              { label: 'Secure Pay', icon: CreditCard },
              { label: '24/7 Support', icon: Bell }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="flex items-center gap-3 rounded-3xl border border-white/10 bg-slate-950/70 p-4 shadow-lg shadow-slate-950/20">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300 shadow-inner shadow-blue-500/10">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-slate-100">{item.label}</p>
                </div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* WHY CHOOSE US SECTION */}
      <section id="about" className="py-24 px-6 max-w-7xl mx-auto scroll-mt-10">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-16 items-center">
          <div className="xl:col-span-5 space-y-6">
            <span className="text-xs font-mono font-bold tracking-widest text-[#60a5fa] uppercase">Why Choose One Spatial Iloilo</span>
            <h2 className="text-4xl sm:text-5xl font-serif font-bold tracking-tight text-white leading-tight">
              Built for premium condominium operations and effortless resident living.
            </h2>
            <p className="text-slate-300 text-base leading-8 max-w-xl">
              One Spatial Iloilo brings a luxury-grade resident experience, property management automation, and booking intelligence together in a secure cloud-native control panel.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {whyChooseData.slice(0, 4).map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-3xl border border-white/10 bg-slate-950/60 p-5 shadow-lg shadow-slate-950/20 backdrop-blur-xl transition-all hover:-translate-y-1">
                    <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm text-slate-400 leading-relaxed">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="xl:col-span-7 grid grid-cols-1 gap-6">
            {whyChooseData.slice(4).map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-lg shadow-slate-950/20 backdrop-blur-xl transition-all hover:-translate-y-1">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-cyan-400/10 text-cyan-300">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                  <p className="mt-3 text-sm text-slate-400 leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PROCESS SECTION */}
      <section id="how-it-works" className="py-24 px-6 bg-slate-950/70 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-mono font-bold tracking-widest text-[#60a5fa] uppercase">How It Works</span>
            <h2 className="mt-4 text-4xl sm:text-5xl font-serif font-bold text-white tracking-tight">A premium booking flow in four effortless steps.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {processSteps.map((step, index) => {
              const Icon = step.icon;
              const isLast = index === processSteps.length - 1;
              return (
                <div key={step.title} className="relative rounded-3xl border border-white/10 bg-slate-950/70 p-8 text-center shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-lg shadow-cyan-500/20">
                    <Icon className="h-7 w-7" />
                  </div>
                  <div className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-blue-300">Step {index + 1}</div>
                  <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                  <p className="mt-3 text-sm text-slate-400 leading-relaxed">{step.description}</p>
                  {!isLast && (
                    <div className="absolute right-4 top-1/2 hidden h-px w-24 -translate-y-1/2 bg-blue-400/20 md:block"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="bg-white/5 backdrop-blur-md py-24 px-6 border-y border-white/5 scroll-mt-10">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold tracking-widest text-[#60a5fa] uppercase">Operational Modules</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-white animate-fade-in">
              Fitted With Real-World Management Power
            </h2>
            <p className="text-slate-400 text-sm max-w-lg mx-auto">
              Our comprehensive system bridges the gap between tenant leisure requirements and property manager oversight.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="glass-card p-6 rounded-2xl hover:bg-white/10 hover:border-white/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 text-blue-400 p-3 rounded-xl inline-block mb-5 border border-blue-400/20">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-white text-base">Booking System</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Select suite layouts, check current price calendars, configure guest counts, and submit reservations under instant, real-time availability tracking.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl hover:bg-white/10 hover:border-white/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="bg-gradient-to-tr from-purple-500/20 to-pink-500/20 text-purple-400 p-3 rounded-xl inline-block mb-5 border border-purple-400/20">
                <UserCheck className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-white text-base">Resident Database</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Admins receive indexed profile rosters. Track booking histories, manage direct announcements, and adjust apartment units easily.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl hover:bg-white/10 hover:border-white/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-400 p-3 rounded-xl inline-block mb-5 border border-emerald-400/20">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-white text-base">Payment Monitoring</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Track security deposits, generate monthly maintenance statement bills, submit digital payments safely, and instantly compile receipts.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl hover:bg-white/10 hover:border-white/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-amber-400 p-3 rounded-xl inline-block mb-5 border border-amber-400/20">
                <Wrench className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-white text-base">Maintenance Tickets</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Residents file domestic tickets with custom priority levels. Admins assign tasks directly to expert technicians with live resolution logs.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* AUTHENTICATED ACCESS CTA */}
      <section id="access" className="px-6 py-20 scroll-mt-10">
        <div className="mx-auto max-w-7xl rounded-[32px] border border-blue-400/20 bg-gradient-to-r from-blue-950/70 via-slate-950/80 to-cyan-950/60 p-8 shadow-2xl shadow-blue-950/20 sm:p-12">
          <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-2xl space-y-4">
              <span className="inline-block rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-xs font-mono font-bold uppercase tracking-widest text-blue-300">
                Resident &amp; Admin Portal
              </span>
              <h2 className="font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Manage your condominium experience in one secure system.
              </h2>
              <p className="text-sm leading-7 text-slate-300">
                Sign in or create an account to access live units, reservations, payments, resident services, and professional property operations.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <button
                onClick={onLoginClick}
                className="rounded-[16px] bg-gradient-to-r from-blue-500 to-cyan-400 px-7 py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:-translate-y-0.5"
              >
                Get Started
              </button>
              <button
                onClick={onBrowseClick}
                className="rounded-[16px] border border-white/15 bg-white/10 px-7 py-3.5 text-center text-sm font-semibold text-white transition-all hover:bg-white/15"
              >
                Explore Available Units
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ANALYTICS PREVIEW SECTION */}
      <section id="analytics" className="bg-white/5 border-y border-white/5 py-24 px-6 text-white scroll-mt-10 overflow-hidden relative backdrop-blur-sm">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center relative z-10">
          
          <div className="lg:col-span-12 xl:col-span-5 space-y-6">
            <span className="text-xs font-mono font-bold tracking-widest text-[#60a5fa] uppercase py-1 px-3 bg-white/5 rounded-full border border-white/10 inline-block">
              Business Intelligence
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight leading-tight">
              Operational Metrics Over Time
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Administrators receive active visual metrics monitoring performance. Secure ledger reports track seasonal rentals, utility spikes, and structural occupancy index trends to help inform layout expansions.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <div className="bg-slate-950/45 border border-white/10 p-4 rounded-xl backdrop-blur-sm">
                <p className="text-xs text-slate-400 font-mono uppercase">Avg Occupancy</p>
                <p className="text-2xl font-serif font-bold text-teal-400 mt-1">No data</p>
              </div>
              <div className="bg-slate-950/45 border border-white/10 p-4 rounded-xl backdrop-blur-sm">
                <p className="text-xs text-slate-400 font-mono uppercase">Gross Billings</p>
                <p className="text-2xl font-serif font-bold text-indigo-400 mt-1">No data</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-12 xl:col-span-7 bg-slate-950/50 backdrop-blur-md border border-white/10 p-6 rounded-3xl shadow-2xl relative">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-sm">Monthly Operational Performance</h3>
                <p className="text-slate-400 text-[10px]">Compiled reports: Q1 - Q2 Revenue & Occupancy trends</p>
              </div>
              <span className="text-xs font-mono font-bold tracking-wider text-teal-400 bg-teal-950/40 border border-teal-900/50 px-2 py-0.5 rounded">
                Live Server Synced
              </span>
            </div>

            <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-white/10 text-center">
              <div>
                <p className="font-serif text-lg font-bold text-white">Analytics data unavailable.</p>
                <p className="mt-2 text-xs text-slate-400">Operational metrics will appear when real records are available.</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      <section id="reviews" className="px-6 py-24 text-center scroll-mt-10 select-none">
        <div className="mx-auto max-w-3xl rounded-3xl border border-dashed border-white/10 bg-white/5 p-10">
          <p className="font-serif text-xl font-bold text-white">Resident reviews will appear here.</p>
          <p className="mt-2 text-sm text-slate-400">Verified resident feedback will be shown when it is available.</p>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-24 px-6 max-w-7xl mx-auto scroll-mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-4">
            <span className="text-xs font-mono font-bold tracking-widest text-[#60a5fa] uppercase">FAQ</span>
            <h2 className="text-4xl sm:text-5xl font-serif font-bold text-white tracking-tight">Answers for the most common resident and booking questions.</h2>
            <p className="text-slate-400 text-sm leading-7 max-w-xl">
              We built the platform to be transparent and easy to use, with each step supported by secure forms and responsive operations.
            </p>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, index) => {
              const isOpen = index === faqOpenIndex;
              return (
                <button
                  key={item.question}
                  type="button"
                  onClick={() => setFaqOpenIndex(isOpen ? null : index)}
                  className="w-full rounded-3xl border border-white/10 bg-slate-950/70 p-5 text-left shadow-lg shadow-slate-950/20 backdrop-blur-xl transition-all hover:border-blue-400/30"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold text-white">{item.question}</p>
                    </div>
                    <span className="text-slate-400">
                      {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </span>
                  </div>
                  {isOpen && (
                    <p className="mt-4 text-sm text-slate-400 leading-7">{item.answer}</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section id="cta" className="py-24 px-6 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-t border-white/10">
        <div className="max-w-7xl mx-auto rounded-[32px] border border-white/10 bg-slate-950/80 p-12 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="max-w-2xl">
              <span className="text-xs font-mono font-bold tracking-widest text-[#60a5fa] uppercase">Ready to elevate your condo operations?</span>
              <h2 className="mt-4 text-4xl sm:text-5xl font-serif font-black text-white tracking-tight">Ready to Find Your Perfect Home?</h2>
              <p className="mt-4 text-sm text-slate-300 leading-7 max-w-xl">
                Experience a modern condominium booking and operations platform designed for residents, managers, and property portfolio teams who demand speed and polish.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={onBrowseClick}
                className="rounded-[16px] bg-gradient-to-r from-blue-500 to-cyan-400 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:-translate-y-0.5"
              >
                Book Now
              </button>
              <button
                onClick={onLoginClick}
                className="rounded-[16px] border border-white/15 bg-white/10 px-8 py-4 text-sm font-semibold text-white transition-all hover:bg-white/15"
              >
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT SECTION & MOCK GOOGLE MAP INTEGRATION */}
      <section id="contact" className="py-24 px-6 scroll-mt-10 bg-white/5 border-t border-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          <div className="space-y-6">
            <span className="text-xs font-mono font-bold tracking-widest text-[#60a5fa] uppercase">Interactive Concierge</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white leading-snug">Get In Touch With Villa Operations</h2>
            <p className="text-slate-300 text-sm leading-relaxed max-w-sm">
              Whether searching for custom floor layouts, scheduled maintenance contracts, or portfolio management advice, our operations center stands ready.
            </p>

            <div className="space-y-4 pt-4 text-sm text-slate-300">
              <div className="flex items-center gap-3.5">
                <MapPin className="h-5 w-5 text-blue-400" />
                <p>One Spatial Iloilo, Mandurriao, Iloilo City, Iloilo, Philippines</p>
              </div>
              <div className="flex items-center gap-3.5">
                <Phone className="h-5 w-5 text-blue-400" />
                <p>+63 917 123 4567 (Gales Urban Haven Desk)</p>
              </div>
              <div className="flex items-center gap-3.5">
                <Mail className="h-5 w-5 text-blue-400" />
                <p>fstevenchristian@gmail.com</p>
              </div>
            </div>

            {/* Simulated Interactive Vector Map */}
            <div className="border border-white/10 rounded-2xl p-4 bg-slate-950/45 backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">📍 Simulated Interactive Map</span>
                <span className="text-slate-400 font-mono text-[10px]">Lat: {mapLatitude.toFixed(4)}, Lon: {mapLongitude.toFixed(4)}</span>
              </div>
              
              <div className="h-44 bg-slate-950/50 rounded-xl relative overflow-hidden border border-white/10 group flex items-center justify-center">
                {/* Custom Styled grid background resembling high-end map styling */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.06)_0%,transparent_100%)]" />
                
                {/* Simulated Roads/Streets */}
                <div className="absolute top-1/2 left-0 right-0 h-4 bg-white/5 shadow-sm rotate-6" />
                <div className="absolute left-1/3 top-0 bottom-0 w-6 bg-white/5 shadow-sm -rotate-12" />
                <div className="absolute left-2/3 top-0 bottom-0 w-4 bg-white/5 shadow-sm -rotate-45" />

                {/* Point representing Tower */}
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 border-2 border-white/20 text-white p-1.5 rounded-full shadow-lg relative group">
                    <Building className="h-4 w-4 animate-bounce" />
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-950 text-[10px] text-white px-2 py-0.5 rounded shadow-lg whitespace-nowrap opacity-100 transition-opacity">
                      One Spatial Iloilo 🚀
                    </span>
                  </div>
                </div>

                {/* Simulated Controls */}
                <div className="absolute bottom-2 right-2 flex flex-col gap-1 z-10">
                  <button 
                    onClick={() => {
                      setMapZoom(prev => Math.min(prev + 1, 18));
                      setMapLatitude(prev => prev + 0.001);
                    }}
                    className="bg-white/10 hover:bg-white/20 text-white font-bold border border-white/10 h-6 w-6 rounded flex items-center justify-center shadow-md select-none cursor-pointer"
                  >
                    +
                  </button>
                  <button 
                    onClick={() => {
                      setMapZoom(prev => Math.max(prev - 1, 10));
                      setMapLatitude(prev => prev - 0.001);
                    }}
                    className="bg-white/10 hover:bg-white/20 text-white font-bold border border-white/10 h-6 w-6 rounded flex items-center justify-center shadow-md select-none cursor-pointer"
                  >
                    -
                  </button>
                </div>

                <div className="absolute bottom-2 left-2 bg-slate-950/80 p-1 rounded backdrop-blur-md text-[9px] text-white pointer-events-none">
                  Scale: {mapZoom}x Zoom
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card border border-white/10 p-8 rounded-3xl shadow-2xl flex flex-col justify-center">
            <span className="text-xs font-mono font-bold tracking-widest text-[#60a5fa] uppercase">Contact Information</span>
            <h3 className="mt-3 text-2xl font-serif font-bold text-white">We’re Here to Help</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Contact the One Spatial Iloilo team for inquiries, assistance, or more information about our condominium units and services.
            </p>

            <div className="mt-8 space-y-5">
              <div className="flex items-start gap-4">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Location</p>
                  <p className="mt-1 text-sm leading-relaxed text-white">One Spatial Iloilo, Mandurriao, Iloilo City, Iloilo, Philippines</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone</p>
                  <p className="mt-1 text-sm leading-relaxed text-white">+63 917 123 4567 (Gales Urban Haven Desk)</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email</p>
                  <p className="mt-1 break-all text-sm leading-relaxed text-white">fstevenchristian@gmail.com</p>
                </div>
              </div>
          </div>

        </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 border-b border-slate-700 pb-12 mb-12">
          
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2 text-white">
              <div className="bg-slate-900 border border-slate-800 text-white p-2 rounded-xl">
                <Building className="h-5 w-5" />
              </div>
              <span className="font-bold text-xl tracking-tight font-serif">ONE SPATIAL ILOILO</span>
            </div>
            <p className="text-xs text-slate-400 leading-normal max-w-sm">
              The supreme solution for architectural listings, tenant scheduling, invoice verification, and active maintenance resolution channels.
            </p>
          </div>

          <div className="md:col-span-2 space-y-3">
            <p className="text-white text-xs font-bold font-serif tracking-wider">RESOURCES</p>
            <ul className="text-xs space-y-2">
              <li><a href="#about" className="hover:text-white transition-colors">Tower Profile</a></li>
              <li><a href="#access" className="hover:text-white transition-colors">Resident Portal</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Facility Listing</a></li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-3">
            <p className="text-white text-xs font-bold font-serif tracking-wider">SECURITY</p>
            <ul className="text-xs space-y-2">
              <li><a href="#auth-root" className="hover:text-white transition-colors">Resident Sign-In</a></li>
              <li><a href="#auth-root" className="hover:text-white transition-colors">Admin Portal Access</a></li>
              <li><a href="#about" className="hover:text-white transition-colors">Privacy Principles</a></li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-3">
            <p className="text-white text-xs font-bold font-serif tracking-wider">VILLAGE OPERATIONS</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Gales Urban Haven Office <br />
              One Spatial Iloilo, Mandurriao <br />
              Iloilo City, Iloilo, Philippines
            </p>
              <p className="pt-4 text-[10px] text-slate-500">Social channels and formal policy pages are planned for the production release.</p>
            <span className="text-slate-500">Legal Agreement (Planned)</span>
            <span className="text-slate-500">Privacy Charter (Planned)</span>
            <a href="#landing-root" className="hover:text-slate-400 font-bold uppercase text-slate-300">Back To Peak ↑</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
