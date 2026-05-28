import React, { createContext, useContext, useState, useCallback, useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle2, Info, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  toasts: Toast[];
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info', duration: number = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toast, toasts, removeToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border bg-white backdrop-blur-md overflow-hidden ${
                t.type === 'success' 
                  ? 'border-emerald-100 bg-emerald-50/95 text-emerald-900' 
                  : t.type === 'error'
                  ? 'border-rose-100 bg-rose-50/95 text-rose-900'
                  : t.type === 'warning'
                  ? 'border-amber-100 bg-amber-50/95 text-amber-900'
                  : 'border-blue-100 bg-blue-50/95 text-blue-900'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {t.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                {t.type === 'error' && <XCircle className="h-5 w-5 text-rose-600" />}
                {t.type === 'warning' && <AlertCircle className="h-5 w-5 text-amber-600" />}
                {t.type === 'info' && <Info className="h-5 w-5 text-blue-600" />}
              </div>
              <div className="flex-1 text-sm font-medium pr-2 leading-relaxed">
                {t.message}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 rounded-lg p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
