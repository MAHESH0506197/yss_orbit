import { useTranslation } from 'react-i18next';
// src/pages/businessUnit/BusinessUnitModulesPage.tsx
// Business Unit Module Subscription & Access Management
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useBusinessUnit } from '@/features/organization/businessUnit/hooks/useBusinessUnits';
import {
  Package, LayoutDashboard, Users, Clock, CalendarOff, Wallet,
  UserPlus, TrendingUp, ShoppingCart, Receipt, Heart, Pill,
  ClipboardList, Bell, Webhook, Building, BarChart3,
  CheckCircle2, XCircle, AlertTriangle, Loader2,
  RefreshCcw, ChevronDown, Info, Lock, Unlock,
  ArrowLeft, Search, X, Settings,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { formatIST } from '@/utils/date';
import {
  businessUnitModuleApi,
  BusinessUnitModule,
  ModuleStatus,
} from '@/features/organization/businessUnit/api/businessUnitModuleApi';

// ─── Icon map (Lucide icon name → component) ─────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Users, Clock, CalendarOff, Wallet, UserPlus, TrendingUp,
  ShoppingCart, Package, Receipt, Heart, Pill, ClipboardList, Bell, Webhook,
  Building, BarChart3,
};

function ModuleIcon({ name, size = 20 }: { name: string; size?: number }) {
  const Icon = ICON_MAP[name] ?? Package;
  return <Icon size={size} />;
}

// ─── Status badge ─────────────────────────────────────────────────────────

const STATUS_META: Record<ModuleStatus, { label: string; color: string; bg: string }> = {
  active:          { label: 'Active',          color: '#10b981', bg: '#ecfdf5' },
  trial:           { label: 'Trial',           color: '#3b82f6', bg: '#eff6ff' },
  suspended:       { label: 'Suspended',       color: '#f59e0b', bg: '#fffbeb' },
  expired:         { label: 'Expired',         color: '#ef4444', bg: '#fef2f2' },
  not_subscribed:  { label: 'Not Activated',   color: '#9ca3af', bg: '#f3f4f6' },
};

function StatusBadge({ status }: { status: ModuleStatus }) {
  const { t } = useTranslation();
  const meta = STATUS_META[status] ?? STATUS_META.not_subscribed;
  return (
    <span style={{ color: meta.color, background: meta.bg }}
      className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full">
      <span style={{ background: meta.color }} className="w-1.5 h-1.5 rounded-full inline-block" />
      {meta.label}
    </span>
  );
}

// ─── Category colours ─────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, { bg: string; border: string; icon: string }> = {
  CORE:         { bg: '#f0fdf4', border: '#86efac', icon: '#10b981' },
  HRMS:         { bg: '#eff6ff', border: '#93c5fd', icon: '#3b82f6' },
  BUSINESS:     { bg: '#fdf4ff', border: '#d8b4fe', icon: '#8b5cf6' },
  ANALYTICS:    { bg: '#fff7ed', border: '#fdba74', icon: '#f59e0b' },
  INTEGRATIONS: { bg: '#f0f9ff', border: '#7dd3fc', icon: '#0ea5e9' },
  FINANCE:      { bg: '#eef2ff', border: '#a5b4fc', icon: '#6366f1' },
};

