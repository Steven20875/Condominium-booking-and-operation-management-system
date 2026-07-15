import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building, Calendar, UserCheck, ShieldCheck, AreaChart, Wrench, Bell, Phone, MapPin, Mail, Sparkles, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Star, Heart, ArrowUpRight, ArrowRight, CreditCard, Twitter, Instagram, Linkedin 
} from 'lucide-react';
import { Unit } from '../types.ts';
import FerrofluidBackground from './FerrofluidBackground.tsx';
import { ResponsiveContainer, AreaChart as RechartAreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface LandingPageProps {
  onLoginClick: () => void;
  onBrowseClick: () => void;
}

const testimonialsData = [
  {
    name: 'Nenia  May Buganas',
    role: 'Tower B Executive Resident',
    avatar: 'data/assets/nenia',
    comment: 'The booking interface has simplified managing our corporate suites completely. Settle bills, schedule gym passes, and coordinate with room mechanics under just 3 minutes.',
    stars: 5,
    unit: 'The Grand Horizon Penthouse'
  },
  {
    name: 'Steven Christian Felarca',
    role: 'Property Committee President',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
    comment: 'From a general administrative perspective, this dashboard delivers high financial clarity. The automated receipts, tenant rosters, and maintenance tracking cut operations friction by 40%.',
    stars: 5,
    unit: 'Penthouse East Owner'
  },
  {
    name: 'Donna May Talam',
    role: 'Resident & Chef Specialist',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80',
    comment: 'Submitting a support request through the portal takes seconds, and the assigned technician actually gives live status notes directly in our conversation stream.',
    stars: 5,
    unit: 'Unit 102 Owner'
  }
];

const mockChartData = [
  { name: 'Jan', occupancy: 65, revenue: 12000 },
  { name: 'Feb', occupancy: 72, revenue: 15400 },
  { name: 'Mar', occupancy: 78, revenue: 18100 },
  { name: 'Apr', occupancy: 84, revenue: 21900 },
  { name: 'May', occupancy: 91, revenue: 24500 },
  { name: 'Jun', occupancy: 96, revenue: 28000 }
];

const fallbackUnits: Unit[] = [
  {
    id: 'unit-103',
    name: 'The Oasis Garden Loft',
    type: '1-Bedroom Loft',
    description: 'Charming duplex loft featuring exposed structural brickwork, reclaimed timber accents, and a lush private garden terrace perfect for morning coffee.',
    price: 180,
    amenities: ['Garden Terrace', 'Exposed Brick Style', 'Coffee Station', 'Dedicated Workspace', 'Smart Locks', 'Queen Bed', 'In-unit Laundry'],
    availability: true,
    capacity: 3,
    floorNumber: 4,
    status: 'Available',
    images: ['https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=800&q=80'],
    createdAt: '2026-05-28T04:07:00.916Z'
  },
  {
    id: 'unit-105',
    name: 'The Crimson Executive Lounge',
    type: 'Executive Studio',
    description: 'Sleek, moody minimalist studio designed for corporate leaders. Soundproofed glazing, high-end acoustic systems, and dynamic ambient lighting presets.',
    price: 150,
    amenities: ['Acoustic Soundproofing', 'Curved Monitor Workspace', 'RGB Diffused Lighting', 'Premium Sound System', 'Double Bed'],
    availability: false,
    capacity: 2,
    floorNumber: 8,
    status: 'Booked',
    images: ['https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80'],
    createdAt: '2026-05-28T04:07:00.916Z'
  },
  {
    id: 'unit-104',
    name: 'The Solarium Duplex',
    type: '2-Bedroom Suite',
    description: 'Bathed in glorious natural light, this southwest-facing duplex offers a spectacular layout ideal for small families or business travelers seeking upscale comfort.',
    price: 240,
    amenities: ['Wraparound Glass', 'Kitchen Island', 'Home Office Corner', 'Walk-in Closet', 'Nespresso Machine', 'Two Queen Beds', 'Bath Tub'],
    availability: false,
    capacity: 4,
    floorNumber: 15,
    status: 'Booked',
    images: ['https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80'],
    createdAt: '2026-05-28T04:07:00.916Z'
  }
];

const trustStats = [
  { value: 500, suffix: '+', label: 'Happy Residents' },
  { value: 98, suffix: '%', label: 'Occupancy Rate' },
  { value: 24, suffix: '/7', label: 'Security' },
  { value: 100, suffix: '%', label: 'Online Booking' }
];

const whyChooseData = [
  { icon: Calendar, title: 'Online Booking', description: 'Reserve units in seconds with real-time availability and secure confirmation.' },
  { icon: UserCheck, title: 'Resident Portal', description: 'A central dashboard for residents to manage bookings, announcements, and service requests.' },
  { icon: CreditCard, title: 'Digital Payments', description: 'Secure billing and payment flows for deposits, utilities, and rent statements.' },
  { icon: Wrench, title: 'Maintenance Requests', description: 'Streamlined service tickets with live progress updates and technician assignment.' },
  { icon: Bell, title: 'Visitor Management', description: 'Approve guests, track arrivals, and secure building entries effortlessly.' },
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
  { question: 'Can guests be registered in advance?', answer: 'Yes, visitor registration is managed through the platform so guests receive seamless building access approval.' }
];

function AnimatedStat({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  const [current, setCurrent] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      let frame = 0;
      const duration = 900;
      const step = Math.max(1, Math.round(value / (duration / 16)));
      const counter = () => {
        frame += step;
        if (frame >= value) {
          setCurrent(value);
          observer.disconnect();
          return;
        }
        setCurrent(frame);
        requestAnimationFrame(counter);
      };
      requestAnimationFrame(counter);
    }, { threshold: 0.4 });

    observer.observe(node);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="space-y-2 text-center">
      <p className="text-4xl sm:text-5xl font-serif font-black text-white tracking-tight">
        {current}
        <span className="text-blue-400">{suffix}</span>
      </p>
      <p className="text-xs uppercase tracking-[0.32em] text-slate-400 font-semibold">{label}</p>
    </div>
  );
}

