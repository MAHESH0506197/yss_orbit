// src/pages/organization/OrganizationDetailPage.tsx
// ─────────────────────────────────────────────────────────────────────────────
// ENTERPRISE DETAIL PAGE — Premium redesign
//  ✅ Full-width gradient hero banner with mesh background
//  ✅ Large avatar with glow shadow, animated status pulse
//  ✅ KPI metric strip (BUs, Status, Created)
//  ✅ Sticky tab bar with icon indicators + animated underline
//  ✅ Overview: glassmorphism info cards in 3-col grid
//  ✅ Settings: grouped cards with live toggle switches (visual only)
//  ✅ Copy buttons: UUID, slug, email with toast feedback
//  ✅ Edit via modal (same pattern as list page)
//  ✅ Custom confirm dialog for archive/restore (BD-style accent stripe)
//  ✅ Archive protection check (block if has BUs)
//  ✅ Enterprise skeleton that matches real layout
//  ✅ Breadcrumb with chevron separator
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useCallback, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  Settings, Hash, Calendar, AlertTriangle, ArrowLeft, ChevronRight,
  CheckCircle2, Mail, Edit2, ShieldCheck, Bell, Building2,
  Palette, Users, Clock, Copy, Check, Globe2, Layers,
  Activity, Shield, GitBranch, Archive, RotateCcw, Loader2,
  ShieldAlert, RefreshCcw, Eye, EyeOff, Fingerprint, Lock,
  X, MoreHorizontal, History, Zap, Wifi, AlertCircle, Phone, MapPin, User, DollarSign, Building, Image,
} from 'lucide-react';
import toast from 'react-hot-toast';

import {
  useOrganization,
  useDeleteOrganization,
  useRestoreOrganization,
  useUpdateOrganizationSettings,
} from '@/features/organization/hooks/useOrganizations';
import type { Organization, OrganizationSettings } from '@/features/organization/types/organizationTypes';
import { getOrganizationStatus } from '@/features/organization/types/organizationTypes';
import { getOrgInitials, getAvatarColor } from '@/features/organization/utils/organizationHelpers';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { useBusinessDomain } from '@/features/organization/businessDomain/api/useBusinessDomains';
import { formatIST } from '@/utils/date';

// ─── Copy Hook ─────────────────────────────────────────────────────────────────
function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      toast.success('Copied to clipboard', { duration: 1200, icon: '📋' });
      setTimeout(() => setCopied(null), 1800);
    });
  }, []);
  return { copied, copy };
}

