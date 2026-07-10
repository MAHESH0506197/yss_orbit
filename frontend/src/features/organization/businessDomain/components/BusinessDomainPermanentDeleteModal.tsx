// src/features/organization/businessDomain/components/BusinessDomainPermanentDeleteModal.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Permanent Delete Confirmation Modal — Enterprise Safety Gate
//
// Pattern: GitHub-style "retype the name" confirmation.
// ● User must type the exact domain name (case-sensitive) before Delete is enabled.
// ● Modal shows a clear danger warning explaining this action is irreversible.
// ● Only visible/callable for super admins on archived (soft-deleted) domains.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  AlertTriangle, X, Trash2, Globe2, Loader2, ShieldAlert,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { BusinessDomain } from '../types/businessDomainTypes';
import { useBusinessDomainMutations } from '../api/useBusinessDomainMutations';
import { formatIST } from '@/utils/date';

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  isOpen: boolean;
  onClose: () => void;
  domain: BusinessDomain | null;
  /** Called after successful permanent deletion so parent can clear selection. */
  onDeleted?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
export const BusinessDomainPermanentDeleteModal: React.FC<Props> = ({
  isOpen,
  onClose,
  domain,
  onDeleted,
}) => {
  const { permanentDeleteDomain, isPermanentDeleting } = useBusinessDomainMutations();
  const [confirmInput, setConfirmInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset input every time modal opens
  useEffect(() => {
    if (isOpen) {
      setConfirmInput('');
      // Small delay so portal is mounted before we focus
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [isOpen]);

  // Keyboard: Escape → close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen || !domain) return null;

  const nameMatches = confirmInput === domain.name;

  const handleDelete = async () => {
    if (!nameMatches || isPermanentDeleting || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await permanentDeleteDomain({ id: domain.id, confirmationName: confirmInput });
      toast.success(`"${domain.name}" has been permanently deleted.`, { icon: '🗑️' });
      onDeleted?.();
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        'Failed to permanently delete domain.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200] bg-gray-950/70 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className="fixed inset-0 z-[201] flex items-center justify-center p-4 sm:p-6 pointer-events-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="perm-delete-title"
        aria-describedby="perm-delete-desc"
      >
        <div className="pointer-events-auto flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900 ring-1 ring-red-200 dark:ring-red-900 animate-[scaleIn_0.15s_ease-out]">

          {/* Danger accent stripe */}
          <div className="h-1.5 w-full bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 shrink-0" aria-hidden="true" />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30 ring-1 ring-red-200 dark:ring-red-800">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" aria-hidden="true" />
              </div>
              <div>
                <h2 id="perm-delete-title" className="text-lg font-bold text-gray-900 dark:text-white">
                  Permanent Delete Domain
                </h2>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  This action <strong className="text-red-600 dark:text-red-400">cannot be undone</strong>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isPermanentDeleting}
              aria-label="Close"
              className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors dark:hover:bg-gray-800 dark:hover:text-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-40"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">

            {/* Domain identity card */}
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-4">
              {domain.logo_url ? (
                <img
                  src={domain.logo_url}
                  alt={`${domain.name} logo`}
                  className="h-12 w-12 shrink-0 rounded-xl object-contain border border-gray-200 dark:border-gray-700 bg-white"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 text-white shadow-sm">
                  <Globe2 className="h-6 w-6" aria-hidden="true" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{domain.name}</p>
                <p className="text-xs font-mono text-gray-500 dark:text-gray-400">{domain.code}</p>
                {domain.deleted_at && (
                  <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-0.5">
                    Archived {formatIST(domain.deleted_at, 'PPP')}
                  </p>
                )}
              </div>
            </div>

            {/* Warning banner */}
            <div
              className="flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3.5"
              role="alert"
            >
              <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" aria-hidden="true" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-red-800 dark:text-red-300">
                  You are about to permanently delete this Business Domain.
                </p>
                <ul className="text-xs text-red-700 dark:text-red-400 list-disc list-inside space-y-0.5">
                  <li>All data associated with this domain will be <strong>erased from the database</strong></li>
                  <li>This domain <strong>cannot be restored</strong> — it will not appear in the archive</li>
                  <li>Any references to this domain in other records may break</li>
                </ul>
              </div>
            </div>

            {/* Name-confirmation input */}
            <div id="perm-delete-desc">
              <label
                htmlFor="confirm-name-input"
                className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2"
              >
                To confirm, type{' '}
                <span className="font-mono font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800">
                  {domain.name}
                </span>{' '}
                below:
              </label>
              <input
                id="confirm-name-input"
                ref={inputRef}
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && nameMatches && !isPermanentDeleting && !isSubmitting) {
                    handleDelete();
                  }
                }}
                disabled={isPermanentDeleting || isSubmitting}
                placeholder={domain.name}
                autoComplete="off"
                spellCheck={false}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm font-medium transition-all outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50
                  ${nameMatches
                    ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10 text-gray-900 dark:text-white focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:border-gray-400 focus:ring-gray-400'
                  }`}
                aria-describedby="confirm-hint"
              />
              <p
                id="confirm-hint"
                className={`mt-1.5 text-xs font-medium transition-colors ${
                  confirmInput.length > 0 && !nameMatches
                    ? 'text-red-500'
                    : nameMatches
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {confirmInput.length === 0
                  ? 'Name must match exactly (case-sensitive)'
                  : nameMatches
                    ? '✓ Name confirmed — delete button is now active'
                    : '✗ Name does not match — keep typing'}
              </p>
            </div>

          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/50 px-6 py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Super admin action · Irreversible</span>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isPermanentDeleting}
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 transition-all hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!nameMatches || isPermanentDeleting || isSubmitting}
                aria-label={`Permanent delete domain ${domain.name}`}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-red-500/40 disabled:opacity-40 disabled:translate-y-0 disabled:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
              >
                  {isPermanentDeleting || isSubmitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin shrink-0" /> Deleting…</>
                  ) : (
                    <><Trash2 className="h-4 w-4 shrink-0" /> Permanent Delete</>
                  )}</button>
            </div>
          </div>

        </div>
      </div>
    </>,
    document.body
  );
};
