import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Building2, User, Shield, Calendar, CheckCircle2,
  XCircle, Loader2, AlertTriangle, Clock, RefreshCcw, Link2, 
  Trash2, ShieldOff, UserCheck
} from 'lucide-react';
import { parseISO, isPast, isFuture } from 'date-fns';

import { userBusinessUnitApi } from './api/userBusinessUnitApi';
import type { UserBusinessUnitMembership } from './types/userBusinessUnitTypes';
import { MODULE_ROUTES } from '@/routes/AppRouter';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import type { ConfirmDialogOptions } from '@/components/common/ConfirmDialog';
import { useDeleteUBU, useActivateUBU, useDeactivateUBU } from './hooks/useUserBusinessUnits';
import { EditMembershipModal } from './components/EditMembershipModal';
import { formatIST } from '@/utils/date';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getEffectiveStatus(m: UserBusinessUnitMembership): 'active' | 'inactive' | 'upcoming' | 'expired' {
  if (!m.isActiveMembership) return 'inactive';
  const now = new Date();
  if (m.effectiveFrom && isFuture(parseISO(m.effectiveFrom))) return 'upcoming';
  if (m.effectiveTo   && isPast(parseISO(m.effectiveTo)))   return 'expired';
  return 'active';
}

function UserInitial({ name, email }: { name?: string; email?: string }) {
  const display = name || email || '?';
  const initial = display.charAt(0).toUpperCase();
  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[2rem] bg-gradient-to-br from-white/20 to-white/5 text-4xl font-black text-white shadow-xl shadow-black/10 backdrop-blur-md ring-1 ring-white/20 select-none">
      {initial}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function MembershipStatusBadge({ m }: { m: UserBusinessUnitMembership }) {
  const status = getEffectiveStatus(m);
  const configs = {
    active:   { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-900/50', dot: 'bg-emerald-500 animate-pulse', label: 'Active' },
    inactive: { cls: 'bg-gray-50 text-gray-600 ring-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700', dot: 'bg-gray-400', label: 'Inactive' },
    upcoming: { cls: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-blue-900/50', dot: 'bg-blue-500', label: 'Upcoming' },
    expired:  { cls: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-900/50', dot: 'bg-amber-500', label: 'Expired' },
  }[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-extrabold tracking-wide uppercase shadow-sm ring-1 backdrop-blur-md ${configs.cls}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${configs.dot}`} />
      {configs.label}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export const UserBusinessUnitDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // This is now the userId

  const [memberships, setMemberships] = useState<UserBusinessUnitMembership[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  // ── UI State for Dialogs ────────────────────────────────────────────────────
  const [confirmOpts, setConfirmOpts] = useState<ConfirmDialogOptions | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editingMembership, setEditingMembership] = useState<UserBusinessUnitMembership | null>(null);

  // ── Mutations ───────────────────────────────────────────────────────────────
  const activateMutation   = useActivateUBU();
  const deactivateMutation = useDeactivateUBU();
  const deleteMutation     = useDeleteUBU();

  const load = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await userBusinessUnitApi.getAll({ userId: id });
      const rawList = response.data;
      const mapped = rawList.map((raw: any) => ({
        id:                 raw.id,
        user:               raw.user,
        userEmail:          raw.user_email          ?? raw.userEmail          ?? '',
        userFullName:       raw.user_full_name      ?? raw.userFullName       ?? '',
        businessUnit:       raw.business_unit       ?? raw.businessUnit       ?? '',
        businessUnitName:   raw.business_unit_name  ?? raw.businessUnitName   ?? '',
        role:               raw.role                ?? null,
        roleName:           raw.role_name           ?? raw.roleName           ?? null,
        isActiveMembership: raw.is_active_membership ?? raw.isActiveMembership ?? false,
        joinedAt:           raw.joined_at           ?? raw.joinedAt           ?? '',
        createdAt:          raw.created_at          ?? raw.createdAt          ?? '',
        updatedAt:          raw.updated_at          ?? raw.updatedAt          ?? '',
        effectiveFrom:      raw.effective_from      ?? raw.effectiveFrom      ?? null,
        effectiveTo:        raw.effective_to        ?? raw.effectiveTo        ?? null,
      }));
      setMemberships(mapped);
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? e?.message ?? 'Failed to load user memberships.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // ── Computed User Overview ──────────────────────────────────────────────────
  const userOverview = useMemo(() => {
    if (!memberships.length || !memberships[0]) return null;
    const first = memberships[0];
    const anyActive = memberships.some(m => m.isActiveMembership);
    return {
      userId: first.user,
      userFullName: first.userFullName,
      userEmail: first.userEmail,
      totalBUs: memberships.length,
      totalRoles: memberships.filter(m => m.role).length,
      isActive: anyActive
    };
  }, [memberships]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleToggle = useCallback((m: UserBusinessUnitMembership) => {
    if (m.isActiveMembership) {
      setConfirmOpts({
        title:        'Deactivate Access',
        message:      `Suspend ${m.userFullName || m.userEmail}'s access to ${m.businessUnitName}?`,
        confirmLabel: 'Deactivate',
        variant:      'warning',
        onConfirm: async () => {
          await deactivateMutation.mutateAsync(m.id);
          setConfirmOpen(false);
          load();
        },
      });
    } else {
      setConfirmOpts({
        title:        'Activate Access',
        message:      `Restore ${m.userFullName || m.userEmail}'s access to ${m.businessUnitName}?`,
        confirmLabel: 'Activate',
        variant:      'success',
        onConfirm: async () => {
          await activateMutation.mutateAsync(m.id);
          setConfirmOpen(false);
          load();
        },
      });
    }
    setConfirmOpen(true);
  }, [deactivateMutation, activateMutation, load]);

  const handleDelete = useCallback((m: UserBusinessUnitMembership) => {
    setConfirmOpts({
      title:        'Remove Access',
      message:      `Permanently remove ${m.userFullName || m.userEmail} from ${m.businessUnitName}? This cannot be undone.`,
      confirmLabel: 'Remove',
      variant:      'danger',
      onConfirm: async () => {
        await deleteMutation.mutateAsync(m.id);
        setConfirmOpen(false);
        load();
      },
    });
    setConfirmOpen(true);
  }, [deleteMutation, load]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading && !memberships.length) return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
      <div className="relative flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 rounded-full border-4 border-violet-100 dark:border-violet-900/30" />
        <div className="absolute inset-0 rounded-full border-4 border-violet-600 border-t-transparent animate-spin" />
        <Loader2 className="h-8 w-8 animate-pulse text-violet-600" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Loading Details</h3>
        <p className="text-sm text-gray-500 mt-1">Retrieving user access mappings...</p>
      </div>
    </div>
  );

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) return (
    <div className="p-6 max-w-2xl mx-auto mt-10">
      <div className="overflow-hidden rounded-3xl border border-red-100 bg-white shadow-xl dark:border-red-900/30 dark:bg-gray-900">
        <div className="bg-red-50 dark:bg-red-900/20 p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50 mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-red-900 dark:text-red-300 mb-2">Failed to Load</h3>
          <p className="text-sm text-red-600 dark:text-red-400 mb-6">{error}</p>
          <button onClick={load} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-red-700 hover:shadow-lg focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
            <RefreshCcw className="h-4 w-4" /> Try Again
          </button>
        </div>
      </div>
    </div>
  );

  if (!userOverview) {
    return (
      <div className="p-6 max-w-2xl mx-auto mt-10 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
          <AlertTriangle className="h-8 w-8 text-gray-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Access Found</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">This user does not have any Business Unit mappings.</p>
        <Link to={MODULE_ROUTES.userBuMapping} className="mt-6 inline-flex items-center gap-2 text-violet-600 font-medium hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to List
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8 pb-20">

      {/* ── Breadcrumb ─────────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-2 text-sm">
        <Link to={MODULE_ROUTES.userBuMapping} className="flex items-center gap-2 text-gray-500 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-400 transition-colors font-medium">
          <ArrowLeft className="h-4 w-4" />
          Back to List
        </Link>
        <span className="text-gray-300 dark:text-gray-700">/</span>
        <span className="font-bold text-gray-900 dark:text-white truncate">
          {userOverview.userFullName || userOverview.userEmail}
        </span>
      </nav>

      {/* ── Hero Card (Frosted Glass) ──────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gray-900 shadow-2xl">
        {/* Animated Mesh Gradient Background */}
        <div className="absolute inset-0 opacity-80 mix-blend-screen">
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-violet-600 blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute top-1/2 right-0 h-80 w-80 -translate-y-1/2 rounded-full bg-fuchsia-600 blur-[100px] animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="absolute -bottom-24 left-1/4 h-80 w-80 rounded-full bg-indigo-600 blur-[100px] animate-pulse" style={{ animationDuration: '5s' }} />
        </div>
        
        <div className="absolute inset-0 opacity-10 mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />

        {/* Content Container */}
        <div className="relative z-10 p-8 sm:p-12 border border-white/10 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 text-center sm:text-left">
            <UserInitial name={userOverview.userFullName} email={userOverview.userEmail} />
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 mb-3">
                <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/70 tracking-tight">
                  {userOverview.userFullName || userOverview.userEmail}
                </h1>
                {userOverview.isActive ? (
                  <span className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-extrabold tracking-wide uppercase shadow-sm ring-1 backdrop-blur-md bg-emerald-400/20 text-emerald-100 ring-emerald-300/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active User
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-extrabold tracking-wide uppercase shadow-sm ring-1 backdrop-blur-md bg-white/10 text-white/80 ring-white/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-white/50" /> Inactive User
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-6">
                <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 backdrop-blur-md ring-1 ring-white/20">
                  <User className="h-4 w-4 text-violet-300" />
                  <span className="text-sm font-semibold text-white">{userOverview.userEmail}</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 backdrop-blur-md ring-1 ring-white/20">
                  <Building2 className="h-4 w-4 text-fuchsia-300" />
                  <span className="text-sm font-semibold text-white">{userOverview.totalBUs} Assigned BUs</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 backdrop-blur-md ring-1 ring-white/20">
                  <Shield className="h-4 w-4 text-amber-300" />
                  <span className="text-sm font-semibold text-white">{userOverview.totalRoles} Assigned Roles</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Business Units & Roles Grid ───────────────────────────────────────────── */}
      <div className="pt-6">
        <div className="flex items-center gap-3 ml-2 mb-6">
          <div className="h-8 w-1.5 rounded-full bg-violet-500" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Assigned Business Units & Roles</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {memberships.map((m) => {
            const effectiveStatus = getEffectiveStatus(m);
            return (
              <div key={m.id} className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm transition-all hover:shadow-lg hover:border-violet-200 dark:hover:border-violet-800">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/30 text-violet-600 dark:text-violet-400">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{m.businessUnitName}</h3>
                      </div>
                    </div>
                    <MembershipStatusBadge m={m} />
                  </div>

                  <div className="mt-5 space-y-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4 border border-gray-100 dark:border-gray-700/50">
                    <div className="flex items-center justify-between text-sm pb-2 border-b border-gray-200 dark:border-gray-700/50">
                      <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Shield className="h-4 w-4" /> Assigned Role
                      </span>
                      <span className="font-bold text-violet-700 dark:text-violet-400">
                        {m.roleName || <span className="italic font-normal text-gray-400">No role assigned</span>}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm pt-1">
                      <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Calendar className="h-4 w-4" /> Start Date
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {m.effectiveFrom ? formatIST(parseISO(m.effectiveFrom), 'dd MMM yyyy') : 'Immediate'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Calendar className="h-4 w-4" /> End Date
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {m.effectiveTo ? formatIST(parseISO(m.effectiveTo), 'dd MMM yyyy') : 'Indefinite'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-800 p-4 bg-gray-50/50 dark:bg-gray-900/50">
                  <button onClick={() => setEditingMembership(m)} className="flex items-center gap-2 rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700 transition-colors hover:bg-violet-100 dark:bg-violet-900/20 dark:text-violet-400 dark:hover:bg-violet-900/40 mr-auto">
                    <Shield className="h-3.5 w-3.5" /> Edit
                  </button>
                  {m.isActiveMembership ? (
                    <button onClick={() => handleToggle(m)} className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 transition-colors hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/40">
                      <ShieldOff className="h-3.5 w-3.5" /> Deactivate
                    </button>
                  ) : (
                    <button onClick={() => handleToggle(m)} className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40">
                      <UserCheck className="h-3.5 w-3.5" /> Activate
                    </button>
                  )}
                  <button onClick={() => handleDelete(m)} className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/40">
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ConfirmDialog isOpen={confirmOpen} opts={confirmOpts} onClose={() => setConfirmOpen(false)} />
      
      <EditMembershipModal
        isOpen={!!editingMembership}
        onClose={() => setEditingMembership(null)}
        membership={editingMembership}
        onSuccess={() => {
          setEditingMembership(null);
          load();
        }}
      />
    </div>
  );
};

export default UserBusinessUnitDetailPage;
