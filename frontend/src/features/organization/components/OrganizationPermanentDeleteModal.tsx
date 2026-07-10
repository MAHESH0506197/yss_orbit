// src/features/organization/components/OrganizationPermanentDeleteModal.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Permanent Delete Confirmation Modal — Enterprise Safety Gate
//
// Pattern: GitHub-style "retype the name" confirmation.
// ● User must type the exact organization name (case-sensitive) before Delete is enabled.
// ● Modal shows a clear danger warning explaining this action is irreversible.
// ● Only visible/callable for super admins on archived (soft-deleted) organizations.
//
// Mirrors: BusinessDomainPermanentDeleteModal pattern exactly.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  AlertTriangle, X, Trash2, Building2, Loader2, ShieldAlert,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Organization } from '@/features/organization/types/organizationTypes';
import { usePermanentDeleteOrganization } from '@/features/organization/hooks/useOrganizations';
import { formatIST } from '@/utils/date';

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  isOpen: boolean;
  onClose: () => void;
  organization: Organization | null;
  /** Called after successful permanent deletion so parent can clear selection. */
  onDeleted?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
export const OrganizationPermanentDeleteModal: React.FC<Props> = ({
  isOpen,
  onClose,
  organization,
  onDeleted,
}) => {
  const { mutateAsync: permanentDelete, isPending: isPermanentDeleting } = usePermanentDeleteOrganization();
  const [confirmInput, setConfirmInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset input every time modal opens
  useEffect(() => {
    if (isOpen) {
      setConfirmInput('');
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

  if (!isOpen || !organization) return null;

  const nameMatches = confirmInput === organization.name;

  const handleDelete = async () => {
    if (!nameMatches || isPermanentDeleting || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await permanentDelete({ id: organization.id, confirmationName: confirmInput });
      toast.success(`"${organization.name}" has been permanently deleted.`, { icon: '🗑️' });
      onDeleted?.();
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        'Failed to permanently delete organization.';
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
        aria-labelledby="org-perm-delete-title"
      >
        <div
          className="relative w-full max-w-lg pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-2xl ring-1 ring-rose-200 dark:ring-rose-900/60 animate-[scaleIn_0.2s_ease-out]">

            {/* Danger stripe */}
            <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-red-500 to-rose-600" />

            {/* Header */}
            <div className="flex items-start gap-4 px-6 pt-6 pb-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-900/30 ring-4 ring-rose-100/60 dark:ring-rose-900/20">
                <Trash2 className="h-6 w-6 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h2
                  id="org-perm-delete-title"
                  className="text-lg font-bold text-gray-900 dark:text-white"
                >
                  Permanent Delete Organization
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  This action <strong className="text-rose-600 dark:text-rose-400">cannot be undone</strong>.{' '}
                  All data associated with this organization — settings, Business Units, and
                  all memberships — will be permanently erased.
                </p>
              </div>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                aria-label="Close dialog"
                className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Organization info summary */}
            <div className="mx-6 mb-4 flex items-start gap-3 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-900/10 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/30">
                <Building2 className="h-5 w-5 text-rose-500 dark:text-rose-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                  {organization.name}
                </p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {organization.business_units_count ?? 0} Business Unit{(organization.business_units_count ?? 0) !== 1 ? 's' : ''}
                  {organization.deleted_at
                    ? ` · Archived ${formatIST(organization.deleted_at, 'dd MMM yyyy')}`
                    : ''
                  }
                </p>
              </div>
            </div>

            {/* Danger warning */}
            <div className="mx-6 mb-4 flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/10 px-4 py-3.5">
              <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                  Super Admin Action — Non-recoverable
                </p>
                <ul className="mt-1.5 space-y-1 text-xs text-amber-700 dark:text-amber-400">
                  <li className="flex items-center gap-1.5">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-amber-600 dark:bg-amber-400" />
                    All organization settings and configurations will be deleted
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-amber-600 dark:bg-amber-400" />
                    All child Business Units will be permanently removed
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-amber-600 dark:bg-amber-400" />
                    All user memberships will be permanently erased
                  </li>
                </ul>
              </div>
            </div>

            {/* Confirmation input */}
            <div className="mx-6 mb-6">
              <label
                htmlFor="org-perm-delete-confirm"
                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
              >
                Type{' '}
                <code className="rounded-md bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 font-mono text-[13px] text-rose-600 dark:text-rose-400 font-bold select-all">
                  {organization.name}
                </code>
                {' '}to confirm:
              </label>
              <input
                ref={inputRef}
                id="org-perm-delete-confirm"
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && nameMatches) handleDelete(); }}
                disabled={isSubmitting}
                placeholder={organization.name}
                autoComplete="off"
                spellCheck={false}
                className={`w-full rounded-xl border px-4 py-2.5 font-mono text-sm transition-all focus:outline-none focus:ring-2 disabled:opacity-50 dark:bg-gray-800 dark:text-white ${
                  confirmInput.length > 0 && !nameMatches
                    ? 'border-rose-300 dark:border-rose-700 focus:ring-rose-500/20 focus:border-rose-400 text-rose-700 dark:text-rose-400'
                    : nameMatches
                      ? 'border-emerald-300 dark:border-emerald-700 focus:ring-emerald-500/20 focus:border-emerald-400 text-emerald-700 dark:text-emerald-400'
                      : 'border-gray-200 dark:border-gray-700 focus:ring-rose-500/20 focus:border-rose-400 text-gray-900'
                }`}
              />
              {confirmInput.length > 0 && !nameMatches && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Name doesn't match — comparison is case-sensitive
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 px-6 py-4 rounded-b-2xl">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={!nameMatches || isSubmitting || isPermanentDeleting}
                aria-label={nameMatches ? 'Confirm permanent deletion' : 'Type the organization name to enable deletion'}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:ring-offset-gray-900"
              >
                {(isSubmitting || isPermanentDeleting) ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                    Permanent Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
};