export default function LandingPage({ onLoginClick, onBrowseClick }: LandingPageProps) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(0);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  // Map simulation
  const [mapLatitude, setMapLatitude] = useState(37.7749);
  const [mapLongitude, setMapLongitude] = useState(-122.4194);
  const [mapZoom, setMapZoom] = useState(13);

  useEffect(() => {
    fetch('/api/units')
      .then(async res => {
        if (!res.ok) {
          throw new Error(`Unit API request failed with status ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setUnits(data.slice(0, 3)); // show first 3 for showcase
        } else {
          setUnits(fallbackUnits);
        }
      })
      .catch(err => {
        console.error('Failed fetching units on landing:', err);
        setUnits(fallbackUnits);
      });
  }, []);

  const handleNextTestimonial = () => {
    setActiveTestimonial((prev) => (prev + 1) % testimonialsData.length);
  };

  const handlePrevTestimonial = () => {
    setActiveTestimonial((prev) => (prev - 1 + testimonialsData.length) % testimonialsData.length);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;
    setContactSuccess(true);
    setTimeout(() => {
      setContactSuccess(false);
      setContactName('');
      setContactEmail('');
      setContactMessage('');
    }, 4500);
  };

  return (
    <div id="landing-root" className="min-h-screen bg-transparent text-slate-200 font-sans selection:bg-blue-600 selection:text-white">
      
      {/* HEADER SECTION */}
      <nav id="landing-nav" className="sticky top-0 z-50 min-h-[78px] bg-slate-950/25 backdrop-blur-xl border-b border-white/10 transition-all duration-500">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between gap-6 px-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-blue-500 to-cyan-400 text-white p-3 rounded-2xl shadow-lg shadow-blue-500/20">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.4em] text-slate-400">One Spatial</p>
              <p className="font-semibold text-lg text-white font-serif">Iloilo</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#hero" className="group relative text-sm font-semibold text-slate-300 transition-colors hover:text-white">
              Home
              <span className="absolute left-0 -bottom-1 h-0.5 w-full scale-x-0 bg-blue-400 transition-transform duration-300 group-hover:scale-x-100" />
            </a>
            <a href="#about" className="group relative text-sm font-semibold text-slate-300 transition-colors hover:text-white">
              About
              <span className="absolute left-0 -bottom-1 h-0.5 w-full scale-x-0 bg-blue-400 transition-transform duration-300 group-hover:scale-x-100" />
            </a>
            <a href="#showcase" className="group relative text-sm font-semibold text-slate-300 transition-colors hover:text-white">
              Units
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

          <div className="flex items-center gap-3">
            <button 
              onClick={onLoginClick}
              className="text-sm font-semibold text-slate-200 hover:text-white transition-all bg-white/10 hover:bg-white/20 px-5 py-3 rounded-[16px] border border-white/10"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section id="hero" className="relative py-20 md:py-32 px-6 overflow-hidden text-white select-none">
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

      <section id="trust" className="py-16 px-6 bg-slate-950/70 border-t border-white/10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {trustStats.map((stat) => (
            <div key={stat.label} className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 text-center shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
              <AnimatedStat label={stat.label} value={stat.value} suffix={stat.suffix} />
            </div>
          ))}
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

      {/* RESIDENCES SHOWCASE PANEL */}
      <section id="showcase" className="py-24 px-6 max-w-7xl mx-auto scroll-mt-10">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12">
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold tracking-widest text-[#60a5fa] uppercase">Live Listings</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">Curated Living Spaces</h2>
            <p className="text-slate-400 text-sm max-w-md">
              View selected units currently available for lease or reservation within One Spatial Iloilo's state-of-the-art building.
            </p>
          </div>
          <button 
            onClick={onBrowseClick}
            className="mt-4 md:mt-0 text-xs font-bold uppercase tracking-wider text-white border-b-2 border-blue-400 hover:text-blue-300 hover:border-blue-300 pb-1.5 transition-all flex items-center gap-1 cursor-pointer"
          >
            Explore Active Inventory <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Units Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {units.length > 0 ? (
            units.map((unit) => (
              <div key={unit.id} className="glass-card rounded-2xl overflow-hidden shadow-xl border border-white/10 group hover:bg-white/10 transition-all duration-300">
                <div className="relative h-64 overflow-hidden bg-slate-950">
                  <img 
                    src={unit.images && unit.images[0] ? unit.images[0] : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'} 
                    alt={unit.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  />
                  
                  {/* Status Overlay Badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <span className={`px-3 py-1 text-[10px] font-mono font-semibold uppercase tracking-widest rounded-full shadow-md ${
                      unit.status === 'Available' 
                        ? 'bg-emerald-500/90 text-white backdrop-blur-md' 
                        : 'bg-slate-950/90 text-slate-300 backdrop-blur-md'
                    }`}>
                      {unit.status}
                    </span>
                  </div>

                  <div className="absolute top-4 right-4 z-10">
                    <span className="bg-slate-950/75 p-1.5 rounded-full text-white backdrop-blur-md">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <span className="text-[10px] font-semibold text-blue-400 font-mono tracking-widest uppercase">{unit.type}</span>
                    <h3 className="font-serif font-bold text-white text-lg mt-0.5 leading-snug group-hover:text-blue-200 transition-colors">
                      {unit.name}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 h-8">
                    {unit.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {unit.amenities.slice(0, 3).map((amenity, i) => (
                      <span key={i} className="text-[10px] font-medium text-slate-200 bg-white/5 border border-white/5 px-2 py-0.5 rounded">
                        {amenity}
                      </span>
                    ))}
                    {unit.amenities.length > 3 && (
                      <span className="text-[10px] font-medium text-slate-400 border border-white/5 px-2 py-0.5 rounded">
                        +{unit.amenities.length - 3} more
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5 font-sans">
                    <div>
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest block">RATE / DAY</span>
                      <span className="font-bold text-emerald-400 text-xl">${unit.price}</span>
                    </div>
                    <button 
                      onClick={onBrowseClick}
                      className="px-4 py-2 bg-white/5 hover:bg-white/15 text-slate-200 hover:text-white transition-all text-xs font-bold rounded-lg uppercase tracking-wide border border-white/10"
                    >
                      Book Layout
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            // Skeletons while loading
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-card rounded-2xl h-[450px] border border-white/10 animate-pulse">
                <div className="bg-white/5 h-64 rounded-t-2xl" />
                <div className="p-6 space-y-4">
                  <div className="h-4 bg-white/10 rounded w-1/4" />
                  <div className="h-6 bg-white/10 rounded w-3/4" />
                  <div className="space-y-2">
                    <div className="h-3 bg-white/5 rounded" />
                    <div className="h-3 bg-white/5 rounded w-5/6" />
                  </div>
                </div>
              </div>
            ))
          )}
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
                <p className="text-2xl font-serif font-bold text-teal-400 mt-1">91.4%</p>
              </div>
              <div className="bg-slate-950/45 border border-white/10 p-4 rounded-xl backdrop-blur-sm">
                <p className="text-xs text-slate-400 font-mono uppercase">Gross Billings</p>
                <p className="text-2xl font-serif font-bold text-indigo-400 mt-1">$119.3K</p>
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

            <div className="h-64 mt-2 select-none">
              <ResponsiveContainer width="100%" height="100%">
                <RechartAreaChart data={mockChartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                    itemStyle={{ color: '#fff', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#14b8a6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                </RechartAreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </section>

      {/* REVIEWS TESTIMONIAL CAROUSEL */}
      <section id="reviews" className="py-24 px-6 max-w-4xl mx-auto text-center scroll-mt-10 select-none">
        <div className="space-y-8 relative">
          <Star className="h-8 w-8 text-amber-400 fill-amber-400 mx-auto animate-pulse" />
          
          <div className="h-44 sm:h-36 flex items-center justify-center relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35 }}
                className="space-y-4"
              >
                <p className="text-lg sm:text-xl font-serif font-semibold text-white/90 leading-relaxed italic">
                  "{testimonialsData[activeTestimonial].comment}"
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button 
              type="button"
              aria-label="Previous testimonial"
              onClick={handlePrevTestimonial}
              className="p-2.5 border border-white/10 hover:bg-white/10 rounded-full transition-all active:scale-[0.9] text-white"
            >
              <ChevronLeft className="h-4 w-4 text-slate-300" />
            </button>

            <div className="flex items-center gap-3 text-left bg-white/5 border border-white/5 py-1.5 px-4 rounded-xl backdrop-blur-md">
              <div className="h-10 w-10 rounded-full overflow-hidden bg-white/10 border border-white/10">
                <img src={testimonialsData[activeTestimonial].avatar} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">{testimonialsData[activeTestimonial].name}</p>
                <p className="text-[10px] text-slate-400">{testimonialsData[activeTestimonial].role}</p>
              </div>
            </div>

            <button 
              type="button"
              aria-label="Next testimonial"
              onClick={handleNextTestimonial}
              className="p-2.5 border border-white/10 hover:bg-white/10 rounded-full transition-all active:scale-[0.9] text-white"
            >
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </button>
          </div>
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
                <p>support@galesurbanhaven.com</p>
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

          <div className="glass-card border border-white/10 p-8 rounded-3xl shadow-2xl flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-serif font-bold text-white">Operatives Request Form</h3>
              <p className="text-xs text-slate-400 mt-1 leading-normal">
                Complete your details and standard operation managers reply within 2 hours.
              </p>
            </div>

            <AnimatePresence mode="wait">
              {contactSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center space-y-3 my-6 text-emerald-200"
                >
                  <Sparkles className="h-8 w-8 text-emerald-400 mx-auto" />
                  <h4 className="font-bold text-sm">Message Compiled Safely</h4>
                  <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
                    Thank you, your inquiries are submitted to general concierge queues. We will reach back promptly.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4 mt-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Full Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Jonathan Sterling" 
                      className="w-full glass-input rounded-xl px-4 py-3 text-xs focus:outline-none transition-all placeholder:text-slate-500 font-semibold"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</label>
                    <input 
                      type="email" 
                      required
                      placeholder="jon@luxury.com" 
                      className="w-full glass-input rounded-xl px-4 py-3 text-xs focus:outline-none transition-all placeholder:text-slate-500 font-semibold"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Your Messages / Inquiries</label>
                    <textarea 
                      required
                      rows={4}
                      placeholder="Good morning operations. I would like to enquire about structural sizing of Tower B lofts..." 
                      className="w-full glass-input rounded-xl px-4 py-3 text-xs focus:outline-none transition-all placeholder:text-slate-500 font-semibold resize-none"
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-4 glass-button-primary text-white text-xs font-bold tracking-widest uppercase rounded-xl transition-all shadow-md mt-4 cursor-pointer"
                  >
                    Submit Inquiries
                  </button>
                </form>
              )}
            </AnimatePresence>
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
              <li><a href="#showcase" className="hover:text-white transition-colors">Residential Suites</a></li>
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
              <div className="flex items-center gap-3 pt-4">
                <a href="#" className="text-slate-400 hover:text-white transition-colors" aria-label="Twitter"><Twitter className="h-4 w-4" /></a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors" aria-label="Instagram"><Instagram className="h-4 w-4" /></a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors" aria-label="LinkedIn"><Linkedin className="h-4 w-4" /></a>
              </div>
            <a href="#landing-root" className="hover:text-slate-400">Legal Agreement</a>
            <a href="#landing-root" className="hover:text-slate-400">Privacy Charter</a>
            <a href="#landing-root" className="hover:text-slate-400 font-bold uppercase text-slate-300">Back To Peak ↑</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
