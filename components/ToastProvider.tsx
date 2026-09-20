import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { MaskIcon } from './dashboard/MaskIcon';
import { DS_ICONS } from './dashboard/assets';
import './dashboard/dashboard.css';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Figma Toaster "Action" (341:17908): white pill, r24, shadow 0 -4 12 .08, 28px tick badge + Subtitle 16 Text/tertiary.
// Only the success variant exists in Figma; error / warning / info keep their semantic tint on the same pill geometry.
const PILL_STYLES: Record<ToastType, string> = {
  success: 'bg-white text-content-tertiary',
  error: 'bg-red-50 text-red-800',
  warning: 'bg-amber-50 text-amber-800',
  info: 'bg-primary-50 text-primary-700',
};

const ICON_STYLES: Record<Exclude<ToastType, 'success'>, string> = {
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-primary-500',
};

const OTHER_ICONS = {
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const ToastItem: React.FC<{ toast: Toast; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onDismiss(toast.id), 300);
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const dismissNow = () => { setIsExiting(true); setTimeout(() => onDismiss(toast.id), 300); };
  const Icon = toast.type === 'success' ? null : OTHER_ICONS[toast.type];

  return (
    <div
      role={toast.type === 'error' ? 'alert' : 'status'}
      onClick={dismissNow}
      className={`group pointer-events-auto flex items-center gap-1 min-h-12 px-3 py-2 rounded-3xl shadow-ds-toast max-w-[calc(100vw-32px)] cursor-pointer ${PILL_STYLES[toast.type]} ${isExiting ? 'ds-toast-out' : 'ds-toast-in'}`}
    >
      <span className="size-7 shrink-0 grid place-items-center">
        {Icon ? <Icon size={18} className={ICON_STYLES[toast.type as Exclude<ToastType, 'success'>]} /> : <MaskIcon src={DS_ICONS.tick} size={12} className="text-primary-500" />}
      </span>
      <span className="font-display text-ds-subtitle">{toast.message}</span>
      {/* Not in Figma: keyboard/touch-reachable dismiss. Collapsed to nothing until the pill is hovered or focused (Featured-Hover style reveal). */}
      <button
        type="button"
        onClick={e => { e.stopPropagation(); dismissNow(); }}
        aria-label="Dismiss notification"
        className="shrink-0 max-w-0 opacity-0 overflow-hidden grid place-items-center text-content-disabled hover:text-content-secondary transition-[max-width,opacity,margin] duration-ds-fast ease-ds-out motion-reduce:transition-none group-hover:max-w-6 group-hover:opacity-100 group-hover:ml-1 focus-visible:max-w-6 focus-visible:opacity-100 focus-visible:ml-1"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const showToast = useCallback((message: string, type: ToastType = 'success', duration = 4000) => {
    const id = `toast-${++counterRef.current}-${Date.now()}`;
    setToasts(prev => [...prev.slice(-4), { id, type, message, duration }]); // Keep max 5
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container — Figma Toaster overlay: TOP_CENTER, the pill sits 90px below the top edge; safe on mobile. */}
      <div className="fixed inset-x-0 top-[calc(90px+env(safe-area-inset-top))] z-[9999] px-4 flex flex-col items-center gap-2 pointer-events-none">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
