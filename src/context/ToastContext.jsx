import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ title, message, type = 'info', duration = 4000 }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, title, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast Render Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0">
        {toasts.map(toast => {
          const isSuccess = toast.type === 'success';
          const isWarning = toast.type === 'warning';
          const isCritical = toast.type === 'critical' || toast.type === 'error';
          
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 animate-slide-down ${
                isCritical
                  ? 'bg-[#150D11] border-red-500/40 text-red-200 shadow-red-950/40'
                  : isWarning
                  ? 'bg-[#17130B] border-amber-500/40 text-amber-200 shadow-amber-950/40'
                  : isSuccess
                  ? 'bg-[#0B150F] border-emerald-500/40 text-emerald-200 shadow-emerald-950/40'
                  : 'bg-[#0F141D] border-[#1E2633] text-slate-200 shadow-black/60'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isCritical && <AlertOctagon className="w-5 h-5 text-red-400" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {!isCritical && !isWarning && !isSuccess && <Info className="w-5 h-5 text-indigo-400" />}
              </div>
              <div className="flex-1 text-sm">
                {toast.title && <div className="font-semibold text-slate-100">{toast.title}</div>}
                <div className="text-slate-300 text-xs mt-0.5 leading-relaxed">{toast.message}</div>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-200 transition-colors p-0.5 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
