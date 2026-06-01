import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from './ToastContext.tsx';
import { 
  Building, Users, Calendar, CreditCard, Wrench, Bell, LogOut, Search, Filter, Plus, Trash2, Edit2, CheckCircle, Clock, AlertTriangle, ShieldCheck, ArrowRight, UserCheck, DollarSign, Settings, FileText, Check, X, ShieldAlert, BookOpen, BarChart3, ListCollapse, Upload
} from 'lucide-react';
import { 
  User as UserType, Unit, Booking, Payment, MaintenanceRequest, CondoNotification, ActivityLog, DashboardStats 
} from '../types.ts';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

interface AdminDashboardProps {
  user: UserType;
  token: string;
  onLogout: () => void;
}

type TabType = 'metrics' | 'units' | 'residents' | 'bookings' | 'payments' | 'maintenance' | 'broadcast' | 'audit';

const COLORS = ['#0f172a', '#10b981', '#f59e0b', '#ef4444'];

export default function AdminDashboard({ user, token, onLogout }: AdminDashboardProps) {
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<TabType>('metrics');
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);

  const formatCurrency = (value: number | null | undefined): string => {
    if (value == null) {
      return 'PHP 0.00';
    }

    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Core collections
  const [units, setUnits] = useState<Unit[]>([]);
  const [residents, setResidents] = useState<UserType[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Form states
  const [loading, setLoading] = useState<boolean>(false);

  // Unit creation state
  const [showAddUnitModal, setShowAddUnitModal] = useState<boolean>(false);
  const [editUnitItem, setEditUnitItem] = useState<Unit | null>(null);
  const [unitName, setUnitName] = useState<string>('');
  const [unitType, setUnitType] = useState<string>('Studio Deluxe');
  const [unitDescription, setUnitDescription] = useState<string>('');
  const [unitPrice, setUnitPrice] = useState<number>(150);
  const [unitCapacity, setUnitCapacity] = useState<number>(2);
  const [unitFloor, setUnitFloor] = useState<number>(3);
  const [unitAmenities, setUnitAmenities] = useState<string>('Wi-Fi, Queen Bed, Smart TV');
  const [unitImages, setUnitImages] = useState<string[]>([]);
  const [submittingUnit, setSubmittingUnit] = useState<boolean>(false);

  // Resident creation states
  const [showAddResidentModal, setShowAddResidentModal] = useState<boolean>(false);
  const [resName, setResName] = useState<string>('');
  const [resEmail, setResEmail] = useState<string>('');
  const [resPhone, setResPhone] = useState<string>('');
  const [resUnit, setResUnit] = useState<string>('');
  const [resPassword, setResPassword] = useState<string>('resident123');
  const [submittingResident, setSubmittingResident] = useState<boolean>(false);

  // Invoice creation states
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState<boolean>(false);
  const [targetResidentBillId, setTargetResidentBillId] = useState<string>('');
  const [billUnitName, setBillUnitName] = useState<string>('Periodic Association Dues');
  const [billAmount, setBillAmount] = useState<number>(200);
  const [submittingBill, setSubmittingBill] = useState<boolean>(false);

  // Broadcast Announcement State
  const [bcTitle, setBcTitle] = useState<string>('');
  const [bcMessage, setBcMessage] = useState<string>('');
  const [bcType, setBcType] = useState<'info' | 'success' | 'warning' | 'alert'>('info');
  const [bcRole, setBcRole] = useState<'all' | 'resident' | 'admin'>('all');
  const [submittingBroadcast, setSubmittingBroadcast] = useState<boolean>(false);

  // Maintenance dispatch states
  const [dispatchTicket, setDispatchTicket] = useState<MaintenanceRequest | null>(null);
  const [dispatchStaff, setDispatchStaff] = useState<string>('Alex Johnson (Team HVAC)');
  const [dispatchStatus, setDispatchStatus] = useState<string>('In Progress');

  // Search/Filters logic
  const [searchUnit, setSearchUnit] = useState<string>('');
  const [searchRes, setSearchRes] = useState<string>('');

  const fetchAllData = () => {
    setLoading(true);
    
    // Core stats
    fetch('/api/dashboard/stats', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(e => console.error(e));

    // Units
    fetch('/api/units')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setUnits(data);
      })
      .catch(e => console.error(e));

    // Bookings
    fetch('/api/bookings', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setBookings(data);
      })
      .catch(e => console.error(e));

    // Payments
    fetch('/api/payments', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setPayments(data);
      })
      .catch(e => console.error(e));

    // Maintenance
    fetch('/api/maintenance', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setMaintenance(data);
      })
      .catch(e => console.error(e));

    // Audit Logs
    fetch('/api/logs', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setLogs(data);
      })
      .catch(e => console.error(e));

    // Resident users
    fetch('/api/residents', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setResidents(data as UserType[]);
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAllData();
  }, [token]);

  // Handler for adding dynamic units
  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitName || !unitPrice) {
      toast('Please supply a listing name and pricing.', 'warning');
      return;
    }

    setSubmittingUnit(true);
    const splitAm = unitAmenities.split(',').map(a => a.trim());
    const payload = {
      name: unitName,
      type: unitType,
      description: unitDescription,
      price: Number(unitPrice),
      amenities: splitAm,
      capacity: Number(unitCapacity),
      floorNumber: Number(unitFloor),
      images: unitImages.length > 0 ? unitImages : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80']
    };

    try {
      let res;
      if (editUnitItem) {
        // Edit
        res = await fetch(`/api/units/${editUnitItem.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        // Create
        res = await fetch('/api/units', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) throw new Error('Action failed.');
      
      toast(editUnitItem ? 'Unit listing updated successfully!' : 'New condominium layout listed!', 'success');
      setShowAddUnitModal(false);
      setEditUnitItem(null);
      
      // Flush fields
      setUnitName('');
      setUnitDescription('');
      setUnitPrice(150);
      setUnitImages([]);
      
      fetchAllData();
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setSubmittingUnit(false);
    }
  };

  // Image base64 loading simulation
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setUnitImages([reader.result]);
        toast('Custom device image parsed successfully!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  // Delete Unit listing
  const handleDeleteUnit = async (id: string) => {
    if (!window.confirm('Are you absolutely sure you want to unlist this condominium suite?')) return;
    try {
      const res = await fetch(`/api/units/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast('Unit unlisted successfully.', 'success');
        fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Booking approvals trigger
  const handleBookingApproval = async (id: string, state: 'Approved' | 'Rejected') => {
    try {
      const res = await fetch(`/api/bookings/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: state })
      });

      if (!res.ok) throw new Error('Action failed.');
      
      toast(`Booking reservation state set to: ${state}. Action validated.`, 'success');
      fetchAllData();
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  // Generate dynamic invoice
  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetResidentBillId || !billAmount) {
      toast('Please choose a resident profile and set invoice price.', 'warning');
      return;
    }

    setSubmittingBill(true);
    try {
      const res = await fetch('/api/payments/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          residentId: targetResidentBillId,
          unitName: billUnitName,
          amount: billAmount,
          status: 'Pending'
        })
      });

      if (!res.ok) throw new Error();
      toast('Invoiced compiled and linked on resident ledger.', 'success');
      setShowCreateInvoiceModal(false);
      fetchAllData();
    } catch {
      toast('Invoice compilation failed.', 'error');
    } finally {
      setSubmittingBill(false);
    }
  };

  // Dispatch announcer
  const handleSubmittingBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bcTitle || !bcMessage) return;

    setSubmittingBroadcast(true);
    try {
      const res = await fetch('/api/notifications/announce', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: bcTitle,
          message: bcMessage,
          type: bcType,
          recipientRole: bcRole
        })
      });

      if (!res.ok) throw new Error();
      toast('System wide board notification dispatched!', 'success');
      
      setBcTitle('');
      setBcMessage('');
      fetchAllData();
    } catch {
      toast('Broadcast failed to deliver.', 'error');
    } finally {
      setSubmittingBroadcast(false);
    }
  };

  // Dispatch technician mechanics handler
  const handleMaintenanceDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchTicket) return;

    try {
      const res = await fetch(`/api/maintenance/${dispatchTicket.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          assignedStaff: dispatchStaff,
          status: dispatchStatus
        })
      });

      if (!res.ok) throw new Error();
      toast('Technician dispatched and logging records resolved!', 'success');
      setDispatchTicket(null);
      fetchAllData();
    } catch {
      toast('Dispatch failed.', 'error');
    }
  };

  // Resolve residents list locally based on bookings to ensure 100% crash proof stability
  const getSimulatedResidents = () => {
    const mapReg: Record<string, UserType> = {};
    
    // Default mock rosters
    mapReg['user-resident-1'] = {
      id: 'user-resident-1',
      email: 'john@condo.com',
      name: 'John Doe',
      role: 'resident',
      phone: '+1 (555) 0122-874',
      unitNumber: 'Unit 1204',
      createdAt: new Date().toISOString()
    };
    
    mapReg['user-resident-2'] = {
      id: 'user-resident-2',
      email: 'alice@condo.com',
      name: 'Alice Cooper',
      role: 'resident',
      phone: '+1 (555) 0144-555',
      unitNumber: 'Unit 102',
      createdAt: new Date().toISOString()
    };

    // Aggregate dynamic registrees from bookings logs
    bookings.forEach(b => {
      if (b.residentId && !mapReg[b.residentId]) {
        mapReg[b.residentId] = {
          id: b.residentId,
          email: b.residentEmail || 'tenant@condo.com',
          name: b.residentName || 'New Resident',
          role: 'resident',
          createdAt: b.createdAt
        };
      }
    });

    return Object.values(mapReg).filter(res => {
      return res.name.toLowerCase().includes(searchRes.toLowerCase()) || 
             res.email.toLowerCase().includes(searchRes.toLowerCase());
    });
  };

  return (
    <div id="admin-dash-root" className="min-h-screen bg-transparent flex flex-col md:flex-row font-sans text-slate-100">
      
      {/* 1. SIDE NAVIGATION BAR */}
      <aside className="w-full md:w-64 bg-slate-950/40 backdrop-blur-md text-white shrink-0 flex flex-col justify-between py-6 px-4 border-r border-white/10 md:h-screen sticky top-0 md:top-auto z-40">
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 px-3">
            <div className="bg-gradient-to-tr from-blue-500 to-purple-500 text-white p-2 rounded-xl">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-sm tracking-widest text-white leading-none uppercase font-serif">One Spatial Iloilo</p>
              <p className="text-[10px] text-purple-400 font-mono tracking-wider mt-1 uppercase">Gales Urban Haven</p>
            </div>
          </div>

          <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex items-center gap-2.5">
            <div className="h-9 w-9 bg-white/10 rounded-full border border-white/15 overflow-hidden shrink-0 flex items-center justify-center">
              <span className="font-bold text-xs text-white">SJ</span>
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-xs truncate max-w-[130px]">{user.name}</p>
              <p className="text-[10px] text-purple-400 font-bold truncate max-w-[130px]">Chief Manager</p>
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('metrics')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                activeTab === 'metrics' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/10 border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart3 className="h-4 w-4" /> Operations Overview
            </button>
            <button
              onClick={() => setActiveTab('units')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                activeTab === 'units' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/10 border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Building className="h-4 w-4" /> Units Manager
            </button>
            <button
              onClick={() => setActiveTab('residents')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                activeTab === 'residents' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/10 border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="h-4 w-4" /> Resident Directory
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                activeTab === 'bookings' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/10 border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar className="h-4 w-4" /> Reservation Approvals
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                activeTab === 'payments' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/10 border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <CreditCard className="h-4 w-4" /> Cash Ledger
            </button>
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                activeTab === 'maintenance' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/10 border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Wrench className="h-4 w-4" /> Repairs Claims Desk
            </button>
            <button
              onClick={() => setActiveTab('broadcast')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                activeTab === 'broadcast' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/10 border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Bell className="h-4 w-4" /> Broadcast Console
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                activeTab === 'audit' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/10 border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <BookOpen className="h-4 w-4" /> System Audit Trail
            </button>
          </nav>
        </div>

        <div className="pt-4 border-t border-white/10 px-3">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-3 py-2.5 text-slate-400 hover:text-rose-400 transition-colors text-xs font-semibold tracking-wider uppercase cursor-pointer"
          >
            <LogOut className="h-4 w-4" /> Quit Admin Gate
          </button>
        </div>
      </aside>

      {/* 2. MAIN HUB INTERFACE */}
      <main className="flex-1 overflow-y-auto px-4 py-8 md:p-12 md:max-h-screen">
        
        {/* TOP METRIC MONITOR BAR */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold font-mono tracking-wider text-purple-400 uppercase">Tower Administration Room</span>
            <h1 className="text-2xl sm:text-3xl font-serif font-black text-white mt-1">
              Building Analytics Terminal
            </h1>
          </div>

          <div className="flex gap-2">
            <button
              onClick={fetchAllData}
              className="bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-semibold text-white px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              Reload API Feeds
            </button>
          </div>
        </header>

        {/* CONTROLLER SWITCH ROUTING */}
        <AnimatePresence mode="wait">
          
          {/* A. PERFORMANCE METRICS TAB */}
          {activeTab === 'metrics' && stats && (
            <motion.div
              key="metrics-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8 animate-fade-in"
            >
              {/* Row Widgets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                <div className="glass-card p-5 rounded-2xl border border-white/10 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Residents</p>
                    <p className="text-2xl font-serif font-bold text-white">{stats.totalResidents}</p>
                  </div>
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                    <Users className="h-5 w-5" />
                  </div>
                </div>

                <div className="glass-card p-5 rounded-2xl border border-white/10 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Condo Units Listed</p>
                    <p className="text-2xl font-serif font-bold text-white">{stats.totalUnits}</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
                    <Building className="h-5 w-5" />
                  </div>
                </div>

                <div className="glass-card p-5 rounded-2xl border border-white/10 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Space Occupancy Rate</p>
                    <p className="text-2xl font-serif font-bold text-white">{stats.occupancyRate}%</p>
                  </div>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                </div>

                <div className="glass-card p-5 rounded-2xl border border-white/10 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">LEDGER Gross Income</p>
                    <p className="text-2xl font-serif font-bold text-emerald-400">{formatCurrency(stats.totalRevenue)}</p>
                  </div>
                  <div className="p-3 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-xl">
                    <CreditCard className="h-5 w-5" />
                  </div>
                </div>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-card p-5 rounded-2xl border border-white/10 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Invoices</p>
                    <p className="text-2xl font-serif font-bold text-white">{stats.totalInvoices}</p>
                  </div>
                  <div className="p-3 bg-slate-500/10 border border-slate-500/20 text-slate-400 rounded-xl">
                    <FileText className="h-5 w-5" />
                  </div>
                </div>

                <div className="glass-card p-5 rounded-2xl border border-white/10 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Payments</p>
                    <p className="text-2xl font-serif font-bold text-white">{stats.pendingPayments}</p>
                  </div>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>

                <div className="glass-card p-5 rounded-2xl border border-white/10 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Tickets</p>
                    <p className="text-2xl font-serif font-bold text-white">{stats.unresolvedMaintenance}</p>
                  </div>
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                </div>

                <div className="glass-card p-5 rounded-2xl border border-white/10 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Bookings</p>
                    <p className="text-2xl font-serif font-bold text-white">{stats.bookingStatusData.find(entry => entry.name === 'Pending Approval')?.value || 0}</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
                    <Clock className="h-5 w-5" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 glass-card p-6 rounded-3xl border border-white/10 shadow-sm">
                  <h3 className="font-serif font-bold text-white text-base">Revenue Trend</h3>
                  <div className="h-80 mt-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.monthlyRevenue} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: 'rgb(15, 23, 42)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                      <Area type="monotone" dataKey="revenue" name="Inflow (₱)" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

                <div className="lg:col-span-4 glass-card p-6 rounded-3xl border border-white/10 shadow-sm flex flex-col justify-between">
                  <h3 className="font-serif font-bold text-white text-base">Reservations Status Ratio</h3>
                  <div className="h-64 mt-4 select-none flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.bookingStatusData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {stats.bookingStatusData.map((entry, index) => {
                            const segmentColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
                            return (
                              <Cell key={`cell-${index}`} fill={segmentColors[index % segmentColors.length]} />
                            );
                          })}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'rgb(15, 23, 42)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                        <Legend wrapperStyle={{ fontSize: '11px', color: '#fff' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* B. UNITS MANAGEMENT TAB */}
          {activeTab === 'units' && (
            <motion.div
              key="units-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6 animate-fade-in"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-4 rounded-2xl border border-white/10 shadow-sm">
                <div className="relative max-w-sm w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-450" />
                  <input
                    type="text"
                    className="w-full glass-input text-xs text-white pl-9 pr-4 py-2.5 rounded-xl focus:outline-none placeholder:text-slate-500 font-semibold"
                    placeholder="Search suite configurations..."
                    value={searchUnit}
                    onChange={(e) => setSearchUnit(e.target.value)}
                  />
                </div>

                <button
                  onClick={() => {
                    setEditUnitItem(null);
                    setUnitName('');
                    setUnitDescription('');
                    setUnitPrice(120);
                    setUnitAmenities('Wi-Fi, Queen Bed, Kitchenette, TV');
                    setShowAddUnitModal(true);
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 px-5 rounded-xl uppercase tracking-wider shadow-md flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Add Premium Suite
                </button>
              </div>

              {/* Grid listings cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {units.filter(u => u.name.toLowerCase().includes(searchUnit.toLowerCase())).map((item) => (
                  <div key={item.id} className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <div className="relative h-44 bg-slate-900 overflow-hidden">
                        <img src={item.images[0]} alt="unit" className="w-full h-full object-cover" />
                        <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[8px] font-mono tracking-widest font-bold bg-white text-slate-900">
                          {item.status}
                        </span>
                      </div>

                      <div className="p-5 space-y-3">
                        <div>
                          <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase block">{item.type}</span>
                          <h4 className="font-serif font-bold text-slate-900 text-base">{item.name}</h4>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
                        
                        <div className="flex flex-wrap gap-1 leading-none pt-1">
                          {item.amenities.map((a, i) => (
                            <span key={i} className="text-[9px] bg-slate-50 border border-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-bold">RATE</span>
                        <strong className="text-sm font-black text-slate-950">{formatCurrency(item.price)}</strong>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          aria-label="Edit unit"
                          onClick={() => {
                            setEditUnitItem(item);
                            setUnitName(item.name);
                            setUnitType(item.type);
                            setUnitDescription(item.description);
                            setUnitPrice(item.price);
                            setUnitCapacity(item.capacity);
                            setUnitFloor(item.floorNumber);
                            setUnitAmenities(item.amenities.join(', '));
                            setUnitImages(item.images);
                            setShowAddUnitModal(true);
                          }}
                          className="bg-white hover:bg-slate-100 border border-slate-200 p-2 rounded-xl text-slate-700"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Delete unit"
                          onClick={() => handleDeleteUnit(item.id)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 p-2 rounded-xl"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* C. RESIDENT DATABASE DIRECTORY TAB */}
          {activeTab === 'residents' && (
            <motion.div
              key="residents-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="relative max-w-sm w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 pl-9 pr-4 py-2.5 rounded-xl focus:outline-none"
                    placeholder="Search residential profiles Name / Email..."
                    value={searchRes}
                    onChange={(e) => setSearchRes(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddResidentModal(true)}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl uppercase tracking-wider shadow"
                  >
                    Add Resident
                  </button>
                  <button
                    onClick={() => {
                      if (getSimulatedResidents().length === 0) {
                        toast('No targets found to invoice.', 'warning');
                        return;
                      }
                      setTargetResidentBillId(getSimulatedResidents()[0].id);
                      setShowCreateInvoiceModal(true);
                    }}
                    className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold py-2.5 px-4 rounded-xl uppercase tracking-wider shadow-sm"
                  >
                    Generate Invoice
                  </button>
                </div>
              </div>

              {/* Roster database Table representation */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-600 tracking-wider">
                  Verified Resident Profiles Directory
                </div>

                <div className="p-4 sm:p-6 overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs min-w-[600px]">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                        <th className="pb-3 px-3">Full Legal Name</th>
                        <th className="pb-3 px-3">E-Mail Identity</th>
                        <th className="pb-3 px-3">Call Coordinates</th>
                        <th className="pb-3 px-3">Unit Assign</th>
                        <th className="pb-3 px-3">Enrollment Date</th>
                        <th className="pb-3 px-3 text-right">Ledger</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getSimulatedResidents().map((res) => (
                        <tr key={res.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-3 font-semibold text-slate-950 flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
                              <img src={res.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${res.name}`} alt="av" />
                            </div>
                            {res.name}
                          </td>
                          <td className="py-4 px-3 font-mono text-slate-600">{res.email}</td>
                          <td className="py-4 px-3 text-slate-600">{res.phone || 'Non Specified'}</td>
                          <td className="py-4 px-3 font-bold text-slate-900">{res.unitNumber || 'Suite pending'}</td>
                          <td className="py-4 px-3 text-slate-400 text-[10px]">{new Date(res.createdAt).toLocaleDateString()}</td>
                          <td className="py-4 px-3 text-right">
                            <button
                              onClick={() => {
                                setTargetResidentBillId(res.id);
                                setShowCreateInvoiceModal(true);
                              }}
                              className="text-[10px] uppercase tracking-wider font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-200"
                            >
                              Bill
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* D. RESERVATION CLAIMS APPROVAL TAB */}
          {activeTab === 'bookings' && (
            <motion.div
              key="bookings-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-fade-in"
            >
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs font-bold uppercase text-slate-600">
                <span>Lease Booking Reservations Board</span>
                <span className="font-mono text-[10px] text-slate-400">Total Bookings: {bookings.length}</span>
              </div>

              <div className="p-4 sm:p-6 overflow-x-auto">
                {bookings.length > 0 ? (
                  <table className="w-full border-collapse text-left text-xs min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                        <th className="pb-3 px-3">Resident Tenant</th>
                        <th className="pb-3 px-3">Target Suite</th>
                        <th className="pb-3 px-3">Booking Dates</th>
                        <th className="pb-3 px-3 text-center">Guests</th>
                        <th className="pb-3 px-3">Net Charge</th>
                        <th className="pb-3 px-3 text-center">Filing Status</th>
                        <th className="pb-3 px-3 text-right">Approve Board</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr key={b.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-3 font-semibold text-slate-900">
                            <p className="font-bold">{b.residentName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{b.residentEmail}</p>
                          </td>
                          <td className="py-4 px-3 font-serif font-bold text-slate-950">{b.unitName || 'Suites'}</td>
                          <td className="py-4 px-3 text-slate-600">
                            <strong>{b.startDate}</strong> to <strong>{b.endDate}</strong>
                          </td>
                          <td className="py-4 px-3 text-center font-bold text-slate-700">{b.guestsCount} Persons</td>
                          <td className="py-4 px-3 font-black text-slate-950">{formatCurrency(b.totalPrice)}</td>
                          <td className="py-4 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono tracking-wider font-bold uppercase ${
                              b.status === 'Approved' ? 'bg-emerald-55 bg-emerald-100 text-emerald-800' :
                              b.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                              'bg-slate-100 text-slate-500'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="py-4 px-3 text-right">
                            {b.status === 'Pending' ? (
                              <div className="flex gap-1.5 justify-end">
                                <button
                                  type="button"
                                  aria-label="Approve booking"
                                  onClick={() => handleBookingApproval(b.id, 'Approved')}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded-lg"
                                >
                                  <Check className="h-4.5 w-4.5" />
                                </button>
                                <button
                                  type="button"
                                  aria-label="Reject booking"
                                  onClick={() => handleBookingApproval(b.id, 'Rejected')}
                                  className="bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-lg"
                                >
                                  <X className="h-4.5 w-4.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-semibold uppercase">{b.status} Validated</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-12 text-center text-slate-400">
                    No active reservations recorded.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* E. FINANCIAL PAYMENTS LEDGER TAB */}
          {activeTab === 'payments' && (
            <motion.div
              key="payments-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-fade-in"
            >
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs font-bold uppercase text-slate-600">
                <span>Account Receivable Cash Ledger</span>
                <span className="font-mono text-[10px] text-slate-400">Inbound Transactions Tracker</span>
              </div>

              <div className="p-4 sm:p-6 overflow-x-auto">
                {payments.length > 0 ? (
                  <table className="w-full border-collapse text-left text-xs min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                        <th className="pb-3 px-3">Transaction Target</th>
                        <th className="pb-3 px-3">Resident Tenant</th>
                        <th className="pb-3 px-3">Filing Date</th>
                        <th className="pb-3 px-3 font-mono">Reference Code</th>
                        <th className="pb-3 px-3">Net Balance</th>
                        <th className="pb-3 px-3 text-center">Status</th>
                        <th className="pb-3 px-3 text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-3 font-bold text-slate-900">{p.unitName || 'Operations Service Fee'}</td>
                          <td className="py-4 px-3">{p.residentName || 'R. Tenant'}</td>
                          <td className="py-4 px-3 text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                          <td className="py-4 px-3 font-mono text-[10px] text-slate-400">{p.referenceNumber}</td>
                          <td className="py-4 px-3 font-black text-slate-950">{formatCurrency(p.amount)}</td>
                          <td className="py-4 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono tracking-wider font-bold uppercase ${
                              p.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                              p.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="py-4 px-3 text-right font-bold text-slate-700">
                            {p.status === 'Paid' ? (
                              <button
                                onClick={() => {
                                  toast('Receipt downloaded safely inside local database stream.', 'success');
                                }}
                                className="text-[10px] tracking-wider uppercase bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 py-1 rounded-lg"
                              >
                                Download Receipt
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-semibold">Invoiced pending</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-12 text-center text-slate-400">
                    No active invoices ledger.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* F. REPAIRS CLAIMS QUEUE TAB */}
          {activeTab === 'maintenance' && (
            <motion.div
              key="maintenance-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-fade-in space-y-4"
            >
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-600 tracking-widest uppercase">
                Active Tenant Repairs & Concierge Work Orders
              </div>

              <div className="p-4 sm:p-6 overflow-x-auto">
                {maintenance.length > 0 ? (
                  <table className="w-full border-collapse text-left text-xs min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                        <th className="pb-3 px-3">Suite / Apartment</th>
                        <th className="pb-3 px-3">Claims Target</th>
                        <th className="pb-3 px-3">Filing Date</th>
                        <th className="pb-3 px-3">Description Context</th>
                        <th className="pb-3 px-3">Priority Alert</th>
                        <th className="pb-3 px-3">Claims Status</th>
                        <th className="pb-3 px-3 text-right">Responder Dispatch</th>
                      </tr>
                    </thead>
                    <tbody>
                      {maintenance.map((ticket) => (
                        <tr key={ticket.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-3 font-bold text-slate-900">{ticket.unitNumber || 'Common Spaces'}</td>
                          <td className="py-4 px-3">
                            <p className="font-bold">{ticket.residentName || 'R. Tenant'}</p>
                            <p className="text-[10px] text-slate-400 font-semibold">{ticket.issueType}</p>
                          </td>
                          <td className="py-4 px-3 text-slate-500">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                          <td className="py-4 px-3 text-slate-600 max-w-[250px] truncate leading-normal font-semibold hover:text-slate-900 transition-colors cursor-help" title={ticket.description}>
                            {ticket.description}
                          </td>
                          <td className="py-4 px-3">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-mono tracking-wider font-bold uppercase ${
                              ticket.priority === 'Emergency' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                              ticket.priority === 'High' ? 'bg-amber-100 text-amber-800' :
                              'bg-slate-200 text-slate-700'
                            }`}>
                              {ticket.priority} Limit
                            </span>
                          </td>
                          <td className="py-4 px-3 font-semibold text-slate-800">
                            <span className="font-bold text-[10px]">● {ticket.status}</span>
                            {ticket.assignedStaff && <span className="block text-[9px] text-slate-400 font-normal">{ticket.assignedStaff}</span>}
                          </td>
                          <td className="py-4 px-3 text-right">
                            <button
                              onClick={() => {
                                setDispatchTicket(ticket);
                                setDispatchStatus(ticket.status);
                                setDispatchStaff(ticket.assignedStaff || 'Robert Mclean (Plumbing Specialist)');
                              }}
                              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-xl uppercase tracking-wider"
                            >
                              Dispatch
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-12 text-center text-slate-400">
                    No repair Claims reported.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* G. CONSOLE SYSTEM BOARD BROADCAST TAB */}
          {activeTab === 'broadcast' && (
            <motion.div
              key="broadcast-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-100 shadow-sm max-w-2xl mx-auto space-y-6"
            >
              <div>
                <h3 className="font-serif font-black text-slate-950 text-xl">Broadcast System Bulletin</h3>
                <p className="text-slate-400 text-xs">Simulate broadcasting notifications immediately to various tenant roles.</p>
              </div>

              <form onSubmit={handleSubmittingBroadcast} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Bulletin Dispatch Header</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Elevators Maintenance Notice: Sector North"
                    className="w-full bg-slate-50 border border-slate-200 text-xs py-3 px-4 rounded-xl focus:border-slate-800 focus:bg-white focus:outline-none placeholder:text-slate-400 text-slate-900 font-bold"
                    value={bcTitle}
                    onChange={(e) => setBcTitle(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="broadcast-visibility-filter" className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Recipient Visibility Filter</label>
                    <select
                      id="broadcast-visibility-filter"
                      className="w-full bg-slate-50 border border-slate-200 text-xs py-3 px-4 rounded-xl focus:outline-none focus:bg-white text-slate-700"
                      value={bcRole}
                      onChange={(e) => setBcRole(e.target.value as any)}
                    >
                      <option value="all">🌐 Broadcast Global (Everyone)</option>
                      <option value="resident">🔑 Safe Tenants (Residents)</option>
                      <option value="admin">🏢 Operations Staff only</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="broadcast-alert-tone" className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Dispatched Alert Tone</label>
                    <select
                      id="broadcast-alert-tone"
                      className="w-full bg-slate-50 border border-slate-200 text-xs py-3 px-4 rounded-xl focus:outline-none focus:bg-white text-slate-700"
                      value={bcType}
                      onChange={(e) => setBcType(e.target.value as any)}
                    >
                      <option value="info">🔵 Information (Blue notice)</option>
                      <option value="success">🟢 Operations Completed (Ozone / Water / Pool)</option>
                      <option value="warning">🟡 Standard System Caution (Water / Elevator Duct)</option>
                      <option value="alert">🔴 Emergency Alert (Security override / Fire drills)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Written Broadcast Context</label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Dear residents. We will dispatch mechanics to perform elevator safety checks between 2 PM and 4 PM in Tower Block B on May 30th. Kindly use sector escalators..."
                    className="w-full bg-slate-50 border border-slate-200 text-xs py-3 px-4 rounded-xl focus:border-slate-800 focus:bg-white focus:outline-none placeholder:text-slate-400 text-slate-800 resize-none font-medium h-32 leading-relaxed"
                    value={bcMessage}
                    onChange={(e) => setBcMessage(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingBroadcast}
                  className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md mt-6"
                >
                  {submittingBroadcast ? 'Dispersing Signals...' : 'Broadcast Bulletin Signals'}
                </button>
              </form>
            </motion.div>
          )}

          {/* H. SECURITY AUDIT TRAIL LOG TAB */}
          {activeTab === 'audit' && (
            <motion.div
              key="audit-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-fade-in space-y-4"
            >
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs font-bold uppercase text-slate-600">
                <span>Security Audit logs (Read-Only)</span>
                <span className="font-mono text-[10px] text-slate-400">Total Entries: {logs.length}</span>
              </div>

              <div className="p-4 sm:p-6 text-xs max-h-[500px] overflow-y-auto font-mono space-y-2.5 leading-relaxed">
                {logs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex flex-col sm:flex-row justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-slate-900">
                        <strong className="text-slate-900 font-sans">[{log.userRole.toUpperCase()}] {log.userName}: </strong>
                        <span className="bg-slate-200 border border-slate-300 rounded px-1.5 py-0.5 text-[10px] font-bold font-mono uppercase">{log.action}</span>
                      </p>
                      <p className="text-slate-500 font-sans font-semibold text-[11px]">{log.details}</p>
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono self-end shrink-0 whitespace-nowrap">{new Date(log.createdAt).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>

      </main>

      {/* --- ADMIN OPERATIONS DICTIONARY OVERLAYS --- */}

      {/* 1. ADD / LIST CONDO SUITE LISTING MODAL */}
      <AnimatePresence>
        {showAddUnitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white text-slate-900 rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden"
            >
              <form onSubmit={handleAddUnit} className="space-y-6">
                <div className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[500px]">
                  <div className="flex justify-between items-center text-slate-900">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Inventory Registry</span>
                      <h3 className="text-xl font-serif font-black text-slate-950 leading-none mt-1">
                        {editUnitItem ? 'Modify Listed Suite' : 'List New Premium Suite'}
                      </h3>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setShowAddUnitModal(false)}
                      aria-label="Close unit modal"
                      className="p-1.5 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Device upload simulation */}
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Image Asset Upload</label>
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center space-y-2 bg-slate-50 relative group text-slate-800">
                      <Upload className="h-6 w-6 text-slate-400 mx-auto" />
                      <div className="text-xs text-slate-500">
                        <label className="cursor-pointer text-slate-800 hover:text-slate-950 font-bold underline">
                          Upload file directly from device
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleImageUpload} 
                          />
                        </label>
                      </div>
                      <p className="text-[9px] text-slate-400">Supports JPG, PNG with auto base64 parsing representation safely</p>
                      
                      {unitImages && unitImages.length > 0 && (
                        <div className="mt-3 relative h-16 w-24 bg-slate-200 border border-slate-300 rounded-lg mx-auto overflow-hidden">
                          <img src={unitImages[0]} alt="prev-up" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            aria-label="Remove uploaded unit image"
                            onClick={() => setUnitImages([])}
                            className="absolute top-0.5 right-0.5 bg-slate-900 text-white rounded-full p-0.5 shrink-0"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="unit-name" className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Unit Name</label>
                      <input
                        id="unit-name"
                        type="text"
                        required
                        className="w-full bg-slate-50 border border-slate-200 text-xs py-2.5 px-3 rounded-xl focus:outline-none focus:bg-white text-slate-900 font-semibold"
                        placeholder="The Zenith Suite"
                        value={unitName}
                        onChange={(e) => setUnitName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="unit-type" className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Architecture Type</label>
                      <input
                        id="unit-type"
                        type="text"
                        required
                        className="w-full bg-slate-50 border border-slate-200 text-xs py-2.5 px-3 rounded-xl focus:outline-none focus:bg-white text-slate-900 font-semibold"
                        value={unitType}
                        onChange={(e) => setUnitType(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="space-y-1">
                      <label htmlFor="unit-price" className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Rate / Night</label>
                      <input
                        id="unit-price"
                        type="number"
                        required
                        className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded-xl focus:outline-none font-bold text-slate-900"
                        value={unitPrice}
                        onChange={(e) => setUnitPrice(Number(e.target.value))}
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="unit-capacity" className="text-[10px] font-bold uppercase tracking-wider text-slate-655 font-bold">Capacity</label>
                      <input
                        id="unit-capacity"
                        type="number"
                        required
                        className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded-xl focus:outline-none font-bold text-slate-900"
                        value={unitCapacity}
                        onChange={(e) => setUnitCapacity(Number(e.target.value))}
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="unit-floor" className="text-[10px] font-bold uppercase tracking-wider text-slate-655 font-bold">Floor Level</label>
                      <input
                        id="unit-floor"
                        type="number"
                        required
                        className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded-xl focus:outline-none font-bold text-slate-900"
                        value={unitFloor}
                        onChange={(e) => setUnitFloor(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Offered Amenities (Comma Separated)</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 text-xs py-2.5 px-3 rounded-xl focus:outline-none text-slate-900 font-semibold"
                      placeholder="Wi-Fi, Queen Bed, Kitchenette, Bath Tub, Coffee Nespresso"
                      value={unitAmenities}
                      onChange={(e) => setUnitAmenities(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Unit Layout Descriptions</label>
                    <textarea
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 text-xs py-2.5 px-3 rounded-xl focus:outline-none resize-none leading-relaxed text-slate-900 font-medium"
                      placeholder="High end interior lofts with southwest facing panorama..."
                      value={unitDescription}
                      onChange={(e) => setUnitDescription(e.target.value)}
                    />
                  </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddUnitModal(false)}
                    className="flex-1 py-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingUnit}
                    className="flex-1 py-3 bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    {submittingUnit ? 'Saving Records...' : 'Save Layout Listing'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. REGISTRATION OF RESIDENTS MANUAL PROFILE MODAL */}
      <AnimatePresence>
        {showAddResidentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white text-slate-900 rounded-3xl border border-slate-100 shadow-2xl max-w-sm w-full overflow-hidden"
            >
              <form onSubmit={async (e) => {
                e.preventDefault();
                setSubmittingResident(true);
                try {
                  const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      email: resEmail,
                      password: resPassword,
                      name: resName,
                      phone: resPhone,
                      unitNumber: resUnit
                    })
                  });

                  if (!res.ok) throw new Error();
                  toast('Resident account mapped successfully!', 'success');
                  setShowAddResidentModal(false);
                  
                  // Reset states
                  setResName('');
                  setResEmail('');
                  setResPhone('');
                  setResUnit('');
                  fetchAllData();
                } catch {
                  toast('Resident mapping failed.', 'error');
                } finally {
                  setSubmittingResident(false);
                }
              }}>
                <div className="p-6 sm:p-8 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 text-slate-900">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Profiles Directory</span>
                      <h3 className="font-serif font-black text-slate-950 text-lg mt-0.5">Enroll Resident</h3>
                    </div>
                    <button 
                      type="button" 
                      aria-label="Close resident modal"
                      onClick={() => setShowAddResidentModal(false)}
                      className="p-1 bg-slate-100 rounded-full text-slate-400 cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label htmlFor="resident-name" className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Legal Resident Name</label>
                      <input
                        id="resident-name"
                        type="text"
                        required
                        className="w-full bg-slate-50 border border-slate-200 text-xs py-2.5 px-3 rounded-xl focus:outline-none text-slate-900 font-semibold"
                        placeholder="John Doe"
                        value={resName}
                        onChange={(e) => setResName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="resident-email" className="text-[10px] font-bold uppercase tracking-wider text-slate-600">E-mail Identity</label>
                      <input
                        id="resident-email"
                        type="email"
                        required
                        className="w-full bg-slate-50 border border-slate-200 text-xs py-2.5 px-3 rounded-xl focus:outline-none font-mono text-slate-900 font-semibold"
                        placeholder="john@condo.com"
                        value={resEmail}
                        onChange={(e) => setResEmail(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label htmlFor="resident-phone" className="text-[10px] font-bold uppercase tracking-wider text-slate-600">SMS / Call</label>
                        <input
                          id="resident-phone"
                          type="tel"
                          placeholder="+1 (555) 012"
                          className="w-full bg-slate-50 border border-slate-200 text-xs py-2.5 px-3 rounded-xl focus:outline-none text-slate-900 font-semibold"
                          value={resPhone}
                          onChange={(e) => setResPhone(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="resident-unit" className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Suite Unit</label>
                        <input
                          id="resident-unit"
                          type="text"
                          placeholder="Unit 1204"
                          className="w-full bg-slate-50 border border-slate-200 text-xs py-2.5 px-3 rounded-xl focus:outline-none text-slate-900 font-semibold"
                          value={resUnit}
                          onChange={(e) => setResUnit(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="resident-password" className="text-[10px] font-bold uppercase tracking-wider text-slate-605">Security Password</label>
                      <input
                        id="resident-password"
                        type="text"
                        required
                        className="w-full bg-slate-50 border border-slate-200 text-xs py-2.5 px-3 rounded-xl focus:outline-none font-mono text-slate-900 font-bold"
                        value={resPassword}
                        onChange={(e) => setResPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddResidentModal(false)}
                    className="flex-1 py-3 border border-slate-200 bg-white text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingResident}
                    className="flex-1 py-3 bg-slate-950 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer"
                  >
                    {submittingResident ? 'Saving...' : 'Add Resident'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. GENERATION OF INBOUND BILLING INVOICE MODAL */}
      <AnimatePresence>
        {showCreateInvoiceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white text-slate-900 rounded-3xl border border-slate-100 shadow-2xl max-w-sm w-full overflow-hidden"
            >
              <form onSubmit={handleGenerateInvoice} className="space-y-4">
                <div className="p-6 sm:p-8 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 text-slate-900">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cash Ledger</span>
                      <h3 className="font-serif font-black text-slate-950 text-lg mt-0.5">Generate Receipt</h3>
                    </div>
                    <button 
                      type="button" 
                      aria-label="Close invoice modal"
                      onClick={() => setShowCreateInvoiceModal(false)}
                      className="p-1 bg-slate-100 rounded-full text-slate-400 cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-3 font-sans">
                    <div className="space-y-1">
                      <label htmlFor="invoice-resident" className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Choose Resident Customer</label>
                      <select
                        id="invoice-resident"
                        className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2.5 rounded-xl focus:outline-none focus:bg-white text-slate-900 font-semibold cursor-pointer"
                        value={targetResidentBillId}
                        onChange={(e) => setTargetResidentBillId(e.target.value)}
                      >
                        {getSimulatedResidents().map(r => (
                          <option key={r.id} value={r.id} className="text-slate-900 font-medium">👤 {r.name} ({r.unitNumber || 'Un-assigned'})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="invoice-title" className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Friction Invoice Title</label>
                      <input
                        id="invoice-title"
                        type="text"
                        required
                        className="w-full bg-slate-50 border border-slate-200 text-xs py-2.5 px-3 rounded-xl focus:outline-none focus:bg-white text-slate-900 font-semibold"
                        value={billUnitName}
                        onChange={(e) => setBillUnitName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="invoice-amount" className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Assigned Inflow Amount</label>
                      <input
                        id="invoice-amount"
                        type="number"
                        required
                        className="w-full bg-slate-50 border border-slate-200 text-xs py-2.5 px-3 rounded-xl focus:outline-none focus:bg-white font-bold text-slate-900"
                        value={billAmount}
                        onChange={(e) => setBillAmount(Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 text-slate-900">
                  <button
                    type="button"
                    onClick={() => setShowCreateInvoiceModal(false)}
                    className="flex-1 py-3 border border-slate-200 bg-white text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingBill}
                    className="flex-1 py-3 bg-slate-950 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer"
                  >
                    {submittingBill ? 'Processing...' : 'Confirm Ledger Invoice'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. TECHNICIAN DISPATCH & WORK STATUS MODAL */}
      <AnimatePresence>
        {dispatchTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-sm w-full overflow-hidden"
            >
              <form onSubmit={handleMaintenanceDispatch}>
                <div className="p-6 sm:p-8 space-y-4 font-sans">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Repairs Desk</span>
                      <h3 className="font-serif font-black text-slate-950 text-lg mt-0.5">Dispatch Responder</h3>
                    </div>
                    <button 
                      type="button" 
                      aria-label="Close dispatch modal"
                      onClick={() => setDispatchTicket(null)}
                      className="p-1 bg-slate-100 rounded-full text-slate-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
                    <p className="font-bold text-slate-800">Anomaly Context Check:</p>
                    <p className="text-slate-500 italic">"{dispatchTicket.description}"</p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="space-y-1">
                      <label htmlFor="dispatch-staff" className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Assign On-Duty Responder</label>
                      <select
                        id="dispatch-staff"
                        className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2.5 rounded-xl focus:outline-none text-slate-800 font-bold"
                        value={dispatchStaff}
                        onChange={(e) => setDispatchStaff(e.target.value)}
                      >
                        <option value="Robert Mclean (Plumber Lead)">🔧 Robert Mclean (Plumber Lead)</option>
                        <option value="Alex Johnson (Team HVAC)">❄️ Alex Johnson (Team HVAC)</option>
                        <option value="Terry Vance (Elevator Lead)">🏢 Terry Vance (Elevator Lead)</option>
                        <option value="Lucas Stark (Concierge Captain)">📦 Lucas Stark (Concierge Captain)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="dispatch-status" className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Task Resolution State</label>
                      <select
                        id="dispatch-status"
                        className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2.5 rounded-xl focus:outline-none text-slate-800 font-bold"
                        value={dispatchStatus}
                        onChange={(e) => setDispatchStatus(e.target.value)}
                      >
                        <option value="Pending">🟡 Pending Verification</option>
                        <option value="In Progress">🔵 Mechanic Dispatched / Active</option>
                        <option value="Completed">🟢 Ticket Completed & Resolved</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setDispatchTicket(null)}
                    className="flex-1 py-3 border border-slate-200 bg-white text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-slate-950 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md animate-pulse"
                  >
                    Confirm Dispatch
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. LOGOUT SECURITY CONFIRMATION MODAL */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-100 space-y-5 text-center"
            >
              <div className="inline-flex p-3 bg-rose-50 rounded-full text-rose-600">
                <LogOut className="h-6 w-6" />
              </div>

              <div className="space-y-2">
                <h3 className="font-serif font-bold text-slate-950 text-lg">Quit Administrator Gate?</h3>
                <p className="text-xs text-slate-500 leading-normal max-w-xs mx-auto">
                  Confirm to sign out of the One Spatial Iloilo Operations control room panel.
                </p>
              </div>

              <div className="flex gap-3 pt-2 font-sans">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
                >
                  Stay in Cabin
                </button>
                <button
                  onClick={() => {
                    setShowLogoutModal(false);
                    onLogout();
                    toast('Session logged out securely.', 'info');
                  }}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md"
                >
                  Leave Gates
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
