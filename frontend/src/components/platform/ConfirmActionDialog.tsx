// src/components/platform/ConfirmActionDialog.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Universal archive / restore / delete confirmation modal.
// Replaces the 3 separate inline ConfirmDialog components in BD, Org, BU detail pages.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { Loader2, Archive, RotateCcw, Trash2 } from 'lucide-react';

export interface ConfirmActionDialogProps {
  /** Controls dialog visibility */
  isOpen: boolean;
  /** Determines color scheme, default labels, and whether reason is required */
  type: 'archive' | 'restore' | 'delete';
  /** Name of the entity being acted on */
  entityName: string;
  /** Optional entity code shown as monospace text in the callout box */
  entityCode?: string;
  /** Optional avatar/icon node rendered in the callout box */
  avatarNode?: React.ReactNode;
  /** Override the default dialog title */
  title?: string;
  /** Override the default description paragraph */
  description?: string;
  /** Override the confirm button label */
  confirmLabel?: string;
  /** Whether a non-empty reason is required before confirming. Defaults: archive=true, delete=true, restore=false */
  requireReason?: boolean;
  /** Called when user clicks Cancel or presses Escape */
  onCancel: () => void;
  /** Called with the reason string when user confirms */
  onConfirm: (reason: string) => void;
  /** True while the confirm action is in flight */
  isLoading: boolean;
}

const CONFIG = {
  archive: {
    headerGradient: 'from-rose-500 to-pink-600',
    confirmGradient: 'from-rose-500 to-pink-600 hover:shadow-rose-500/30',
    icon: Archive,
    defaultTitle: (name: string) => `Archive ${name}`,
    defaultDesc: 'This record will be archived and hidden from active use. You can restore it later.',
    requireReasonDefault: true,
  },
  restore: {
    headerGradient: 'from-emerald-500 to-teal-600',
    confirmGradient: 'from-emerald-500 to-teal-600 hover:shadow-emerald-500/30',
    icon: RotateCcw,
    defaultTitle: (name: string) => `Restore ${name}`,
    defaultDesc: 'This record will be restored and made available for use again.',
    requireReasonDefault: false,
  },
  delete: {
    headerGradient: 'from-rose-600 to-red-700',
    confirmGradient: 'from-rose-600 to-red-700 hover:shadow-rose-600/30',
    icon: Trash2,
    defaultTitle: (name: string) => `Permanent Delete ${name}`,
    defaultDesc: 'This will permanently delete this record. This action cannot be undone.',
    requireReasonDefault: true,
  },
} as const;

export function ConfirmActionDialog({
  isOpen,
  type,
  entityName,
  entityCode,
  avatarNode,
  title,
  description,
  confirmLabel,
  requireReason,
  onCancel,
  onConfirm,
  isLoading,
}: ConfirmActionDialogProps) {
  const [reason, setReason] = useState('');
  const cfg = CONFIG[type];
  const needsReason = requireReason ?? cfg.requireReasonDefault;
  const ConfirmIcon = cfg.icon;

  // Reset reason when dialog opens/closes
  useEffect(() => {
    if (!isOpen) setReason('');
  }, [isOpen]);

  // Escape key closes dialog
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onCancel();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  const canConfirm = !isLoading && (!needsReason || reason.trim().length > 0);
  const dialogTitle = title ?? cfg.defaultTitle(entityName);
  const dialogDesc  = description ?? cfg.defaultDesc;
  const btnLabel    = confirmLabel ?? (type === 'archive' ? 'Archive' : type === 'restore' ? 'Restore' : 'Permanent Delete');

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
        onClick={() => !isLoading && onCancel()}
      />

      {/* Dialog panel */}
      <div
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 animate-scaleIn"
      >
        {/* Top accent bar */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${cfg.headerGradient}`} />

        <div className="p-6">
          {/* Title */}
          <h3
            id="confirm-dialog-title"
            className="text-lg font-bold text-gray-900 dark:text-white mb-2"
          >
            {dialogTitle}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
            {dialogDesc}
          </p>

          {/* Entity callout box */}
          {(avatarNode || entityName) && (
            <div className={`flex items-center gap-3 rounded-xl px-4 py-3 mb-4 border ${
              type === 'restore'
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800'
            }`}>
              {avatarNode}
              <div className="min-w-0">
                <div className="font-bold text-sm text-gray-900 dark:text-white truncate">
                  {entityName}
                </div>
                {entityCode && (
                  <code className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                    {entityCode}
                  </code>
                )}
              </div>
            </div>
          )}

          {/* Reason textarea */}
          {needsReason && (
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                Reason <span className="text-rose-500" aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder={`Reason for ${type === 'archive' ? 'archiving' : type === 'restore' ? 'restoring' : 'deleting'}…`}
                rows={2}
                className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 py-2.5 px-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-all resize-none"
                disabled={isLoading}
                required
              />
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirm(reason)}
              disabled={!canConfirm}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none bg-gradient-to-r ${cfg.confirmGradient} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-violet-500`}
            >
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Processing…</>
              ) : (
                <><ConfirmIcon className="h-4 w-4" aria-hidden="true" /> {btnLabel}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmActionDialog;