// ─── Inline Copy Button ────────────────────────────────────────────────────────
function CopyBtn({ value, label, mono = true }: { value: string; label: string; mono?: boolean }) {
  const { copied, copy } = useCopy();
  const isCopied = copied === value;
  return (
    <button
      onClick={() => copy(value, value)}
      aria-label={`Copy ${label}`}
      title={isCopied ? 'Copied!' : `Copy ${label}`}
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold ring-1 transition-all group ${
        mono ? 'font-mono' : ''
      } ${
        isCopied
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/25 dark:text-emerald-400 dark:ring-emerald-800/50'
          : 'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:ring-violet-800/50 hover:bg-violet-100 dark:hover:bg-violet-900/40'
      }`}
    >
      {value.length > 24 ? `${value.slice(0, 12)}…${value.slice(-6)}` : value}
      {isCopied
        ? <Check className="h-3 w-3 shrink-0 text-emerald-500" />
        : <Copy className="h-3 w-3 opacity-40 group-hover:opacity-100 transition-opacity shrink-0" />
      }
    </button>
  );
}

function ToggleSwitch({ on }: { on: boolean }) {
  return (
    <div className={`relative flex h-6 w-11 shrink-0 items-center rounded-full transition-all duration-300 ${on ? 'bg-indigo-600 shadow-sm' : 'bg-gray-200 dark:bg-gray-700'}`}>
      <span className={`absolute h-4.5 w-4.5 rounded-full bg-white shadow-md transition-all duration-300 ${on ? 'left-6' : 'left-0.5'}`} style={{ height: 18, width: 18, left: on ? 20 : 2 }} />
    </div>
  );
}

// ─── Info Field Card ────────────────────────────────────────────────────────────
function InfoField({
  icon: Icon, label, value, children, mono = false, copyKey,
}: {
  icon: React.ElementType; label: string; value?: string | null; children?: React.ReactNode; mono?: boolean; copyKey?: string;
}) {
  const { copied, copy } = useCopy();
  if (!value && !children) return null;
  return (
    <div className="group flex items-start gap-3 rounded-xl bg-gray-50/70 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 p-4 transition-all hover:border-violet-200 dark:hover:border-violet-800/50 hover:shadow-sm">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
        <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">{label}</p>
        {children ?? (
          <div className="flex items-center gap-2">
            {copyKey ? (
              <button
                onClick={() => copy(value!, copyKey)}
                title={copied === copyKey ? 'Copied!' : 'Copy'}
                className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-sm font-semibold ring-1 transition-all group/copy ${
                  mono ? 'font-mono text-[12px]' : ''
                } ${
                  copied === copyKey
                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/25 dark:text-emerald-400 dark:ring-emerald-800'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 ring-gray-200 dark:ring-gray-700 hover:ring-violet-300 dark:hover:ring-violet-700'
                }`}
              >
                {copied === copyKey ? <Check className="h-3 w-3 shrink-0 text-emerald-500" /> : <Copy className="h-3 w-3 shrink-0 opacity-40 group-hover/copy:opacity-100 transition-opacity" />}
                <span className="truncate max-w-[200px]">{value}</span>
              </button>
            ) : (
              <span className={`text-sm font-semibold text-gray-800 dark:text-gray-100 ${mono ? 'font-mono text-[12px]' : ''}`}>{value}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Settings Toggle Row ──────────────────────────────────────────────────────────
function SettingRow({
  icon: Icon, label, description, value, color = 'emerald',
}: {
  icon: React.ElementType; label: string; description: string; value: boolean; color?: 'emerald' | 'violet' | 'blue' | 'amber';
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800/50 p-4 transition-all hover:border-gray-300 dark:hover:border-gray-600 shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700`}>
          <Icon className={`h-4 w-4 ${value ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}`} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{label}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${value ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}`}>
          {value ? 'On' : 'Off'}
        </span>
        <ToggleSwitch on={value} />
      </div>
    </div>
  );
}

