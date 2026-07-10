// src/pages/organization/organizationListPage.tsx
// ─────────────────────────────────────────────────────────────────────────────
// ENTERPRISE UI/UX v3.0 — Synced to BusinessDomainPage v3.0 standard
//  ✅ v2.0 features all preserved
//  ✅ NEW: PageHeader component with breadcrumb (Platform Admin > Organizations)
//  ✅ NEW: RefetchBar — top progress indicator during background refetch
//  ✅ NEW: “Last Updated” column in table view
//  ✅ NEW: Responsive filter tabs (native select on xs, button tabs on sm+)
//  ✅ NEW: Unified premium empty state (same in grid + table)
//  ✅ NEW: Screen-reader result count announcement
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Building2, Plus, Edit2, Eye,
  CheckCircle2, XCircle, AlertTriangle, MoreHorizontal,
  Search, X, GitBranch, Check,
  ChevronLeft, ChevronRight, Globe2, Loader2, Mail, Calendar,
  ShieldAlert, Archive, RotateCcw, RefreshCcw, Clock, Phone,
  Trash2, ArrowUpDown,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import {
  useOrganizations,
  useDeleteOrganization,
  useRestoreOrganization,
} from '@/features/organization/hooks/useOrganizations';

import { OrganizationPermanentDeleteModal } from '@/features/organization/components/OrganizationPermanentDeleteModal';
import { useBusinessDomains } from '@/features/organization/businessDomain/api/useBusinessDomains';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { RefetchBar } from '@/components/ui/RefetchBar';
import { CopyButton } from '@/components/ui/CopyButton';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { useViewMode } from '@/hooks/useViewMode';
import { ViewModeToggle } from '@/components/platform/ViewModeToggle';
import { CardGrid } from '@/components/platform/CardGrid';
import { EntityCard } from '@/components/platform/EntityCard';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import type { Organization, OrganizationListParams } from '@/features/organization/types/organizationTypes';
import { getOrganizationStatus } from '@/features/organization/utils/organizationHelpers';
import { EntityAvatar } from '@/components/platform/EntityAvatar';
import { StatusBadge, getEntityStatus } from '@/components/platform/StatusBadge';
import { EmptyState } from '@/components/platform/EmptyState';
import { PageSkeleton } from '@/components/platform/PageSkeleton';
import { formatIST } from '@/utils/date';

const PAGE_SIZE = 20;

// ─── Sort Options ─────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { label: 'Name A→Z',      value: 'name' },
  { label: 'Name Z→A',      value: '-name' },
  { label: 'Newest First',  value: '-created_at' },
  { label: 'Oldest First',  value: 'created_at' },
  { label: 'Active First',  value: '-is_active' },
];

// ─── Types ─────────────────────────────────────────────────────────────────────
type StatusFilter = 'all' | 'active' | 'inactive' | 'deleted' | 'has_bus';

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function OrganizationListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // ── State ───────────────────────────────────────────────────────────────────
  const [page, setPage]                         = useState(1);
  const [statusFilter, setStatusFilter]         = useState<StatusFilter>('all');
  const [domainFilter, setDomainFilter]         = useState('all');
  const [searchInput, setSearchInput]           = useState('');
  const [debouncedSearch, setDebouncedSearch]   = useState('');
  const [isSearching, setIsSearching]           = useState(false);
  const [sortOption, setSortOption]             = useState('name');
  const [isModalOpen, setIsModalOpen]           = useState(false);
  const [selectedOrg, setSelectedOrg]           = useState<Organization | null>(null);
  const [confirmDialog, setConfirmDialog]       = useState<{ type: 'archive' | 'restore'; org: Organization } | null>(null);
  const [confirmReason, setConfirmReason]       = useState('');
  const [permDeleteOrg, setPermDeleteOrg]       = useState<Organization | null>(null);
  const [isConfirming, setIsConfirming]         = useState(false);
  const [selectedIds, setSelectedIds]           = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [viewMode, setViewMode, density, setDensity] = useViewMode('organizations', 'grid');

  // ── Debounced search ────────────────────────────────────────────────────────
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    setIsSearching(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput]);

  // ── API query ────────────────────────────────────────────────────────────────
  const queryParams = useMemo((): OrganizationListParams => {
    const p: OrganizationListParams = { page, page_size: PAGE_SIZE, ordering: sortOption };
    if (debouncedSearch.trim()) p.search = debouncedSearch.trim();
    if (domainFilter !== 'all') p.business_domain_id = domainFilter;
    if (statusFilter === 'active')   { p.is_active = true;  }
    if (statusFilter === 'inactive') { p.is_active = false; }
    if (statusFilter === 'deleted')  { p.is_deleted = true; }
    return p;
  }, [page, statusFilter, domainFilter, debouncedSearch, sortOption]);

  const { data, isLoading, isError, isFetching, refetch } = useOrganizations(queryParams);

  const organizations: Organization[] = useMemo(() => {
    let orgs = data?.results ?? [];
    if (statusFilter === 'has_bus') {
      orgs = orgs.filter(o => (o.business_units_count ?? 0) > 0);
    }
    return orgs;
  }, [data, statusFilter]);

  const meta       = (data as any)?.meta ?? null;
  const totalPages = meta?.total_pages ?? 1;
  const isRefetching = isFetching && !isLoading;

