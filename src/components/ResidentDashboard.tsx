import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from './ToastContext.tsx';
import { 
  Building, Calendar, CreditCard, Wrench, Bell, User, LogOut, CheckCircle, Clock, AlertTriangle, Search, Filter, ArrowUpRight, ShieldAlert, ArrowLeft, ChevronLeft, ChevronRight, Sun, Heart, X, Sparkles, Upload, FileText, DollarSign, HelpCircle, QrCode, Smartphone, ShieldCheck 
} from 'lucide-react';
import { User as UserType, Unit, Booking, Payment, MaintenanceRequest, CondoNotification, Inquiry, Purchase } from '../types.ts';
import UserManual from './UserManual';

const GCASH_DEEPLINK_BASE = 'gcash://com.mynt.gcash/app/006300000800';

interface ResidentDashboardProps {
  user: UserType;
  token: string;
  onLogout: () => void;
  onUpdateUser: (updatedUser: UserType) => void;
  initialActiveTab?: TabType;
}

type TabType = 'overview' | 'browse' | 'bookings' | 'payments' | 'maintenance' | 'notifications' | 'profile';

export default function ResidentDashboard({ user, token, onLogout, onUpdateUser, initialActiveTab }: ResidentDashboardProps) {
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => {
    if (initialActiveTab) {
      setActiveTab(initialActiveTab);
    }
  }, [initialActiveTab]);
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState<boolean>(false);
  const [showUserManual, setShowUserManual] = useState<boolean>(false);

  // States
  const [units, setUnits] = useState<Unit[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([]);
  const [notifications, setNotifications] = useState<CondoNotification[]>([]);

  // Loading states
  const [loadingUnits, setLoadingUnits] = useState<boolean>(false);
  const [loadingBookings, setLoadingBookings] = useState<boolean>(false);
  const [loadingPayments, setLoadingPayments] = useState<boolean>(false);
  const [loadingMaintenance, setLoadingMaintenance] = useState<boolean>(false);

  // Profile Form States
  const [profileName, setProfileName] = useState<string>(user.name);
  const [profilePhone, setProfilePhone] = useState<string>(user.phone || '');
  const [profileUnit, setProfileUnit] = useState<string>(user.unitNumber || '');
  const [profileAvatar, setProfileAvatar] = useState<string>(user.avatarUrl || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState<boolean>(false);

  // Complex Booking Form State
  const [selectedUnitForBooking, setSelectedUnitForBooking] = useState<Unit | null>(null);
  const [checkInDate, setCheckInDate] = useState<string>('2026-06-15');
  const [checkOutDate, setCheckOutDate] = useState<string>('2026-06-18');
  const [guestsCount, setGuestsCount] = useState<number>(2);
  const [bookingNotes, setBookingNotes] = useState<string>('');
  const [submittingBooking, setSubmittingBooking] = useState<boolean>(false);

  // Inquire / Buy action state
  const [selectedUnitForAction, setSelectedUnitForAction] = useState<Unit | null>(null);
  const [actionType, setActionType] = useState<'inquire' | 'buy'>('inquire');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [actionMessage, setActionMessage] = useState<string>('');
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);

  // Unit Filtering Sizing
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Complex Receipt view State
  const [selectedBookingReceipt, setSelectedBookingReceipt] = useState<Booking | null>(null);

  // Complex Pay visual state
  const [payingInvoice, setPayingInvoice] = useState<Payment | null>(null);
  const [cardHolder, setCardHolder] = useState<string>(user.name);
  const [cardNumber, setCardNumber] = useState<string>('4000 1234 5678 9010');
  const [cardExpiry, setCardExpiry] = useState<string>('09/29');
  const [cardCVC, setCardCVC] = useState<string>('984');
  const [submittingPayment, setSubmittingPayment] = useState<boolean>(false);

  // Cash payment state
  const [paymentOption, setPaymentOption] = useState<'cash'>('cash');
  const gcashPhone = user.phone || '09123456789';

  const formatEmvField = (id: string, value: string) => `${id}${value.length.toString().padStart(2, '0')}${value}`;

  const computeGcashQrCrc = (payload: string) => {
    const bytes = new TextEncoder().encode(payload);
    let crc = 0xffff;

    for (const byte of bytes) {
      crc ^= byte << 8;
      for (let i = 0; i < 8; i += 1) {
        crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) : (crc << 1);
        crc &= 0xffff;
      }
    }

    return crc.toString(16).toUpperCase().padStart(4, '0');
  };

  const buildGcashQrPayload = (amount: number, orderId: string) => {
    const amountString = amount.toFixed(2);
    const merchantAccountInfo =
      formatEmvField('00', 'ph.ppmi.p2m') +
      formatEmvField('01', 'SRCPPHM2XXX') +
      formatEmvField('03', gcashPhone);

    const additionalData =
      formatEmvField('03', orderId) +
      formatEmvField('10', 'GalesCondo');

    const payloadWithoutCrc = [
      formatEmvField('00', '01'),
      formatEmvField('01', '12'),
      formatEmvField('26', merchantAccountInfo),
      formatEmvField('52', '0000'),
      formatEmvField('53', '608'),
      formatEmvField('54', amountString),
      formatEmvField('58', 'PH'),
      formatEmvField('59', 'Gales Condominium'),
      formatEmvField('60', 'Iloilo'),
      formatEmvField('62', additionalData),
      '6304'
    ].join('');

    return payloadWithoutCrc + computeGcashQrCrc(payloadWithoutCrc);
  };

  // Maintenance Filing Form State
  const [mIssueType, setMIssueType] = useState<string>('Plumbing');
  const [mPriority, setMPriority] = useState<'Low' | 'Medium' | 'High' | 'Emergency'>('Medium');
  const [mDescription, setMDescription] = useState<string>('');
  const [submittingMaintenance, setSubmittingMaintenance] = useState<boolean>(false);

  // Handlers
  const fetchAllData = () => {
    setLoadingUnits(true);
    fetch('/api/units')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setUnits(data);
      })
      .catch(e => console.error(e))
      .finally(() => setLoadingUnits(false));

    setLoadingBookings(true);
    fetch('/api/bookings', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setBookings(data);
      })
      .catch(e => console.error(e))
      .finally(() => setLoadingBookings(false));

    setLoadingPayments(true);
    fetch('/api/payments', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setPayments(data);
      })
      .catch(e => console.error(e))
      .finally(() => setLoadingPayments(false));

    setLoadingMaintenance(true);
    fetch('/api/maintenance', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setMaintenance(data);
      })
      .catch(e => console.error(e))
      .finally(() => setLoadingMaintenance(false));

    // Fetch Notifications
    fetch('/api/notifications', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setNotifications(data);
      })
      .catch(e => console.error(e));

    // Note: Inquiries and purchases are POST-only endpoints; no GET retrieval is supported
  };

  useEffect(() => {
    fetchAllData();
  }, [token]);

  // Profile update Handler
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: profileName,
          phone: profilePhone,
          unitNumber: profileUnit,
          avatarUrl: profileAvatar
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed updating profile.');

      onUpdateUser(data.user);
      toast('Your resident profile coordinates have been updated successfully!', 'success');
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Submit inquire or buy action
  const handleSubmitAction = async () => {
    if (!selectedUnitForAction) return;
    setSubmittingAction(true);

    try {
      const payload: any = {
        unitId: selectedUnitForAction.id,
        unitName: selectedUnitForAction.name,
        residentId: user.id,
        residentName: user.name,
        type: actionType,
        frequency: actionType === 'inquire' ? frequency : frequency,
        message: actionMessage,
      };

      const endpoint = actionType === 'inquire' ? '/api/inquiries' : '/api/purchases';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed.');

      toast(`${actionType === 'inquire' ? 'Inquiry' : 'Purchase request'} submitted for ${selectedUnitForAction.name}`, 'success');
      setSelectedUnitForAction(null);
      setActionMessage('');
      fetchAllData();
    } catch (err: any) {
      toast(err.message || 'Failed to submit request.', 'error');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Avatar Upload simulation
  const handleAvatarSelect = (url: string) => {
    setProfileAvatar(url);
    toast('Profile avatar set. Commit updates below or press save.', 'info');
  };

  const currentDateString = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const weatherSummary = '29°C • Partly Cloudy';

  // Calculate booking cost
  const calculateDays = () => {
    try {
      const start = new Date(checkInDate);
      const end = new Date(checkOutDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return isNaN(diffDays) ? 1 : diffDays || 1;
    } catch {
      return 1;
    }
  };

  const calculateTotalCost = (price: number) => {
    return calculateDays() * price;
  };

  // Currency formatting (display in PHP)
  const EXCHANGE_RATE = 57; // 1 USD -> 57 PHP (adjustable)
  const formatPHP = (usdAmount: number | null | undefined) => {
    const n = Number(usdAmount || 0) * EXCHANGE_RATE;
    return `₱${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Submit Booking request
  const handleConfirmBooking = async () => {
    if (!selectedUnitForBooking) return;
    setSubmittingBooking(true);
    
    const cost = calculateTotalCost(selectedUnitForBooking.price);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          unitId: selectedUnitForBooking.id,
          startDate: checkInDate,
          endDate: checkOutDate,
          totalPrice: cost,
          guestsCount,
          notes: bookingNotes
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not place booking.');

      toast(`Reservation for ${selectedUnitForBooking.name} created! Status: Pending Approval.`, 'success');
      setSelectedUnitForBooking(null);
      
      // Auto transition & Fetch new records
      fetchAllData();
      setActiveTab('bookings');
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setSubmittingBooking(false);
    }
  };

  // Settle invoice handler
  const handleSettleInvoice = async (e: React.FormEvent, customMethod?: string) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!payingInvoice) return;
    setSubmittingPayment(true);

    try {
      const selectedMethod = customMethod || 'Cash';
      const mockRef = (selectedMethod === 'Cash' ? 'CASH-' : selectedMethod.startsWith('QR') ? 'QRPH-' : 'TXN-') + Math.random().toString(36).substr(2, 6).toUpperCase();
      const res = await fetch(`/api/payments/${payingInvoice.id}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          method: selectedMethod,
          referenceNumber: mockRef,
          amount: payingInvoice.amount
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed compiling payment.');

      toast(`Transaction settled! Paid ${formatPHP(payingInvoice.amount)} (${payingInvoice.amount.toLocaleString(undefined,{minimumFractionDigits:2})} USD) successfully via ${selectedMethod}.`, 'success');
      setPayingInvoice(null);
      fetchAllData();
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleReceiptSettle = () => {
    if (!selectedBookingReceipt) return;
    const pendingPayment = payments.find(
      (p) => p.bookingId === selectedBookingReceipt.id && p.status === 'Pending'
    );

    if (pendingPayment) {
      setPayingInvoice(pendingPayment);
      setSelectedBookingReceipt(null);
      setActiveTab('payments');
      toast('Loaded your pending invoice into the payment terminal. Complete settlement here.', 'info');
      return;
    }

    setSelectedBookingReceipt(null);
    toast('Receipt closed. No pending invoice was found for this booking.', 'info');
  };

  // Submit Maintenance ticket
  const handleFilingMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mDescription) {
      toast('Please supply a written description of the issue.', 'warning');
      return;
    }

    setSubmittingMaintenance(true);
    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          unitNumber: user.unitNumber || 'Suite ' + user.id.slice(-4),
          issueType: mIssueType,
          description: mDescription,
          priority: mPriority
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Filing ticket failed.');

      toast(`Maintenance ticket submitted! Priority: ${mPriority}.`, 'success');
      setMDescription('');
      fetchAllData();
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setSubmittingMaintenance(false);
    }
  };

  // Clear single Notification
  const handleClearNotification = async (notifId: string) => {
    try {
      await fetch(`/api/notifications/read/${notifId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(n => n.id !== notifId));
    } catch (e) {
      console.error(e);
    }
  };

  // Clear all notifications
  const handleClearAllNotifications = async () => {
    try {
      await fetch(`/api/notifications/read-all`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications([]);
      toast('Notifications inbox cleared.', 'success');
    } catch (e) {
      console.error(e);
    }
  };

  // Filters calculation
  const getFilteredUnits = () => {
    return units.filter((u: Unit) => {
      const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            u.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType ? u.type.toLowerCase() === filterType.toLowerCase() : true;
      const matchesStatus = filterStatus ? u.status.toLowerCase() === filterStatus.toLowerCase() : true;
      return matchesSearch && matchesType && matchesStatus;
    });
  };

  // Metrics extraction for overview widgets
  const pendingApprovalsCount = bookings.filter(b => b.status === 'Pending').length;
  const activeBookingsCount = bookings.filter(b => b.status === 'Approved').length;
  const pendingPaymentsAmount = payments
    .filter(p => p.status === 'Pending')
    .reduce((sum, p) => sum + p.amount, 0);
  const activeIssuesCount = maintenance.filter(m => m.status !== 'Completed').length;

  return (
    <div id="res-dash-root" className="min-h-screen bg-transparent flex flex-col md:flex-row font-sans text-slate-100">
      
      {/* 1. SIDE NAVIGATION BAR */}
      <aside className={`w-full ${isSidebarCollapsed ? 'md:w-20' : 'md:w-72'} bg-slate-950/40 backdrop-blur-md text-white shrink-0 flex flex-col justify-between py-6 px-4 border-r border-white/10 md:h-screen sticky top-0 md:top-auto z-40 transition-all duration-300`}>
        <div className="space-y-6">
          <div className={`flex items-center gap-2.5 px-3 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="bg-gradient-to-tr from-blue-500 to-purple-500 text-white p-2 rounded-xl">
              <Building className="h-5 w-5" />
            </div>
            <div className={`${isSidebarCollapsed ? 'hidden' : ''}`}>
              <p className="font-bold text-sm tracking-widest text-white leading-none uppercase font-serif">One Spatial Iloilo</p>
              <p className="text-[10px] text-blue-400 font-mono tracking-wider mt-1 uppercase">Gales Urban Haven</p>
            </div>
          </div>

          {/* Mini Resident Info */}
          <div className={`bg-white/5 p-3 rounded-xl border border-white/10 flex items-center gap-2.5 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="h-9 w-9 bg-white/10 rounded-full border border-white/15 overflow-hidden shrink-0">
              <img src={user.avatarUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80'} alt="Avatar" />
            </div>
            <div className={`overflow-hidden transition-all ${isSidebarCollapsed ? 'opacity-0 w-0' : ''}`}>
              <p className="font-bold text-xs truncate max-w-[130px]">{user.name}</p>
              <p className="text-[10px] text-slate-400 truncate max-w-[130px]">{user.unitNumber || 'One Spatial Guest'}</p>
            </div>
          </div>

          {/* Tab Options links */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center' : 'justify-start'} px-3 py-2.5 rounded-xl text-left text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                activeTab === 'overview' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/10 border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Building className="h-4 w-4" />
              <span className={`${isSidebarCollapsed ? 'hidden' : ''}`}>Overview Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('browse')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                activeTab === 'browse' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/10 border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Search className="h-4 w-4" /> Browse Available Units
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                activeTab === 'bookings' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/10 border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar className="h-4 w-4" /> My Bookings {pendingApprovalsCount > 0 && <span className="ml-auto bg-amber-500 text-slate-950 font-bold text-[9px] px-1.5 py-0.5 rounded-full">{pendingApprovalsCount}</span>}
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                activeTab === 'payments' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/10 border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <CreditCard className="h-4 w-4" /> Ledger & Payments
            </button>
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                activeTab === 'maintenance' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/10 border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Wrench className="h-4 w-4" /> Maintenance Desk {activeIssuesCount > 0 && <span className="ml-auto bg-emerald-500 text-slate-900 font-bold text-[9px] px-1.5 py-0.5 rounded-full">{activeIssuesCount}</span>}
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                activeTab === 'notifications' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/10 border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Bell className="h-4 w-4" /> Bulletins & Alerts {notifications.length > 0 && <span className="ml-auto bg-rose-500 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-full">{notifications.length}</span>}
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                activeTab === 'profile' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/10 border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <User className="h-4 w-4" /> Profile Settings
            </button>
          </nav>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className={`w-full flex items-center gap-3 py-2.5 text-slate-400 hover:text-rose-400 transition-colors text-xs font-semibold tracking-wider uppercase cursor-pointer ${isSidebarCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="h-4 w-4" />
            <span className={`${isSidebarCollapsed ? 'hidden' : ''}`}>Sign Out Session</span>
          </button>
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-slate-300 hover:text-white transition-colors text-xs font-semibold uppercase tracking-wider border border-white/10 rounded-xl"
          >
            {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            <span className={`${isSidebarCollapsed ? 'hidden' : ''}`}>Collapse</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN HUB INTERFACE */}
      <main className="flex-1 overflow-y-auto px-4 py-8 md:p-12 md:max-h-screen">
        
        {/* TOP STATUS HEADER BAR */}
        <header className="flex flex-col gap-6 mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold font-mono tracking-wider text-blue-400 uppercase py-0.5">Welcome Back</span>
              <h1 className="text-3xl md:text-4xl font-serif font-black text-white mt-3 leading-tight">Welcome Back, {user.name}</h1>
              <p className="text-sm text-slate-400 mt-2 max-w-2xl">Resident • {profileUnit || 'Unit 1204'} • {currentDateString}</p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="glass-card p-3 rounded-3xl border border-white/10 shadow-sm min-w-[170px]">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-amber-300" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Weather</p>
                    <p className="text-sm font-semibold text-white">{weatherSummary}</p>
                  </div>
                </div>
              </div>
              <div className="glass-card p-3 rounded-3xl border border-white/10 shadow-sm min-w-[170px]">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-blue-300" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Notifications</p>
                    <p className="text-sm font-semibold text-white">{notifications.length} unread</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-4 items-center">
            <div className="glass-card p-4 rounded-3xl border border-white/10 shadow-sm flex items-center gap-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bookings, payments, maintenance, residents..."
                className="w-full bg-transparent placeholder:text-slate-500 text-sm text-white focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={handleClearAllNotifications}
                className="glass-button-secondary text-xs px-4 py-3 rounded-3xl"
              >
                Clear Alert Inbox
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="glass-card p-3 rounded-3xl border border-white/10 shadow-sm flex items-center gap-3"
                >
                  <div className="h-10 w-10 rounded-2xl overflow-hidden bg-slate-800 border border-white/10">
                    <img src={profileAvatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80'} alt="Resident profile" className="h-full w-full object-cover" />
                  </div>
                  <div className={`${isSidebarCollapsed ? 'hidden' : ''}`}>
                    <p className="text-sm text-white font-semibold leading-none">{profileName}</p>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Account Settings</p>
                  </div>
                </button>
                {profileMenuOpen && (
                  <div className="absolute right-0 mt-3 w-60 rounded-3xl border border-white/10 bg-slate-950/95 backdrop-blur-xl shadow-2xl shadow-slate-950/50 p-3 z-50">
                    {['Profile', 'Settings', 'Notifications', 'Security', 'Help Center', 'Logout'].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          if (item === 'Help Center') {
                            setShowUserManual(true);
                          } else if (item === 'Logout') {
                            setShowLogoutModal(true);
                          }
                        }}
                        className="w-full text-left px-3 py-3 rounded-2xl text-sm text-slate-200 hover:bg-white/5 transition-colors"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* CONTROLLER SWITCH ROUTING */}
        <AnimatePresence mode="wait">
          
          {/* OVERVIEW PANEL */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {/* Quick Widget Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                <div className="glass-card p-5 rounded-2xl border border-white/10 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Approved Bookings</p>
                    <p className="text-2xl font-serif font-bold text-white">{activeBookingsCount}</p>
                  </div>
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                </div>

                <div className="glass-card p-5 rounded-2xl border border-white/10 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Verification</p>
                    <p className="text-2xl font-serif font-bold text-white">{pendingApprovalsCount}</p>
                  </div>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
                    <Clock className="h-5 w-5" />
                  </div>
                </div>

                <div className="glass-card p-5 rounded-2xl border border-white/10 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Bills Score</p>
                    <p className="text-2xl font-serif font-bold text-rose-500">{formatPHP(pendingPaymentsAmount)}</p>
                  </div>
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>

                <div className="glass-card p-5 rounded-2xl border border-white/10 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Domestic Support Tickets</p>
                    <p className="text-2xl font-serif font-bold text-white">{activeIssuesCount}</p>
                  </div>
                  <div className="p-3 bg-white/5 border border-white/10 text-slate-400 rounded-xl">
                    <Wrench className="h-5 w-5" />
                  </div>
                </div>

              </div>

              {/* Grid 2 Column */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* News & Bulletins Block */}
                <div className="lg:col-span-7 glass-card p-6 rounded-3xl border border-white/10 shadow-sm space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-white/15">
                    <div>
                      <h3 className="font-serif font-bold text-white text-base">Announcements Board</h3>
                      <p className="text-slate-400 text-[10px]">Real-time broadcasts from Administration Office</p>
                    </div>
                    <button onClick={() => setActiveTab('notifications')} className="text-xs text-blue-400 hover:text-blue-300 hover:underline font-bold cursor-pointer">
                      View All
                    </button>
                  </div>

                  {notifications.length > 0 ? (
                    <div className="space-y-3.5">
                      {notifications.slice(0, 3).map((notif) => (
                        <div key={notif.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-xs text-white">{notif.title}</h4>
                            <span className="text-[9px] text-slate-400 font-mono">{new Date(notif.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">{notif.message}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-450 text-xs">
                      No active bulletins found inside your registry.
                    </div>
                  )}
                </div>

                {/* Quick Shortcuts */}
                <div className="lg:col-span-5 glass-card p-6 rounded-3xl border border-white/10 shadow-sm space-y-4">
                  <div>
                    <h3 className="font-serif font-bold text-white text-base">Quick Concierge Actions</h3>
                    <p className="text-slate-400 text-[10px]">Expedite requests to tower operators</p>
                  </div>

                  <div className="space-y-3">
                    <button 
                      onClick={() => setActiveTab('browse')}
                      className="w-full glass-button-primary text-white p-4 rounded-xl text-left font-bold text-xs uppercase tracking-wider flex items-center justify-between cursor-pointer"
                    >
                      Book Premium Club Suites <ArrowUpRight className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => {
                        setActiveTab('maintenance');
                        setMIssueType('Plumbing');
                      }}
                      className="w-full bg-white/5 hover:bg-white/15 text-slate-200 border border-white/10 p-4 rounded-xl text-left font-bold text-xs uppercase tracking-wider flex items-center justify-between cursor-pointer"
                    >
                      Report Leakage Anomalies <Wrench className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => {
                        setActiveTab('maintenance');
                        setMIssueType('Security / Parking');
                      }}
                      className="w-full bg-white/5 hover:bg-white/15 text-slate-200 border border-white/10 p-4 rounded-xl text-left font-bold text-xs uppercase tracking-wider flex items-center justify-between cursor-pointer"
                    >
                      Request Keycard Replacements <Smartphone className="h-4 w-4" />
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* BROWSE ALL UNITS PANEL */}
          {activeTab === 'browse' && (
            <motion.div
              key="browse-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Filter controls row */}
              <div className="glass-card p-4 rounded-2xl border border-white/10 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    className="w-full glass-input text-xs text-white pl-9 pr-4 py-2.5 rounded-xl focus:outline-none placeholder:text-slate-500 font-semibold"
                    placeholder="Search unit name/amenity..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div>
                  <select
                    aria-label="Filter unit type"
                    className="w-full glass-input text-xs text-white/80 px-3 py-2.5 rounded-xl focus:outline-none"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="" className="bg-slate-900 text-white">All Architectures</option>
                    <option value="Studio Deluxe" className="bg-slate-900 text-white">Studio Deluxe</option>
                    <option value="Penthouse" className="bg-slate-900 text-white">Penthouse</option>
                    <option value="1-Bedroom Loft" className="bg-slate-900 text-white">1-Bedroom Loft</option>
                    <option value="2-Bedroom Suite" className="bg-slate-900 text-white">2-Bedroom Suite</option>
                    <option value="Executive Studio" className="bg-slate-900 text-white">Executive Studio</option>
                  </select>
                </div>

                <div>
                  <select
                    aria-label="Filter unit status"
                    className="w-full glass-input text-xs text-white/80 px-3 py-2.5 rounded-xl focus:outline-none"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="" className="bg-slate-900 text-white">All Statuses</option>
                    <option value="Available" className="bg-slate-900 text-white">Available</option>
                    <option value="Booked" className="bg-slate-900 text-white">Leased / Booked</option>
                    <option value="Maintenance" className="bg-slate-900 text-white">Maintenance Window</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType('');
                    setFilterStatus('');
                    toast('Filters purged catalog reset.', 'info');
                  }}
                  className="w-full bg-white/5 hover:bg-white/15 border border-white/10 text-xs text-white py-2.5 rounded-xl font-bold uppercase tracking-wider cursor-pointer"
                >
                  Purge Filters
                </button>
              </div>

              {/* Units Showcase Grid cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredUnits().map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm group hover:shadow-lg transition-all flex flex-col justify-between">
                    <div>
                      <div className="relative h-48 bg-slate-900 overflow-hidden">
                        <img src={item.images[0]} alt="Unit" className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" />
                        <span className={`absolute top-3 left-3 px-2 py-0.5 rounded-full text-[9px] font-mono tracking-widest font-bold uppercase ${
                          item.status === 'Available' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-900 text-slate-300'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      
                      <div className="p-5 space-y-3">
                        <div>
                          <span className="text-[10px] text-slate-400 font-mono tracking-wider block">{item.type}</span>
                          <h4 className="font-serif font-bold text-slate-900 text-base">{item.name}</h4>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{item.description}</p>
                        
                        <div className="flex flex-wrap gap-1 leading-none">
                          {item.amenities.map((am, idx) => (
                            <span key={idx} className="text-[9px] bg-slate-50 border border-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              {am}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-5 border-t border-slate-50 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-bold">Daily Rate</span>
                        <span className="text-base font-bold text-slate-950">{formatPHP(item.price)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          disabled={item.status !== 'Available'}
                          onClick={() => {
                            setSelectedUnitForBooking(item);
                          }}
                          className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider shadow"
                        >
                          {item.status === 'Available' ? 'Book Suite' : 'Occupied'}
                        </button>

                        <button
                          onClick={() => {
                            setSelectedUnitForAction(item);
                            setActionType('inquire');
                            setFrequency('daily');
                            setActionMessage('');
                          }}
                          className="bg-white/5 hover:bg-white/10 text-white/90 px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider border border-white/10"
                        >
                          Inquire / Buy
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* MY BOOKINGS BOARD PANEL */}
          {activeTab === 'bookings' && (
            <motion.div
              key="bookings-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {bookings.length > 0 ? (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Registered Reservations</p>
                    <span className="text-[10px] text-slate-400 font-mono">Count: {bookings.length} reservations</span>
                  </div>

                  <div className="p-4 sm:p-6 overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs min-w-[600px]">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                          <th className="pb-3 px-3">Suite Name</th>
                          <th className="pb-3 px-3">Interval Dates</th>
                          <th className="pb-3 px-3 text-center">Guests</th>
                          <th className="pb-3 px-3">Bill Valuation</th>
                          <th className="pb-3 px-3">State Status</th>
                          <th className="pb-3 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map((book) => (
                          <tr key={book.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-3 font-semibold text-slate-950">{book.unitName || 'One Spatial Living'}</td>
                            <td className="py-4 px-3 text-slate-500">
                              <span className="font-medium text-slate-800">{book.startDate}</span> to <span className="font-medium text-slate-800">{book.endDate}</span>
                            </td>
                            <td className="py-4 px-3 text-center font-medium">{book.guestsCount} Persons</td>
                            <td className="py-4 px-3 font-bold text-slate-900">{formatPHP(book.totalPrice)}</td>
                            <td className="py-4 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                book.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                book.status === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                'bg-slate-100 text-slate-500'
                              }`}>
                                {book.status}
                              </span>
                            </td>
                            <td className="py-4 px-3 text-right space-x-2">
                              <button
                                type="button"
                                onClick={() => setSelectedBookingReceipt(book)}
                                aria-label="View receipt"
                                className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-900 shadow-sm transition hover:bg-slate-200"
                              >
                                <FileText className="h-3 w-3" /> Receipt
                              </button>
                              
                              {book.status === 'Pending' && (
                                <button
                                  onClick={async () => {
                                    try {
                                      const res = await fetch(`/api/bookings/${book.id}/status`, {
                                        method: 'PUT',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'Authorization': `Bearer ${token}`
                                        },
                                        body: JSON.stringify({ status: 'Cancelled' })
                                      });
                                      if (res.ok) {
                                        toast('Booking request cancelled.', 'success');
                                        fetchAllData();
                                      }
                                    } catch (e) {
                                      console.error(e);
                                    }
                                  }}
                                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-2.5 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider"
                                >
                                  Cancel
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="p-16 text-center bg-white rounded-3xl border border-slate-100 shadow space-y-4">
                  <Calendar className="h-10 w-10 text-slate-300 mx-auto" />
                  <div>
                    <h4 className="font-serif font-bold text-slate-900 text-base">No active reservations</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      You haven’t reserved any condominium facilities yet. Check are catalogs of lofts ready with 48 hours availability overrides!
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('browse')}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2.5 px-5 rounded-xl uppercase tracking-wider shadow"
                  >
                    Go Book a Suite Now
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* LEDGER & PAYMENTS PANEL */}
          {activeTab === 'payments' && (
            <motion.div
              key="payments-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Account Financials Ledger</p>
                  <span className="text-[10px] text-slate-400 font-mono">Invoice Ledger Receipts</span>
                </div>

                <div className="p-4 sm:p-6 overflow-x-auto">
                  {payments.length > 0 ? (
                    <table className="w-full border-collapse text-left text-xs min-w-[600px]">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                          <th className="pb-3 px-3">Description Item</th>
                          <th className="pb-3 px-3">Ref ID</th>
                          <th className="pb-3 px-3">Amount</th>
                          <th className="pb-3 px-3">Filing Date</th>
                          <th className="pb-3 px-3">State Status</th>
                          <th className="pb-3 px-3 text-right">Action Gate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((p) => (
                          <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-3 font-bold text-slate-900">{p.unitName || 'Operations Bill'}</td>
                            <td className="py-4 px-3 font-mono text-slate-500 text-[10px]">{p.referenceNumber}</td>
                            <td className="py-4 px-3 font-black text-slate-950">{formatPHP(p.amount)}</td>
                            <td className="py-4 px-3 text-slate-550">{new Date(p.createdAt).toLocaleDateString()}</td>
                            <td className="py-4 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                p.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                p.status === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                'bg-rose-50 text-rose-700 border border-rose-100'
                              }`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="py-4 px-3 text-right">
                              {p.status === 'Pending' ? (
                                <button
                                  onClick={() => setPayingInvoice(p)}
                                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] px-3.5 py-2 rounded-xl uppercase tracking-wider shadow"
                                >
                                  Transfer Securely
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-semibold">Cleared on {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : 'Today'}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-12 text-center text-slate-400">
                      No invoices filed on this profile ledger.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* CONCIERGE & MAINTENANCE PANEL */}
          {activeTab === 'maintenance' && (
            <motion.div
              key="maintenance-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Form Input Block */}
              <div className="lg:col-span-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 self-start">
                <div>
                  <h3 className="font-serif font-bold text-slate-950 text-lg">Report Apartment Issues</h3>
                  <p className="text-slate-400 text-[10px] leading-relaxed mt-1">
                    On-duty mechanics resolve emergency claims within 20 minutes!
                  </p>
                </div>

                <form onSubmit={handleFilingMaintenance} className="space-y-4">
                  <div className="space-y-1">
                    <label htmlFor="maintenance-issue-type" className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Issue Classification</label>
                    <select
                      id="maintenance-issue-type"
                      className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-700 px-3 py-3 rounded-xl focus:outline-none focus:bg-white"
                      value={mIssueType}
                      onChange={(e) => setMIssueType(e.target.value)}
                    >
                      <option value="Plumbing">💧 Plumbing (Water Leaks/Clogs)</option>
                      <option value="Electrical">⚡ Electrical (Outlets/Sconces)</option>
                      <option value="HVAC / Cooling">❄️ HVAC System (Air cooling/Heating)</option>
                      <option value="Locks & Security">🔑 Smart Lock (Keycards/Doors)</option>
                      <option value="Structural / Glass">🏢 Structural Glass & Carpentry</option>
                      <option value="Conciege Help">📦 Concierge Domestic Errand</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label id="maintenance-priority-label" className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Emergency Priority</label>
                    <div role="group" aria-labelledby="maintenance-priority-label" className="grid grid-cols-4 gap-2 text-center">
                      {(['Low', 'Medium', 'High', 'Emergency'] as const).map((pr) => (
                        <button
                          key={pr}
                          type="button"
                          onClick={() => setMPriority(pr)}
                          className={`py-2 px-1 rounded-lg border text-[10px] font-bold transition-all ${
                            mPriority === pr
                              ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                              : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          {pr}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="maintenance-description" className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Observation Details</label>
                    <textarea
                      id="maintenance-description"
                      required
                      rows={4}
                      className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 px-4 py-3 rounded-xl focus:border-slate-800 focus:bg-white focus:outline-none resize-none"
                      placeholder="Specify leaks location, warning sound indicators or thermostat E-code numbers..."
                      value={mDescription}
                      onChange={(e) => setMDescription(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingMaintenance}
                    className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white font-bold text-xs py-3.5 px-4 rounded-xl uppercase tracking-wider mt-4 shadow"
                  >
                    {submittingMaintenance ? 'Routing Dispatch...' : 'Dispatch Support Ticket'}
                  </button>
                </form>
              </div>

              {/* Status List Block */}
              <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div>
                  <h3 className="font-serif font-bold text-slate-950 text-base">Filed Tickets Log</h3>
                  <p className="text-slate-400 text-[10px]">Real-time status updates of active operations claim tickers</p>
                </div>

                <div className="space-y-4">
                  {maintenance.length > 0 ? (
                    maintenance.map((ticket) => (
                      <div key={ticket.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3">
                        <div className="flex justify-between items-start gap-3">
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase">{ticket.unitNumber || 'Common Spaces'}</span>
                            <h4 className="font-bold text-slate-900 text-xs">{ticket.issueType}</h4>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${
                              ticket.priority === 'Emergency' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                              ticket.priority === 'High' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                              'bg-slate-200 text-slate-700'
                            }`}>
                              {ticket.priority} Priority
                            </span>
                            
                            <span className={`px-2 py-0.5 rounded text-[8px] font-mono tracking-wider font-bold uppercase ${
                              ticket.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                              ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              ● {ticket.status}
                            </span>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                          {ticket.description}
                        </p>

                        {ticket.assignedStaff && (
                          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-semibold">
                            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span>Assigned Responder: <strong className="text-slate-800">{ticket.assignedStaff}</strong></span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-16 text-center text-slate-400 text-xs">
                      No tickets reported. All units running flawlessly!
                    </div>
                  )}
                </div>
              </div>

            </motion.div>
          )}

          {/* ALERTS & bulletins BOARD notifications */}
          {activeTab === 'notifications' && (
            <motion.div
              key="notifications-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Village Operations Mailbox</p>
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAllNotifications}
                    className="text-xs text-rose-600 font-bold uppercase tracking-wider hover:underline"
                  >
                    Clear All Alerts
                  </button>
                )}
              </div>

              <div className="space-y-3.5">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`p-5 rounded-2xl border shadow-sm transition-all flex items-start gap-4 ${
                        notif.type === 'success' ? 'border-emerald-100 bg-emerald-50/20' :
                        notif.type === 'alert' ? 'border-rose-100 bg-rose-50/20' :
                        notif.type === 'warning' ? 'border-amber-100 bg-amber-50/20' :
                        'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {notif.type === 'success' && <CheckCircle className="h-5 w-5 text-emerald-600" />}
                        {notif.type === 'alert' && <ShieldAlert className="h-5 w-5 text-rose-600" />}
                        {notif.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-600" />}
                        {notif.type === 'info' && <Bell className="h-5 w-5 text-slate-800" />}
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-serif font-bold text-slate-900 text-sm leading-none">{notif.title}</h4>
                          <span className="text-[10px] text-slate-400 font-mono">{new Date(notif.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                          {notif.message}
                        </p>
                      </div>

                      <button
                        onClick={() => handleClearNotification(notif.id)}
                        aria-label="Dismiss notification"
                        className="shrink-0 text-slate-400 hover:text-slate-600 p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-16 text-center bg-white rounded-3xl border border-slate-105 shadow space-y-2 text-slate-400">
                    <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-800">Your bulletins inbox is completely cleared!</p>
                    <p className="text-[10px] text-slate-500 max-w-xs mx-auto">No outstanding security alerts are flagged on this profile context.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* PROFILE SETTINGS PANEL */}
          {activeTab === 'profile' && (
            <motion.div
              key="profile-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-100 shadow space-y-8 max-w-2xl mx-auto"
            >
              <div>
                <h3 className="font-serif font-bold text-slate-950 text-xl">Account Coordinates</h3>
                <p className="text-slate-400 text-xs">Verify your registered mobile phone and billing address coordinates.</p>
              </div>

              {/* Visual Avatar Selector */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Select Profile Identity Avatar</label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full border border-slate-200 overflow-hidden bg-slate-100">
                    <img src={profileAvatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80'} alt="Avatar Preview" className="h-full w-full object-cover" />
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {Array.from({ length: 6 }).map((_, idx) => {
                      const seed = `avatar-res-${idx}`;
                      const url = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAvatarSelect(url)}
                          className={`h-9 w-9 rounded-full overflow-hidden border-2 transition-transform hover:scale-105 ${
                            profileAvatar === url ? 'border-slate-900 shadow' : 'border-transparent'
                          }`}
                        >
                          <img src={url} alt="av-select" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-1">
                    <label htmlFor="profile-name" className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Legal Registration Name</label>
                    <input
                      id="profile-name"
                    required
                    className="w-full bg-slate-50 border border-slate-200 text-xs py-3 px-4 rounded-xl focus:border-slate-800 focus:bg-white focus:outline-none placeholder:text-slate-400 text-slate-800 font-bold"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="profile-phone" className="text-[10px] font-bold uppercase tracking-wider text-slate-600">SMS / Call Coordinates</label>
                    <input
                      id="profile-phone"
                      type="tel"
                      className="w-full bg-slate-50 border border-slate-200 text-xs py-3 px-4 rounded-xl focus:border-slate-800 focus:bg-white focus:outline-none placeholder:text-slate-400 text-slate-800 font-bold"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="profile-unit" className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Assigned Suite Unit</label>
                    <input
                      id="profile-unit"
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 text-xs py-3 px-4 rounded-xl focus:border-slate-800 focus:bg-white focus:outline-none placeholder:text-slate-400 text-slate-900 font-bold"
                      value={profileUnit}
                      onChange={(e) => setProfileUnit(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="profile-email" className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Mail coordinates (read-only)</label>
                  <input
                    id="profile-email"
                    type="email"
                    disabled
                    className="w-full bg-slate-100 border border-slate-200 text-xs py-3 px-4 rounded-xl cursor-not-allowed text-slate-500 font-medium"
                    value={user.email}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="w-full py-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md mt-6"
                >
                  {isUpdatingProfile ? 'Saving Records...' : 'Save Profile Coordination'}
                </button>
              </form>
            </motion.div>
          )}

        </AnimatePresence>

      </main>

      {/* --- COMPLEX COMPONENT MODALS --- */}

      {/* A. CONFIGURE RESERVATION MODAL */}
      <AnimatePresence>
        {selectedUnitForBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden flex flex-col justify-between"
            >
              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono block">Layout: {selectedUnitForBooking.type}</span>
                    <h3 className="text-xl font-serif font-black text-slate-950 mt-1">{selectedUnitForBooking.name}</h3>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setSelectedUnitForBooking(null)}
                    aria-label="Close reservation modal"
                    className="text-slate-400 hover:text-slate-600 p-1 bg-slate-100 rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                  <div className="space-y-1">
                    <label htmlFor="booking-checkin" className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Check-In Date</label>
                    <input
                      id="booking-checkin"
                      type="date"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="booking-checkout" className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Check-Out Date</label>
                    <input
                      id="booking-checkout"
                      type="date"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                  <div className="space-y-1">
                    <label htmlFor="booking-guests" className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Adult Guests Count</label>
                    <input
                      id="booking-guests"
                      type="number"
                      min={1}
                      max={selectedUnitForBooking.capacity}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none font-bold"
                      value={guestsCount}
                      onChange={(e) => setGuestsCount(Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-1 text-slate-500">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Maximum Limit</label>
                    <div className="py-2.5 font-bold text-slate-700">{selectedUnitForBooking.capacity} Persons Allowed</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Instruction Remarks</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                    placeholder="E.g. High floor prefered late arrival, gate keys arrangement..."
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                  />
                </div>

                {/* Costs computation segment */}
                <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100 font-sans">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Estimated Price ({calculateDays()} Days)</span>
                    <span className="text-xl font-bold text-slate-950">{formatPHP(calculateTotalCost(selectedUnitForBooking.price))}</span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">Rate: {formatPHP(selectedUnitForBooking.price)} / Day</span>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedUnitForBooking(null)}
                  className="flex-1 py-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  className="flex-1 py-3 bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow"
                >
                  Confirm Reservation
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

        {/* C. INQUIRE / BUY MODAL */}
        <AnimatePresence>
          {selectedUnitForAction && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden flex flex-col"
              >
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-serif font-black">{selectedUnitForAction.name}</h3>
                      <p className="text-xs text-slate-500">{selectedUnitForAction.type} • {formatPHP(selectedUnitForAction.price)} / day</p>
                    </div>
                    <button type="button" aria-label="Close action modal" onClick={() => setSelectedUnitForAction(null)} className="text-slate-400 hover:text-slate-600 p-1 bg-slate-100 rounded-full">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-600">Action</label>
                      <div className="mt-2 flex gap-2">
                        <button type="button" onClick={() => setActionType('inquire')} className={`py-2 px-3 rounded-xl text-xs font-bold ${actionType === 'inquire' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-700'}`}>
                          Inquire
                        </button>
                        <button type="button" onClick={() => setActionType('buy')} className={`py-2 px-3 rounded-xl text-xs font-bold ${actionType === 'buy' ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-700'}`}>
                          Buy / Lease
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="action-frequency" className="text-[10px] font-bold uppercase text-slate-600">Frequency</label>
                      <select id="action-frequency" value={frequency} onChange={(e) => setFrequency(e.target.value as any)} className="w-full mt-2 bg-slate-50 border border-slate-200 py-2 px-3 rounded-xl text-xs">
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="action-message" className="text-[10px] font-bold uppercase text-slate-600">Message (optional)</label>
                    <textarea id="action-message" value={actionMessage} onChange={(e) => setActionMessage(e.target.value)} rows={4} className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" placeholder="Additional notes for the admin or seller..." />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                  <button onClick={() => setSelectedUnitForAction(null)} className="flex-1 py-3 border border-slate-200 bg-white text-slate-700 font-bold text-xs rounded-xl">Cancel</button>
                  <button onClick={handleSubmitAction} disabled={submittingAction} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl">
                    {submittingAction ? 'Submitting…' : actionType === 'inquire' ? 'Send Inquiry' : 'Request Purchase'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      {/* B. SECURED CARD PAYMENT TERMINAL MODAL */}
      <AnimatePresence>
        {payingInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white text-slate-950 rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden"
            >
              <form onSubmit={(e) => {
                e.preventDefault();
                handleSettleInvoice(e, 'Cash');
              }}>
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">One Spatial Pay</span>
                      <h3 className="font-serif font-black text-slate-950 text-lg leading-tight mt-0.5">Payment Desk</h3>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => {
                        setPayingInvoice(null);
                      }}
                      aria-label="Close payment modal"
                      className="p-1 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Cash method panel */}
                  <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl text-amber-950">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest font-bold text-amber-600">Cash Payment</p>
                          <h4 className="text-sm font-bold">Pay cash at the property office or with the Gales cashier.</h4>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-700">In-person</span>
                      </div>
                      <p className="text-[11px] text-amber-700 leading-relaxed mt-4">
                        After you settle the amount in cash, click Confirm Settle to register payment in your dashboard.
                      </p>
                    </div>
                  </div>

                  {/* Payment summary in local currency */}
                  <div className="p-4 bg-blue-50/60 rounded-2xl flex flex-col gap-1.5 border border-blue-100 font-sans">
                    <div className="flex justify-between items-center text-blue-900">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Total Bill</span>
                      <span className="text-sm font-black text-slate-900">{formatPHP(payingInvoice.amount)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPayingInvoice(null);
                    }}
                    className="flex-1 py-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                  >
                    Hold Invoice
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPayment}
                    className="flex-1 py-3 bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
                  >
                    {submittingPayment ? 'Processing...' : 'Confirm Settle'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* C. DETAILED RECIEPT DIALOGUE OVERLAY */}
      <AnimatePresence>
        {selectedBookingReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden p-6 sm:p-8"
            >
              <div className="space-y-6">
                <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="bg-slate-900 p-1.5 rounded-lg text-white">
                      <Building className="h-4 w-4" />
                    </div>
                    <span className="font-serif font-black text-slate-950 leading-none">VISTA RESIDENCE</span>
                  </div>
                  <button 
                    type="button"
                    aria-label="Close receipt dialog"
                    onClick={() => setSelectedBookingReceipt(null)}
                    className="p-1 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Simulated Reciept Frame */}
                <div className="space-y-4 text-xs font-sans">
                  <div className="text-center font-serif py-1">
                    <h4 className="font-bold text-slate-900 text-sm">TRANSACTION RECEIPT</h4>
                    <p className="text-slate-400 font-mono text-[9px] mt-0.5">Booking Invoice Ledger No: {selectedBookingReceipt.id}</p>
                  </div>

                  <div className="space-y-2.5 pt-4 border-t border-dashed border-slate-200">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Resident Customer:</span>
                      <span className="font-semibold text-slate-900">{selectedBookingReceipt.residentName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Suite Layout:</span>
                      <span className="font-semibold text-slate-900">{selectedBookingReceipt.unitName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Booking Interval:</span>
                      <span className="font-semibold text-slate-800">{selectedBookingReceipt.startDate} to {selectedBookingReceipt.endDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Guests Configuration:</span>
                      <span className="font-semibold text-slate-900">{selectedBookingReceipt.guestsCount} Persons</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-sm font-serif">
                    <span className="font-bold text-slate-900">Total Charged Amount</span>
                    <span className="text-lg font-black text-slate-950">{formatPHP(selectedBookingReceipt.totalPrice)}</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl text-[10px] text-slate-400 text-center uppercase tracking-wide border border-dashed border-slate-200">
                    Approved state triggers electronic ledger logging.
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
                  >
                    Print PDF
                  </button>
                  <button
                    onClick={handleReceiptSettle}
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
                  >
                    Okay, Settle
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* D. LOGOUT SECURITY CONFIRMATION MODAL */}
      <UserManual isOpen={showUserManual} onClose={() => setShowUserManual(false)} />

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
                <h3 className="font-serif font-bold text-slate-950 text-lg">Leave Session?</h3>
                <p className="text-xs text-slate-500 leading-normal max-w-xs mx-auto">
                  Confirm to close your secure resident authentication gateway. Outstanding maintenance dispatch notifications remain active!
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
                >
                  Stay
                </button>
                <button
                  onClick={() => {
                    setShowLogoutModal(false);
                    onLogout();
                    toast('Session logged out securely.', 'info');
                  }}
                  className="flex-1 py-3 bg-rose-650 hover:bg-rose-700 bg-rose-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md"
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
