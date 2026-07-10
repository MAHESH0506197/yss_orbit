import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit2, ShieldAlert, Globe, Phone, Calendar, Clock,
  ShieldCheck, RotateCcw, Archive, Trash2, CheckCircle2,
  XCircle, GitBranch, Users, Activity, Fingerprint, Loader2, ChevronRight
} from 'lucide-react';
import { isPast, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

import { useUser } from '@/features/iam/users/hooks/useUsers';
import { useDeleteUser, useRestoreUser } from '@/features/iam/users/hooks/useUserMutations';
import { useUserBusinessUnit } from '@/features/organization/userBusinessUnit/hooks/useuserBusinessUnit';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { CopyChip } from '@/components/platform/CopyChip';
import { StatusBadge } from '@/components/platform/StatusBadge';
import { TabBar } from '@/components/platform/TabBar';
import { KpiStrip } from '@/components/platform/KpiStrip';
import { EntityAvatar } from '@/components/platform/EntityAvatar';
import { UserBUAccessTab } from '@/features/iam/users/components/UserBUAccessTab';
import { UserAuditHistoryTab } from '@/features/iam/users/components/UserAuditHistoryTab';
import { UserPermanentDeleteModal } from '@/features/iam/users/components/UserPermanentDeleteModal';
import { formatIST } from '@/utils/date';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getEntityStatus(isDeleted: boolean, isActive: boolean) {
  if (isDeleted) return 'archived';
  return isActive ? 'active' : 'inactive';
}

function InfoPair({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: React.ElementType }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5" />} {label}
      </span>
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
        {value || <span className="text-gray-400 italic">Not provided</span>}
      </span>
    </div>
  );
}

type Tab = 'overview' | 'security' | 'bu_access' | 'audit';
const TABS = [
  { id: 'overview' as Tab,  label: 'Overview',             icon: Globe },
  { id: 'security' as Tab,  label: 'Security & Access',    icon: ShieldAlert },
  { id: 'bu_access' as Tab, label: 'Business Unit Access', icon: ShieldCheck },
  { id: 'audit' as Tab,     label: 'Audit History',        icon: Clock },
];

