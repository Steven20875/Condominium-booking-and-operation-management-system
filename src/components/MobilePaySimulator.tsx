import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Building, ShieldCheck, CheckCircle2, QrCode, AlertTriangle, ArrowRight, ArrowLeft, RefreshCw } from 'lucide-react';

export default function MobilePaySimulator() {
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [initAmount, setInitAmount] = useState<number>(0);
  const [residentName, setResidentName] = useState<string>('Gales Resident');
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [invoiceDetails, setInvoiceDetails] = useState<any | null>(null);

  // Flow control
  const [gcashStep, setGcashStep] = useState<'phone' | 'otp' | 'success'>('phone');
  const [mobileNumber, setMobileNumber] = useState<string>('09171234567');
  const [otpCode, setOtpCode] = useState<string>('');
  const [errorOtp, setErrorOtp] = useState<boolean>(false);
  const [referenceNum, setReferenceNum] = useState<string>('');
  const [selectedGateway, setSelectedGateway] = useState<'gcash' | 'maya'>('gcash');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const amt = params.get('amount');
    const name = params.get('name');

    if (id) {
      setInvoiceId(id);
      fetch(`/api/public/payments/${id}`)
        .then(async (res) => {
          if (!res.ok) {
            throw new Error('Billing record could not be traced on server.');
          }
          const data = await res.json();
          setInvoiceDetails(data);
          if (data.status === 'Paid') {
            setGcashStep('success');
            setReferenceNum(data.referenceNumber || 'RCV-LINK-OK');
          }
        })
        .catch((err) => {
          setError(err.message);
          // Fallbacks for offline resilience
          if (amt) setInitAmount(Number(amt));
          if (name) setResidentName(decodeURIComponent(name));
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
      setError('Invalid scanner reference. No valid receipt link payload detected.');
    }
  }, []);

  const handleMobileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileNumber || mobileNumber.length < 10) return;
    setGcashStep('otp');
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode !== '885912' && otpCode.length > 0) {
      // Allow user convenience, but note sandbox suggestion
      setErrorOtp(false);
    }

    setLoading(true);
    const amountToBill = invoiceDetails ? invoiceDetails.amount : initAmount;
    const finalMethod = selectedGateway === 'gcash' ? 'GCash Mobile' : 'Maya Standard';
    const mockRef = (selectedGateway === 'gcash' ? 'GCSH-MOB-' : 'MAYA-MOB-') + Math.random().toString(36).substr(2, 6).toUpperCase();

    try {
      const res = await fetch(`/api/public/payments/${invoiceId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          method: finalMethod,
          referenceNumber: mockRef,
          amount: amountToBill,
          payorName: invoiceDetails ? invoiceDetails.residentName : residentName
        })
      });

      if (!res.ok) {
        throw new Error('Transaction server rejected request.');
      }

      setReferenceNum(mockRef);
      setGcashStep('success');
    } catch (err: any) {
      setError(err.message || 'Payment system sync failed.');
    } finally {
      setLoading(false);
    }
  };

  const currencyValue = invoiceDetails ? invoiceDetails.amount : initAmount;
  const phpValue = (currencyValue * 57).toLocaleString(undefined, { minimumFractionDigits: 2 });

  if (loading && gcashStep !== 'success') {
    return (
      <div className="min-h-screen bg-[#070b13] flex flex-col items-center justify-center text-white px-6">
        <RefreshCw className="h-9 w-9 text-blue-500 animate-spin mb-4" />
        <p className="text-xs uppercase tracking-widest font-mono text-slate-400">Securing National Gateway...</p>
      </div>
    );
  }

  if (error && !invoiceId) {
    return (
      <div className="min-h-screen bg-[#070b13] flex flex-col items-center justify-center text-white px-6 text-center space-y-4">
        <div className="h-14 w-14 bg-red-950/40 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-serif font-bold text-white">Payment Desynced</h2>
          <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed">{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
        >
          Retry Scan
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b13] text-white flex flex-col items-center justify-center p-4">
      
      {/* Container simulating a sleek mobile app */}
      <div className="w-full max-w-sm bg-[#0c121e]/90 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Gateway Brand Header Bar */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-950 to-blue-950 py-4.5 px-6 border-b border-white/10 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs ${
              selectedGateway === 'gcash' ? 'bg-blue-600 text-white' : 'bg-[#1b253b] text-teal-400'
            }`}>
              {selectedGateway === 'gcash' ? 'g)' : 'M)'}
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-widest font-bold font-mono text-blue-400 block leading-none">Instantpay PH</span>
              <h3 className="text-xs font-bold leading-normal text-white">Gales Mobile Checkout</h3>
            </div>
          </div>
          
          <div className="flex items-center gap-1 opacity-80">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-[9px] font-mono tracking-wider font-semibold text-emerald-400">SECURE 256</span>
          </div>
        </div>

        {/* Invoice Summary Board */}
        <div className="bg-[#121b2d] px-6 py-5 border-b border-white/5 space-y-3.5">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Recipient</span>
              <h4 className="text-xs font-bold font-serif text-white tracking-wide">Gales Urban Haven (One Spatial Iloilo)</h4>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-slate-400 font-mono block">Invoice Registry</span>
              <span className="text-[11px] font-mono text-slate-300">#{invoiceId ? invoiceId.substring(0, 8) : 'GUEST'}</span>
            </div>
          </div>

          <div className="flex justify-between items-center bg-[#090e18] p-3 rounded-2xl border border-white/5">
            <div>
              <span className="text-[9px] text-slate-400 block uppercase font-bold">Resident</span>
              <span className="text-xs font-bold text-white mt-0.5 block">
                {invoiceDetails ? invoiceDetails.residentName : residentName}
              </span>
            </div>
            
            <div className="text-right">
              <span className="text-[9px] text-slate-400 block uppercase font-bold">Converted Amount</span>
              <span className="text-[15px] font-black text-blue-400 block">₱ {phpValue} PHP</span>
            </div>
          </div>
        </div>

        {/* MAIN STEPS */}
        <div className="p-6 flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: ENTER PHONE NUMBER */}
            {gcashStep === 'phone' && (
              <motion.form
                key="step-phone"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleMobileSubmit}
                className="space-y-6 flex-1 flex flex-col justify-between"
              >
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] tracking-widest uppercase font-bold text-slate-400 font-mono">Select Payment Outlet</label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setSelectedGateway('gcash')}
                        className={`py-3 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border transition ${
                          selectedGateway === 'gcash'
                            ? 'bg-blue-600/10 border-blue-500 text-blue-100'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Smartphone className="h-4 w-4" />
                        GCash Mobile
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setSelectedGateway('maya')}
                        className={`py-3 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border transition ${
                          selectedGateway === 'maya'
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-100'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        <QrCode className="h-4 w-4" />
                        PayMaya Standard
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] tracking-widest uppercase font-bold text-slate-400 font-mono">
                      {selectedGateway === 'gcash' ? 'GCash' : 'Maya'} Registered Mobile No.
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-2.5 text-xs text-slate-500 font-bold font-mono">+63</span>
                      <input
                        type="tel"
                        required
                        placeholder="917 123 4567"
                        className="w-full bg-[#111827] border border-white/10 text-xs py-3 pl-12 pr-4 rounded-xl focus:outline-none focus:border-blue-500 text-white font-bold font-mono tracking-widest"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 leading-normal block">
                      Requires Philippine mobile carriers (Globe, Smart, DITO, TM, or TNT). No actual cash balances are drawn in this secure Sandbox node.
                    </span>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Authenticate Online
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.form>
            )}

            {/* STEP 2: SMS TOKEN SIMULATION */}
            {gcashStep === 'otp' && (
              <motion.form
                key="step-otp"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleOtpSubmit}
                className="space-y-6 flex-1 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="text-center space-y-1.5 bg-[#121927] p-4.5 rounded-2xl border border-white/5">
                    <div className="h-9 w-9 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto">
                      <Smartphone className="h-4.5 w-4.5 animate-pulse" />
                    </div>
                    <h4 className="text-xs font-bold text-white tracking-wide">Secure SMS Validation Code</h4>
                    <p className="text-[10px] text-slate-400">
                      Sent OTP Code to mobile contact **{mobileNumber.slice(-4)}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] tracking-widest uppercase font-bold text-slate-400 font-mono text-center block">Enter 6-Digit Password Token</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="885912"
                      className="w-full bg-[#111827] border border-white/10 text-center text-sm font-bold tracking-[0.4em] py-3.5 px-3 rounded-2xl focus:outline-none focus:border-blue-500 font-mono text-white"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    />
                    
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono px-1">
                      <span>Sandbox Pin: <strong className="text-blue-400 font-bold bg-blue-500/10 px-1 py-0.5 rounded">885912</strong></span>
                      <button
                        type="button"
                        onClick={() => setOtpCode('885912')}
                        className="text-blue-400 font-bold hover:underline"
                      >
                        Auto-Fill
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Confirm Settle ₱ {phpValue} PHP
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setGcashStep('phone')}
                    className="w-full py-2.5 text-center text-slate-400 hover:text-white text-xs font-semibold hover:bg-white/5 rounded-xl transition cursor-pointer"
                  >
                    Change Gateway / Phone
                  </button>
                </div>
              </motion.form>
            )}

            {/* STEP 3: TRANSACTION SUCCESS CELEBRATION */}
            {gcashStep === 'success' && (
              <motion.div
                key="step-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6 space-y-6 flex-1 flex flex-col justify-center"
              >
                <div className="space-y-3">
                  <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="h-9 w-9" />
                  </div>
                  
                  <div>
                    <h4 className="text-base font-serif font-black text-white leading-tight">Paid in Local Currency</h4>
                    <p className="text-[10px] text-emerald-400 mt-0.5 uppercase tracking-widest font-mono font-bold font-semibold">Processed Successfully</p>
                  </div>
                </div>

                <div className="bg-[#111927] p-4.5 rounded-2xl border border-white/5 max-w-xs mx-auto text-left gap-2 flex flex-col">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-slate-400 uppercase font-bold text-[9px]">Vendor</span>
                    <span className="text-white font-semibold">Gales Urban Haven</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-slate-400 uppercase font-bold text-[9px]">Amount Refunded</span>
                    <span className="text-white font-bold">₱{phpValue} PHP</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono pt-1.5 border-t border-white/5">
                    <span className="text-slate-400 uppercase font-bold text-[9px]">Receipt Token</span>
                    <span className="text-blue-400 font-bold font-mono">{referenceNum || 'GCSH-MOB-F8AEE'}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] text-slate-400">
                    Your desktop dashboard will automatically sync and lock this receipt. Settle closed!
                  </p>
                  <button
                    onClick={() => {
                      if (window.opener) {
                        window.close();
                      } else {
                        // Redirect to main page
                        window.location.href = '/';
                      }
                    }}
                    className="w-full py-3 bg-slate-900 border border-white/10 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                  >
                    Go Back Home
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>

      <div className="mt-4 text-center text-[10px] text-slate-500 font-mono tracking-wider">
        <span>Powered globally via One Spatial Pay Philippines Inc.</span>
      </div>
    </div>
  );
}