// ─── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, color = 'violet', action }: {
  icon: React.ElementType; title: string; color?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700`}>
          <Icon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">{title}</h3>
      </div>
      {action}
    </div>
  );
}

// ─── Skeleton ───────────────────────────────────────────────────────────────────
function DetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" role="status" aria-label="Loading organization">
      {/* Breadcrumb */}
      <div className="h-4 w-52 rounded-full bg-gray-200 dark:bg-gray-800" />
      {/* Hero */}
      <div className="h-64 w-full rounded-2xl bg-gray-100 dark:bg-gray-800" />
      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 dark:border-gray-700 pb-0">
        {[80, 64, 72].map((w, i) => <div key={i} className="h-10 rounded-t-xl bg-gray-100 dark:bg-gray-800" style={{ width: w }} />)}
      </div>
      {/* Content grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[0, 1, 2].map(i => <div key={i} className="h-56 rounded-2xl bg-gray-100 dark:bg-gray-800" />)}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
type TabKey = 'overview' | 'settings' | 'audit';

export const OrganizationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: org, isLoading, isError } = useOrganization(id ?? '');
  const { data: domain } = useBusinessDomain(org?.business_domain_id || '');

  const [activeTab, setActiveTab]         = useState<TabKey>('overview');

  const [confirmDialog, setConfirmDialog] = useState<{ type: 'archive' | 'restore' } | null>(null);
  const [confirmReason, setConfirmReason] = useState('');
  const [isConfirming, setIsConfirming]   = useState(false);

  const deleteMutation  = useDeleteOrganization();
  const restoreMutation = useRestoreOrganization();
  const updateSettingsMutation = useUpdateOrganizationSettings();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && confirmDialog && !isConfirming) {
        e.preventDefault();
        setConfirmDialog(null);
        setConfirmReason('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmDialog, isConfirming]);

  const executeConfirm = async () => {
    if (!confirmDialog || !org) return;
    setIsConfirming(true);
    try {
      if (confirmDialog.type === 'archive') {
        await deleteMutation.mutateAsync({ id: org.id, reason: confirmReason });
        toast.success(`"${org.name}" archived.`);
      } else {
        await restoreMutation.mutateAsync({ id: org.id, reason: confirmReason });
        toast.success(`"${org.name}" restored.`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Action failed. Please try again.');
    } finally {
      setIsConfirming(false);
      setConfirmDialog(null);
      setConfirmReason('');
    }
  };

  if (isLoading) return <DetailSkeleton />;

  if (isError || !org) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center px-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-900/20">
          <AlertTriangle className="h-8 w-8 text-rose-500 dark:text-rose-400" />
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">Organization Not Found</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">It may have been deleted or the URL is incorrect.</p>
        </div>
        <Link
          to="/platform/organizations"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:-translate-y-0.5 transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Organizations
        </Link>
      </div>
    );
  }

  const status = getOrganizationStatus(org);
  const { bg } = getAvatarColor(org.name);
  const isProtected = (org.business_units_count ?? 0) > 0;

  const statusCfg = {
    active:   { gradient: 'from-emerald-500 to-teal-500',  dot: 'bg-emerald-400 animate-pulse', text: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-900/25 ring-emerald-200 dark:ring-emerald-800/50', label: 'Active' },
    inactive: { gradient: 'from-amber-500 to-orange-500',  dot: 'bg-amber-400',                 text: 'text-amber-700 dark:text-amber-300',   bg: 'bg-amber-50 dark:bg-amber-900/25 ring-amber-200 dark:ring-amber-800/50',   label: 'Inactive' },
    deleted:  { gradient: 'from-rose-500 to-pink-600',     dot: 'bg-rose-400',                  text: 'text-rose-700 dark:text-rose-300',     bg: 'bg-rose-50 dark:bg-rose-900/25 ring-rose-200 dark:ring-rose-800/50',     label: 'Archived' },
  }[status];

  const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'overview', label: 'Overview',  icon: Activity },
    { key: 'settings', label: 'Settings',  icon: Shield },
    { key: 'audit',    label: 'Audit Trail', icon: History },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-0 pb-12">

      {/* ── Breadcrumb ──────────────────────────────────────────────────────── */}
      <div className="px-0 pb-4">
        <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
          <Link to="/platform/organizations" className="inline-flex items-center gap-1.5 font-medium text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
            <Building2 className="h-3.5 w-3.5" /> Organizations
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600" />
          <span className="font-semibold text-gray-900 dark:text-white truncate max-w-[200px]">{org.name}</span>
        </nav>
      </div>

                                    {/* ── Hero Profile ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm dark:border-gray-800/60 dark:bg-gray-900 mb-8 mt-4">
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }}
        />
        <div
          className="absolute -top-40 -right-40 h-96 w-96 rounded-full blur-[100px] opacity-40 dark:opacity-20 pointer-events-none"
          style={{ backgroundColor: bg }}
        />
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{ background: `linear-gradient(90deg, ${bg}, transparent)` }}
        />

        <div className="relative z-10 flex flex-col gap-6 p-6 sm:p-8 lg:p-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center lg:items-start">
            <div className="relative shrink-0">
              <div className="group relative flex h-28 w-28 items-center justify-center rounded-[1.5rem] shadow-xl ring-4 ring-white transition-transform hover:scale-105 dark:ring-gray-900">
                {org.logo_url ? (
                  <img src={org.logo_url} alt={org.name} className="h-full w-full object-contain p-2 bg-white rounded-[1.5rem] relative z-10" />
                ) : (
                  <div className="relative z-10 flex h-full w-full items-center justify-center rounded-[1.5rem] mix-blend-overlay" style={{ backgroundColor: bg, filter: 'brightness(0.5)' }}>
                    <span className="text-4xl font-black text-white">
                      {getOrgInitials(org.name)}
                    </span>
                  </div>
                )}
              </div>
              <div className={`absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white dark:border-gray-900 shadow-md z-20 ${
                org.is_deleted ? 'bg-rose-500' : status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}>
                {org.is_deleted ? <Archive className="h-4 w-4 text-white" /> : <ShieldCheck className="h-4 w-4 text-white" />}
              </div>
              {!org.is_deleted && status === 'active' && (
                <div className="absolute -bottom-2 -right-2 h-8 w-8 animate-ping rounded-full bg-emerald-500 opacity-20 z-10" />
              )}
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                  {org.name}
                </h1>
                <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold border ${
                  org.is_deleted ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-400'
                  : status === 'active' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-400'
                  : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-400'
                }`}>
                  <div className={`h-1.5 w-1.5 rounded-full ${org.is_deleted ? 'bg-rose-500' : status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {org.is_deleted ? 'Archived' : status === 'active' ? 'Active' : 'Inactive'}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1.5 cursor-text text-gray-900 dark:text-white transition-colors">
                  <Fingerprint className="h-4 w-4 opacity-50" />
                  <span className="font-mono text-xs">{org.id}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 lg:flex-col lg:items-end">
            <PermissionGate permission="organization.organization.view">
              <button
                onClick={() => navigate(`/platform/organizations/${org.id}/edit`)}
                disabled={org.is_deleted}
                className="inline-flex items-center gap-2 rounded-xl bg-gray-100/80 dark:bg-gray-800 px-5 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-200 transition-all hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Edit2 className="h-4 w-4" /> Edit Profile
              </button>
            </PermissionGate>
            <PermissionGate permission="organization.organization.view">
              {org.is_deleted ? (
                <button
                  onClick={() => setConfirmDialog({ type: 'restore' })}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-5 py-2.5 text-sm font-bold text-emerald-700 transition-all hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40"
                >
                  <RotateCcw className="h-4 w-4" /> Restore
                </button>
              ) : isProtected ? (
                <button
                  onClick={() => toast.error(`Cannot archive: org has ${org.business_units_count} active Business Unit(s).`)}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600"
                  title="Cannot archive (has active Business Units)"
                >
                  <ShieldAlert className="h-4 w-4" /> Archive Protected
                </button>
              ) : (
                <button
                  onClick={() => setConfirmDialog({ type: 'archive' })}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/40"
                >
                  <Archive className="h-4 w-4" /> Archive
                </button>
              )}
            </PermissionGate>
          </div>
        </div>

        {/* Hero KPI Footer */}
        <div className="grid grid-cols-2 divide-x divide-gray-100 border-t border-gray-100 bg-gray-50/50 dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900/50 sm:grid-cols-5">
          <div className="flex items-center gap-3 p-4 sm:px-8">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Users</p>
              <p className="text-lg font-black text-gray-900 dark:text-white">0</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 sm:px-8">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400">
              <GitBranch className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Business Units</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[120px]">{org.business_units_count || 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 sm:px-8">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400">
              <Globe2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Business Domain</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[120px]">{domain?.name || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 sm:px-8">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Created</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {org.created_at ? formatIST(org.created_at, 'dd MMM yyyy') : 'N/A'}
              </p>
              {org.created_at && (
                <p className="text-xs font-medium text-gray-500 mt-0.5">
                  {formatIST(org.created_at, 'hh:mm a')}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 sm:px-8">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400">
              <RefreshCcw className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Last Updated</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {org.updated_at ? formatIST(org.updated_at, 'dd MMM yyyy') : 'N/A'}
              </p>
              {org.updated_at && (
                <p className="text-xs font-medium text-gray-500 mt-0.5">
                  {formatIST(org.updated_at, 'hh:mm a')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky Tabs ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 mt-0 -mx-0">
        <div className="flex items-center gap-1 px-1 pt-2">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`relative flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all rounded-t-xl ${
                activeTab === tab.key
                  ? 'text-violet-600 dark:text-violet-400 bg-violet-50/60 dark:bg-violet-900/20'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-t-full bg-indigo-600" />
              )}
            </button>
          ))}
        </div>
      </div>

            {/* ── Overview Tab ────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="pt-6 grid grid-cols-1 gap-6 md:grid-cols-3">

          {/* Contact & Identity */}
          <div className="rounded-[1.5rem] border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-gray-50/50 dark:bg-gray-800/20 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 shadow-inner">
                  <Mail className="h-4.5 w-4.5" style={{ height: 18, width: 18 }} />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">Contact & Identity</h3>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col gap-5">
              {org.email && (
                <div className="group flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/20 transition-colors">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">Email Address</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{org.email}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="group flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/20 transition-colors">
                  <Fingerprint className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">Organization ID</p>
                  <p className="text-xs font-mono font-medium text-gray-500 dark:text-gray-400 truncate" title={org.id}>{org.id}</p>
                </div>
              </div>
              {domain && (
                <div className="group flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/20 transition-colors">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">Business Domain</p>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200/50 dark:border-indigo-500/20 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-400">
                      {domain.name}
                    </span>
                  </div>
                </div>
              )}
              {org.phone && (
                <div className="group flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/20 transition-colors">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">Phone Number</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{org.phone}</p>
                  </div>
                </div>
              )}
              {[org.headquarters_address_1, org.headquarters_address_2, org.city, org.state, org.postal_code, org.country].some(Boolean) && (
                <div className="group flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/20 transition-colors">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">Headquarters Address</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-relaxed">
                      {[org.headquarters_address_1, org.headquarters_address_2].filter(Boolean).join(', ')}
                      <br />
                      {[org.city, org.state, org.postal_code].filter(Boolean).join(', ')}
                      <br />
                      {org.country}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Locale & Region */}
          <div className="rounded-[1.5rem] border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-gray-50/50 dark:bg-gray-800/20 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 shadow-inner">
                  <Globe2 className="h-4.5 w-4.5" style={{ height: 18, width: 18 }} />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">Locale & Region</h3>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col gap-5">
              <div className="group flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/20 transition-colors">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">Timezone</p>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{org.timezone || 'Not set'}</p>
                </div>
              </div>

              <div className="group flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/20 transition-colors">
                  <DollarSign className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">Currency Code</p>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{org.currency_code || 'Not set'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-[1.5rem] border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-gray-50/50 dark:bg-gray-800/20 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 shadow-inner">
                  <Calendar className="h-4.5 w-4.5" style={{ height: 18, width: 18 }} />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">Lifecycle & Timeline</h3>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col gap-6 relative">
              {/* Vertical connecting line */}
              <div className="absolute left-[39px] top-10 bottom-10 w-0.5 bg-gray-100 dark:bg-gray-800/80 rounded-full" />
              
              {org.created_at && (
                <div className="relative z-10 flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 ring-4 ring-white dark:ring-gray-900">
                    <Calendar className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1 pt-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-500 mb-0.5">Created At</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{formatIST(org.created_at, 'dd MMM yyyy')}</p>
                    <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-0.5">{formatIST(org.created_at, 'h:mm a')}</p>
                  </div>
                </div>
              )}
              {org.updated_at && (
                <div className="relative z-10 flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 ring-4 ring-white dark:ring-gray-900">
                    <RefreshCcw className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1 pt-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-500 mb-0.5">Last Updated</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{formatDistanceToNow(new Date(org.updated_at), { addSuffix: true })}</p>
                    <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-0.5">{formatIST(org.updated_at, 'dd MMM yyyy, h:mm a')}</p>
                  </div>
                </div>
              )}
              {org.deleted_at && (
                <div className="relative z-10 flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-500 ring-4 ring-white dark:ring-gray-900">
                    <Archive className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1 pt-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-500 mb-0.5">Archived At</p>
                    <p className="text-sm font-bold text-rose-700 dark:text-rose-400">{formatIST(org.deleted_at, 'dd MMM yyyy')}</p>
                    <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-0.5">{formatIST(org.deleted_at, 'h:mm a')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Platform Stats */}
          <div className="rounded-[1.5rem] border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-gray-50/50 dark:bg-gray-800/20 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 shadow-inner">
                  <Zap className="h-4.5 w-4.5" style={{ height: 18, width: 18 }} />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">Organization Stats</h3>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col gap-6">
              <div className="flex items-center gap-5 p-4 rounded-xl bg-violet-50/50 dark:bg-violet-900/10 border border-violet-100/50 dark:border-violet-800/30">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                  <GitBranch className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Business Units</p>
                  <div className="flex items-center gap-3">
                    <span className={`text-3xl font-black ${(org.business_units_count ?? 0) > 0 ? 'text-violet-700 dark:text-violet-400' : 'text-gray-400'}`}>
                      {org.business_units_count ?? 0}
                    </span>
                    {(org.business_units_count ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-violet-600 bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400 rounded-full px-2.5 py-1">
                        <Activity className="h-3 w-3" /> Active
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {isProtected && (
                <div className="flex items-start gap-3 rounded-xl border border-orange-200/60 dark:border-orange-800/50 bg-orange-50/80 dark:bg-orange-900/15 p-4 shadow-sm">
                  <ShieldAlert className="h-5 w-5 text-orange-600 dark:text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-orange-800 dark:text-orange-400">Archive Protected</p>
                    <p className="text-xs text-orange-700/80 dark:text-orange-300/70 mt-1 leading-relaxed font-medium">Has <strong className="text-orange-700 dark:text-orange-300">{org.business_units_count} active</strong> Business Unit(s). Remove all BUs before archiving.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      )}
            {/* ── Settings Tab ────────────────────────────────────────────────────── */}
      {activeTab === 'settings' && (
        org.settings ? (
          <div className="pt-6 space-y-6">

            {/* Branding */}
            <div className="rounded-[1.5rem] border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 shadow-sm overflow-hidden flex flex-col">
              <div className="bg-gray-50/50 dark:bg-gray-800/20 px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400 shadow-inner">
                    <Palette className="h-4.5 w-4.5" style={{ height: 18, width: 18 }} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">Branding</h3>
                </div>
                <Link to={`/platform/organizations/${org.id}/settings`} className="inline-flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <Edit2 className="h-3 w-3" /> Edit
                </Link>
              </div>
              <div className="p-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
                {/* Logo */}
                <div className="group flex items-start gap-4">
                  {org.logo_url ? (
                    <img src={org.logo_url} alt="Logo" className="h-12 w-12 shrink-0 rounded-xl object-contain bg-white border-2 border-gray-100 dark:border-gray-800 shadow-sm transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-sm transition-transform group-hover:scale-105">
                      <Palette className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">Logo</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{org.logo_url ? 'Custom Uploaded' : 'Default Initials'}</p>
                  </div>
                </div>
                

                
                {/* Domain */}
                <div className="group flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 shadow-sm transition-colors group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40">
                    <Globe2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">Active Domain</p>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm font-bold text-gray-800 dark:text-gray-200">{org.settings.custom_domain || 'Not configured'}</p>
                        {org.settings.custom_domain && (
                          <>
                            <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                              org.settings.domain_status === 'verified' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' :
                              org.settings.domain_status === 'failed' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' :
                              'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                            }`}>
                              Domain: {org.settings.domain_status || 'pending'}
                            </span>
                            <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                              org.settings.ssl_status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' :
                              org.settings.ssl_status === 'failed' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' :
                              'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                            }`}>
                              SSL: {org.settings.ssl_status || 'pending'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <p className="text-xs font-medium text-gray-500 mt-1">
                      {org.settings.custom_domain ? 'Custom domain linked' : 'Default workspace domain'}
                    </p>
                  </div>
                </div>



              </div>
            </div>

            {/* Security & Compliance */}
            <div className="rounded-[1.5rem] border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 shadow-sm overflow-hidden flex flex-col">
              <div className="bg-gray-50/50 dark:bg-gray-800/20 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 shadow-inner">
                    <ShieldCheck className="h-4.5 w-4.5" style={{ height: 18, width: 18 }} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">Security & Compliance</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <SettingRow icon={Lock} label="Multi-Factor Auth" description="Required for all users" value={org.settings.require_mfa} color="violet" />
                  <SettingRow icon={Activity} label="Audit Logging" description="Track all user actions" value={org.settings.enable_audit_log} color="blue" />
                  <SettingRow icon={Wifi} label="API Access" description="Allow API key generation" value={org.settings.enable_api_access} color="emerald" />
                </div>
                
                {/* Secondary metrics */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                  <div className="group flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 dark:text-amber-400 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40 transition-colors">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">Session Timeout</p>
                      <p className="text-base font-black text-gray-800 dark:text-gray-100">{org.settings.session_timeout_minutes} <span className="text-xs font-semibold text-gray-500">minutes</span></p>
                    </div>
                  </div>
                  
                  <div className="group flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 transition-colors">
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">Max Users Limit</p>
                      <p className="text-base font-black text-gray-800 dark:text-gray-100">
                        {org.settings.max_users ?? <span className="text-emerald-500">Unlimited</span>}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="rounded-[1.5rem] border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 shadow-sm overflow-hidden flex flex-col">
              <div className="bg-gray-50/50 dark:bg-gray-800/20 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400 shadow-inner">
                    <Bell className="h-4.5 w-4.5" style={{ height: 18, width: 18 }} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">Notification Policies</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <SettingRow icon={AlertCircle} label="Login Notifications" description="Alert admins on each new login" value={org.settings.notify_on_login} color="amber" />
                  <SettingRow icon={Zap} label="Data Export Alerts" description="Notify on bulk data exports" value={org.settings.notify_on_data_export} color="blue" />
                </div>
              </div>
            </div>

          </div>
        ) : (<div className="mt-6 flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/20 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/25">
              <Settings className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-base font-bold text-gray-900 dark:text-white">No Settings Configured</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-sm">Settings are typically auto-provisioned when the organization is created.</p>
            </div>
            <Link
              to={`/platform/organizations/${org.id}/settings`}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <Settings className="h-4 w-4" /> Configure Now
            </Link>
          </div>
        )
      )}

      {/* ── Audit Trail Tab ──────────────────────────────────────────────────────── */}
      {activeTab === 'audit' && (
        <div className="mt-8 animate-[fadeInUp_0.3s_ease-out_both]" style={{ animationDelay: '100ms' }}>
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
                  {org.created_at && (
                    <li className="relative">
                      <div className="absolute -left-[25px] flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 ring-2 ring-white dark:ring-gray-900">
                        <Calendar className="h-3 w-3 text-blue-500" />
                      </div>
                      <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-bold text-gray-900 dark:text-white">Organization Created</span>
                          <time className="text-xs text-gray-400 whitespace-nowrap">
                            {formatIST(org.created_at, 'dd MMM yyyy, HH:mm')}
                          </time>
                        </div>
                        {org.created_by_id && (
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            By user: <span className="font-mono bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-[10px]">{org.created_by_id}</span>
                          </div>
                        )}
                        {org.created_reason && (
                          <div className="mt-2 text-xs text-gray-600 dark:text-gray-300 italic border-l-2 border-blue-200 dark:border-blue-800 pl-2">
                            "{org.created_reason}"
                          </div>
                        )}
                      </div>
                    </li>
                  )}

                  {/* Last Updated event (if different from created) */}
                  {org.updated_at && org.updated_at !== org.created_at && (
                    <li className="relative">
                      <div className="absolute -left-[25px] flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/50 ring-2 ring-white dark:ring-gray-900">
                        <Edit2 className="h-3 w-3 text-violet-500" />
                      </div>
                      <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-bold text-gray-900 dark:text-white">Last Updated</span>
                          <time className="text-xs text-gray-400 whitespace-nowrap">
                            {formatIST(org.updated_at, 'dd MMM yyyy, HH:mm')}
                          </time>
                        </div>
                        {org.updated_by_id && (
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            By user: <span className="font-mono bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-[10px]">{org.updated_by_id}</span>
                          </div>
                        )}
                        {org.updated_reason && (
                          <div className="mt-2 text-xs text-gray-600 dark:text-gray-300 italic border-l-2 border-violet-200 dark:border-violet-800 pl-2">
                            "{org.updated_reason}"
                          </div>
                        )}
                      </div>
                    </li>
                  )}

                  {/* Archived event */}
                  {org.is_deleted && org.deleted_at && (
                    <li className="relative">
                      <div className="absolute -left-[25px] flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/50 ring-2 ring-white dark:ring-gray-900">
                        <Archive className="h-3 w-3 text-rose-500" />
                      </div>
                      <div className="rounded-xl bg-rose-50/50 dark:bg-rose-900/10 px-4 py-3 border border-rose-100 dark:border-rose-900/30">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-bold text-rose-700 dark:text-rose-400">Organization Archived</span>
                          <time className="text-xs text-gray-400 whitespace-nowrap">
                            {formatIST(org.deleted_at, 'dd MMM yyyy, HH:mm')}
                          </time>
                        </div>
                        {org.deleted_by_id && (
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            By user: <span className="font-mono bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-[10px]">{org.deleted_by_id}</span>
                          </div>
                        )}
                        {org.deleted_reason && (
                          <div className="mt-2 text-xs text-rose-600 dark:text-rose-300 italic border-l-2 border-rose-200 dark:border-rose-800 pl-2">
                            "{org.deleted_reason}"
                          </div>
                        )}
                      </div>
                    </li>
                  )}

                  {/* Restored event (if restored_at is set, and it's newer than deleted_at, or if not currently deleted) */}
                  {org.restored_at && (!org.is_deleted || (org.deleted_at && new Date(org.restored_at) > new Date(org.deleted_at))) && (
                    <li className="relative">
                      <div className="absolute -left-[25px] flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 ring-2 ring-white dark:ring-gray-900">
                        <RotateCcw className="h-3 w-3 text-emerald-500" />
                      </div>
                      <div className="rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 px-4 py-3 border border-emerald-100 dark:border-emerald-900/30">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Organization Restored</span>
                          <time className="text-xs text-gray-400 whitespace-nowrap">
                            {formatIST(org.restored_at, 'dd MMM yyyy, HH:mm')}
                          </time>
                        </div>
                        {org.restored_by_id && (
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            By user: <span className="font-mono bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-[10px]">{org.restored_by_id}</span>
                          </div>
                        )}
                        {org.restored_reason && (
                          <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-300 italic border-l-2 border-emerald-200 dark:border-emerald-800 pl-2">
                            "{org.restored_reason}"
                          </div>
                        )}
                      </div>
                    </li>
                  )}
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal (Removed, now using full pages) ── */}

      {/* ── Confirm Dialog (BD-style: accent stripe + icon) ──────────────────── */}
      {confirmDialog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={confirmDialog.type === 'archive' ? 'Confirm archive' : 'Confirm restore'}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => !isConfirming && setConfirmDialog(null)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl ring-1 ring-black/5 overflow-hidden">
            <div className={`h-1 w-full ${confirmDialog.type === 'archive' ? 'bg-gradient-to-r from-rose-500 to-pink-600' : 'bg-gradient-to-r from-emerald-500 to-teal-600'}`} />
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${confirmDialog.type === 'archive' ? 'bg-rose-50 dark:bg-rose-900/30' : 'bg-emerald-50 dark:bg-emerald-900/30'}`}>
                  {confirmDialog.type === 'archive'
                    ? <Archive className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                    : <RotateCcw className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {confirmDialog.type === 'archive' ? 'Archive Organization' : 'Restore Organization'}
                  </h2>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {confirmDialog.type === 'archive'
                      ? <><span>Archive </span><strong className="text-gray-900 dark:text-white">"{org.name}"</strong><span>? Associated Business Units will be suspended. You can restore it later.</span></>
                      : <><span>Restore </span><strong className="text-gray-900 dark:text-white">"{org.name}"</strong><span>? Access will be reinstated for all associated users and Business Units.</span></>
                    }
                  </p>
                </div>
              </div>

              {/* Enterprise Audit: Reason Input */}
              <div className="mt-4 border border-gray-200 dark:border-gray-800 rounded-xl p-3 bg-gray-50/50 dark:bg-gray-900/50">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Reason for Action (Optional)
                </label>
                <input
                  type="text"
                  value={confirmReason}
                  onChange={e => setConfirmReason(e.target.value)}
                  placeholder="e.g. Requested by compliance team"
                  className="w-full text-sm rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 transition-colors py-2"
                  disabled={isConfirming}
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setConfirmDialog(null);
                    setConfirmReason('');
                  }}
                  disabled={isConfirming}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={executeConfirm}
                  disabled={isConfirming}
                  className={`inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed ${
                    confirmDialog.type === 'archive'
                      ? 'bg-gradient-to-r from-rose-500 to-pink-600 focus:ring-rose-500'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 focus:ring-emerald-500'
                  }`}
                >
                  {isConfirming
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
                    : confirmDialog.type === 'archive'
                      ? <><Archive className="h-4 w-4" /> Archive</>
                      : <><RotateCcw className="h-4 w-4" /> Restore</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationDetailPage;