// ─── KPI stat card ────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color }: {
  label: string; value: number | string; icon: React.ReactNode; color: string;
}) {
  return (
    <div className="rounded-2xl p-4 border flex items-center gap-3 transition-all duration-200 hover:scale-[1.01]"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
      <div className="rounded-xl p-2.5" style={{ background: color + '22' }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <div className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>{value}</div>
        <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{label}</div>
      </div>
    </div>
  );
}

// ─── Module Card ─────────────────────────────────────────────────────────

function ModuleCard({
  bum, onActivate, onDeactivate, loading,
}: {
  bum: BusinessUnitModule;
  onActivate: (code: string) => void;
  onDeactivate: (code: string) => void;
  loading: boolean;
}) {
  const { t } = useTranslation();
  const code = bum.module.code;
  const isActive = bum.is_active;
  const hasDeps = bum.module.depends_on.length > 0;
  const FALLBACK_CAT = { bg: '#fdf4ff', border: '#d8b4fe', icon: '#8b5cf6' } as const;
  const cat = (CATEGORY_COLORS[bum.module.category] ?? FALLBACK_CAT) as { bg: string; border: string; icon: string };
  const isFree = bum.module.is_free;
  const hasPlanLimit = Object.keys(bum.plan_limit ?? {}).length > 0;

  return (
    <div
      className="rounded-2xl border p-4 flex flex-col gap-3 transition-all duration-200 hover:shadow-md"
      style={{
        background: isActive ? cat.bg : 'var(--card)',
        borderColor: isActive ? cat.border : 'var(--border)',
        opacity: loading ? 0.7 : 1,
      }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl p-2" style={{ background: cat.icon + '22' }}>
            <span style={{ color: cat.icon }}>
              <ModuleIcon name={bum.module.icon} size={18} />
            </span>
          </div>
          <div>
            <div className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
              {bum.module.name}
            </div>
            <div className="text-[11px] font-mono" style={{ color: 'var(--muted-foreground)' }}>
              {code}
            </div>
          </div>
        </div>
        <StatusBadge status={bum.status as ModuleStatus} />
      </div>

      {/* Description */}
      <p className="text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
        {bum.module.description}
      </p>

      {/* Dependency warning */}
      {hasDeps && (
        <div className="flex items-start gap-1.5 rounded-lg px-2 py-1.5 text-xs"
          style={{ background: '#fef9c3', color: '#854d0e' }}>
          <AlertTriangle size={12} className="mt-0.5 shrink-0" />
          <span>{t('auto.requires', 'Requires:')} <strong>{bum.module.depends_on.join(', ')}</strong></span>
        </div>
      )}

      {/* Plan limit (if overridden) */}
      {hasPlanLimit && (
        <div className="text-xs rounded-lg px-2 py-1.5"
          style={{ background: '#f0f9ff', color: '#0369a1' }}>
          <span className="font-semibold">{t('auto.custom_limits', 'Custom limits:')} </span>
          {Object.entries(bum.plan_limit).map(([k, v]) => (
            <span key={k}>{k}={String(v)} </span>
          ))}
        </div>
      )}

      {/* Trial/expiry info */}
      {bum.trial_ends_at && (
        <div className="text-xs" style={{ color: '#6b7280' }}>
          {t('auto.trial_ends', 'Trial ends:')} <strong>{formatIST(new Date(bum.trial_ends_at), 'PPP')}</strong>
        </div>
      )}

      {/* Action */}
      <div className="flex items-center justify-between mt-auto pt-1">
        {isFree && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: '#dcfce7', color: '#15803d' }}>
            {t('auto.always_free', 'Always free')}
          </span>
        )}
        <div className="ml-auto">
          <PermissionGate
            permission={isActive ? 'business_unit.businessunitmodule.deactivate' : 'business_unit.businessunitmodule.activate'}>
            <button
              onClick={() => isActive ? onDeactivate(code) : onActivate(code)}
              disabled={loading || isFree}
              title={isFree ? 'This module is always included and cannot be deactivated' : undefined}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              style={isActive
                ? { background: '#fee2e2', color: '#dc2626' }
                : { background: cat.icon + '22', color: cat.icon }}>
              {loading
                ? <Loader2 size={12} className="animate-spin" />
                : isActive
                  ? <><Lock size={12} /> {t('auto.deactivate', 'Deactivate')}</>
                  : <><Unlock size={12} /> {t('auto.activate', 'Activate')}</>}
            </button>
          </PermissionGate>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────

const CATEGORY_ORDER = ['CORE', 'HRMS', 'BUSINESS', 'ANALYTICS', 'FINANCE', 'INTEGRATIONS'];
const CATEGORY_LABELS: Record<string, string> = {
  CORE: 'Platform Core',
  HRMS: 'Human Resources',
  BUSINESS: 'Business Operations',
  ANALYTICS: 'Analytics & Reporting',
  FINANCE: 'Finance',
  INTEGRATIONS: 'Integrations',
};

export default function BusinessUnitModulesPage() {
  const { buId } = useParams<{ buId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Fetch BU details for breadcrumb name
  const { data: buData } = useBusinessUnit(buId ?? '');
  const buName = buData?.name ?? 'Business Unit';

  const [modules, setModules] = useState<BusinessUnitModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // module code being toggled
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<ModuleStatus | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const fetchModules = useCallback(async () => {
    if (!buId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await businessUnitModuleApi.list(buId);
      setModules(data);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Failed to load modules.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [buId]);

  useEffect(() => { fetchModules(); }, [fetchModules]);

  const handleActivate = useCallback(async (code: string) => {
    if (!buId) return;
    setActionLoading(code);
    try {
      const updated = await businessUnitModuleApi.activate(buId, { module_code: code });
      setModules(prev => prev.map(m => m.module.code === code ? updated : m));
      toast.success(`'${updated.module.name}' activated.`);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string; message?: string } } })
        ?.response?.data;
      toast.error(detail?.detail ?? detail?.message ?? 'Activation failed.');
    } finally {
      setActionLoading(null);
    }
  }, [buId]);

  const handleDeactivate = useCallback(async (code: string) => {
    if (!buId) return;
    setActionLoading(code);
    try {
      const updated = await businessUnitModuleApi.deactivate(buId, code);
      setModules(prev => prev.map(m => m.module.code === code ? updated : m));
      toast.success(`'${updated.module.name}' deactivated.`);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string; message?: string } } })
        ?.response?.data;
      toast.error(detail?.detail ?? detail?.message ?? 'Deactivation failed.');
    } finally {
      setActionLoading(null);
    }
  }, [buId]);

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:       modules.length,
    active:      modules.filter(m => m.is_active).length,
    trial:       modules.filter(m => m.status === 'trial').length,
    suspended:   modules.filter(m => m.status === 'suspended').length,
    notActive:   modules.filter(m => !m.is_active).length,
  }), [modules]);

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...modules];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(m =>
        m.module.name.toLowerCase().includes(q) ||
        m.module.code.toLowerCase().includes(q) ||
        m.module.description.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== 'all') list = list.filter(m => m.status === filterStatus);
    if (filterCategory !== 'all') list = list.filter(m => m.module.category === filterCategory);
    return list;
  }, [modules, search, filterStatus, filterCategory]);

  // ── Group by category ──────────────────────────────────────────────────────
  const grouped = useMemo(() => {
    const map = new Map<string, BusinessUnitModule[]>();
    for (const m of filtered) {
      const cat = m.module.category;
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(m);
    }
    return CATEGORY_ORDER.filter(c => map.has(c)).map(c => ({
      category: c,
      label: CATEGORY_LABELS[c] ?? c,
      items: map.get(c)!,
    }));
  }, [filtered]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="max-w-6xl mx-auto p-6 space-y-6">

        {/* Enhanced breadcrumb header */}
        <div className="flex items-start gap-4">
          <div className="flex-1">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-sm mb-2" aria-label="Breadcrumb">
              <Link
                to="/platform/business-units"
                className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium"
              >
                Business Units
              </Link>
              <span className="text-gray-300 dark:text-gray-600">/</span>
              <Link
                to={`/platform/business-units/${buId}`}
                className="text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 dark:text-gray-400 transition-colors font-semibold truncate max-w-[160px]"
              >
                {buName}
              </Link>
              <span className="text-gray-300 dark:text-gray-600">/</span>
              <span className="text-gray-900 dark:text-white font-bold">Modules</span>
            </nav>
            <h1 className="text-2xl font-extrabold" style={{ color: 'var(--foreground)' }}>
              {t('auto.module_subscriptions', 'Module Subscriptions')}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              {t('auto.activate_and_manage_the_platform_modules_available', 'Activate and manage the platform modules available to this Business Unit.')}
            </p>
          </div>
          <button onClick={fetchModules} disabled={loading}
            className="ml-auto p-2 rounded-xl transition hover:opacity-70 disabled:opacity-40 mt-1"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            title="Refresh modules"
          >
            <RefreshCcw size={15} className={loading ? 'animate-spin' : ''} style={{ color: 'var(--muted-foreground)' }} />
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label={t('auto.total_modules', 'Total Modules')}    value={stats.total}     icon={<Package size={18} />}      color="#6366f1" />
          <StatCard label={t('auto.active', 'Active')}           value={stats.active}    icon={<CheckCircle2 size={18} />} color="#10b981" />
          <StatCard label={t('auto.not_activated', 'Not Activated')}    value={stats.notActive} icon={<XCircle size={18} />}      color="#9ca3af" />
          <StatCard label={t('auto.trial_suspended', 'Trial / Suspended')} value={stats.trial + stats.suspended} icon={<AlertTriangle size={18} />} color="#f59e0b" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--muted-foreground)' }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t('auto.search_modules', 'Search modules…')}
              className="w-full pl-8 pr-8 py-2 text-sm rounded-xl border outline-none focus:ring-2 focus:ring-indigo-400"
              style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100">
                <X size={13} />
              </button>
            )}
          </div>

          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as ModuleStatus | 'all')}
            className="text-sm rounded-xl border px-3 py-2 cursor-pointer outline-none"
            style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}>
            <option value="all">{t('auto.all_statuses', 'All statuses')}</option>
            <option value="active">{t('auto.active', 'Active')}</option>
            <option value="trial">{t('auto.trial', 'Trial')}</option>
            <option value="suspended">{t('auto.suspended', 'Suspended')}</option>
            <option value="expired">{t('auto.expired', 'Expired')}</option>
            <option value="not_subscribed">{t('auto.not_activated', 'Not Activated')}</option>
          </select>

          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="text-sm rounded-xl border px-3 py-2 cursor-pointer outline-none"
            style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}>
            <option value="all">{t('auto.all_categories', 'All categories')}</option>
            {CATEGORY_ORDER.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl border px-4 py-3 flex items-center gap-2 text-sm"
            style={{ background: '#fef2f2', borderColor: '#fca5a5', color: '#dc2626' }}>
            <AlertTriangle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && modules.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="rounded-2xl border h-40 animate-pulse"
                style={{ background: 'var(--card)', borderColor: 'var(--border)' }} />
            ))}
          </div>
        )}

        {/* Module groups */}
        {!loading && grouped.length === 0 && (
          <div className="text-center py-16 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {t('auto.no_modules_match_your_filters', 'No modules match your filters.')}
          </div>
        )}

        {grouped.map(group => (
          <section key={group.category}>
            <h2 className="text-sm font-bold mb-3 uppercase tracking-widest"
              style={{ color: 'var(--muted-foreground)' }}>
              {group.label}
              <span className="ml-2 font-normal normal-case tracking-normal">
                ({group.items.filter(m => m.is_active).length}/{group.items.length} {t('auto.active', 'active)')}
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.items.map(bum => (
                <ModuleCard
                  key={bum.module.code}
                  bum={bum}
                  onActivate={handleActivate}
                  onDeactivate={handleDeactivate}
                  loading={actionLoading === bum.module.code}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
