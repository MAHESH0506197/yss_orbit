// src/features/organization/businessDomain/pages/BusinessDomainDetailPage.tsx
// ─────────────────────────────────────────────────────────────────────────────
// ENTERPRISE FULL PAGE — Business Domain Detail
//
// Route: /platform/business-domains/:id
// Back:  /platform/business-domains  (breadcrumb + ArrowLeft button)
// Edit:  /platform/business-domains/:id/edit  (full page)
//
// Features:
//  ✅ Hero banner with mesh gradient + domain avatar + animated status pulse
//  ✅ KPI metric strip (Orgs, BUs, Active Users, Status, Created)
//  ✅ Sticky tab bar: Overview | Organizations | Audit Trail
//  ✅ Overview tab: glassmorphism info cards, code chip, description, logo
//  ✅ Organizations tab: list of organizations using this domain
//  ✅ Audit Trail tab: timestamps + user IDs in a timeline
//  ✅ Breadcrumb navigation with chevron separators
//  ✅ Archive / Restore / Permanent Delete with confirm dialog
//  ✅ Keyboard shortcuts: E → Edit, A → Archive/Restore, Escape → Back
//  ✅ Back/Forward browser navigation support
//  ✅ Enterprise skeleton matching real layout
//  ✅ Smooth page-entry animation
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft, ChevronRight, Globe2, Edit2, Archive, RotateCcw,
  CheckCircle2, XCircle, Building2, GitBranch, Users, Calendar,
  Clock, Fingerprint, Code2, FileText, Activity, ShieldAlert,
  Loader2, AlertTriangle, RefreshCcw, Copy, Check, Trash2,
  LayoutGrid, Info, History, Eye, ImagePlus,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useBusinessDomain, useDeleteBusinessDomain, useRestoreBusinessDomain } from '../api/useBusinessDomains';
import { useBusinessDomainMutations } from '../api/useBusinessDomainMutations';
import { BusinessDomainPermanentDeleteModal } from '../components/BusinessDomainPermanentDeleteModal';
import { PermissionGate } from '@/components/auth/PermissionGate';
import type { BusinessDomain } from '../types/businessDomainTypes';

// ─── Shared Design System Components ─────────────────────────────────────────
import { EntityAvatar } from '@/components/platform/EntityAvatar';
import { StatusBadge, getEntityStatus } from '@/components/platform/StatusBadge';
import { CopyChip } from '@/components/platform/CopyChip';
import { SectionCard } from '@/components/platform/SectionCard';
import { InfoRow } from '@/components/platform/InfoRow';
import { KpiStrip } from '@/components/platform/KpiStrip';
import { TabBar } from '@/components/platform/TabBar';
import { PageSkeleton } from '@/components/platform/PageSkeleton';
import { formatIST } from '@/utils/date';

// ─── Tab definitions ──────────────────────────────────────────────────────────────
type Tab = 'overview' | 'organizations' | 'audit';
const TABS = [
  { id: 'overview' as Tab,      label: 'Overview',       icon: Info      },
  { id: 'organizations' as Tab, label: 'Organizations',  icon: Building2 },
  { id: 'audit' as Tab,         label: 'Audit Trail',    icon: History   },
];

