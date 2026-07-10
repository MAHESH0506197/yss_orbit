import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Building2, Shield, Calendar, Loader2, ChevronDown, Check } from 'lucide-react';
import { useRoles, useRoleTemplates } from '@/features/iam/rbac/hooks/useRoles';
import type { UserBusinessUnitMembership, UserBusinessUnitUpdatePayload } from '../types/userBusinessUnitTypes';
import { useUpdateUBU } from '../hooks/useUserBusinessUnits';

export interface EditMembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  membership: UserBusinessUnitMembership | null;
  onSuccess?: () => void;
}

export function EditMembershipModal({ isOpen, onClose, membership, onSuccess }: EditMembershipModalProps) {
  const [selectedRoleValue, setSelectedRoleValue] = useState<string>('');
  const [effectiveFrom, setEffectiveFrom] = useState<string>('');
  const [effectiveTo, setEffectiveTo] = useState<string>('');

  const { data: rolesResponse, isLoading: isLoadingRoles } = useRoles({ business_unit_id: membership?.businessUnit });
  const { data: templatesResponse, isLoading: isLoadingTemplates } = useRoleTemplates();
  const updateMutation = useUpdateUBU();

  const roles = rolesResponse?.results || [];
  const templates = templatesResponse || [];

  useEffect(() => {
    if (isOpen && membership) {
      setSelectedRoleValue(membership.role || '');
      setEffectiveFrom(membership.effectiveFrom ? (membership.effectiveFrom.split('T')[0] || '') : '');
      setEffectiveTo(membership.effectiveTo ? (membership.effectiveTo.split('T')[0] || '') : '');
    } else {
      setSelectedRoleValue('');
      setEffectiveFrom('');
      setEffectiveTo('');
    }
  }, [isOpen, membership]);

  // Prevent background scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen || !membership) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (updateMutation.isPending) return;

    let rolePayload: string | null = null;
    if (selectedRoleValue) {
      rolePayload = selectedRoleValue;
    }

    const payload: UserBusinessUnitUpdatePayload = {
      role: rolePayload,
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom).toISOString() : null,
      effectiveTo: effectiveTo ? new Date(effectiveTo).toISOString() : null,
    };

    try {
      await updateMutation.mutateAsync({ id: membership.id, data: payload });
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to update membership", error);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 dark:bg-gray-900 dark:ring-white/10 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit Access Mapping</h2>
            <p className="text-sm text-gray-500 mt-0.5">Update role and duration</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <form id="edit-membership-form" onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* Context Info */}
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4 border border-gray-100 dark:border-gray-700/50 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Business Unit</p>
                  <p className="font-bold text-gray-900 dark:text-white">{membership.businessUnitName}</p>
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <Shield className="h-4 w-4 text-violet-500" />
                Role <span className="text-xs font-normal text-gray-400">(optional)</span>
              </label>
              
              <div className="relative flex items-center">
                <select
                  value={selectedRoleValue}
                  onChange={(e) => setSelectedRoleValue(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-white pl-3 pr-10 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">No specific role</option>
                  
                  {isLoadingRoles || isLoadingTemplates ? (
                    <option disabled>Loading roles...</option>
                  ) : (
                    <>
                      {roles.length > 0 && (
                        <optgroup label="BU Specific Roles">
                          {roles.map((r: any) => (
                            <option key={`role:${r.id}`} value={r.id}>{r.name}</option>
                          ))}
                        </optgroup>
                      )}
                      {templates.length > 0 && (
                        <optgroup label="Global Templates (Auto-Clone)">
                          {templates.map((t: any) => (
                            <option key={`template:${t.id}`} value={`template:${t.id}`}>{t.name} (Blueprint)</option>
                          ))}
                        </optgroup>
                      )}
                    </>
                  )}
                </select>
                <ChevronDown className="mr-3 h-4 w-4 shrink-0 text-gray-400 pointer-events-none absolute right-0" />
              </div>
            </div>

            {/* Effective Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="edit-assign-from" className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <Calendar className="h-4 w-4 text-violet-500" />
                  Effective From <span className="text-xs font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  id="edit-assign-from"
                  type="date"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="edit-assign-to" className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <Calendar className="h-4 w-4 text-violet-500" />
                  Effective To <span className="text-xs font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  id="edit-assign-to"
                  type="date"
                  value={effectiveTo}
                  min={effectiveFrom || undefined}
                  onChange={(e) => setEffectiveTo(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={updateMutation.isPending}
            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            form="edit-membership-form"
            type="submit"
            disabled={updateMutation.isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:translate-y-0 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:ring-offset-gray-900"
          >
            {updateMutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
            ) : (
              <><Check className="h-4 w-4" /> Save Changes</>
            )}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
