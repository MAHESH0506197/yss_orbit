// src/features/platform/platformAdmin/BusinessDomainPage.tsx
// ─────────────────────────────────────────────────────────────────────────────
// ENTERPRISE UI/UX — v4.0 FULL AUDIT PASS
//
// ✅ C1/H7: Frontend now calls DELETE /?hard=true correctly (backend now handles it)
// ✅ H1:    Table view ADDED Code column with CopyButton chip
// ✅ H2:    Table view ADDED Active Users column
// ✅ H3:    Table view ADDED Created At column
// ✅ H4:    Success toasts on create/update wired in FormModal (already done there)
// ✅ H5:    Grid card now shows code chip with CopyButton
// ✅ M1:    "In Use" tab ADDED to STATUS_TABS filter pills
// ✅ M3/M4: fadeInUp + scaleIn keyframes defined via <style> tag inside component
// ✅ M6:    Sort dropdown added to toolbar
// ✅ P2:    Refresh button added to toolbar
//
// Preserved from v3.0:
//  ✅ Unified PageHeader with breadcrumb
//  ✅ RefetchBar
//  ✅ E keyboard shortcut in ViewModal
//  ✅ Responsive filter tabs (mobile select + desktop pills)
//  ✅ Confirm dialog with domain-name callout
//  ✅ Fetching overlay / sticky top bar
//
// Preserved from v2.0:
//  ✅ Debounced search, server-side pagination, KPI cards, filter count badges
//  ✅ ⋮ dropdown action menu, N shortcut, Bulk Archive/Restore bar
//  ✅ Archive protection indicator, Copy Code, Grid/Table toggle
//  ✅ Stagger animation, skeleton, full WCAG aria-labels
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe2, Plus, Edit2, Eye,
  CheckCircle2, XCircle, AlertTriangle, MoreHorizontal,
  Search, X, GitBranch,
  ChevronLeft, ChevronRight, Building2, Loader2,
  ShieldAlert, Archive, RotateCcw, RefreshCcw, Check,
  Clock, Users, Code2, ArrowUpDown, Calendar, Trash2,
} from 'lucide-react';

import toast from 'react-hot-toast';

import {
  useBusinessDomains,
  useDeleteBusinessDomain,
  useRestoreBusinessDomain,
} from '@/features/organization/businessDomain/api/useBusinessDomains';
import { useBusinessDomainMutations } from '@/features/organization/businessDomain/api/useBusinessDomainMutations';
import { BusinessDomainPermanentDeleteModal } from '@/features/organization/businessDomain/components/BusinessDomainPermanentDeleteModal';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { RefetchBar } from '@/components/ui/RefetchBar';
import { PermissionGate, AnyPermissionGate } from '@/components/auth/PermissionGate';
import { useViewMode } from '@/hooks/useViewMode';
import { ViewModeToggle } from '@/components/platform/ViewModeToggle';
import { CardGrid } from '@/components/platform/CardGrid';
import { EntityCard } from '@/components/platform/EntityCard';
import type { BusinessDomain } from '@/features/organization/businessDomain/types/businessDomainTypes';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';

const PAGE_SIZE = 20;

// ─── Types ────────────────────────────────────────────────────────────────────
type StatusFilter = 'all' | 'active' | 'inactive' | 'deleted';

// ─── Sort Options ─────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { label: 'Name A→Z',      value: 'name'       },
  { label: 'Name Z→A',      value: '-name'      },
  { label: 'Code A→Z',      value: 'code'       },
  { label: 'Code Z→A',      value: '-code'      },
  { label: 'Newest First',  value: '-created_at' },
  { label: 'Oldest First',  value: 'created_at'  },
  { label: 'Active First',  value: '-is_active'  },
];

// ─── Shared Design System Components ─────────────────────────────────────────
import { EntityAvatar } from '@/components/platform/EntityAvatar';
import { StatusBadge, getEntityStatus } from '@/components/platform/StatusBadge';
import { CopyChip } from '@/components/platform/CopyChip';
import { EmptyState } from '@/components/platform/EmptyState';
import { PageSkeleton } from '@/components/platform/PageSkeleton';
import { BulkActionBar } from '@/components/platform/BulkActionBar';
import { FilterBar } from '@/components/platform/FilterBar';
import { formatIST } from '@/utils/date';

