// yss_orbit/frontend/src/shared/components/ConfirmDialog.tsx
/**
 * Shared ConfirmDialog component.
 * Extracted from organizationListPage & businessUnitListPage to eliminate duplication.
 * Supports danger / warning / success variants.
 * Renders via React Portal to document.body to avoid z-index stacking issues.
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { AlertOctagon, AlertTriangle, CheckCircle2 } from 'lucide-react';

export interface ConfirmDialogOptions {
  title: string;
  message?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'success' | 'primary';
  onConfirm: () => void | Promise<void>;
}

interface ConfirmDialogProps {
  isOpen: boolean;
  opts: ConfirmDialogOptions | null;
  onClose: () => void;
  isLoading?: boolean;
}

export function ConfirmDialog({ isOpen, opts, onClose, isLoading }: ConfirmDialogProps) {
  if (!isOpen || !opts) return null;

  const isDanger  = opts.variant === 'danger' || (!opts.variant && !opts.message?.includes('Success'));
  const isWarning = opts.variant === 'warning';
  const isSuccess = opts.variant === 'success';
  const isPrimary = opts.variant === 'primary';

  const iconBg    = isDanger
    ? 'bg-rose-100 dark:bg-rose-900/30'
    : isWarning
    ? 'bg-amber-100 dark:bg-amber-900/30'
    : isPrimary
    ? 'bg-indigo-100 dark:bg-indigo-900/30'
    : 'bg-emerald-100 dark:bg-emerald-900/30';

  const iconColor = isDanger
    ? 'text-rose-500'
    : isWarning
    ? 'text-amber-500'
    : isPrimary
    ? 'text-indigo-500'
    : 'text-emerald-500';

  const btnCls = isDanger
    ? 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 shadow-rose-500/25'
    : isWarning
    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-500/25'
    : isPrimary
    ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-indigo-500/25'
    : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/25';

  const Icon = isDanger ? AlertOctagon : isWarning ? AlertTriangle : CheckCircle2;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/10 dark:bg-gray-900 dark:ring-white/10"
        style={{ animation: 'confirmDialogIn .28s cubic-bezier(.34,1.56,.64,1) both' }}
      >
        <style>{`
          @keyframes confirmDialogIn {
            from { opacity: 0; transform: scale(.92) translateY(10px); }
            to   { opacity: 1; transform: scale(1)   translateY(0); }
          }
        `}</style>
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`shrink-0 flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg}`}>
              <Icon className={`h-6 w-6 ${iconColor}`} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white">{opts.title}</h3>
              <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {opts.message || opts.description}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2.5 border-t border-gray-100 bg-gray-50/80 px-6 py-4 dark:border-gray-800 dark:bg-gray-900/50">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:bg-transparent dark:text-gray-400 dark:hover:bg-gray-800"
          >
            {opts.cancelLabel || 'Cancel'}
          </button>
          <button
            onClick={() => opts.onConfirm()}
            disabled={isLoading}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 ${btnCls}`}
          >
            {isLoading ? 'Processing…' : (opts.confirmLabel ?? 'Confirm')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
