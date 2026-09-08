import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from './ToastContext.tsx';
import { 
  Building, Users, Calendar, CreditCard, Wrench, Bell, LogOut, Search, Filter, Plus, Trash2, Edit2, CheckCircle, Clock, AlertTriangle, ShieldCheck, ArrowRight, UserCheck, DollarSign, Settings, FileText, Check, X, ShieldAlert, BookOpen, BarChart3, ListCollapse, Upload
} from 'lucide-react';
import { 
  User as UserType, Unit, Booking, Payment, MaintenanceRequest, CondoNotification, ActivityLog, DashboardStats 
} from '../types.ts';
import UserManual from './UserManual';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Button, Input, Select, Badge, StatusBadge, Modal, ModalHeader, ModalBody, ModalFooter, ConfirmationDialog } from './ui';
import { formatCurrency, formatCurrencyText } from '../utils/currency.ts';

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
  const [showUserManual, setShowUserManual] = useState<boolean>(false);

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
  const [unitType, setUnitType] = useState<string>('');
  const [unitDescription, setUnitDescription] = useState<string>('');
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [unitCapacity, setUnitCapacity] = useState<number>(0);
  const [unitFloor, setUnitFloor] = useState<number>(0);
  const [unitAmenities, setUnitAmenities] = useState<string>('');
  const [unitImages, setUnitImages] = useState<string[]>([]);
  const [submittingUnit, setSubmittingUnit] = useState<boolean>(false);

  // Resident creation states
  const [showAddResidentModal, setShowAddResidentModal] = useState<boolean>(false);
  const [resName, setResName] = useState<string>('');
  const [resEmail, setResEmail] = useState<string>('');
  const [resPhone, setResPhone] = useState<string>('');
  const [resUnit, setResUnit] = useState<string>('');
  const [resPassword, setResPassword] = useState<string>('');
  const [submittingResident, setSubmittingResident] = useState<boolean>(false);

  // Invoice creation states
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState<boolean>(false);
  const [targetResidentBillId, setTargetResidentBillId] = useState<string>('');
  const [billUnitName, setBillUnitName] = useState<string>('');
  const [billAmount, setBillAmount] = useState<number>(0);
  const [submittingBill, setSubmittingBill] = useState<boolean>(false);

  // Payment recording state for admin
  const [selectedPaymentForAdmin, setSelectedPaymentForAdmin] = useState<Payment | null>(null);
  const [adminPaymentAmount, setAdminPaymentAmount] = useState<number>(0);
  const [adminPaymentMethod, setAdminPaymentMethod] = useState<string>('Cash');
  const [submittingAdminPayment, setSubmittingAdminPayment] = useState<boolean>(false);

  // Broadcast Announcement State
  const [bcTitle, setBcTitle] = useState<string>('');
  const [bcMessage, setBcMessage] = useState<string>('');
  const [bcType, setBcType] = useState<'info' | 'success' | 'warning' | 'alert'>('info');
  const [bcRole, setBcRole] = useState<'all' | 'resident' | 'admin'>('all');
  const [submittingBroadcast, setSubmittingBroadcast] = useState<boolean>(false);

  // Maintenance dispatch states
  const [dispatchTicket, setDispatchTicket] = useState<MaintenanceRequest | null>(null);
  const [dispatchStaff, setDispatchStaff] = useState<string>('');
  const [dispatchStatus, setDispatchStatus] = useState<string>('In Progress');

  // Search/Filters logic
  const [searchUnit, setSearchUnit] = useState<string>('');
  const [searchRes, setSearchRes] = useState<string>('');

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const authHeaders = { 'Authorization': `Bearer ${token}` };

      const safeJson = async (response: Response) => {
        if (!response.ok) return null;
        try {
          return await response.json();
        } catch (err) {
          console.error('JSON parse failed:', err);
          return null;
        }
      };

      // Execute all fetches in parallel and wait for all to complete
      const [statsRes, unitsRes, bookingsRes, paymentsRes, maintenanceRes, logsRes, residentsRes] = await Promise.all([
        fetch('/api/dashboard/stats', { headers: authHeaders }).then(safeJson).catch(e => { console.error('Stats fetch error:', e); return null; }),
        fetch('/api/units').then(safeJson).catch(e => { console.error('Units fetch error:', e); return null; }),
        fetch('/api/bookings', { headers: authHeaders }).then(safeJson).catch(e => { console.error('Bookings fetch error:', e); return null; }),
        fetch('/api/payments', { headers: authHeaders }).then(safeJson).catch(e => { console.error('Payments fetch error:', e); return null; }),
        fetch('/api/maintenance', { headers: authHeaders }).then(safeJson).catch(e => { console.error('Maintenance fetch error:', e); return null; }),
        fetch('/api/logs', { headers: authHeaders }).then(safeJson).catch(e => { console.error('Logs fetch error:', e); return null; }),
        fetch('/api/residents', { headers: authHeaders }).then(safeJson).catch(e => { console.error('Residents fetch error:', e); return null; })
      ]);

      // Update state atomically once all data is fetched
      if (statsRes && statsRes.bookingStatusData && Array.isArray(statsRes.bookingStatusData) && Array.isArray(statsRes.monthlyRevenue)) {
        setStats(statsRes as DashboardStats);
      } else {
        setStats(null);
      }
      if (Array.isArray(unitsRes)) setUnits(unitsRes);
      if (Array.isArray(bookingsRes)) setBookings(bookingsRes);
      if (Array.isArray(paymentsRes)) setPayments(paymentsRes);
      if (Array.isArray(maintenanceRes)) setMaintenance(maintenanceRes);
      if (Array.isArray(logsRes)) setLogs(logsRes);
      if (Array.isArray(residentsRes)) setResidents(residentsRes as UserType[]);
    } catch (e) {
      console.error('Fatal data synchronization error:', e);
      toast('Error refreshing dashboard data. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [token]);

  // Realtime updates via Server-Sent Events (SSE)
  useEffect(() => {
    if (!token) return;

    const url = `/api/events?token=${encodeURIComponent(token)}`;
    let es: EventSource | null = null;

    try {
      es = new EventSource(url as any);

      const handleStats = (e: MessageEvent) => {
        try {
          const payload = JSON.parse((e as any).data);
          setStats(payload);
        } catch (err) {
          console.error('Failed parsing SSE stats payload', err);
        }
      };

      es.addEventListener('stats', handleStats as any);
      es.onopen = () => console.log('SSE connected to /api/events');
      es.onerror = (err) => {
        console.error('SSE connection error', err);
        // keep EventSource alive; browser will retry automatically
      };
    } catch (err) {
      console.error('Failed to create EventSource', err);
    }

    return () => {
      try {
        if (es) {
          es.close();
        }
      } catch (e) {}
    };
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
      images: unitImages
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
      setUnitPrice(0);
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

  // Get filtered residents from actual backend data
  const getFilteredResidents = () => {
    return residents.filter(res => {
      return res.name.toLowerCase().includes(searchRes.toLowerCase()) || 
             res.email.toLowerCase().includes(searchRes.toLowerCase());
    });
  };

  const hasValidStats = !!stats && Array.isArray(stats.bookingStatusData) && Array.isArray(stats.monthlyRevenue);

  const reservationStatusSummary = stats?.bookingStatusData ?? [];
  const totalReservationCount = reservationStatusSummary.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const monthlyRevenueSeries = stats?.monthlyRevenue ?? [];
  const latestMonthlyRevenue = monthlyRevenueSeries.length > 0 ? monthlyRevenueSeries[monthlyRevenueSeries.length - 1] : null;
  const previousMonthlyRevenue = monthlyRevenueSeries.length > 1 ? monthlyRevenueSeries[monthlyRevenueSeries.length - 2] : latestMonthlyRevenue;
  const revenueDelta = latestMonthlyRevenue && previousMonthlyRevenue
    ? latestMonthlyRevenue.revenue - previousMonthlyRevenue.revenue
    : 0;
  const revenueDeltaPct = previousMonthlyRevenue && previousMonthlyRevenue.revenue
    ? (revenueDelta / previousMonthlyRevenue.revenue) * 100
    : 0;
  const revenueTrendLabel = revenueDelta >= 0
    ? `+${formatCurrency(Math.abs(revenueDelta))} vs previous month`
    : `-${formatCurrency(Math.abs(revenueDelta))} vs previous month`;

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
              <span className="font-bold text-xs text-white">GUH</span>
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-xs truncate max-w-[130px]">{user.name}</p>
              <p className="text-[10px] text-purple-400 font-bold truncate max-w-[130px]">GALES, URBAN HAVEN / Administrator</p>
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('metrics')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                activeTab === 'metrics' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/10 border border-white/10' : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <BarChart3 className="h-4 w-4" /> Operations Overview
            </button>
            <button
              onClick={() => setActiveTab('units')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                activeTab === 'units' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/10 border border-white/10' : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Building className="h-4 w-4" /> Units Manager
            </button>
            <button
              onClick={() => setActiveTab('residents')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                activeTab === 'residents' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/10 border border-white/10' : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Users className="h-4 w-4" /> Resident Directory
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                activeTab === 'bookings' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/10 border border-white/10' : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Calendar className="h-4 w-4" /> Reservation Approvals
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                activeTab === 'payments' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/10 border border-white/10' : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <CreditCard className="h-4 w-4" /> Cash Ledger
            </button>
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                activeTab === 'maintenance' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/10 border border-white/10' : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Wrench className="h-4 w-4" /> Repairs Claims Desk
            </button>
            <button
              onClick={() => setActiveTab('broadcast')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                activeTab === 'broadcast' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/10 border border-white/10' : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Bell className="h-4 w-4" /> Broadcast Console
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                activeTab === 'audit' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/10 border border-white/10' : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <BookOpen className="h-4 w-4" /> System Audit Trail
            </button>
          </nav>
        </div>

        <div className="pt-4 border-t border-white/10 px-3">
          <Button
            variant="danger"
            size="sm"
            fullWidth
            onClick={() => setShowLogoutModal(true)}
            icon={LogOut}
          >
            Quit Admin Gate
          </Button>
        </div>
      </aside>

      {/* 2. MAIN HUB INTERFACE */}
      <main className="flex-1 overflow-y-auto px-4 py-8 md:p-12 md:max-h-screen">
        
        {/* TOP METRIC MONITOR BAR */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold font-mono tracking-wider text-blue-400 uppercase">Operations Hub</span>
            <h1 className="text-3xl sm:text-4xl font-serif font-black text-white mt-1 tracking-tight">
              Property Management Dashboard
            </h1>
            <p className="text-xs text-slate-400 mt-2 font-medium">Real-time operations analytics & administrative controls</p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant="secondary"
              size="md"
              icon={BookOpen}
              onClick={() => setShowUserManual(true)}
            >
              Help Center
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={fetchAllData}
              isLoading={loading}
            >
              ↻ Sync Data
            </Button>
          </div>
        </header>

        {/* CONTROLLER SWITCH ROUTING */}
        <AnimatePresence mode="wait">
          
          {/* LOADING STATE */}
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center"
            >
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-slate-200 rounded-lg w-64 mx-auto"></div>
                <div className="h-4 bg-slate-100 rounded-lg w-96 mx-auto"></div>
                <p className="text-slate-400 font-mono text-xs mt-6">Synchronizing financial records and operational data...</p>
              </div>
            </motion.div>
          )}

          {/* A. PERFORMANCE METRICS TAB */}
          {!loading && activeTab === 'metrics' && hasValidStats ? (
            <motion.div
              key="metrics-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8 animate-fade-in"
            >
              {/* Row Widgets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                <div className="glass-card p-5 rounded-2xl border border-white/10 shadow-sm flex items-center justify-between hover:shadow-lg hover:border-white/15 transition-all hover:-translate-y-1 cursor-default">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Residents</p>
                    <p className="text-2xl font-serif font-bold text-white">{stats.totalResidents}</p>
                    <p className="text-[10px] text-slate-400">Current resident roster</p>
                  </div>
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                    <Users className="h-5 w-5" />
                  </div>
                </div>

                <div className="glass-card p-5 rounded-2xl border border-white/10 shadow-sm flex items-center justify-between hover:shadow-lg hover:border-white/15 transition-all hover:-translate-y-1 cursor-default">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Condo Units Listed</p>
                    <p className="text-2xl font-serif font-bold text-white">{stats.totalUnits}</p>
                    <p className="text-[10px] text-slate-400">Inventory from live unit data</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
                    <Building className="h-5 w-5" />
                  </div>
                </div>

                <div className="glass-card p-5 rounded-2xl border border-white/10 shadow-sm flex items-center justify-between hover:shadow-lg hover:border-white/15 transition-all hover:-translate-y-1 cursor-default">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Space Occupancy Rate</p>
                    <p className="text-2xl font-serif font-bold text-white">{stats.occupancyRate}%</p>
                    <p className="text-[10px] text-slate-400">Booked units / total units</p>
                  </div>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                </div>

                <div className="glass-card p-5 rounded-2xl border border-white/10 shadow-sm flex items-center justify-between hover:shadow-lg hover:border-white/15 transition-all hover:-translate-y-1 cursor-default">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">LEDGER Gross Income</p>
                    <p className="text-2xl font-serif font-bold text-emerald-400">{formatCurrency(stats.totalRevenue)}</p>
                    <p className="text-[10px] text-emerald-300">{revenueTrendLabel}</p>
                  </div>
                  <div className="p-3 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-xl">
                    <CreditCard className="h-5 w-5" />
                  </div>
                </div>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-card p-5 rounded-2xl border border-white/10 shadow-sm flex items-center justify-between hover:shadow-lg hover:border-white/15 transition-all hover:-translate-y-1 cursor-default">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Invoices</p>
                    <p className="text-2xl font-serif font-bold text-white">{stats.totalInvoices}</p>
                    <p className="text-[10px] text-slate-400">Paid and pending payment records</p>
                  </div>
                  <div className="p-3 bg-slate-500/10 border border-slate-500/20 text-slate-400 rounded-xl">
                    <FileText className="h-5 w-5" />
                  </div>
                </div>

                <div className="glass-card p-5 rounded-2xl border border-white/10 shadow-sm flex items-center justify-between hover:shadow-lg hover:border-white/15 transition-all hover:-translate-y-1 cursor-default">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Payments</p>
                    <p className="text-2xl font-serif font-bold text-white">{stats.pendingPayments}</p>
                    <p className="text-[10px] text-amber-300">Open balances awaiting collection</p>
                  </div>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>

                <div className="glass-card p-5 rounded-2xl border border-white/10 shadow-sm flex items-center justify-between hover:shadow-lg hover:border-white/15 transition-all hover:-translate-y-1 cursor-default">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Tickets</p>
                    <p className="text-2xl font-serif font-bold text-white">{stats.unresolvedMaintenance}</p>
                    <p className="text-[10px] text-rose-300">Open maintenance work orders</p>
                  </div>
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                </div>

                <div className="glass-card p-5 rounded-2xl border border-white/10 shadow-sm flex items-center justify-between hover:shadow-lg hover:border-white/15 transition-all hover:-translate-y-1 cursor-default">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Bookings</p>
                    <p className="text-2xl font-serif font-bold text-white">{stats.bookingStatusData.find(entry => entry.name === 'Pending Approval')?.value || 0}</p>
                    <p className="text-[10px] text-blue-300">Awaiting admin approval</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
                    <Clock className="h-5 w-5" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 glass-card p-6 rounded-3xl border border-white/10 shadow-sm hover:shadow-lg hover:border-white/15 transition-all">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-serif font-bold text-white text-base">Revenue Trend</h3>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400">From actual payment dates</span>
                  </div>
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

                <div className="lg:col-span-4 glass-card p-6 rounded-3xl border border-white/10 shadow-sm hover:shadow-lg hover:border-white/15 transition-all flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-serif font-bold text-white text-base">Reservations Status Ratio</h3>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400">{totalReservationCount} total</span>
                  </div>
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
                  <div className="space-y-2 mt-2">
                    {reservationStatusSummary.map((entry, index) => {
                      const share = totalReservationCount > 0 ? ((Number(entry.value || 0) / totalReservationCount) * 100).toFixed(1) : '0.0';
                      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
                      return (
                        <div key={`${entry.name}-${index}`} className="flex items-center justify-between gap-3 text-[11px] text-slate-300">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                            <span>{entry.name}</span>
                          </div>
                          <span>{entry.value} ({share}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </motion.div>
          ) : (!loading && activeTab === 'metrics') ? (
            <motion.div
              key="metrics-unavailable"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center"
            >
              <p className="text-slate-500 text-sm font-medium">Unable to load dashboard metrics. Please click Sync Data or refresh the page.</p>
            </motion.div>
          ) : null}

          {/* B. UNITS MANAGEMENT TAB */}
          {activeTab === 'units' && (
            <motion.div
              key="units-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6 animate-fade-in"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-4 rounded-2xl border border-white/10 shadow-sm hover:shadow-md hover:border-white/15 transition-all">
                <div className="max-w-sm w-full">
                  <Input
                    type="text"
                    placeholder="Search suite configurations..."
                    value={searchUnit}
                    onChange={(e: any) => setSearchUnit(e.target.value)}
                    icon={Search}
                    variant="glass"
                    fullWidth
                  />
                </div>

                <Button
                  variant="primary"
                  onClick={() => {
                    setEditUnitItem(null);
                    setUnitName('');
                    setUnitDescription('');
                    setUnitPrice(0);
                    setUnitAmenities('');
                    setShowAddUnitModal(true);
                  }}
                  icon={Plus}
                >
                  Add Premium Suite
                </Button>
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
                        <Button
                          variant="secondary"
                          size="sm"
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
                          icon={Edit2}
                          aria-label="Edit unit"
                        />
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteUnit(item.id)}
                          icon={Trash2}
                          aria-label="Delete unit"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {units.filter(u => u.name.toLowerCase().includes(searchUnit.toLowerCase())).length === 0 && (
                  <div className="md:col-span-2 lg:col-span-3 rounded-2xl border border-dashed border-slate-200 p-10 text-center">
                    <p className="font-serif text-lg font-bold text-slate-900">No units available.</p>
                    <p className="mt-2 text-sm text-slate-500">There are currently no units available in the inventory.</p>
                  </div>
                )}
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
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setShowAddResidentModal(true)}
                    icon={Plus}
                  >
                    Add Resident
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => {
                      if (getFilteredResidents().length === 0) {
                        toast('No targets found to invoice.', 'warning');
                        return;
                      }
                      setTargetResidentBillId(getFilteredResidents()[0].id);
                      setShowCreateInvoiceModal(true);
                    }}
                  >
                    Generate Invoice
                  </Button>
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
                      {getFilteredResidents().length > 0 ? getFilteredResidents().map((res) => (
                          <tr key={res.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-3 font-semibold text-slate-950 flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
                                <img src={res.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${res.name}`} alt="av" />
                              </div>
                              {res.name}
                            </td>
                            <td className="py-4 px-3 font-mono text-slate-600">{res.email}</td>
                            <td className="py-4 px-3 text-slate-600">{res.phone || 'Non Specified'}</td>
                            <td className="py-4 px-3 font-bold text-slate-900">{res.unitNumber || 'Not assigned'}</td>
                            <td className="py-4 px-3 text-slate-400 text-[10px]">{new Date(res.createdAt).toLocaleDateString()}</td>
                            <td className="py-4 px-3 text-right">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  setTargetResidentBillId(res.id);
                                  setShowCreateInvoiceModal(true);
                                }}
                              >
                                Bill
                              </Button>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={6} className="p-12 text-center text-slate-400">No residents registered yet.</td>
                          </tr>
                        )}
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
                              b.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                              b.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                              'bg-slate-100 text-slate-500'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="py-4 px-3 text-right">
                            {b.status === 'Pending' ? (
                              <div className="flex gap-1.5 justify-end">
                                <Button
                                  variant="success"
                                  size="sm"
                                  icon={Check}
                                  onClick={() => handleBookingApproval(b.id, 'Approved')}
                                />
                                <Button
                                  variant="danger"
                                  size="sm"
                                  icon={X}
                                  onClick={() => handleBookingApproval(b.id, 'Rejected')}
                                />
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
                          <td className="py-4 px-3 font-bold text-slate-900">{p.unitName || 'Not specified'}</td>
                          <td className="py-4 px-3">{p.residentName || 'Not specified'}</td>
                          <td className="py-4 px-3 text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                          <td className="py-4 px-3 font-mono text-[10px] text-slate-400">{p.referenceNumber}</td>
                          <td className="py-4 px-3 font-black text-slate-950">{formatCurrency(p.totalAmount)}</td>
                          <td className="py-4 px-3 font-semibold text-slate-900">{formatCurrency(p.paidAmount)}</td>
                          <td className="py-4 px-3 font-semibold text-slate-900">{formatCurrency(p.remainingBalance)}</td>
                          <td className="py-4 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono tracking-wider font-bold uppercase ${
                              p.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                              p.status === 'Partially Paid' ? 'bg-cyan-100 text-cyan-800' :
                              p.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="py-4 px-3 text-right font-bold text-slate-700">
                            {p.status === 'Paid' ? (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  toast('Receipt downloaded safely inside local database stream.', 'success');
                                }}
                                icon={FileText}
                              >
                                Download
                              </Button>
                            ) : (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                  setSelectedPaymentForAdmin(p);
                                  setAdminPaymentAmount(p.remainingBalance);
                                  setAdminPaymentMethod('Cash');
                                }}
                                icon={DollarSign}
                              >
                                Record Payment
                              </Button>
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
                          <td className="py-4 px-3 font-bold text-slate-900">{ticket.unitNumber || 'Not specified'}</td>
                          <td className="py-4 px-3">
                            <p className="font-bold">{ticket.residentName || 'Not specified'}</p>
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
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                setDispatchTicket(ticket);
                                setDispatchStatus(ticket.status);
                                setDispatchStaff(ticket.assignedStaff || '');
                              }}
                              icon={Wrench}
                            >
                              Dispatch
                            </Button>
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

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  disabled={submittingBroadcast}
                  isLoading={submittingBroadcast}
                  loadingText="Dispersing Signals..."
                >
                  Broadcast Bulletin Signals
                </Button>
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
                {logs.length > 0 ? logs.map((log) => (
                    <div key={log.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row justify-between gap-2">
                      <div className="space-y-1">
                        <p className="text-slate-900">
                          <strong className="text-slate-900 font-sans">[{log.userRole.toUpperCase()}] {log.userName}: </strong>
                          <span className="bg-slate-200 border border-slate-300 rounded px-1.5 py-0.5 text-[10px] font-bold font-mono uppercase">{log.action}</span>
                        </p>
                        <p className="text-slate-500 font-sans font-semibold text-[11px]">{formatCurrencyText(log.details)}</p>
                      </div>

                      <span className="text-[10px] text-slate-400 font-mono self-end shrink-0 whitespace-nowrap">{new Date(log.createdAt).toLocaleTimeString()}</span>
                    </div>
                  )) : (
                    <div className="p-12 text-center text-slate-400">No audit entries yet.</div>
                  )}
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
              className="bg-white text-slate-900 rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden backdrop-blur-sm"
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
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
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
                        placeholder="Enter amenities separated by commas"
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

                <div className="p-6 bg-slate-50 border-t border-slate-200 flex gap-3">
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => setShowAddUnitModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    disabled={submittingUnit}
                    isLoading={submittingUnit}
                  >
                    {submittingUnit ? 'Saving Records...' : 'Save Layout Listing'}
                  </Button>
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
              className="bg-white text-slate-900 rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full overflow-hidden backdrop-blur-sm"
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
                      className="p-1 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
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
                        placeholder="Enter resident name"
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
                        placeholder="resident@example.com"
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

                <div className="p-6 bg-slate-50 border-t border-slate-200 flex gap-3">
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => setShowAddResidentModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    disabled={submittingResident}
                    isLoading={submittingResident}
                  >
                    {submittingResident ? 'Saving...' : 'Add Resident'}
                  </Button>
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
              className="bg-white text-slate-900 rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full overflow-hidden backdrop-blur-sm"
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
                        {getFilteredResidents().map(r => (
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

      <AnimatePresence>
        {selectedPaymentForAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full overflow-hidden backdrop-blur-sm"
            >
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!selectedPaymentForAdmin) return;
                  if (adminPaymentAmount <= 0) {
                    toast('Enter a valid payment amount.', 'warning');
                    return;
                  }
                  if (adminPaymentAmount > selectedPaymentForAdmin.remainingBalance) {
                    toast('Payment exceeds remaining balance.', 'warning');
                    return;
                  }
                  setSubmittingAdminPayment(true);
                  try {
                    const res = await fetch(`/api/payments/${selectedPaymentForAdmin.id}/pay`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({
                        method: adminPaymentMethod,
                        referenceNumber: `ADMIN-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
                        amount: adminPaymentAmount
                      })
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Failed to apply admin payment.');
                    toast('Payment applied successfully.', 'success');
                    setSelectedPaymentForAdmin(null);
                    setAdminPaymentAmount(0);
                    fetchAllData();
                  } catch (err: any) {
                    toast(err.message, 'error');
                  } finally {
                    setSubmittingAdminPayment(false);
                  }
                }}
              >
                <div className="p-6 sm:p-8 space-y-4">
                  <div className="flex justify-between items-start pb-2 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Admin Ledger</span>
                      <h3 className="font-serif font-black text-slate-950 text-lg mt-0.5">Record Payment</h3>
                    </div>
                    <button
                      type="button"
                      aria-label="Close payment modal"
                      onClick={() => setSelectedPaymentForAdmin(null)}
                      className="p-1 bg-slate-100 rounded-full text-slate-400 cursor-pointer hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Resident</label>
                      <div className="text-slate-900 font-semibold">{selectedPaymentForAdmin.residentName}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Invoice Total</label>
                        <div className="text-slate-900 font-black">{formatCurrency(selectedPaymentForAdmin.totalAmount)}</div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Remaining</label>
                        <div className="text-slate-900 font-black">{formatCurrency(selectedPaymentForAdmin.remainingBalance)}</div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="admin-payment-amount" className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Payment Amount</label>
                      <input
                        id="admin-payment-amount"
                        type="number"
                        min={1}
                        max={selectedPaymentForAdmin.remainingBalance}
                        className="w-full bg-slate-50 border border-slate-200 text-xs py-2.5 px-3 rounded-xl focus:outline-none text-slate-900 font-semibold"
                        value={adminPaymentAmount}
                        onChange={(e) => setAdminPaymentAmount(Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="admin-payment-method" className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Payment Method</label>
                      <select
                        id="admin-payment-method"
                        className="w-full bg-slate-50 border border-slate-200 text-xs py-2.5 px-3 rounded-xl focus:outline-none text-slate-900 font-semibold"
                        value={adminPaymentMethod}
                        onChange={(e) => setAdminPaymentMethod(e.target.value)}
                      >
                        <option value="Cash">Cash</option>
                        <option value="GCash Mobile">GCash Mobile</option>
                        <option value="Credit Card">Credit Card</option>
                        <option value="Debit Card">Debit Card</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentForAdmin(null)}
                    className="flex-1 py-3 border border-slate-200 bg-white text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-slate-950 text-white font-bold text-xs uppercase tracking-wider rounded-xl"
                    disabled={submittingAdminPayment}
                  >
                    {submittingAdminPayment ? 'Applying...' : 'Record Payment'}
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
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full overflow-hidden backdrop-blur-sm"
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
                      <input
                        id="dispatch-staff"
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2.5 rounded-xl focus:outline-none text-slate-800 font-bold"
                        value={dispatchStaff}
                        onChange={(e) => setDispatchStaff(e.target.value)}
                        placeholder="Enter responder name"
                      />
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

                <div className="p-6 bg-slate-50 border-t border-slate-200 flex gap-3">
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => setDispatchTicket(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                  >
                    Confirm Dispatch
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. LOGOUT SECURITY CONFIRMATION MODAL */}
      <UserManual isOpen={showUserManual} onClose={() => setShowUserManual(false)} />

      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-200 space-y-5 text-center backdrop-blur-sm"
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
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setShowLogoutModal(false)}
                >
                  Stay in Cabin
                </Button>
                <Button
                  variant="danger"
                  fullWidth
                  onClick={() => {
                    setShowLogoutModal(false);
                    onLogout();
                    toast('Session logged out securely.', 'info');
                  }}
                >
                  Leave Gates
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
