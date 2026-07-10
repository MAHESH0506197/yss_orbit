// src/features/platform/apiKeys/ApiKeysPage.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Enterprise API Consumer Keys — v3.0 Golden Standard
//  ✅ PageHeader with breadcrumbs + gradient icon
//  ✅ 4 StatCard KPIs (Total / Active / Expired / Revoked)
//  ✅ Security warning banner (rotate every 90 days)
//  ✅ Table: Name, Prefix (masked), Scopes (chips), Status, Expires, Last Used, Actions
//  ✅ CopyButton on key prefix
//  ✅ DropdownMenu: Rotate, Revoke, Delete, Copy
//  ✅ "Generate New Key" modal: Name, Scopes, Expiry
//  ✅ Premium empty state with shield icon
//  ✅ Expiry warning badges (amber < 7 days, rose expired)
//  ✅ Full dark mode support
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo } from 'react';
import {
  Key, Plus, Shield, Clock, CheckCircle2, XCircle,
  AlertTriangle, MoreHorizontal, Copy, RotateCcw,
  Trash2, Eye, EyeOff, X, Lock, ChevronDown,
  Check, Calendar, Zap, Globe, Code, RefreshCcw,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { CopyButton } from '@/components/ui/CopyButton';
import toast from 'react-hot-toast';
import { formatIST } from '@/utils/date';

// ─── Types ────────────────────────────────────────────────────────────────────
type KeyStatus = 'active' | 'expired' | 'revoked' | 'rotating';

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  full_key?: string;
  scopes: string[];
  status: KeyStatus;
  created_at: string;
  expires_at: string | null;
  last_used_at: string | null;
  created_by: string;
}

// ─── Mock data (ready for API wiring) ────────────────────────────────────────
const MOCK_KEYS: ApiKey[] = [
  {
    id: '1',
    name: 'Production Integration',
    prefix: 'sk_live_4xKj9',
    scopes: ['read:all', 'write:users', 'webhook'],
    status: 'active',
    created_at: '2024-01-15',
    expires_at: '2025-01-15',
    last_used_at: '2025-06-30',
    created_by: 'admin@company.com',
  },
  {
    id: '2',
    name: 'Staging CI/CD Pipeline',
    prefix: 'sk_test_8mPq2',
    scopes: ['read:all', 'write:all'],
    status: 'active',
    created_at: '2024-03-20',
    expires_at: '2025-07-05',
    last_used_at: '2025-06-28',
    created_by: 'devops@company.com',
  },
  {
    id: '3',
    name: 'Legacy Webhook Consumer',
    prefix: 'sk_live_9rTn6',
    scopes: ['webhook'],
    status: 'expired',
    created_at: '2023-06-01',
    expires_at: '2024-06-01',
    last_used_at: '2024-05-20',
    created_by: 'admin@company.com',
  },
  {
    id: '4',
    name: 'Analytics Dashboard',
    prefix: 'sk_live_2aVw7',
    scopes: ['read:analytics', 'read:reports'],
    status: 'revoked',
    created_at: '2024-02-10',
    expires_at: null,
    last_used_at: null,
    created_by: 'ops@company.com',
  },
];

const ALL_SCOPES = ['read:all', 'write:all', 'read:users', 'write:users', 'read:analytics', 'read:reports', 'webhook', 'admin'];
const EXPIRY_OPTIONS = [
  { label: '30 days', value: 30 },
  { label: '60 days', value: 60 },
  { label: '90 days', value: 90 },
  { label: '1 year', value: 365 },
  { label: 'Never', value: -1 },
];