// ─── Component ────────────────────────────────────────────────────────────────
export const UserDetailPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>(); // Note: userRoutes typically uses :id or :userId depending on definition. We'll support id. 
  // Let's assume the router uses :id or :userId. If it's :userId, we'll grab it.
  const { userId } = useParams<{ userId: string }>();
  const resolvedId = id || userId;
  
  const navigate = useNavigate();

  const { data: user, isLoading, isError, refetch } = useUser(resolvedId!);
  const archiveMutation = useDeleteUser();
  const restoreMutation = useRestoreUser();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [confirmType, setConfirmType] = useState<'archive' | 'restore' | 'hard_delete' | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [reason, setReason] = useState('');
  const [confirmationUsername, setConfirmationUsername] = useState('');

  const { memberships, applyFilters, refetch: refetchBU } = useUserBusinessUnit();

  useEffect(() => {
    if (resolvedId) {
      applyFilters({ userId: resolvedId });
      refetchBU();
    }
  }, [resolvedId, applyFilters, refetchBU]);

  const accessStats = useMemo(() => {
    const uniqueBUs = new Set(memberships.map(m => m.businessUnit)).size;
    const rolesCount = user?.is_super_admin ? 1 : new Set(memberships.map(m => m.role).filter(Boolean)).size;
    let activeCount = 0;
    
    memberships.forEach(m => {
      const isExpired = m.effectiveTo && isPast(parseISO(m.effectiveTo));
      if (m.isActiveMembership && !isExpired) {
        activeCount++;
      }
    });

    return { uniqueBUs, rolesCount, activeCount };
  }, [memberships, user]);

  const backUrl = '/platform/user-management';
  const editUrl = `/platform/user-management/${resolvedId}/edit`;

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    if (confirmType) return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if (inInput) return;

      if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
        e.preventDefault();
        navigate(backUrl);
      }
      if ((e.key === 'e' || e.key === 'E') && user && !user.is_deleted) {
        e.preventDefault();
        navigate(editUrl);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [user, confirmType, navigate, backUrl, editUrl]);

  const executeConfirmAction = useCallback(async () => {
    if (!user || !confirmType) return;
    
    if (confirmType === 'hard_delete' && confirmationUsername !== user.username) {
      toast.error('Username confirmation does not match.');
      return;
    }

    setIsConfirming(true);
    try {
      if (confirmType === 'archive') {
        await archiveMutation.mutateAsync({ id: user.id, reason });
        toast.success(`User archived.`);
        navigate(backUrl);
      } else if (confirmType === 'hard_delete') {
        await archiveMutation.mutateAsync({ id: user.id, reason, hard: true, confirmation_username: confirmationUsername });
        toast.success(`User permanently deleted.`);
        navigate(backUrl);
      } else {
        await restoreMutation.mutateAsync({ id: user.id, reason });
        toast.success(`User restored.`);
        refetch();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Action failed.');
    } finally {
      setIsConfirming(false);
      setConfirmType(null);
      setReason('');
      setConfirmationUsername('');
    }
  }, [user, confirmType, reason, confirmationUsername, archiveMutation, restoreMutation, navigate, backUrl, refetch]);

  if (isLoading) return <LoadingScreen />;

  if (isError || !user) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-center">
        <ShieldAlert className="h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">User Not Found</h2>
        <p className="text-gray-500 mt-2 mb-6">The user you are looking for does not exist or you do not have permission to view them.</p>
        <Link to={backUrl} className="text-indigo-600 font-semibold hover:underline">← Back to User Management</Link>
      </div>
    );
  }

  const name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username;
  const isDeleted = Boolean(user.is_deleted);
  const isActive = Boolean(user.is_active);

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 animate-fadeInUp">
        
        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-1.5 text-sm py-5 text-gray-500 dark:text-gray-400"
          aria-label="Breadcrumb">
          <Link to="/platform"
            className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors font-medium">
            Platform
          </Link>
          <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 shrink-0" />
          <Link to={backUrl}
            className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors font-medium">
            User Management
          </Link>
          <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 shrink-0" />
          <span className="font-bold text-gray-900 dark:text-white truncate max-w-[180px]">Details</span>
        </nav>

        {/* ── Hero Banner ── */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-900 via-violet-900 to-purple-900 dark:from-indigo-950 dark:via-violet-950 dark:to-purple-950 px-6 py-5 mb-5 shadow-2xl">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-violet-500/30 blur-3xl filter" />
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-indigo-500/30 blur-3xl filter" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="absolute top-0 right-0 flex items-center gap-2">
              <Link to={backUrl} aria-label="Back to Users" title="Back to list"
                className="flex items-center gap-1.5 rounded-xl bg-white/15 backdrop-blur-sm px-3 py-2 text-xs font-bold text-white hover:bg-white/25 transition-all ring-1 ring-white/20">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Link>
            </div>

            <div className="relative">
              <EntityAvatar name={name} size={88} shape="rounded-2xl" className="border-4 border-white/30 shadow-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-3xl" />
              {!isDeleted && isActive && (
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 ring-2 ring-white dark:ring-gray-900 shadow">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-pulseRing" />
                  <CheckCircle2 className="h-3 w-3 text-white relative z-10" />
                </span>
              )}
              {isDeleted && (
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-400 ring-2 ring-white dark:ring-gray-900 shadow">
                  <Archive className="h-3 w-3 text-white" />
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0 flex flex-col items-center sm:items-start text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-2">
                <h1 className="text-3xl font-black text-white tracking-tight leading-tight">{name}</h1>
                <StatusBadge status={getEntityStatus(isDeleted, isActive)} />
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <code className="rounded-lg bg-white/15 backdrop-blur-sm px-2.5 py-1 text-sm font-mono font-bold text-white/90 ring-1 ring-white/20">
                  @{user.username}
                </code>
                <span className="text-sm font-medium text-white/80">{user.email}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 mt-4 sm:mt-0">
              {!isDeleted ? (
                <>
                  <PermissionGate permission="iam.user.update">
                    <Link to={editUrl} title="Edit User (E)"
                      className="inline-flex items-center gap-2 rounded-xl bg-white/15 backdrop-blur-sm px-4 py-2 text-sm font-bold text-white ring-1 ring-white/20 hover:bg-white/25 transition-all">
                      <Edit2 className="h-4 w-4" />
                      <span>Edit <kbd className="hidden sm:inline-flex items-center rounded border border-white/20 bg-white/10 px-1 py-0.5 font-mono text-[9px] text-white/70">E</kbd></span>
                    </Link>
                  </PermissionGate>
                  <PermissionGate permission="iam.user.delete">
                    <button
                      onClick={() => setConfirmType('archive')}
                      className="inline-flex items-center gap-2 rounded-xl bg-rose-500/20 backdrop-blur-sm px-4 py-2 text-sm font-bold text-rose-100 ring-1 ring-rose-500/30 hover:bg-rose-500/30 transition-all"
                    >
                      <Archive className="h-4 w-4" />
                      <span>Archive</span>
                    </button>
                  </PermissionGate>
                </>
              ) : (
                <>
                  <PermissionGate permission="iam.user.delete">
                    <button
                      onClick={() => setConfirmType('restore')}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/20 backdrop-blur-sm px-4 py-2 text-sm font-bold text-emerald-100 ring-1 ring-emerald-500/30 hover:bg-emerald-500/30 transition-all"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>Restore</span>
                    </button>
                    {user?.is_super_admin === false && ( // Assuming super admins can hard delete non-super admins. Or rather just show it. We'll rely on backend check.
                      <button
                        onClick={() => setConfirmType('hard_delete')}
                        className="inline-flex items-center gap-2 rounded-xl bg-rose-600/40 backdrop-blur-sm px-4 py-2 text-sm font-bold text-white ring-1 ring-rose-500 hover:bg-rose-600/60 transition-all shadow-[0_0_15px_rgba(225,29,72,0.3)]"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Permanent Delete</span>
                      </button>
                    )}
                  </PermissionGate>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── KPI Strip ── */}
        <KpiStrip
            className="mb-5 animate-fadeInUp delay-50 shadow-lg"
            items={[
              { icon: GitBranch, label: 'Business Units', value: accessStats.uniqueBUs, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
              { icon: ShieldAlert, label: 'Assigned Roles', value: accessStats.rolesCount, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20' },
              {
                icon:  isActive && !isDeleted ? CheckCircle2 : XCircle,
                label: 'Status',
                value: isDeleted ? 'Archived' : isActive ? 'Active' : 'Inactive',
                color: isDeleted ? 'text-rose-600 dark:text-rose-400' : isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400',
                bg:    isDeleted ? 'bg-rose-50 dark:bg-rose-900/20' : isActive ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-amber-50 dark:bg-amber-900/20',
              },
              {
                icon:  Calendar,
                label: 'Created',
                value: user.created_at ? formatIST(user.created_at, 'dd MMM yyyy') : '—',
                color: 'text-gray-600 dark:text-gray-400',
                bg:    'bg-gray-50 dark:bg-gray-800/50',
              },
            ]}
          />

        {/* ── Tabs ── */}
        <TabBar tabs={TABS} activeTab={activeTab} onChange={(id: string) => setActiveTab(id as Tab)} className="mb-5 animate-fadeInUp delay-75" />

        {/* ── Tab Content ── */}
        <div className="animate-fadeInUp delay-100">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 space-y-6">
              {activeTab === 'overview' && (
                <>
                  <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm border border-gray-200 dark:border-gray-800">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                      <Fingerprint className="h-5 w-5 text-indigo-500" /> Identity Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-6">
                      <InfoPair label="First Name" value={user.first_name} />
                      <InfoPair label="Last Name" value={user.last_name} />
                      <InfoPair label="Username" value={user.username} />
                      <InfoPair label="Email" value={user.email} />
                      <InfoPair label="Phone" value={user.phone_number} icon={Phone} />
                    </div>
                  </div>


                </>
              )}

              {activeTab === 'security' && (
                <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm border border-gray-200 dark:border-gray-800">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-indigo-500" /> Role & Permissions
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">Active Access (is_active)</h4>
                        <p className="text-sm text-gray-500">True: User can log in. False: User is suspended.</p>
                      </div>
                      {user.is_active ? (
                        <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                      ) : (
                        <span className="text-sm font-bold text-gray-400">Disabled</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl border border-rose-100 dark:border-rose-900/30 bg-rose-50 dark:bg-rose-900/10">
                      <div>
                        <h4 className="font-bold text-rose-900 dark:text-rose-100 flex items-center gap-2">Super Admin</h4>
                        <p className="text-sm text-rose-700/70 dark:text-rose-200/60 mt-0.5">True: Unrestricted access across all domains.</p>
                      </div>
                      {user.is_super_admin ? (
                        <CheckCircle2 className="h-6 w-6 text-rose-500" />
                      ) : (
                        <span className="text-sm font-bold text-gray-400">Disabled</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'bu_access' && (
                <UserBUAccessTab userId={user.id} isSuperAdmin={user.is_super_admin} />
              )}

              {activeTab === 'audit' && (
                <UserAuditHistoryTab userId={user.id} />
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm border border-gray-200 dark:border-gray-800 text-sm">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Metadata</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 text-gray-500 dark:text-gray-400">
                    <Calendar className="h-4 w-4 mt-0.5 shrink-0 text-gray-400" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-300">Created</p>
                      <p>{user.created_at ? formatIST(user.created_at, 'PPPp') : 'Unknown'}</p>
                      {user.created_reason && (
                        <p className="mt-1 text-xs italic bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
                          "{user.created_reason}"
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-gray-500 dark:text-gray-400">
                    <Clock className="h-4 w-4 mt-0.5 shrink-0 text-blue-400" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-300">Last Modified</p>
                      <p>{user.updated_at ? formatIST(user.updated_at, 'PPPp') : 'Unknown'}</p>
                      {user.updated_reason && (
                        <p className="mt-1 text-xs italic bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-2 rounded-md border border-blue-100 dark:border-blue-800/30">
                          "{user.updated_reason}"
                        </p>
                      )}
                    </div>
                  </div>
                  {user.is_deleted && (
                    <div className="flex items-start gap-3 text-gray-500 dark:text-gray-400">
                      <Archive className="h-4 w-4 mt-0.5 shrink-0 text-rose-400" />
                      <div>
                        <p className="font-semibold text-rose-700 dark:text-rose-400">Archived</p>
                        <p>{user.deleted_at ? formatIST(user.deleted_at, 'PPPp') : 'Unknown'}</p>
                        {user.deleted_reason && (
                          <p className="mt-1 text-xs italic bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 p-2 rounded-md border border-rose-100 dark:border-rose-800/30">
                            "{user.deleted_reason}"
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {user.restored_at && !user.is_deleted && (
                    <div className="flex items-start gap-3 text-gray-500 dark:text-gray-400">
                      <RotateCcw className="h-4 w-4 mt-0.5 shrink-0 text-emerald-400" />
                      <div>
                        <p className="font-semibold text-emerald-700 dark:text-emerald-400">Last Restored</p>
                        <p>{formatIST(user.restored_at, 'PPPp')}</p>
                        {user.restored_reason && (
                          <p className="mt-1 text-xs italic bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 p-2 rounded-md border border-emerald-100 dark:border-emerald-800/30">
                            "{user.restored_reason}"
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
      {/* Shared Confirm Modal for Archive/Restore (not hard delete) */}
      {confirmType && confirmType !== 'hard_delete' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => !isConfirming && setConfirmType(null)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`h-1.5 w-full ${confirmType === 'archive' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
            
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${confirmType === 'archive' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                  {confirmType === 'archive' ? <Archive className="h-5 w-5" /> : <RotateCcw className="h-5 w-5" />}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {confirmType === 'archive' ? 'Archive User' : 'Restore User'}
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                {confirmType === 'archive' 
                  ? 'Are you sure you want to archive this user? They will no longer be able to log in, but their historical data will be preserved.' 
                  : 'Are you sure you want to restore this user? They will regain access to their assigned business units.'}
              </p>
              
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Reason <span className="text-gray-500 font-normal">(Optional)</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="Provide a reason for the audit log..."
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setConfirmType(null);
                    setReason('');
                  }}
                  disabled={isConfirming}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={executeConfirmAction}
                  disabled={isConfirming}
                  className={`px-4 py-2 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 ${
                    confirmType === 'archive'
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-600/20' 
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20'
                  }`}
                >
                  {isConfirming && <Loader2 className="h-4 w-4 animate-spin" />}
                  {confirmType === 'archive' ? 'Archive User' : 'Restore User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enterprise Hard Delete Modal */}
      <UserPermanentDeleteModal
        isOpen={confirmType === 'hard_delete'}
        onClose={() => setConfirmType(null)}
        user={user}
        onDeleted={() => navigate(backUrl)}
      />
    </>
  );
};

export default UserDetailPage;