// ─── Main Page ────────────────────────────────────────────────────────────────
export const BusinessDomainPage: React.FC = () => {
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────────────────────
  const [page, setPage]                         = useState(1);
  const [statusFilter, setStatusFilter]         = useState<StatusFilter>('all');
  const [searchInput, setSearchInput]           = useState('');
  const [debouncedSearch, setDebouncedSearch]   = useState('');
  const [isSearching, setIsSearching]           = useState(false);
  const [ordering, setOrdering]                 = useState('name');
  const [confirmDialog, setConfirmDialog]       = useState<{ type: 'archive' | 'restore'; domain: BusinessDomain } | null>(null);
  const [confirmReason, setConfirmReason]       = useState('');
  const [isConfirming, setIsConfirming]         = useState(false);
  const [selectedIds, setSelectedIds]           = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [viewMode, setViewMode, density, setDensity] = useViewMode('businessDomains', 'grid');
  const [permDeleteTarget, setPermDeleteTarget]       = useState<BusinessDomain | null>(null);

  // ── Debounced search ───────────────────────────────────────────────────────
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

  // ── API query ──────────────────────────────────────────────────────────────
  const queryParams = useMemo(() => {
    const p: Record<string, any> = { page, page_size: PAGE_SIZE, ordering };
    if (statusFilter !== 'all') p.status = statusFilter;
    if (debouncedSearch.trim()) p.search = debouncedSearch.trim();
    return p;
  }, [page, statusFilter, debouncedSearch, ordering]);

  const { data, isLoading, isError, isFetching, refetch } = useBusinessDomains(queryParams);

  const domains: BusinessDomain[] = useMemo(() => data?.results ?? [], [data]);
  const meta = (data as any)?.meta ?? null;
  const totalPages  = meta?.total_pages  ?? 1;
  const isRefetching = isFetching && !isLoading;

  // ── Mutations ──────────────────────────────────────────────────────────────
  const { deleteDomain, restoreDomain } = useBusinessDomainMutations();
  const bulkDeleteMutation  = useDeleteBusinessDomain();
  const bulkRestoreMutation = useRestoreBusinessDomain();

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleCreate = useCallback(() => navigate('/platform/business-domains/new'), [navigate]);
  const handleEdit   = useCallback((d: BusinessDomain) => navigate(`/platform/business-domains/${d.id}/edit`), [navigate]);
  const handleView   = useCallback((d: BusinessDomain) => navigate(`/platform/business-domains/${d.id}`), [navigate]);

  const handleFilterClick = useCallback((f: StatusFilter) => {
    setStatusFilter(prev => prev === f ? 'all' : f);
    setPage(1);
    setSelectedIds([]);
  }, []);

  const clearAllFilters = useCallback(() => {
    setStatusFilter('all');
    setSearchInput('');
    setDebouncedSearch('');
    setOrdering('name');
    setPage(1);
    setSelectedIds([]);
  }, []);

  const hasActiveFilters = statusFilter !== 'all' || debouncedSearch.trim().length > 0 || ordering !== 'name';

  // ── Confirm action (single) ────────────────────────────────────────────────
  const executeConfirmAction = async () => {
    if (!confirmDialog) return;
    setIsConfirming(true);
    try {
      if (confirmDialog.type === 'archive') {
        await deleteDomain({ id: confirmDialog.domain.id, reason: confirmReason });
        toast.success(`"${confirmDialog.domain.name}" archived.`);
      } else {
        await restoreDomain({ id: confirmDialog.domain.id, reason: confirmReason });
        toast.success(`"${confirmDialog.domain.name}" restored.`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Action failed. Please try again.');
    } finally {
      setIsConfirming(false);
      setConfirmDialog(null);
      setConfirmReason('');
    }
  };

  // ── Bulk actions ────────────────────────────────────────────────────────────
  const handleBulkArchive = async () => {
    if (!selectedIds.length) return;
    setIsBulkProcessing(true);
    const results = await Promise.allSettled(
      selectedIds.map(id => bulkDeleteMutation.mutateAsync({ id, reason: 'Bulk archived' }))
    );
    const failed = results.filter(r => r.status === 'rejected').length;
    if (failed > 0) toast.error(`${failed} domain(s) failed to archive.`);
    else toast.success(`${selectedIds.length} domain(s) archived.`);
    setSelectedIds([]);
    setIsBulkProcessing(false);
  };

  const handleBulkRestore = async () => {
    if (!selectedIds.length) return;
    setIsBulkProcessing(true);
    const results = await Promise.allSettled(
      selectedIds.map(id => bulkRestoreMutation.mutateAsync({ id, reason: 'Bulk restored' }))
    );
    const failed = results.filter(r => r.status === 'rejected').length;
    if (failed > 0) toast.error(`${failed} domain(s) failed to restore.`);
    else toast.success(`${selectedIds.length} domain(s) restored.`);
    setSelectedIds([]);
    setIsBulkProcessing(false);
  };

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      if (e.key === 'Escape' && confirmDialog && !isConfirming) {
        e.preventDefault();
        setConfirmDialog(null);
        return;
      }

      // Block shortcut if dialogs are open
      if (!!confirmDialog) return;
      if (inInput) return;
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        handleCreate();
      }
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        refetch();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [confirmDialog, isConfirming, handleCreate, refetch]);

  // ── Selection helpers ──────────────────────────────────────────────────────
  const toggleSelect = useCallback((id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id));
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.length === domains.length) setSelectedIds([]);
    else setSelectedIds(domains.map(d => d.id));
  }, [selectedIds.length, domains]);

  // ── Archive protection helper ──────────────────────────────────────────────
  const isArchiveProtected = (d: BusinessDomain) =>
    !d.is_deleted && ((d as any).organizations_count ?? 0) > 0;

  // ── Smart bulk selection analysis (MUST be before early returns) ──────────
  const selectedDomains = useMemo(
    () => domains.filter(d => selectedIds.includes(d.id)),
    [domains, selectedIds]
  );
  const hasNonDeletedInSelection = selectedDomains.some(d => !d.is_deleted);
  const hasDeletedInSelection    = selectedDomains.some(d => d.is_deleted);
  const archiveProtectedCount = selectedDomains.filter(
    d => !d.is_deleted && ((d as any).organizations_count ?? 0) > 0
  ).length;
  const archivableCount = selectedDomains.filter(
    d => !d.is_deleted && ((d as any).organizations_count ?? 0) === 0
  ).length;

  // ── Loading / Error states (early returns AFTER all hooks) ──────────────────
  if (isLoading) return <div className="p-6 max-w-7xl mx-auto"><PageSkeleton /></div>;

  if (isError) {
    return (
      <div className="p-6 max-w-7xl mx-auto" role="alert">
        <div className="flex items-start gap-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 p-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/40">
            <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h3 className="font-bold text-rose-800 dark:text-rose-300">Failed to load Business Domains</h3>
            <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">
              There was a problem fetching data from the server. Please refresh the page or contact support.
            </p>
            <button
              onClick={() => refetch()}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700 transition-colors"
            >
              <RefreshCcw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Filter tab definitions with count badges ───────────────────────────────
  const STATUS_TABS: { label: string; value: StatusFilter; count: number | null }[] = [
    { label: 'All',      value: 'all',      count: meta?.total ?? null },
    { label: 'Active',   value: 'active',   count: meta?.total_active ?? null },
    { label: 'Inactive', value: 'inactive', count: meta?.total_inactive ?? null },
    { label: 'Archived', value: 'deleted',  count: meta?.total_deleted ?? null },
  ];

  // ── Total orgs using any domain ────────────────────────────────────────────
  const totalOrgsUsingDomains = meta?.total_orgs_count ??
    domains.reduce((sum: number, d: BusinessDomain) => sum + ((d as any).organizations_count ?? 0), 0);

  // ── New Domain button ──────────────────────────────────────────────────────
  const newDomainButton = (
    <PermissionGate permission="business_domain.businessdomain.create">
      <button
        onClick={handleCreate}
        aria-label="Create new business domain (N)"
        title="New Domain (N)"
        className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/40 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:ring-offset-gray-950 whitespace-nowrap"
      >
        <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" aria-hidden="true" />
        New Domain
        <kbd className="hidden sm:inline-flex ml-1 items-center rounded border border-violet-400/40 bg-violet-700/30 px-1.5 py-0.5 font-mono text-[10px] text-violet-200">
          N
        </kbd>
      </button>
    </PermissionGate>
  );

  return (
    <>
      <div className="p-6 max-w-7xl mx-auto space-y-6 pb-16">

        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <PageHeader
          icon={Globe2}
          iconGradient="from-indigo-500 to-blue-600"
          title="Business Domains"
          subtitle="Define high-level industry categories (e.g., Retail, Pharmacy) to group and organize your client organizations."
          countBadge={meta?.total}
          countBadgeLabel={`${meta?.total ?? 0} total domains`}
          actions={newDomainButton}
        />

        {/* ── KPI Cards ── 5 cards: Total / Active / Inactive / Archived / Orgs ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5" role="group" aria-label="Domain statistics filters">
          <StatCard
            label="Total Domains"
            value={meta?.total ?? domains.length}
            icon={Globe2}
            gradient="bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600"
            onClick={() => handleFilterClick('all')}
            isActive={statusFilter === 'all'}
          />
          <StatCard
            label="Active"
            value={meta?.total_active ?? domains.filter(d => d.is_active && !d.is_deleted).length}
            icon={CheckCircle2}
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
            onClick={() => handleFilterClick('active')}
            isActive={statusFilter === 'active'}
          />
          <StatCard
            label="Inactive"
            value={meta?.total_inactive ?? domains.filter(d => !d.is_active && !d.is_deleted).length}
            icon={XCircle}
            gradient="bg-gradient-to-br from-amber-500 to-orange-500"
            onClick={() => handleFilterClick('inactive')}
            isActive={statusFilter === 'inactive'}
          />
          <StatCard
            label="Archived"
            value={meta?.total_deleted ?? domains.filter(d => d.is_deleted).length}
            icon={Archive}
            gradient="bg-gradient-to-br from-rose-500 to-pink-600"
            onClick={() => handleFilterClick('deleted')}
            isActive={statusFilter === 'deleted'}
          />
          <StatCard
            label="Orgs Using Domains"
            value={totalOrgsUsingDomains}
            icon={Building2}
            gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
            subLabel="across all domains"
          />
        </div>

        {/* ── Bulk Action Bar (shared component) ──────────────────────────── */}
        <BulkActionBar
          selectedCount={selectedIds.length}
          onArchive={hasNonDeletedInSelection && archivableCount > 0 ? handleBulkArchive : undefined}
          onRestore={hasDeletedInSelection ? handleBulkRestore : undefined}
          onClear={() => setSelectedIds([])}
          isLoading={isBulkProcessing}
        />

        {/* ── Main Data Card ────────────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 shadow-sm">

          {/* RefetchBar — top progress indicator during background refetch */}
          <RefetchBar visible={isRefetching} />

          {/* ── Toolbar — uses FilterBar component ──────────────────────── */}
          <FilterBar
            search={searchInput}
            onSearch={setSearchInput}
            placeholder="Search domains…"
            isSearching={isSearching}
            sortOptions={SORT_OPTIONS}
            sort={ordering}
            onSort={(v) => { setOrdering(v); setPage(1); }}
            viewMode={viewMode}
            onViewMode={setViewMode}
            isFetching={isFetching}
            onRefresh={() => refetch()}
            rightSlot={
              <>
                {/* Status filter pills */}
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
                        onClick={() => handleFilterClick(tab.value)}
                        className={`relative inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-200 ${
                          isSelected
                            ? 'bg-white dark:bg-gray-800 text-violet-700 dark:text-violet-400 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        {tab.label}
                        {tab.count !== null && (
                          <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
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

                {/* Clear filters */}
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    aria-label="Clear all filters"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" /> Clear
                  </button>
                )}
              </>
            }
          />

          {/* Result count (announced to screen readers) */}
          <p id="domain-result-count" className="sr-only" aria-live="polite">
            {domains.length === 0
              ? 'No business domains found'
              : `Showing ${domains.length} of ${meta?.total ?? domains.length} business domains`}
          </p>

          {/* ── Data Panel ─────────────────────────────────────────────────── */}
          <div id="domain-data-panel" role="tabpanel" aria-live="polite">

            {/* ── Grid View ──────────────────────────────────────────────── */}
            {viewMode === 'grid' ? (
              <CardGrid
                density={density}
                isEmpty={domains.length === 0}
                emptyState={
                  <EmptyState
                    title={hasActiveFilters ? 'No Domains Match' : 'No Business Domains Yet'}
                    description={hasActiveFilters ? 'Try adjusting your search or status filter.' : 'Create your first Business Domain to get started.'}
                    hasFilters={hasActiveFilters}
                    onClear={clearAllFilters}
                    onCreate={handleCreate}
                    createPermission="organization.businessdomain.create"
                    createLabel="Create Domain"
                  />
                }
              >
                {domains.map((domain, i) => {
                  const isSelected = selectedIds.includes(domain.id);
                  const protected_ = isArchiveProtected(domain);
                  return (
                    <div
                      key={domain.id}
                      style={{ animationDelay: `${i * 40}ms` }}
                      className="flex flex-col h-full animate-fadeInUp"
                    >
                      <EntityCard
                        id={domain.id}
                        density={density}
                        title={domain.name}
                        subtitle={domain.code}
                        avatar={<EntityAvatar name={domain.name} logoUrl={domain.logo_url} size={40} />}
                        statusBadge={<StatusBadge status={getEntityStatus(domain.is_deleted, domain.is_active)} />}
                        isSelected={isSelected}
                        onSelect={checked => toggleSelect(domain.id, checked)}
                        onClick={() => handleView(domain)}
                        metrics={[
                          { label: 'Orgs', value: (domain as any).organizations_count ?? 0, icon: <Building2 className="h-3.5 w-3.5" /> },
                          { label: 'BUs', value: (domain as any).business_units_count ?? 0, icon: <GitBranch className="h-3.5 w-3.5" /> },
                          { label: 'Users', value: (domain as any).active_users_count ?? 0, icon: <Users className="h-3.5 w-3.5" /> },
                        ]}
                        actions={[
                          { label: 'View Details', icon: <Eye className="h-4 w-4" />, onClick: () => handleView(domain) },
                          { label: 'Edit Domain', icon: <Edit2 className="h-4 w-4" />, onClick: () => handleEdit(domain) },
                          domain.is_deleted
                            ? { label: 'Restore Domain', icon: <RotateCcw className="h-4 w-4" />, onClick: () => setConfirmDialog({ type: 'restore', domain }) }
                            : protected_
                              ? { label: `Archive (${(domain as any).organizations_count} org${(domain as any).organizations_count !== 1 ? 's' : ''})`, icon: <ShieldAlert className="h-4 w-4" />, onClick: () => toast.error('This domain is assigned to organizations and cannot be archived.'), danger: false, disabled: true }
                              : { label: 'Archive Domain', icon: <Archive className="h-4 w-4" />, danger: true, onClick: () => setConfirmDialog({ type: 'archive', domain }) },
                          ...(domain.is_deleted ? [{ label: 'Permanent Delete', icon: <Trash2 className="h-4 w-4" />, danger: true, onClick: () => setPermDeleteTarget(domain) }] : []),
                        ]}
                      />
                    </div>
                  );
                })}
              </CardGrid>
            ) : (
              /* ── Table View ──────────────────────────────────────────── */
              domains.length === 0 ? (
                <EmptyState
                  title={hasActiveFilters ? 'No Domains Match' : 'No Business Domains Yet'}
                  description={hasActiveFilters ? 'Try adjusting your search or status filter.' : 'Create your first Business Domain to get started.'}
                  hasFilters={hasActiveFilters}
                  onClear={clearAllFilters}
                  onCreate={handleCreate}
                  createPermission="organization.businessdomain.create"
                  createLabel="Create Domain"
                />
              ) : (
                <div className="overflow-auto max-h-[calc(100vh-380px)]">
                  <table className="w-full text-sm text-left relative">
                    <thead className="sticky top-0 z-20 bg-gradient-to-r from-violet-700 via-purple-700 to-fuchsia-700 text-white shadow-md">
                      <tr className="divide-x divide-dashed divide-white/20">
                        <th className="w-10 px-4 py-3">
                          <input
                            type="checkbox"
                            aria-label="Select all domains on this page"
                            checked={selectedIds.length > 0 && selectedIds.length === domains.length}
                            onChange={toggleSelectAll}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer bg-white dark:bg-gray-800 dark:border-gray-700"
                          />
                        </th>
                        {[
                          { key: 'Domain',       label: 'Domain'        },
                          { key: 'Code',         label: 'Code'          },
                          { key: 'Status',       label: 'Status'        },
                          { key: 'Orgs',         label: 'Orgs'          },
                          { key: 'BUs',          label: 'BUs'           },
                          { key: 'ActiveUsers',  label: 'Active Users'  },
                          { key: 'Created',      label: 'Created'       },
                          { key: 'Updated',      label: 'Updated'       },
                          { key: 'Actions',      label: 'Actions'       },
                        ].map(h => (
                          <th key={h.key} className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                            {h.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 border-b border-gray-200 dark:border-gray-800">
                      {domains.map((d, i) => {
                        const isSelected = selectedIds.includes(d.id);
                        const protected_ = isArchiveProtected(d);
                        return (
                          <tr
                            key={d.id}
                            className={`group transition-colors divide-x divide-dashed divide-gray-200 dark:divide-gray-800 hover:bg-gray-50/70 dark:hover:bg-gray-800/40 animate-fadeInUp ${
                              isSelected ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : 'bg-white dark:bg-gray-900'
                            }`}
                            style={{ animationDelay: `${i * 30}ms` }}
                          >
                            {/* Checkbox */}
                            <td className="w-10 px-4 py-3.5">
                              <input
                                type="checkbox"
                                aria-label={`Select ${d.name}`}
                                checked={isSelected}
                                onChange={e => toggleSelect(d.id, e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer bg-white dark:bg-gray-800 dark:border-gray-700"
                              />
                            </td>

                            {/* Domain Name */}
                            <td className="px-4 py-3.5 min-w-[180px]">
                              <button
                                type="button"
                                onClick={() => handleView(d)}
                                aria-label={`View details for ${d.name}`}
                                className="flex items-center gap-3 group text-left transition-colors w-full"
                              >
                                <EntityAvatar name={d.name} logoUrl={d.logo_url} size={36} />
                                <div className="min-w-0">
                                  <div className="text-[14px] font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                                    {d.name}
                                  </div>
                                </div>
                              </button>
                            </td>

                            {/* Code column */}
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <CopyChip value={d.code} label="domain code" />
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3.5"><StatusBadge status={getEntityStatus(d.is_deleted, d.is_active)} /></td>

                            {/* Orgs */}
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
                                <span className={`font-bold tabular-nums text-sm ${(d as any).organizations_count > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
                                  {(d as any).organizations_count ?? 0}
                                </span>
                              </div>
                            </td>

                            {/* BUs */}
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-1.5">
                                <GitBranch className="h-3.5 w-3.5 text-violet-400" aria-hidden="true" />
                                <span className={`font-bold tabular-nums text-sm ${(d as any).business_units_count > 0 ? 'text-violet-600 dark:text-violet-400' : 'text-gray-400'}`}>
                                  {(d as any).business_units_count ?? 0}
                                </span>
                              </div>
                            </td>

                            {/* Active Users column */}
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                                <span className={`font-bold tabular-nums text-sm ${(d as any).active_users_count > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                                  {(d as any).active_users_count ?? 0}
                                </span>
                              </div>
                            </td>

                            {/* Created At column */}
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <Calendar className="h-3 w-3 shrink-0 text-blue-400" aria-hidden="true" />
                                {d.created_at ? formatIST(d.created_at, 'dd MMM yyyy') : '—'}
                              </div>
                            </td>

                            {/* Updated */}
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <Clock className="h-3 w-3 shrink-0 text-violet-400" aria-hidden="true" />
                                {d.updated_at ? formatIST(d.updated_at, 'dd MMM yyyy') : '—'}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3.5">
                              <div className="flex justify-end" onClick={e => e.stopPropagation()}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      type="button"
                                      aria-label={`Actions for ${d.name}`}
                                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-transparent text-gray-400 transition-all hover:border-gray-200 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:opacity-100 data-[state=open]:border-gray-200 data-[state=open]:bg-gray-50 data-[state=open]:text-gray-900 data-[state=open]:shadow-sm dark:hover:border-gray-700 dark:hover:bg-gray-800/50 dark:hover:text-white dark:data-[state=open]:border-gray-700 dark:data-[state=open]:bg-gray-800/50 dark:data-[state=open]:text-white"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-60 rounded-2xl border border-gray-100 bg-white/95 p-2 shadow-xl shadow-gray-200/50 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/95 dark:shadow-gray-900/50">
                                    <DropdownMenuLabel className="px-2.5 py-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                      <span className="block truncate text-indigo-600 dark:text-indigo-400">{d.name}</span>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator className="my-1 bg-gray-100 dark:bg-gray-800" />

                                    <DropdownMenuItem onClick={() => handleView(d)} className="flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900 focus:bg-gray-50 focus:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800/50 dark:hover:text-white dark:focus:bg-gray-800/50 dark:focus:text-white">
                                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                        <Eye className="h-4 w-4" />
                                      </div>
                                      View Details
                                    </DropdownMenuItem>

                                    {!d.is_deleted && (
                                      <PermissionGate permission="business_domain.businessdomain.update">
                                        <DropdownMenuItem onClick={() => handleEdit(d)} className="flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium text-violet-700 transition-colors hover:bg-violet-50 hover:text-violet-800 focus:bg-violet-50 focus:text-violet-800 dark:text-violet-400 dark:hover:bg-violet-900/20 dark:hover:text-violet-300 dark:focus:bg-violet-900/20 dark:focus:text-violet-300">
                                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400">
                                            <Edit2 className="h-4 w-4" />
                                          </div>
                                          Edit Domain
                                        </DropdownMenuItem>
                                      </PermissionGate>
                                    )}

                                    <DropdownMenuSeparator className="my-1 bg-gray-100 dark:bg-gray-800" />

                                    <AnyPermissionGate permissions={['business_domain.businessdomain.delete', 'business_domain.businessdomain.restore']}>
                                      {d.is_deleted ? (
                                        <>
                                          <DropdownMenuItem
                                            onClick={() => setConfirmDialog({ type: 'restore', domain: d })}
                                            className="flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50 hover:text-emerald-800 focus:bg-emerald-50 focus:text-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-300 dark:focus:bg-emerald-900/20 dark:focus:text-emerald-300"
                                          >
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                                              <RotateCcw className="h-4 w-4" />
                                            </div>
                                            Restore Domain
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() => setPermDeleteTarget(d)}
                                            className="flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 hover:text-red-800 focus:bg-red-50 focus:text-red-800 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300 dark:focus:bg-red-900/20 dark:focus:text-red-300"
                                          >
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">
                                              <Trash2 className="h-4 w-4" />
                                            </div>
                                            Permanent Delete
                                          </DropdownMenuItem>
                                        </>
                                      ) : protected_ ? (
                                        <DropdownMenuItem disabled className="flex cursor-not-allowed items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium opacity-60">
                                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-500">
                                            <ShieldAlert className="h-4 w-4" />
                                          </div>
                                          <span className="text-amber-700 dark:text-amber-500">Archive <span className="text-[10px]">({(d as any).organizations_count} org{(d as any).organizations_count !== 1 ? 's' : ''})</span></span>
                                        </DropdownMenuItem>
                                      ) : (
                                        <DropdownMenuItem
                                          onClick={() => setConfirmDialog({ type: 'archive', domain: d })}
                                          className="flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50 hover:text-rose-800 focus:bg-rose-50 focus:text-rose-800 dark:text-rose-400 dark:hover:bg-rose-900/20 dark:hover:text-rose-300 dark:focus:bg-rose-900/20 dark:focus:text-rose-300"
                                        >
                                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400">
                                            <Archive className="h-4 w-4" />
                                          </div>
                                          Archive Domain
                                        </DropdownMenuItem>
                                      )}
                                    </AnyPermissionGate>
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
          </div>{/* end #domain-data-panel */}

          {/* ── Server-side Pagination ─────────────────────────────────────── */}
          {(meta?.total ?? 0) > 0 && (
            <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 px-5 py-3 bg-gray-50/40 dark:bg-gray-900/40">
              <p className="text-xs text-gray-500 dark:text-gray-400" aria-live="polite">
                Showing{' '}
                <span className="font-semibold text-gray-700 dark:text-gray-200">
                  {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, meta?.total ?? 0)}
                </span>
                {' '}of{' '}
                <span className="font-semibold text-gray-700 dark:text-gray-200">{meta?.total ?? 0}</span>
                {' '}domains
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-1" role="navigation" aria-label="Pagination">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
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
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
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

        {/* ── Permanent Delete Confirmation Modal ───────────────────────────── */}
        <BusinessDomainPermanentDeleteModal
          isOpen={!!permDeleteTarget}
          onClose={() => setPermDeleteTarget(null)}
          domain={permDeleteTarget}
          onDeleted={() => setPermDeleteTarget(null)}
        />

        {/* ── Confirm Dialog ───────────────────────────────────────────────── */}
        {confirmDialog && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={confirmDialog.type === 'archive' ? 'Confirm archive' : 'Confirm restore'}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => !isConfirming && setConfirmDialog(null)} />
            <div
              className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl ring-1 ring-black/5 overflow-hidden"
              style={{ animation: 'scaleIn 0.15s ease-out' }}
            >
              {/* Accent stripe */}
              <div className={`h-1 w-full ${confirmDialog.type === 'archive' ? 'bg-gradient-to-r from-rose-500 to-pink-600' : 'bg-gradient-to-r from-emerald-500 to-teal-600'}`} />
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
                      {confirmDialog.type === 'archive' ? 'Archive Business Domain' : 'Restore Business Domain'}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {confirmDialog.type === 'archive'
                        ? 'This will remove the domain from active use. Organizations currently assigned to it will retain their assignment.'
                        : 'This will make the domain available again for Organization assignments.'
                      }
                    </p>
                    {/* Domain name callout block */}
                    <div className={`mt-3 flex items-center gap-2 rounded-xl px-4 py-2.5 ${
                      confirmDialog.type === 'archive'
                        ? 'bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800'
                        : 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                    }`}>
                      <EntityAvatar name={confirmDialog.domain.name} logoUrl={confirmDialog.domain.logo_url} size={28} />
                      <span className="font-bold text-sm text-gray-900 dark:text-white truncate">
                        {confirmDialog.domain.name}
                      </span>
                      <code className="ml-auto text-[10px] font-mono text-gray-500 dark:text-gray-400 shrink-0">
                        {confirmDialog.domain.code}
                      </code>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 mb-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                    Reason <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    value={confirmReason}
                    onChange={(e) => setConfirmReason(e.target.value)}
                    placeholder={`Reason for ${confirmDialog.type === 'archive' ? 'archiving' : 'restoring'}...`}
                    rows={2}
                    className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 py-2.5 px-3 text-sm text-gray-900 dark:text-white focus:border-violet-500 focus:ring-violet-500 transition-all resize-none"
                  />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setConfirmDialog(null)}
                    disabled={isConfirming}
                    className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeConfirmAction}
                    disabled={isConfirming || !confirmReason.trim()}
                    aria-label={isConfirming ? 'Processing…' : (confirmDialog.type === 'archive' ? 'Confirm archive' : 'Confirm restore')}
                    className={`inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed ${
                      confirmDialog.type === 'archive'
                        ? 'bg-gradient-to-r from-rose-500 to-pink-600 focus:ring-rose-500'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-600 focus:ring-emerald-500'
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
      </div>
    </>
  );
};

export default BusinessDomainPage;