// ─── Status helpers ───────────────────────────────────────────────────────────
const STATUS_META: Record<KeyStatus, { label: string; cls: string; dot: string }> = {
  active:   { label: 'Active',   cls: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500 animate-pulse' },
  expired:  { label: 'Expired',  cls: 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400', dot: 'bg-rose-500' },
  revoked:  { label: 'Revoked',  cls: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400', dot: 'bg-gray-400' },
  rotating: { label: 'Rotating', cls: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400', dot: 'bg-amber-500 animate-pulse' },
};

function getDaysUntilExpiry(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function ExpiryBadge({ expiresAt }: { expiresAt: string | null }) {
  if (!expiresAt) return <span className="text-xs text-gray-400 dark:text-gray-500">Never</span>;
  const days = getDaysUntilExpiry(expiresAt);
  if (days === null) return null;
  if (days < 0) return (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-400">
      <XCircle className="h-2.5 w-2.5" /> Expired
    </span>
  );
  if (days <= 7) return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
      <AlertTriangle className="h-2.5 w-2.5" /> {days}d left
    </span>
  );
  return (
    <span className="text-xs text-gray-500 dark:text-gray-400">
      {formatIST(new Date(expiresAt), 'PPP')}
    </span>
  );
}

// ─── Generate Key Modal ───────────────────────────────────────────────────────
function GenerateKeyModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [expiryDays, setExpiryDays] = useState(90);
  const [loading, setLoading] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleScope = (scope: string) => {
    setSelectedScopes(prev => prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]);
  };

  const handleGenerate = async () => {
    if (!name.trim() || selectedScopes.length === 0) {
      toast.error('Name and at least one scope are required');
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    // Generate mock key (in real app this comes from API)
    const mockKey = `sk_live_${Math.random().toString(36).slice(2, 18)}`;
    setGeneratedKey(mockKey);
    setLoading(false);
    toast.success('API key generated successfully');
  };

  const handleClose = () => {
    setName(''); setSelectedScopes([]); setExpiryDays(90); setGeneratedKey(null);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 shadow-2xl ring-1 ring-black/5 overflow-hidden">
          {/* Accent */}
          <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/20">
                <Key className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-gray-900 dark:text-white">Generate API Key</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">One-time display — save it securely</p>
              </div>
            </div>
            <button onClick={handleClose} className="rounded-xl p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {generatedKey ? (
              /* ── Success state: show key once ──────────────────────────────────── */
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                    <strong>Copy this key now.</strong> It will not be shown again. Store it in a secure secrets manager.
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3">
                  <code className="flex-1 text-xs font-mono text-gray-800 dark:text-gray-200 break-all">{generatedKey}</code>
                  <CopyButton text={generatedKey} />
                </div>
                <button onClick={handleClose} className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white hover:bg-indigo-500 transition-colors">
                  Done
                </button>
              </div>
            ) : (
              /* ── Form ──────────────────────────────────────────────────────────── */
              <>
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Key Name *</label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Production CRM Integration"
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:outline-none transition"
                  />
                </div>

                {/* Scopes */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Permissions / Scopes *</label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_SCOPES.map(scope => (
                      <button
                        key={scope}
                        onClick={() => toggleScope(scope)}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
                          selectedScopes.includes(scope)
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-700'
                        }`}
                      >
                        {selectedScopes.includes(scope) && <Check className="h-3 w-3" />}
                        {scope}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Expiry */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Expiry</label>
                  <div className="flex flex-wrap gap-2">
                    {EXPIRY_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setExpiryDays(opt.value)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                          expiryDays === opt.value
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={handleClose} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={loading || !name.trim() || selectedScopes.length === 0}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-blue-500/20 hover:shadow-blue-500/40 disabled:opacity-50 transition-all"
                  >
                    {loading ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                    Generate Key
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>(MOCK_KEYS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());

  const toggleReveal = (id: string) => {
    setRevealedKeys(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleRevoke = (id: string) => {
    setKeys(prev => prev.map(k => k.id === id ? { ...k, status: 'revoked' as KeyStatus } : k));
    toast.success('API key revoked');
  };

  const handleDelete = (id: string) => {
    setKeys(prev => prev.filter(k => k.id !== id));
    toast.success('API key deleted');
  };

  const stats = useMemo(() => ({
    total:   keys.length,
    active:  keys.filter(k => k.status === 'active').length,
    expired: keys.filter(k => k.status === 'expired').length,
    revoked: keys.filter(k => k.status === 'revoked').length,
  }), [keys]);

  const expiringCount = useMemo(() =>
    keys.filter(k => {
      if (k.status !== 'active' || !k.expires_at) return false;
      const days = getDaysUntilExpiry(k.expires_at);
      return days !== null && days <= 7 && days >= 0;
    }).length, [keys]
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pb-24">

      {/* ── Page Header ─────────────────────────────────────────────────────────── */}
      <PageHeader
        icon={Key}
        iconGradient="from-blue-500 via-indigo-500 to-violet-500"
        title="API Consumer Keys"
        subtitle="Manage platform-wide API keys for third-party integrations, webhook consumers, and programmatic access."
        countBadge={stats.total}
        breadcrumbs={[
          { label: 'Platform' },
          { label: 'API Keys' },
        ]}
        actions={
          <button
            onClick={() => setIsModalOpen(true)}
            className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/40"
          >
            <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
            Generate New Key
          </button>
        }
      />

      {/* ── KPI StatCards ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Keys"  value={stats.total}   icon={Key}          gradient="bg-gradient-to-br from-blue-500 to-indigo-600" />
        <StatCard label="Active"      value={stats.active}  icon={CheckCircle2} gradient="bg-gradient-to-br from-emerald-500 to-teal-600" />
        <StatCard label="Expired"     value={stats.expired} icon={Clock}        gradient="bg-gradient-to-br from-rose-500 to-red-600" />
        <StatCard label="Revoked"     value={stats.revoked} icon={XCircle}      gradient="bg-gradient-to-br from-gray-400 to-gray-600" />
      </div>

      {/* ── Security Warning Banner ──────────────────────────────────────────────── */}
      {expiringCount > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
              {expiringCount} key{expiringCount > 1 ? 's' : ''} expiring soon
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              Rotate keys that are expiring within 7 days to avoid service disruptions.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-start gap-3 rounded-2xl border border-blue-200 dark:border-blue-800/60 bg-blue-50 dark:bg-blue-900/20 p-4">
        <Shield className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
          <strong>Security best practice:</strong> API keys grant programmatic access to your platform. Rotate keys every 90 days and use the minimum required scopes.
        </p>
      </div>

      {/* ── Keys Table ────────────────────────────────────────────────────────────── */}
      <div className="rounded-[1.5rem] border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">

        {keys.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-100 dark:ring-blue-500/20 mb-5">
              <Shield className="h-9 w-9 text-blue-500 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mb-2">No API Keys Generated</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6 leading-relaxed">
              Create an API key to securely authenticate external applications and programmatic requests to the YSS Orbit Platform.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
              Generate First Key
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left" role="grid" aria-label="API Consumer Keys">
              <thead className="sticky top-0 z-20 bg-gradient-to-r from-violet-700 via-purple-700 to-fuchsia-700 text-white shadow-md">
                <tr className="divide-x divide-dashed divide-white/20">
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Key Name</th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Prefix</th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Scopes</th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Status</th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Expires</th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Last Used</th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {keys.map(apiKey => {
                  const meta = STATUS_META[apiKey.status];
                  const revealed = revealedKeys.has(apiKey.id);
                  return (
                    <tr
                      key={apiKey.id}
                      className="group transition-colors hover:bg-blue-50/30 dark:hover:bg-blue-900/10 divide-x divide-dashed divide-gray-100 dark:divide-gray-800"
                    >
                      {/* Name */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-200 dark:border-blue-800">
                            <Key className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-[14px] font-bold text-gray-900 dark:text-white">{apiKey.name}</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500">by {apiKey.created_by}</p>
                          </div>
                        </div>
                      </td>

                      {/* Prefix */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">
                            {revealed ? (apiKey.full_key ?? apiKey.prefix + '•••••••••••') : apiKey.prefix + '•••••'}
                          </code>
                          <button
                            onClick={() => toggleReveal(apiKey.id)}
                            className="rounded-lg p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title={revealed ? 'Hide' : 'Reveal'}
                          >
                            {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                          <CopyButton text={apiKey.prefix} />
                        </div>
                      </td>

                      {/* Scopes */}
                      <td className="px-4 py-3.5 max-w-[200px]">
                        <div className="flex flex-wrap gap-1">
                          {apiKey.scopes.slice(0, 3).map(scope => (
                            <span key={scope} className="inline-block rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-400">
                              {scope}
                            </span>
                          ))}
                          {apiKey.scopes.length > 3 && (
                            <span className="text-[10px] text-gray-400 dark:text-gray-500">+{apiKey.scopes.length - 3}</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${meta.cls}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </span>
                      </td>

                      {/* Expires */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <ExpiryBadge expiresAt={apiKey.expires_at} />
                      </td>

                      {/* Last Used */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {apiKey.last_used_at ? (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatIST(new Date(apiKey.last_used_at), 'PPP')}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500 italic">Never</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                aria-label={`Actions for ${apiKey.name}`}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuLabel className="text-xs truncate max-w-[160px]">{apiKey.name}</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(apiKey.prefix); toast.success('Prefix copied'); }}>
                                <Copy className="h-4 w-4 mr-2 text-gray-400" /> Copy Prefix
                              </DropdownMenuItem>
                              {apiKey.status === 'active' && (
                                <>
                                  <DropdownMenuItem onClick={() => toast('Key rotation coming soon', { icon: '🔄' })}>
                                    <RotateCcw className="h-4 w-4 mr-2 text-gray-400" /> Rotate Key
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleRevoke(apiKey.id)}
                                    className="text-amber-600 dark:text-amber-400"
                                  >
                                    <Lock className="h-4 w-4 mr-2" /> Revoke
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(apiKey.id)}
                                className="text-rose-600 dark:text-rose-400 focus:text-rose-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/30 px-5 py-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                <span className="font-semibold text-gray-700 dark:text-gray-300">{stats.active}</span> active keys · 
                <span className="font-semibold text-gray-700 dark:text-gray-300 ml-1">{stats.expired}</span> expired · 
                <span className="font-semibold text-gray-700 dark:text-gray-300 ml-1">{stats.revoked}</span> revoked
              </p>
              <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" /> Rotate keys every 90 days
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Generate Key Modal ────────────────────────────────────────────────────── */}
      <GenerateKeyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
