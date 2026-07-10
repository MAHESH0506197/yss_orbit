// src/components/feedback/Alert.tsx
import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  X,
  LucideIcon,
} from 'lucide-react';
import { cn } from '../../utils/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AlertVariant = 'success' | 'warning' | 'error' | 'info' | 'default';

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children?: React.ReactNode;
  /** Override the default icon */
  icon?: LucideIcon | null;
  /** Show a close / dismiss button */
  dismissible?: boolean;
  onDismiss?: () => void;
  /** Compact single-line style */
  compact?: boolean;
  className?: string;
}

// ─── Variant tokens ───────────────────────────────────────────────────────────

const ALERT_VARIANTS: Record<
  AlertVariant,
  { wrapper: string; icon: string; DefaultIcon: LucideIcon }
> = {
  success: {
    wrapper: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800/50 dark:text-emerald-300',
    icon:    'text-emerald-500 dark:text-emerald-400',
    DefaultIcon: CheckCircle2,
  },
  warning: {
    wrapper: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800/50 dark:text-amber-300',
    icon:    'text-amber-500 dark:text-amber-400',
    DefaultIcon: AlertTriangle,
  },
  error: {
    wrapper: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-800/50 dark:text-red-300',
    icon:    'text-red-500 dark:text-red-400',
    DefaultIcon: XCircle,
  },
  info: {
    wrapper: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/30 dark:border-blue-800/50 dark:text-blue-300',
    icon:    'text-blue-500 dark:text-blue-400',
    DefaultIcon: Info,
  },
  default: {
    wrapper: 'bg-muted border-border text-foreground',
    icon:    'text-muted-foreground',
    DefaultIcon: Info,
  },
};

// ─── Component ───────────────────────────────────────────────────────────────

export const Alert: React.FC<AlertProps> = ({
  variant = 'default',
  title,
  children,
  icon,
  dismissible = false,
  onDismiss,
  compact = false,
  className,
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const { wrapper, icon: iconCls, DefaultIcon } = ALERT_VARIANTS[variant];

  // icon === null means explicitly hide icon
  const IconComponent = icon === null ? null : (icon ?? DefaultIcon);

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      role="alert"
      className={cn(
        'flex gap-3 rounded-xl border px-4 animate-in fade-in duration-200',
        compact ? 'py-2.5 items-center' : 'py-3.5 items-start',
        wrapper,
        className,
      )}
    >
      {/* Icon */}
      {IconComponent && (
        <IconComponent
          size={compact ? 16 : 18}
          strokeWidth={2}
          className={cn('shrink-0', compact ? 'mt-0' : 'mt-0.5', iconCls)}
          aria-hidden="true"
        />
      )}

      {/* Body */}
      <div className="flex-1 min-w-0">
        {title && (
          <p className={cn('font-semibold leading-snug', compact ? 'text-sm' : 'text-sm mb-0.5')}>
            {title}
          </p>
        )}
        {children && (
          <div className={cn('text-sm leading-relaxed', title ? 'opacity-85' : '')}>
            {children}
          </div>
        )}
      </div>

      {/* Dismiss */}
      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss alert"
          className="shrink-0 -mr-1 flex h-7 w-7 items-center justify-center rounded-lg opacity-60 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-150"
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};

export default Alert;