// ─── Confirm Dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({
  type,
  domain,
  onCancel,
  onConfirm,
  isLoading,
}: {
  type: 'archive' | 'restore';
  domain: BusinessDomain;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
  isLoading: boolean;
}) {
  const [reason, setReason] = useState('');
  
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl ring-1 ring-black/5 overflow-hidden"
        style={{ animation: 'scaleIn 0.15s ease-out' }}>
        <div className={`h-1 w-full ${type === 'archive' ? 'bg-gradient-to-r from-rose-500 to-pink-600' : 'bg-gradient-to-r from-emerald-500 to-teal-600'}`} />
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {type === 'archive' ? 'Archive Business Domain' : 'Restore Business Domain'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {type === 'archive'
              ? 'This domain will be archived and hidden from active use. Organizations already assigned will retain their assignment.'
              : 'This domain will be restored and made available for Organization assignments again.'}
          </p>
          <div className={`flex items-center gap-3 rounded-xl px-4 py-3 mb-4 ${
            type === 'archive'
              ? 'bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800'
              : 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
          }`}>
            <EntityAvatar name={domain.name} logoUrl={domain.logo_url} size={36} />
            <div>
              <div className="font-bold text-sm text-gray-900 dark:text-white">{domain.name}</div>
              <code className="text-[11px] text-gray-500 dark:text-gray-400">{domain.code}</code>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
              Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={`Reason for ${type === 'archive' ? 'archiving' : 'restoring'}...`}
              rows={2}
              className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 py-2.5 px-3 text-sm text-gray-900 dark:text-white focus:border-violet-500 focus:ring-violet-500 transition-all resize-none"
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <button onClick={onCancel} disabled={isLoading}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50">
              Cancel
            </button>
            <button onClick={() => onConfirm(reason)} disabled={isLoading || !reason.trim()}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed ${
                type === 'archive'
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 hover:shadow-rose-500/30 hover:shadow-lg'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-emerald-500/30 hover:shadow-lg'
              }`}>
              {isLoading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
                : type === 'archive'
                  ? <><Archive className="h-4 w-4" /> Archive</>
                  : <><RotateCcw className="h-4 w-4" /> Restore</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Detail Page ──────────────────────────────────────────────────────────
export const BusinessDomainDetailPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [confirmType, setConfirmType] = useState<'archive' | 'restore' | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [permDeleteOpen, setPermDeleteOpen] = useState(false);

  const { data: domain, isLoading, isError, refetch } = useBusinessDomain(id);
  const archiveMutation  = useDeleteBusinessDomain();
  const restoreMutation  = useRestoreBusinessDomain();

  const backUrl = '/platform/business-domains';
  const editUrl = `/platform/business-domains/${id}/edit`;

  const isArchiveProtected = !domain?.is_deleted && (domain?.organizations_count ?? 0) > 0;

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    if (confirmType || permDeleteOpen) return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if (inInput) return;

      if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
        e.preventDefault();
        navigate(backUrl);
      }
      if ((e.key === 'e' || e.key === 'E') && domain && !domain.is_deleted) {
        e.preventDefault();
        navigate(editUrl);
      }
      if ((e.key === 'a' || e.key === 'A') && domain) {
        e.preventDefault();
        if (domain.is_deleted) setConfirmType('restore');
        else if (!isArchiveProtected) setConfirmType('archive');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [domain, confirmType, permDeleteOpen, navigate, backUrl, editUrl, isArchiveProtected]);

  const executeConfirmAction = useCallback(async (reason: string) => {
    if (!domain || !confirmType) return;
    setIsConfirming(true);
    try {
      if (confirmType === 'archive') {
        await archiveMutation.mutateAsync({ id: domain.id, reason });
        toast.success(`"${domain.name}" archived.`);
        navigate(backUrl);
      } else {
        await restoreMutation.mutateAsync({ id: domain.id, reason });
        toast.success(`"${domain.name}" restored.`);
        refetch();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Action failed.');
    } finally {
      setIsConfirming(false);
      setConfirmType(null);
    }
  }, [domain, confirmType, archiveMutation, restoreMutation, navigate, backUrl, refetch]);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      <PageSkeleton variant="detail" />
    </div>
  );

  // ── Error state ───────────────────────────────────────────────────────────
  if (isError || !domain) return (
    <div className="max-w-5xl mx-auto px-6 py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-50 dark:bg-rose-900/20 mx-auto mb-5">
        <AlertTriangle className="h-10 w-10 text-rose-500" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Domain Not Found</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        This business domain may have been permanently deleted or the ID is incorrect.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Link to={backUrl}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition shadow-sm">
          <ArrowLeft className="h-4 w-4" /> Back to Domains
        </Link>
        <button onClick={() => refetch()}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-700 transition shadow-sm">
          <RefreshCcw className="h-4 w-4" /> Retry
        </button>
      </div>
    </div>
  );

  const orgsCount  = domain.organizations_count ?? 0;
  const busCount   = domain.business_units_count ?? 0;
  const usersCount = domain.active_users_count ?? 0;
  // Entity gradient for hero (same palette as EntityAvatar)
  const HERO_GRADIENTS = [
    'from-violet-500 to-purple-600', 'from-blue-500 to-indigo-600',
    'from-teal-500 to-emerald-600',  'from-amber-500 to-orange-500',
    'from-pink-500 to-rose-500',     'from-cyan-500 to-blue-500',
  ];
  const grad = HERO_GRADIENTS[domain.name.charCodeAt(0) % HERO_GRADIENTS.length];

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 animate-fadeInUp">

        {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
        <nav className="flex items-center gap-1.5 text-sm py-5 text-gray-500 dark:text-gray-400"
          aria-label="Breadcrumb">
          <Link to="/platform"
            className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors font-medium">
            Platform
          </Link>
          <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 shrink-0" />
          <Link to={backUrl}
            className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors font-medium">
            Business Domains
          </Link>
          <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 shrink-0" />
          <span className="font-bold text-gray-900 dark:text-white truncate max-w-[180px]">{domain.name}</span>
        </nav>

        {/* ── Hero Banner ─────────────────────────────────────────────────── */}
        <div className={`relative rounded-3xl overflow-hidden bg-gradient-to-br ${grad} px-6 py-5 mb-5 shadow-2xl`}>
          <div className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }} />
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-black/10 blur-2xl" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="absolute top-0 right-0 flex items-center gap-2">
              <Link to={backUrl} aria-label="Back to Business Domains (←)"
                title="Back to list (← or Backspace)"
                className="flex items-center gap-1.5 rounded-xl bg-white/15 backdrop-blur-sm px-3 py-2 text-xs font-bold text-white hover:bg-white/25 transition-all ring-1 ring-white/20">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Link>
            </div>

            <div className="relative">
              <EntityAvatar name={domain.name} logoUrl={domain.logo_url} size={88} shape="rounded-2xl" className="border-4 border-white/30 shadow-2xl" />
              {!domain.is_deleted && domain.is_active && (
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 ring-2 ring-white dark:ring-gray-900 shadow">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-pulseRing" />
                  <CheckCircle2 className="h-3 w-3 text-white relative z-10" />
                </span>
              )}
              {domain.is_deleted && (
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-400 ring-2 ring-white dark:ring-gray-900 shadow">
                  <Archive className="h-3 w-3 text-white" />
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl font-black text-white tracking-tight leading-tight">{domain.name}</h1>
                <StatusBadge status={getEntityStatus(domain.is_deleted, domain.is_active)} />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <code className="rounded-lg bg-white/15 backdrop-blur-sm px-2.5 py-1 text-sm font-mono font-bold text-white/90 ring-1 ring-white/20">
                  {domain.code}
                </code>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-auto self-end sm:self-auto">
              {!domain.is_deleted && (
                <PermissionGate permission="business_domain.businessdomain.update">
                  <Link to={editUrl}
                    title="Edit Domain (E)"
                    aria-label="Edit this domain"
                    className="inline-flex items-center gap-2 rounded-xl bg-white/15 backdrop-blur-sm px-4 py-2 text-sm font-bold text-white ring-1 ring-white/20 hover:bg-white/25 transition-all">
                    <Edit2 className="h-4 w-4" />
                    <span>Edit <kbd className="hidden sm:inline-flex items-center rounded border border-white/20 bg-white/10 px-1 py-0.5 font-mono text-[9px] text-white/70">E</kbd></span>
                  </Link>
                </PermissionGate>
              )}

              {domain.is_deleted ? (
                <PermissionGate permission="business_domain.businessdomain.restore">
                  <button
                    onClick={() => setConfirmType('restore')}
                    title="Restore Domain (A)"
                    className="inline-flex items-center gap-2 rounded-xl bg-white/15 backdrop-blur-sm px-4 py-2 text-sm font-bold text-white ring-1 ring-white/20 hover:bg-white/25 transition-all">
                    <RotateCcw className="h-4 w-4" /> Restore
                  </button>
                </PermissionGate>
              ) : isArchiveProtected ? (
                <button disabled title="Cannot archive — domain has active organizations"
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500/20 backdrop-blur-sm px-4 py-2 text-sm font-bold text-amber-200 ring-1 ring-amber-400/30 cursor-not-allowed opacity-70">
                  <ShieldAlert className="h-4 w-4" /> Archive ({orgsCount} org{orgsCount !== 1 ? 's' : ''})
                </button>
              ) : (
                <PermissionGate permission="business_domain.businessdomain.delete">
                  <button
                    onClick={() => setConfirmType('archive')}
                    title="Archive Domain (A)"
                    className="inline-flex items-center gap-2 rounded-xl bg-rose-500/20 backdrop-blur-sm px-4 py-2 text-sm font-bold text-rose-100 ring-1 ring-rose-400/30 hover:bg-rose-500/35 transition-all">
                    <Archive className="h-4 w-4" /> Archive
                  </button>
                </PermissionGate>
              )}

              {domain.is_deleted && (
                <PermissionGate permission="business_domain.businessdomain.delete">
                  <button onClick={() => setPermDeleteOpen(true)}
                    title="Permanent Delete"
                    className="inline-flex items-center gap-2 rounded-xl bg-rose-700/30 backdrop-blur-sm px-4 py-2 text-sm font-bold text-rose-200 ring-1 ring-rose-600/40 hover:bg-rose-700/50 transition-all">
                    <Trash2 className="h-4 w-4" /> Permanent Delete
                  </button>
                </PermissionGate>
              )}
            </div>
          </div>
        </div>

        {/* ── KPI Strip ─────────────────────────────────────────────────── */}
        <KpiStrip
          className="mb-5 animate-fadeInUp delay-50"
          items={[
            { icon: Building2, label: 'Organizations',  value: orgsCount,   color: 'text-blue-600 dark:text-blue-400',        bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { icon: GitBranch, label: 'Business Units', value: busCount,    color: 'text-violet-600 dark:text-violet-400',     bg: 'bg-violet-50 dark:bg-violet-900/20' },
            { icon: Users,     label: 'Active Users',   value: usersCount,  color: 'text-emerald-600 dark:text-emerald-400',   bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
            {
              icon:  domain.is_active && !domain.is_deleted ? CheckCircle2 : XCircle,
              label: 'Status',
              value: domain.is_deleted ? 'Archived' : domain.is_active ? 'Active' : 'Inactive',
              color: domain.is_deleted ? 'text-rose-600 dark:text-rose-400' : domain.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400',
              bg:    domain.is_deleted ? 'bg-rose-50 dark:bg-rose-900/20' : domain.is_active ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-amber-50 dark:bg-amber-900/20',
            },
            {
              icon:  Calendar,
              label: 'Created',
              value: domain.created_at ? formatIST(domain.created_at, 'dd MMM yyyy') : '—',
              color: 'text-gray-600 dark:text-gray-400',
              bg:    'bg-gray-50 dark:bg-gray-800/50',
            },
          ]}
        />

        {/* ── Tab Bar (shared component) ─────────────────────────────────── */}
        <div className="sticky top-0 z-30 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl mb-5 animate-fadeInDown delay-100">
          <TabBar
            tabs={TABS}
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as Tab)}
          />
        </div>

        {/* ── Tab Content ───────────────────────────────────────────────────── */}
        <div className="animate-fadeInUp delay-150">

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div id="tabpanel-overview" role="tabpanel" className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Identity card */}
              <SectionCard title="Identity" icon={Globe2} iconColor="text-violet-500" animDelay="delay-100">
                <InfoRow icon={Globe2} label="Domain Name" iconColor="text-violet-500">
                  <span className="font-bold text-gray-900 dark:text-white">{domain.name}</span>
                </InfoRow>
                <InfoRow icon={Code2} label="Domain Code" iconColor="text-indigo-500">
                  <CopyChip value={domain.code} label="domain code" />
                </InfoRow>
                <InfoRow icon={Fingerprint} label="UUID" iconColor="text-gray-400" last>
                  <CopyChip value={domain.id} label="domain UUID" />
                </InfoRow>
              </SectionCard>

              {/* Logo & Branding card */}
              <SectionCard title="Branding" icon={ImagePlus} iconColor="text-pink-500" animDelay="delay-150">
                {domain.logo_url && (
                  <div className="flex items-center gap-4 mb-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                    <img src={domain.logo_url} alt={`${domain.name} logo`}
                      className="h-16 w-16 object-contain rounded-xl border border-gray-200 dark:border-gray-700 bg-white" />
                    <div>
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Domain Logo</div>
                      <CopyChip value={domain.logo_url} label="logo URL" mono={false} />
                    </div>
                  </div>
                )}
                {!domain.logo_url && (
                  <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700">
                    <div className="h-16 w-16 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700">
                      <Globe2 className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                    </div>
                    <span className="text-sm text-gray-400 dark:text-gray-500">No logo uploaded</span>
                  </div>
                )}
              </SectionCard>

              {/* Status & Configuration card */}
              <SectionCard title="Status & Configuration" icon={Activity} iconColor="text-emerald-500" animDelay="delay-200">
                <InfoRow icon={CheckCircle2} label="Active Status" iconColor={domain.is_active ? 'text-emerald-500' : 'text-gray-400'}>
                  <StatusBadge status={getEntityStatus(domain.is_deleted, domain.is_active)} />
                </InfoRow>
                <InfoRow icon={Building2} label="Organizations Assigned" iconColor="text-blue-500">
                  <span className={`font-bold text-lg tabular-nums ${orgsCount > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
                    {orgsCount}
                  </span>
                  {orgsCount > 0 && (
                    <button onClick={() => setActiveTab('organizations')}
                      className="ml-2 text-xs text-violet-600 dark:text-violet-400 hover:underline font-medium">
                      View →
                    </button>
                  )}
                </InfoRow>
                <InfoRow icon={GitBranch} label="Business Units" iconColor="text-violet-500">
                  <span className={`font-bold text-lg tabular-nums ${busCount > 0 ? 'text-violet-600 dark:text-violet-400' : 'text-gray-400'}`}>
                    {busCount}
                  </span>
                </InfoRow>
                <InfoRow icon={Users} label="Active Users" iconColor="text-emerald-500" last>
                  <span className={`font-bold text-lg tabular-nums ${usersCount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                    {usersCount}
                  </span>
                </InfoRow>
                {isArchiveProtected && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                    <ShieldAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    Archive-protected — {orgsCount} organization{orgsCount !== 1 ? 's' : ''} assigned
                  </div>
                )}
              </SectionCard>

              {/* Timestamps card */}
              <SectionCard title="Timestamps" icon={Clock} iconColor="text-blue-400" animDelay="delay-300">
                <InfoRow icon={Calendar} label="Created At" iconColor="text-blue-400">
                  {domain.created_at
                    ? <><span className="font-semibold">{formatIST(domain.created_at, 'dd MMM yyyy, HH:mm')}</span> <span className="text-gray-400">({formatDistanceToNow(new Date(domain.created_at), { addSuffix: true })})</span></>
                    : '—'
                  }
                </InfoRow>
                <InfoRow icon={Clock} label="Last Updated" iconColor="text-violet-400">
                  {domain.updated_at
                    ? <><span className="font-semibold">{formatIST(domain.updated_at, 'dd MMM yyyy, HH:mm')}</span> <span className="text-gray-400">({formatDistanceToNow(new Date(domain.updated_at), { addSuffix: true })})</span></>
                    : '—'
                  }
                </InfoRow>
                {domain.is_deleted && domain.deleted_at && (
                  <InfoRow icon={Archive} label="Archived At" iconColor="text-rose-400">
                    <span className="font-semibold">{formatIST(domain.deleted_at, 'dd MMM yyyy, HH:mm')}</span>
                    <span className="ml-2 text-gray-400">({formatDistanceToNow(new Date(domain.deleted_at), { addSuffix: true })})</span>
                  </InfoRow>
                )}
                {domain.restored_at && (
                  <InfoRow icon={RotateCcw} label="Restored At" iconColor="text-emerald-400" last>
                    <span className="font-semibold">{formatIST(domain.restored_at, 'dd MMM yyyy, HH:mm')}</span>
                  </InfoRow>
                )}
              </SectionCard>
            </div>
          )}

          {/* ORGANIZATIONS TAB */}
          {activeTab === 'organizations' && (
            <div id="tabpanel-organizations" role="tabpanel">
              {orgsCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-800 mb-4">
                    <Building2 className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Organizations Yet</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                    No organizations are currently assigned to the <strong>{domain.name}</strong> domain.
                  </p>
                  <Link to="/platform/organizations"
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-700 transition shadow-sm">
                    <Building2 className="h-4 w-4" /> Go to Organizations
                  </Link>
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
                  <div className="border-b border-gray-100 dark:border-gray-800 px-5 py-4">
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      Organizations using <span className="text-violet-600 dark:text-violet-400">{domain.name}</span>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {orgsCount} organization{orgsCount !== 1 ? 's' : ''} classified under this business domain
                    </p>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3">
                      <Info className="h-4 w-4 shrink-0 text-blue-500" />
                      Full organization list with details is available on the{' '}
                      <Link to="/platform/organizations" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
                        Organizations page
                      </Link>
                      . Filters by domain code <code className="font-mono bg-blue-100 dark:bg-blue-900/50 px-1.5 py-0.5 rounded">{domain.code}</code> are supported there.
                    </div>
                    <div className="mt-4 text-center">
                      <Link
                        to={`/platform/organizations?domain=${domain.code}`}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/25 hover:-translate-y-0.5 hover:shadow-xl transition-all"
                      >
                        <Eye className="h-4 w-4" /> View {orgsCount} Organization{orgsCount !== 1 ? 's' : ''}
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AUDIT TRAIL TAB */}
          {activeTab === 'audit' && (
            <div id="tabpanel-audit" role="tabpanel">
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
                <div className="border-b border-gray-100 dark:border-gray-800 px-5 py-4">
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <History className="h-4 w-4 text-violet-500" /> Audit Trail
                  </h3>
                </div>
                <div className="p-5">
                  <ol className="relative border-l-2 border-violet-200 dark:border-violet-900 pl-6 space-y-6">
                    {/* Created event */}
                    {domain.created_at && (
                      <li className="relative">
                        <div className="absolute -left-[25px] flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 ring-2 ring-white dark:ring-gray-900">
                          <Calendar className="h-3 w-3 text-blue-500" />
                        </div>
                        <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-bold text-gray-900 dark:text-white">Domain Created</span>
                            <time className="text-xs text-gray-400 whitespace-nowrap">
                              {formatIST(domain.created_at, 'dd MMM yyyy, HH:mm')}
                            </time>
                          </div>
                          {domain.created_by_id && (
                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              By user: <CopyChip value={domain.created_by_id} label="creator user ID" />
                            </div>
                          )}
                          {domain.created_reason && (
                            <div className="mt-2 text-xs text-gray-600 dark:text-gray-300 italic border-l-2 border-blue-200 dark:border-blue-800 pl-2">
                              "{domain.created_reason}"
                            </div>
                          )}
                        </div>
                      </li>
                    )}

                    {/* Last Updated event (if different from created) */}
                    {domain.updated_at && domain.updated_at !== domain.created_at && (
                      <li className="relative">
                        <div className="absolute -left-[25px] flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/50 ring-2 ring-white dark:ring-gray-900">
                          <Edit2 className="h-3 w-3 text-violet-500" />
                        </div>
                        <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-bold text-gray-900 dark:text-white">Last Updated</span>
                            <time className="text-xs text-gray-400 whitespace-nowrap">
                              {formatIST(domain.updated_at, 'dd MMM yyyy, HH:mm')}
                            </time>
                          </div>
                          {domain.updated_by_id && (
                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              By user: <CopyChip value={domain.updated_by_id} label="updater user ID" />
                            </div>
                          )}
                          {domain.updated_reason && (
                            <div className="mt-2 text-xs text-gray-600 dark:text-gray-300 italic border-l-2 border-violet-200 dark:border-violet-800 pl-2">
                              "{domain.updated_reason}"
                            </div>
                          )}
                        </div>
                      </li>
                    )}

                    {/* Archived event */}
                    {domain.is_deleted && domain.deleted_at && (
                      <li className="relative">
                        <div className="absolute -left-[25px] flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/50 ring-2 ring-white dark:ring-gray-900">
                          <Archive className="h-3 w-3 text-rose-500" />
                        </div>
                        <div className="rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900 px-4 py-3">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-bold text-rose-700 dark:text-rose-400">Domain Archived</span>
                            <time className="text-xs text-gray-400 whitespace-nowrap">
                              {formatIST(domain.deleted_at, 'dd MMM yyyy, HH:mm')}
                            </time>
                          </div>
                          {domain.deleted_by_id && (
                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              By user: <CopyChip value={domain.deleted_by_id} label="archiver user ID" />
                            </div>
                          )}
                          {domain.deleted_reason && (
                            <div className="mt-2 text-xs text-rose-600 dark:text-rose-300 italic border-l-2 border-rose-200 dark:border-rose-800 pl-2">
                              "{domain.deleted_reason}"
                            </div>
                          )}
                        </div>
                      </li>
                    )}

                    {/* Restored event */}
                    {domain.restored_at && (
                      <li className="relative">
                        <div className="absolute -left-[25px] flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 ring-2 ring-white dark:ring-gray-900">
                          <RotateCcw className="h-3 w-3 text-emerald-500" />
                        </div>
                        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900 px-4 py-3">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Domain Restored</span>
                            <time className="text-xs text-gray-400 whitespace-nowrap">
                              {formatIST(domain.restored_at, 'dd MMM yyyy, HH:mm')}
                            </time>
                          </div>
                          {domain.restored_by_id && (
                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              By user: <CopyChip value={domain.restored_by_id} label="restorer user ID" />
                            </div>
                          )}
                          {domain.restored_reason && (
                            <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-300 italic border-l-2 border-emerald-200 dark:border-emerald-800 pl-2">
                              "{domain.restored_reason}"
                            </div>
                          )}
                        </div>
                      </li>
                    )}
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Keyboard hints strip ───────────────────────────────────────────── */}
        <div className="mt-8 flex items-center justify-center gap-4 text-xs text-gray-400 dark:text-gray-600">
          {[
            { key: '←', label: 'Back to list' },
            { key: 'E', label: 'Edit domain' },
            { key: 'A', label: domain?.is_deleted ? 'Restore' : 'Archive' },
          ].map(({ key, label }) => (
            <span key={key} className="inline-flex items-center gap-1.5">
              <kbd className="inline-flex items-center rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 font-mono text-[10px] font-bold text-gray-500">
                {key}
              </kbd>
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────── */}
      {confirmType && domain && (
        <ConfirmDialog
          type={confirmType}
          domain={domain}
          onCancel={() => setConfirmType(null)}
          onConfirm={executeConfirmAction}
          isLoading={isConfirming}
        />
      )}

      <BusinessDomainPermanentDeleteModal
        isOpen={permDeleteOpen}
        onClose={() => setPermDeleteOpen(false)}
        domain={domain ?? null}
        onDeleted={() => { setPermDeleteOpen(false); navigate(backUrl); }}
      />
    </>
  );
};

export default BusinessDomainDetailPage;