// ── Mutations ────────────────────────────────────────────────────────────────
  const bulkDeleteMutation  = useDeleteOrganization();
  const bulkRestoreMutation = useRestoreOrganization();

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleCreate = useCallback(() => { navigate('/platform/organizations/new'); }, [navigate]);
  const handleEdit   = useCallback((org: Organization) => { navigate(`/platform/organizations/${org.id}/edit`); }, [navigate]);

  const handleFilterClick = useCallback((f: StatusFilter) => {
    setStatusFilter(prev => prev === f ? 'all' : f);
    setPage(1);
    setSelectedIds([]);
  }, []);

  const handleDomainFilterClick = useCallback((domainId: string) => {
    setDomainFilter(domainId);
    setPage(1);
    setSelectedIds([]);
  }, []);

  const clearAllFilters = useCallback(() => {
    setStatusFilter('all');
    setDomainFilter('all');
    setSearchInput('');
    setDebouncedSearch('');
    setPage(1);
    setSelectedIds([]);
  }, []);

  const hasActiveFilters = statusFilter !== 'all' || domainFilter !== 'all' || debouncedSearch.trim().length > 0;

  // ── Confirm action (single) ──────────────────────────────────────────────────
  const executeConfirmAction = async () => {
    if (!confirmDialog) return;
    setIsConfirming(true);
    try {
      if (confirmDialog.type === 'archive') {
        await bulkDeleteMutation.mutateAsync({ id: confirmDialog.org.id, reason: confirmReason });
        toast.success(`"${confirmDialog.org.name}" archived.`);
      } else {
        await bulkRestoreMutation.mutateAsync({ id: confirmDialog.org.id, reason: confirmReason });
        toast.success(`"${confirmDialog.org.name}" restored.`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Action failed. Please try again.');
    } finally {
      setIsConfirming(false);
      setConfirmDialog(null);
      setConfirmReason('');
    }
  };

  // ── Bulk actions ─────────────────────────────────────────────────────────────
  const handleBulkArchive = async () => {
    if (!selectedIds.length) return;
    setIsBulkProcessing(true);
    const targets = organizations.filter(o => selectedIds.includes(o.id) && !o.is_deleted && (o.business_units_count ?? 0) === 0);
    const results = await Promise.allSettled(targets.map(o => bulkDeleteMutation.mutateAsync({ id: o.id, reason: 'Bulk archived' })));
    const failed  = results.filter(r => r.status === 'rejected').length;
    if (failed > 0) toast.error(`${failed} organization(s) failed to archive.`);
    else toast.success(`${targets.length} organization(s) archived.`);
    setSelectedIds([]);
    setIsBulkProcessing(false);
  };

  const handleBulkRestore = async () => {
    if (!selectedIds.length) return;
    setIsBulkProcessing(true);
    const targets = organizations.filter(o => selectedIds.includes(o.id) && o.is_deleted);
    const results = await Promise.allSettled(targets.map(o => bulkRestoreMutation.mutateAsync({ id: o.id, reason: 'Bulk restored' })));
    const failed  = results.filter(r => r.status === 'rejected').length;
    if (failed > 0) toast.error(`${failed} organization(s) failed to restore.`);
    else toast.success(`${targets.length} organization(s) restored.`);
    setSelectedIds([]);
    setIsBulkProcessing(false);
  };

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      // Escape: close confirm dialog
      if (e.key === 'Escape' && confirmDialog && !isConfirming) {
        e.preventDefault();
        setConfirmDialog(null);
        setConfirmReason('');
        return;
      }

      if (isModalOpen || !!confirmDialog) return;
      if (inInput) return;
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        handleCreate();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isModalOpen, confirmDialog, isConfirming, handleCreate]);

  // ── Selection helpers ────────────────────────────────────────────────────────
  const toggleSelect = useCallback((id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id));
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.length === organizations.length) setSelectedIds([]);
    else setSelectedIds(organizations.map(o => o.id));
  }, [selectedIds.length, organizations]);

  // ── Archive protection helper ────────────────────────────────────────────────
  const isArchiveProtected = (o: Organization) =>
    !o.is_deleted && (o.business_units_count ?? 0) > 0;

  // ── Smart bulk selection analysis (MUST be before any early returns) ─────────
  const selectedOrgs          = useMemo(() => organizations.filter(o => selectedIds.includes(o.id)), [organizations, selectedIds]);
  const hasNonDeletedInSel    = selectedOrgs.some(o => !o.is_deleted);
  const hasDeletedInSel       = selectedOrgs.some(o => o.is_deleted);
  const archiveProtectedCount = selectedOrgs.filter(o => !o.is_deleted && (o.business_units_count ?? 0) > 0).length;
  const archivableCount       = selectedOrgs.filter(o => !o.is_deleted && (o.business_units_count ?? 0) === 0).length;
  const totalBU               = useMemo(() => organizations.reduce((s, o) => s + (o.business_units_count ?? 0), 0), [organizations]);

  // ── Loading / Error states (early returns AFTER all hooks) ───────────────────
  if (isLoading) return <PageSkeleton />;

  if (isError) {
    return (
      <div className="p-6 max-w-7xl mx-auto" role="alert">
        <div className="flex items-start gap-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 p-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/40">
            <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h3 className="font-bold text-rose-800 dark:text-rose-300">Failed to load Organizations</h3>
            <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">
              There was a problem fetching data from the server. Please refresh the page or contact support.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700 transition-colors"
            >
              <RefreshCcw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Filter tab definitions with count badges ──────────────────────────────────
  const STATUS_TABS: { label: string; value: StatusFilter; count: number | null }[] = [
    { label: 'All',      value: 'all',      count: meta?.total          ?? null },
    { label: 'Active',   value: 'active',   count: meta?.total_active   ?? null },
    { label: 'Inactive', value: 'inactive', count: meta?.total_inactive ?? null },
    { label: 'Archived', value: 'deleted',  count: meta?.total_deleted  ?? null },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pb-16">

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <PageHeader
        icon={Building2}
        iconGradient="from-violet-500 via-purple-500 to-fuchsia-600"
        title={t('organization.title', 'Organizations')}
        subtitle="Manage secure, multi-tenant workspaces representing distinct legal entities or client companies."
        countBadge={meta?.total}
        countBadgeLabel={`${meta?.total ?? 0} total organizations`}
        actions={
          <PermissionGate permission="organization.organization.create">
            <button
              onClick={handleCreate}
              aria-label="Create new organization (N)"
              title="New Organization (N)"
              className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/40 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:ring-offset-gray-950 whitespace-nowrap"
            >
              <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" aria-hidden="true" />
              New Organization
              <kbd className="hidden sm:inline-flex ml-1 items-center rounded border border-violet-400/40 bg-violet-700/30 px-1.5 py-0.5 font-mono text-[10px] text-violet-200">
                N
              </kbd>
            </button>
          </PermissionGate>
        }
      />

      {/* ── KPI Cards ── 5 cards: Total / Active / Inactive / Archived / BUs ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" role="group" aria-label="Organization statistics filters">
        <StatCard
          label="Total Organizations"
          value={meta?.total ?? organizations.length}
          icon={Building2}
          gradient="bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600"
          onClick={() => handleFilterClick('all')}
          isActive={statusFilter === 'all'}
        />
        <StatCard
          label="Active"
          value={meta?.total_active ?? organizations.filter(o => o.is_active && !o.is_deleted).length}
          icon={CheckCircle2}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          onClick={() => handleFilterClick('active')}
          isActive={statusFilter === 'active'}
        />
        <StatCard
          label="Inactive"
          value={meta?.total_inactive ?? organizations.filter(o => !o.is_active && !o.is_deleted).length}
          icon={XCircle}
          gradient="bg-gradient-to-br from-amber-500 to-orange-500"
          onClick={() => handleFilterClick('inactive')}
          isActive={statusFilter === 'inactive'}
        />
        <StatCard
          label="Archived"
          value={meta?.total_deleted ?? organizations.filter(o => o.is_deleted).length}
          icon={Archive}
          gradient="bg-gradient-to-br from-rose-500 to-pink-600"
          onClick={() => handleFilterClick('deleted')}
          isActive={statusFilter === 'deleted'}
        />
        <StatCard
          label="Business Units"
          value={meta?.total_business_units ?? totalBU}
          icon={GitBranch}
          gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
          subLabel="across all active orgs"
          onClick={() => handleFilterClick('has_bus')}
          isActive={statusFilter === 'has_bus'}
        />
      </div>

      {/* ── Bulk Action Banner — context-aware based on selection state ───────── */}
      {selectedIds.length > 0 && (
        <div
          role="toolbar"
          aria-label={`${selectedIds.length} organization${selectedIds.length !== 1 ? 's' : ''} selected`}
          className="flex flex-wrap items-center gap-3 rounded-2xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 px-5 py-3 shadow-sm animate-[slideDown_0.2s_ease-out_both]"
        >
          <div className="flex items-center gap-2 font-semibold text-violet-700 dark:text-violet-300 text-sm">
            <Check className="h-4 w-4" aria-hidden="true" />
            {selectedIds.length} organization{selectedIds.length !== 1 ? 's' : ''} selected
          </div>

          {/* Protected warning */}
          {archiveProtectedCount > 0 && hasNonDeletedInSel && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-2.5 py-1">
              <ShieldAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {archiveProtectedCount} protected (has BUs)
            </div>
          )}

          <div className="ml-auto flex items-center gap-2">
            {hasNonDeletedInSel && (
              <PermissionGate permission="organization.organization.delete">
                <button
                  onClick={handleBulkArchive}
                  disabled={isBulkProcessing || archivableCount === 0}
                  aria-label={`Archive ${archivableCount} of ${selectedIds.length} selected organizations`}
                  title={archiveProtectedCount > 0 ? `${archiveProtectedCount} org(s) with BUs will be skipped` : undefined}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isBulkProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Archive className="h-3.5 w-3.5" aria-hidden="true" />}
                  Archive{archivableCount < selectedIds.length ? ` (${archivableCount})` : ''}
                </button>
              </PermissionGate>
            )}

            {hasDeletedInSel && (
              <PermissionGate permission="organization.organization.restore">
                <button
                  onClick={handleBulkRestore}
                  disabled={isBulkProcessing}
                  aria-label={`Restore ${selectedOrgs.filter(o => o.is_deleted).length} archived organizations`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isBulkProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />}
                  Restore{selectedOrgs.filter(o => o.is_deleted).length < selectedIds.length ? ` (${selectedOrgs.filter(o => o.is_deleted).length})` : ''}
                </button>
              </PermissionGate>
            )}

            <button
              onClick={() => setSelectedIds([])}
              aria-label="Clear selection"
              className="rounded-xl px-3 py-1.5 text-xs font-bold text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ── Main Data Card ─────────────────────────────────────────────────────── */}
      <OrgDataCard
        organizations={organizations}
        meta={meta}
        totalPages={totalPages}
        page={page}
        setPage={setPage}
        isSearching={isSearching}
        isFetching={isFetching}
        refetch={refetch}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        debouncedSearch={debouncedSearch}
        setDebouncedSearch={setDebouncedSearch}
        statusFilter={statusFilter}
        domainFilter={domainFilter}
        setDomainFilter={handleDomainFilterClick}
        STATUS_TABS={STATUS_TABS}
        handleFilterClick={handleFilterClick}
        hasActiveFilters={hasActiveFilters}
        clearAllFilters={clearAllFilters}
        sortOption={sortOption}
        setSortOption={setSortOption}
        viewMode={viewMode}
        setViewMode={setViewMode}
        density={density}
        setDensity={setDensity}
        selectedIds={selectedIds}
        toggleSelect={toggleSelect}
        toggleSelectAll={toggleSelectAll}
        isArchiveProtected={isArchiveProtected}
        handleEdit={handleEdit}
        handleCreate={handleCreate}
        navigate={navigate}
        setConfirmDialog={setConfirmDialog}
        setPermDeleteOrg={setPermDeleteOrg}
        t={t}
      />

      {/* ── Create/Edit Modal (Removed, now using full pages) ── */}

      {/* ── Confirm Dialog (BD-style: accent stripe + icon) ─────────────────── */}
      {confirmDialog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={confirmDialog.type === 'archive' ? 'Confirm archive' : 'Confirm restore'}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => !isConfirming && setConfirmDialog(null)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            {/* Accent stripe */}
            <div className={`h-1 w-full ${confirmDialog.type === 'archive' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${confirmDialog.type === 'archive' ? 'bg-rose-50 dark:bg-rose-900/30' : 'bg-emerald-50 dark:bg-emerald-900/30'}`}>
                  {confirmDialog.type === 'archive'
                    ? <Archive className="h-5 w-5 text-rose-600 dark:text-rose-400" aria-hidden="true" />
                    : <RotateCcw className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {confirmDialog.type === 'archive' ? 'Archive Organization' : 'Restore Organization'}
                  </h2>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {confirmDialog.type === 'archive'
                      ? <><span>Archive </span><strong className="text-gray-900 dark:text-white">"{confirmDialog.org.name}"</strong><span>? Associated Business Units will be suspended. You can restore it later.</span></>
                      : <><span>Restore </span><strong className="text-gray-900 dark:text-white">"{confirmDialog.org.name}"</strong><span>? Access will be reinstated for all associated users and Business Units.</span></>
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
                  onClick={executeConfirmAction}
                  disabled={isConfirming}
                  aria-label={isConfirming ? 'Processing…' : (confirmDialog.type === 'archive' ? 'Confirm archive' : 'Confirm restore')}
                  className={`inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed ${
                    confirmDialog.type === 'archive'
                      ? 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500'
                      : 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500'
                  }`}
                >
                  {isConfirming
                    ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Processing…</>
                    : confirmDialog.type === 'archive'
                      ? <><Archive className="h-4 w-4" aria-hidden="true" /> Archive</>
                      : <><RotateCcw className="h-4 w-4" aria-hidden="true" /> Restore</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Permanent Delete Modal ────────────────────────────────────────────── */}
      <OrganizationPermanentDeleteModal
        isOpen={!!permDeleteOrg}
        onClose={() => setPermDeleteOrg(null)}
        organization={permDeleteOrg}
        onDeleted={() => setPermDeleteOrg(null)}
      />
    </div>
  );
}

// ─── Data Card sub-component (keeps render section clean) ─────────────────────
function OrgDataCard({
  organizations, meta, totalPages, page, setPage,
  isSearching, isFetching,
  searchInput, setSearchInput, debouncedSearch, setDebouncedSearch,
  statusFilter, domainFilter, setDomainFilter,
  STATUS_TABS, handleFilterClick, hasActiveFilters, clearAllFilters,
  sortOption, setSortOption, refetch,
  viewMode, setViewMode, density, setDensity,
  selectedIds, toggleSelect, toggleSelectAll,
  isArchiveProtected, handleEdit, handleCreate, navigate,
  setConfirmDialog, setPermDeleteOrg, t,
}: {
  organizations: Organization[];
  meta: any;
  totalPages: number;
  page: number;
  setPage: (p: number) => void;
  isSearching: boolean;
  isFetching: boolean;
  refetch: () => void;
  searchInput: string;
  setSearchInput: (v: string) => void;
  debouncedSearch: string;
  setDebouncedSearch: (v: string) => void;
  statusFilter: StatusFilter;
  domainFilter: string;
  setDomainFilter: (v: string) => void;
  STATUS_TABS: { label: string; value: StatusFilter; count: number | null }[];
  handleFilterClick: (f: StatusFilter) => void;
  hasActiveFilters: boolean;
  clearAllFilters: () => void;
  sortOption: string;
  setSortOption: (v: string) => void;
  viewMode: string;
  setViewMode: (m: any) => void;
  density: string;
  setDensity: (d: any) => void;
  selectedIds: string[];
  toggleSelect: (id: string, checked: boolean) => void;
  toggleSelectAll: () => void;
  isArchiveProtected: (o: Organization) => boolean;
  handleEdit: (o: Organization) => void;
  handleCreate: () => void;
  navigate: (to: string) => void;
  setConfirmDialog: (d: { type: 'archive' | 'restore'; org: Organization } | null) => void;
  setPermDeleteOrg: (org: Organization | null) => void;
  t: (k: string, d: string) => string;
}) {
  // ── Domain list for filter dropdown ────────────────────────────────────────
  const { data: domainsData } = useBusinessDomains();

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 shadow-sm">

      {/* RefetchBar — top progress indicator during background refetch */}
      <RefetchBar visible={isFetching} />

      {/* Toolbar */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 px-5 py-3.5">

        {/* Search with spinner */}
        <div className="relative w-full xl:max-w-xs flex-1">
          {isSearching || isFetching
            ? <Loader2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-violet-500 animate-spin pointer-events-none" aria-label="Searching…" />
            : <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" aria-hidden="true" />
          }
          <input
            type="search"
            placeholder={t('organization.search', 'Search organizations…')}
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            aria-label="Search organizations"
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-2.5 pl-10 pr-8 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all hover:border-gray-300 dark:hover:border-gray-600"
          />
          {searchInput && (
            <button
              onClick={() => { setSearchInput(''); setDebouncedSearch(''); }}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {/* Status filter tabs — mobile: native select, desktop: button tabs */}
          <select
            className="sm:hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 py-2 px-3 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-400/20 cursor-pointer"
            value={statusFilter}
            onChange={e => handleFilterClick(e.target.value as StatusFilter)}
            aria-label="Filter by status"
          >
            {STATUS_TABS.map(tab => (
              <option key={tab.value} value={tab.value}>
                {tab.label}{tab.count !== null ? ` (${tab.count})` : ''}
              </option>
            ))}
          </select>

          {/* Desktop: Filter Pills */}
          <div
            className="hidden sm:inline-flex items-center gap-1 bg-gray-50/80 dark:bg-gray-800/40 p-1 rounded-2xl border border-gray-100 dark:border-gray-700/50"
            role="tablist"
            aria-label="Filter by status"
          >
            {STATUS_TABS.map(tab => {
              const isSelected = statusFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  role="tab"
                  aria-selected={isSelected}
                  aria-controls="org-data-panel"
                  onClick={() => handleFilterClick(tab.value)}
                  className={`relative inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-200 ${
                    isSelected
                      ? 'bg-white dark:bg-gray-800 text-violet-700 dark:text-violet-400 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <span className="relative z-10">{tab.label}</span>
                  {tab.count !== null && (
                    <span className={`relative z-10 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      isSelected
                        ? 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300'
                        : 'bg-gray-200/50 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                    }`}>
                      {tab.count > 99 ? '99+' : tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={`inline-flex items-center gap-1.5 rounded-xl border transition-all duration-200 px-3 py-1.5 text-xs font-bold ${
                domainFilter !== 'all'
                  ? 'border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 shadow-sm'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
              }`}>
                <Globe2 className="h-3.5 w-3.5" />
                {domainFilter === 'all'
                  ? 'All Domains'
                  : (domainsData?.results?.find((d: any) => d.id === domainFilter)?.name || 'Domain')
                }
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-xl flex flex-col gap-1">
              <div className="px-3 py-2 mb-1">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Filter by Domain
                </p>
              </div>
              <div className="max-h-[280px] overflow-y-auto pr-1 flex flex-col gap-1">
                <DropdownMenuItem
                  onClick={() => setDomainFilter('all')}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-all cursor-pointer outline-none ${
                    domainFilter === 'all'
                      ? 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-md ${domainFilter === 'all' ? 'bg-violet-100 dark:bg-violet-900/50 text-violet-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                      <Globe2 className="h-3.5 w-3.5" />
                    </div>
                    All Domains
                  </div>
                  {domainFilter === 'all' && <Check className="h-4 w-4 text-violet-600 dark:text-violet-400" />}
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="my-1 border-gray-100 dark:border-gray-800" />
                
                {domainsData?.results?.map((d: any) => (
                  <DropdownMenuItem
                    key={d.id}
                    onClick={() => setDomainFilter(d.id)}
                    className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-all cursor-pointer outline-none ${
                      domainFilter === d.id
                        ? 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`h-2 w-2 rounded-full ${domainFilter === d.id ? 'bg-violet-500 ring-2 ring-violet-200 dark:ring-violet-900' : 'bg-gray-300 dark:bg-gray-600'}`} />
                      {d.name}
                    </div>
                    {domainFilter === d.id && <Check className="h-4 w-4 text-violet-600 dark:text-violet-400" />}
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              aria-label="Clear all filters"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" /> Clear filters
            </button>
          )}

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Sort organizations"
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
              >
                <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                {SORT_OPTIONS.find(o => o.value === sortOption)?.label ?? 'Sort'}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white/95 dark:bg-gray-900/95 p-2 shadow-xl backdrop-blur-xl">
              <div className="mb-1 px-3 py-2">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Sort By
                </p>
              </div>
              <div className="flex flex-col gap-1">
                {SORT_OPTIONS.map(opt => (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => setSortOption(opt.value)}
                    className={`flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors outline-none ${
                      sortOption === opt.value
                        ? 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                  >
                    {opt.label}
                    {sortOption === opt.value && <Check className="h-4 w-4 text-violet-600 dark:text-violet-400" />}
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Refresh list"
            title="Refresh"
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50 shadow-sm"
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>

          <ViewModeToggle viewMode={viewMode as any} setViewMode={setViewMode} density={density as any} setDensity={setDensity} />
        </div>
      </div>

      {/* ── Active Filter Chips ──────────────────────────────────────────────── */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 px-4 pb-3 pt-1">
          {statusFilter !== 'all' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 pl-3 pr-2 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
              Status: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
              <button
                onClick={() => handleFilterClick('all')}
                className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
                aria-label="Remove status filter"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          )}
          {domainFilter !== 'all' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 pl-3 pr-2 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
              Domain: {(domainsData as any)?.results?.find((d: any) => d.id === domainFilter)?.name ?? domainFilter}
              <button
                onClick={() => setDomainFilter('all')}
                className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
                aria-label="Remove domain filter"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          )}
          {debouncedSearch.trim() && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 pl-3 pr-2 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
              Search: &ldquo;{debouncedSearch}&rdquo;
              <button
                onClick={() => { setSearchInput(''); setDebouncedSearch(''); }}
                className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
                aria-label="Remove search filter"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          )}
        </div>
      )}

      <div id="org-data-panel" role="tabpanel" aria-live="polite">

        {/* ── Grid View ────────────────────────────────────────────────────────── */}
        {viewMode === 'grid' ? (
        <CardGrid
          isEmpty={organizations.length === 0}
          emptyState={
            <EmptyState
              title={hasActiveFilters ? 'No Organizations Match' : 'No Organizations Yet'}
              description={hasActiveFilters ? 'Try adjusting your search or status filter.' : 'Create your first Organization to get started.'}
              hasFilters={hasActiveFilters}
              onClear={clearAllFilters}
              onCreate={handleCreate}
              createPermission="organization.organization.create"
              createLabel="Create Organization"
            />
          }
        >
          {organizations.map((org, i) => {
            const isSelected = selectedIds.includes(org.id);
            const protected_ = isArchiveProtected(org);
            const domainName = (domainsData as any)?.results?.find((d: any) => d.id === org.business_domain_id)?.name;
            return (
              <div
                key={org.id}
                className="animate-fadeInUp flex flex-col h-full"
              >
                <EntityCard
                  id={org.id}
                  density={density as any}
                  title={org.name}
                  avatar={<EntityAvatar name={org.name} logoUrl={org.logo_url} size={40} />}
                  statusBadge={<StatusBadge status={getEntityStatus(org.is_deleted, org.is_active)} />}
                  isSelected={isSelected}
                  onSelect={checked => toggleSelect(org.id, checked)}
                  onClick={() => navigate(`/platform/organizations/${org.id}`)}
                  metrics={[
                    { label: 'Domain', value: domainName || 'None', icon: <Globe2 className="h-3.5 w-3.5" /> },
                    { label: 'Business Units', value: org.business_units_count ?? 0, icon: <GitBranch className="h-3.5 w-3.5" /> },
                  ]}
                  actions={[
                    { label: 'View Details', icon: <Eye className="h-4 w-4" />, onClick: () => navigate(`/platform/organizations/${org.id}`) },
                    { label: 'Edit Organization', icon: <Edit2 className="h-4 w-4" />, onClick: () => handleEdit(org) },
                    org.is_deleted
                      ? { label: 'Restore Organization', icon: <RotateCcw className="h-4 w-4" />, onClick: () => setConfirmDialog({ type: 'restore', org }) }
                      : protected_
                        ? { label: `Archive (${org.business_units_count} BU${(org.business_units_count ?? 0) !== 1 ? 's' : ''})`, icon: <ShieldAlert className="h-4 w-4" />, onClick: () => toast.error('Cannot archive: org has active BUs.'), danger: false }
                        : { label: 'Archive Organization', icon: <Archive className="h-4 w-4" />, danger: true, onClick: () => setConfirmDialog({ type: 'archive', org }) },
                    ...(org.is_deleted ? [
                      { label: 'Permanent Delete', icon: <Trash2 className="h-4 w-4" />, danger: true, onClick: () => setPermDeleteOrg(org) }
                    ] : []),
                  ]}
                />
              </div>
            );
          })}
        </CardGrid>
      ) : (
        /* ── Table View ──────────────────────────────────────────────────────── */
        organizations.length === 0 ? (
          <EmptyState
            title={hasActiveFilters ? 'No Organizations Match' : 'No Organizations Yet'}
            description={hasActiveFilters ? 'Try adjusting your search or status filter.' : 'Create your first Organization to get started.'}
            hasFilters={hasActiveFilters}
            onClear={clearAllFilters}
            onCreate={handleCreate}
            createPermission="organization.organization.create"
            createLabel="Create Organization"
          />
        ) : (
          <div className="overflow-auto max-h-[calc(100vh-380px)]">
            <table className="w-full text-sm text-left relative">
              <thead className="sticky top-0 z-20 bg-gradient-to-r from-violet-700 via-purple-700 to-fuchsia-700 text-white shadow-md">
                <tr className="divide-x divide-dashed divide-white/20">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label="Select all organizations on this page"
                      checked={selectedIds.length > 0 && selectedIds.length === organizations.length}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                    />
                  </th>
                  {['Organization', 'Domain', 'Contact', 'Status', 'Assigned BUs', 'Updated', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 border-b border-gray-200 dark:border-gray-800">
                {organizations.map((org, i) => {
                  const isSelected  = selectedIds.includes(org.id);
                  const protected_  = isArchiveProtected(org);
                  const domainName  = (domainsData as any)?.results?.find((d: any) => d.id === org.business_domain_id)?.name;
                  return (
                    <tr
                      key={org.id}
                      className={`transition-colors divide-x divide-dashed divide-gray-200 dark:divide-gray-800 hover:bg-gray-50/70 dark:hover:bg-gray-800/40 ${isSelected ? 'bg-violet-50/80 dark:bg-violet-900/20' : ''}`}
                      style={{ animationDelay: `${i * 30}ms` }}
                    >
                      <td className="w-10 px-4 py-3.5">
                        <input
                          type="checkbox"
                          aria-label={`Select ${org.name}`}
                          checked={isSelected}
                          onChange={e => toggleSelect(org.id, e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                        />
                      </td>
                      {/* Name + slug */}
                      <td className="px-4 py-3.5 min-w-[200px]">
                        <button
                          type="button"
                          onClick={() => navigate(`/platform/organizations/${org.id}`)}
                          aria-label={`View details for ${org.name}`}
                          className="flex items-center gap-3 group text-left hover:text-violet-600 dark:hover:text-violet-400 transition-colors w-full"
                        >
                          <EntityAvatar name={org.name} logoUrl={org.logo_url} size={44} />
                          <div className="min-w-0">
                            <div className="text-[14px] font-bold text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate">
                              {org.name}
                            </div>
                          </div>
                        </button>
                      </td>
                      {/* Domain */}
                      <td className="px-4 py-3.5">
                        {domainName
                          ? <span className="inline-flex items-center gap-1 font-semibold text-[11px] text-indigo-600 bg-indigo-50 border border-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-400 px-2 py-0.5 rounded-full whitespace-nowrap">{domainName}</span>
                          : <span className="text-gray-300 dark:text-gray-600">—</span>
                        }
                      </td>
                      {/* Contact */}
                      <td className="px-4 py-3.5 min-w-[200px]">
                        <div className="flex flex-col gap-1.5">
                          {org.email ? (
                            <a href={`mailto:${org.email}`} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 transition-colors" title={org.email}>
                              <Mail className="h-3.5 w-3.5 shrink-0" />
                              <span>{org.email}</span>
                            </a>
                          ) : (
                            <span className="text-gray-300 dark:text-gray-600">—</span>
                          )}
                          {org.phone ? (
                            <a href={`tel:${org.phone}`} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 transition-colors" title={org.phone}>
                              <Phone className="h-3.5 w-3.5 shrink-0" />
                              <span>{org.phone}</span>
                            </a>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-600">
                              <Phone className="h-3.5 w-3.5 shrink-0 opacity-50" />
                              <span>—</span>
                            </div>
                          )}
                        </div>
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3.5"><StatusBadge status={getEntityStatus(org.is_deleted, org.is_active)} /></td>
                      {/* Business Units */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <GitBranch className="h-3.5 w-3.5 text-violet-400" aria-hidden="true" />
                          <span className={`font-bold tabular-nums ${(org.business_units_count ?? 0) > 0 ? 'text-violet-600 dark:text-violet-400' : 'text-gray-400'}`}>
                            {org.business_units_count ?? 0}
                          </span>
                        </div>
                      </td>
                      {/* Updated */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <Clock className="h-3 w-3 shrink-0 text-violet-400" aria-hidden="true" />
                          {(org as any).updated_at ? formatIST((org as any).updated_at, 'dd MMM yyyy') : '—'}
                        </div>
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex justify-end" onClick={e => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                aria-label={`Actions for ${org.name}`}
                                className="flex h-8 w-8 items-center justify-center rounded-xl border border-transparent text-gray-400 transition-all hover:border-gray-200 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 data-[state=open]:border-gray-200 data-[state=open]:bg-gray-50 data-[state=open]:text-gray-900 data-[state=open]:shadow-sm dark:hover:border-gray-700 dark:hover:bg-gray-800/50 dark:hover:text-white dark:data-[state=open]:border-gray-700 dark:data-[state=open]:bg-gray-800/50 dark:data-[state=open]:text-white"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-60 rounded-2xl border border-gray-100 bg-white/95 p-2 shadow-xl shadow-gray-200/50 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/95 dark:shadow-gray-900/50">
                              <DropdownMenuLabel className="px-2.5 py-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                <span className="block truncate text-violet-600 dark:text-violet-400">{org.name}</span>
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator className="my-1 bg-gray-100 dark:bg-gray-800" />
                              
                              <DropdownMenuItem onClick={() => navigate(`/platform/organizations/${org.id}`)} className="flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900 focus:bg-gray-50 focus:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800/50 dark:hover:text-white dark:focus:bg-gray-800/50 dark:focus:text-white">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                  <Eye className="h-4 w-4" />
                                </div>
                                View Details
                              </DropdownMenuItem>
                              
                              {!org.is_deleted && (
                                <PermissionGate permission="organization.organization.update">
                                  <DropdownMenuItem onClick={() => handleEdit(org)} className="flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium text-violet-700 transition-colors hover:bg-violet-50 hover:text-violet-800 focus:bg-violet-50 focus:text-violet-800 dark:text-violet-400 dark:hover:bg-violet-900/20 dark:hover:text-violet-300 dark:focus:bg-violet-900/20 dark:focus:text-violet-300">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400">
                                      <Edit2 className="h-4 w-4" />
                                    </div>
                                    Edit Organization
                                  </DropdownMenuItem>
                                </PermissionGate>
                              )}
                              
                              <DropdownMenuSeparator className="my-1 bg-gray-100 dark:bg-gray-800" />
                              
                              {org.is_deleted ? (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => setConfirmDialog({ type: 'restore', org })}
                                    className="flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50 hover:text-emerald-800 focus:bg-emerald-50 focus:text-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-300 dark:focus:bg-emerald-900/20 dark:focus:text-emerald-300"
                                  >
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                                      <RotateCcw className="h-4 w-4" />
                                    </div>
                                    Restore Organization
                                  </DropdownMenuItem>
                                  <PermissionGate permission="organization.organization.delete">
                                    <DropdownMenuItem
                                      onClick={() => setPermDeleteOrg(org)}
                                      className="flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50 hover:text-rose-800 focus:bg-rose-50 focus:text-rose-800 dark:text-rose-400 dark:hover:bg-rose-900/20 dark:hover:text-rose-300 dark:focus:bg-rose-900/20 dark:focus:text-rose-300"
                                    >
                                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400">
                                        <Trash2 className="h-4 w-4" />
                                      </div>
                                      Permanent Delete
                                    </DropdownMenuItem>
                                  </PermissionGate>
                                </>
                              ) : protected_ ? (
                                <DropdownMenuItem disabled className="flex cursor-not-allowed items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium opacity-60">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-500">
                                    <ShieldAlert className="h-4 w-4" />
                                  </div>
                                  <span className="text-amber-700 dark:text-amber-500">Archive <span className="text-[10px]">({org.business_units_count} BU{(org.business_units_count ?? 0) !== 1 ? 's' : ''})</span></span>
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => setConfirmDialog({ type: 'archive', org })}
                                  className="flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50 hover:text-rose-800 focus:bg-rose-50 focus:text-rose-800 dark:text-rose-400 dark:hover:bg-rose-900/20 dark:hover:text-rose-300 dark:focus:bg-rose-900/20 dark:focus:text-rose-300"
                                >
                                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400">
                                    <Archive className="h-4 w-4" />
                                  </div>
                                  Archive Organization
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      </div>{/* end #org-data-panel */}

      {/* ── Server-side Pagination ─────────────────────────────────────────── */}
      {(meta?.total ?? 0) > 0 && (
        <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 px-5 py-3 bg-gray-50/40 dark:bg-gray-900/40">
          <p className="text-xs text-gray-500 dark:text-gray-400" aria-live="polite">
            Showing{' '}
            <span className="font-semibold text-gray-700 dark:text-gray-200">
              {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, meta?.total ?? 0)}
            </span>
            {' '}of{' '}
            <span className="font-semibold text-gray-700 dark:text-gray-200">{meta?.total ?? 0}</span>
            {' '}organizations
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1" role="navigation" aria-label="Pagination">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1 || isFetching}
                aria-label="Previous page"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = totalPages <= 5 ? i + 1
                  : page <= 3 ? i + 1
                  : page >= totalPages - 2 ? totalPages - 4 + i
                  : page - 2 + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    aria-label={`Page ${p}`}
                    aria-current={p === page ? 'page' : undefined}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                      p === page
                        ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm'
                        : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages || isFetching}
                aria-label="Next page"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
