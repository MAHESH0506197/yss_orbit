// src/components/feedback/Toast.tsx
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertTriangle, XCircle, Info, X, LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastVariant = 'success' | 'warning' | 'error' | 'info' | 'default';
export type ToastPosition = 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';

export interface ToastItem {
  id: string;
  variant?: ToastVariant;
  title: string;
  description?: string;
  duration?: number; // ms; 0 = persistent
  action?: { label: string; onClick: () => void };
}

// ─── Variant config ───────────────────────────────────────────────────────────

const TOAST_VARIANTS: Record<
  ToastVariant,
  { wrapper: string; icon: string; DefaultIcon: LucideIcon; progress: string }
> = {
  success: {
    wrapper:  'bg-white dark:bg-gray-900 border-emerald-200 dark:border-emerald-800/60',
    icon:     'text-emerald-500',
    DefaultIcon: CheckCircle2,
    progress: 'bg-emerald-500',
  },
  warning: {
    wrapper:  'bg-white dark:bg-gray-900 border-amber-200 dark:border-amber-800/60',
    icon:     'text-amber-500',
    DefaultIcon: AlertTriangle,
    progress: 'bg-amber-500',
  },
  error: {
    wrapper:  'bg-white dark:bg-gray-900 border-red-200 dark:border-red-800/60',
    icon:     'text-red-500',
    DefaultIcon: XCircle,
    progress: 'bg-red-500',
  },
  info: {
    wrapper:  'bg-white dark:bg-gray-900 border-blue-200 dark:border-blue-800/60',
    icon:     'text-blue-500',
    DefaultIcon: Info,
    progress: 'bg-blue-500',
  },
  default: {
    wrapper:  'bg-white dark:bg-gray-900 border-border',
    icon:     'text-muted-foreground',
    DefaultIcon: Info,
    progress: 'bg-primary',
  },
};

const POSITION_CLS: Record<ToastPosition, string> = {
  'top-right':     'top-4 right-4 items-end',
  'top-center':    'top-4 left-1/2 -translate-x-1/2 items-center',
  'top-left':      'top-4 left-4 items-start',
  'bottom-right':  'bottom-4 right-4 items-end',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
  'bottom-left':   'bottom-4 left-4 items-start',
};

// ─── Individual Toast ─────────────────────────────────────────────────────────

interface ToastCardProps {
  toast: ToastItem;
  onRemove: (id: string) => void;
}

function ToastCard({ toast, onRemove }: ToastCardProps) {
  const { id, variant = 'default', title, description, duration = 4000, action } = toast;
  const v = TOAST_VARIANTS[variant];
  const IconComponent = v.DefaultIcon;
  const [progress, setProgress] = useState(100);
  const [visible, setVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(Date.now());

  // Entrance animation
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Auto-dismiss with progress bar
  useEffect(() => {
    if (!duration) return;
    startRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(pct);
      if (pct <= 0) dismiss();
    }, 50);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [duration]);

  const dismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => onRemove(id), 250);
  }, [id, onRemove]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'relative w-80 max-w-[calc(100vw-2rem)] rounded-xl border shadow-lg overflow-hidden',
        'transition-all duration-250 ease-out',
        visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95',
        v.wrapper,
      )}
    >
      {/* Progress bar */}
      {duration > 0 && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-muted/30">
          <div
            className={cn('h-full transition-none rounded-full', v.progress)}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="flex gap-3 px-4 pt-4 pb-3.5">
        {/* Icon */}
        <IconComponent size={18} strokeWidth={2} className={cn('shrink-0 mt-0.5', v.icon)} aria-hidden="true" />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-snug">{title}</p>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{description}</p>
          )}
          {action && (
            <button
              type="button"
              onClick={() => { action.onClick(); dismiss(); }}
              className="mt-2 text-xs font-semibold text-primary hover:underline focus-visible:outline-none"
            >
              {action.label}
            </button>
          )}
        </div>

        {/* Close */}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close notification"
          className="shrink-0 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150"
        >
          <X size={13} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

// ─── Context & Provider ───────────────────────────────────────────────────────

interface ToastContextValue {
  toast: (item: Omit<ToastItem, 'id'>) => void;
  success: (title: string, description?: string) => void;
  error:   (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info:    (title: string, description?: string) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export interface ToastProviderProps {
  children: React.ReactNode;
  position?: ToastPosition;
  maxToasts?: number;
}

export function ToastProvider({ children, position = 'top-right', maxToasts = 5 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const add = useCallback((item: Omit<ToastItem, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts(prev => {
      const next = [{ ...item, id }, ...prev];
      return next.slice(0, maxToasts);
    });
  }, [maxToasts]);

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const ctx: ToastContextValue = {
    toast:      add,
    success:    (title, description) => add({ variant: 'success', title, description }),
    error:      (title, description) => add({ variant: 'error',   title, description }),
    warning:    (title, description) => add({ variant: 'warning', title, description }),
    info:       (title, description) => add({ variant: 'info',    title, description }),
    dismiss:    remove,
    dismissAll: () => setToasts([]),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {createPortal(
        <div
          aria-label="Notifications"
          className={cn('fixed z-[9999] flex flex-col gap-2 pointer-events-none', POSITION_CLS[position])}
        >
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto">
              <ToastCard toast={t} onRemove={remove} />
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

// ─── Standalone export (legacy / simple usage) ────────────────────────────────

export { ToastCard as Toast };
export default ToastProvider;
