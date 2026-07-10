import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitBranch, Plus, Edit2, Eye,
  CheckCircle2, XCircle, AlertTriangle, MoreHorizontal,
  Search, Building2, ChevronLeft, ChevronRight, Loader2,
  Archive, RotateCcw, RefreshCcw, Users, MapPin, Star, Calendar
} from 'lucide-react';

import toast from 'react-hot-toast';

import {
  useBusinessUnits,
  useDeleteBusinessUnit,
  useRestoreBusinessUnit,
} from '../hooks/useBusinessUnits';
import type { BusinessUnit } from '../types/businessUnitTypes';

import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { RefetchBar } from '@/components/ui/RefetchBar';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { useViewMode } from '@/hooks/useViewMode';
import { ViewModeToggle } from '@/components/platform/ViewModeToggle';
import { CardGrid } from '@/components/platform/CardGrid';
import { EntityCard } from '@/components/platform/EntityCard';
import { EntityAvatar } from '@/components/platform/EntityAvatar';
import { StatusBadge, getEntityStatus } from '@/components/platform/StatusBadge';
import { CopyChip } from '@/components/platform/CopyChip';
import { EmptyState } from '@/components/platform/EmptyState';
import { PageSkeleton } from '@/components/platform/PageSkeleton';
import { formatIST } from '@/utils/date';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel
} from '@/components/ui/DropdownMenu';

const PAGE_SIZE = 20;
type StatusFilter = 'all' | 'active' | 'inactive' | 'deleted' | 'main_branch';
type SortOption = { label: string; value: string };

const SORT_OPTIONS: SortOption[] = [
  { label: 'Name A→Z',      value: 'name'       },
  { label: 'Name Z→A',      value: '-name'      },
  { label: 'Code A→Z',      value: 'code'       },
  { label: 'Code Z→A',      value: '-code'      },
  { label: 'Newest First',  value: '-created_at' },
  { label: 'Oldest First',  value: 'created_at'  },
  { label: 'Active First',  value: '-is_active'  },
];

export default function BusinessUnitListPage() {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [ordering, setOrdering] = useState('name');
  
  const [confirmDialog, setConfirmDialog] = useState<{ type: 'archive' | 'restore'; bu: BusinessUnit } | null>(null);
  const [confirmReason, setConfirmReason] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  
  const [viewMode, setViewMode] = useViewMode('businessUnits', 'grid');

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput]);

  const queryParams = useMemo(() => {
    const p: Record<string, any> = { page, page_size: PAGE_SIZE, ordering };
    if (statusFilter !== 'all') {
      if (statusFilter === 'deleted') p.is_deleted = true;
      else if (statusFilter === 'main_branch') p.is_main_branch = true;
      else p.is_active = statusFilter === 'active';
    }
    if (debouncedSearch.trim()) p.search = debouncedSearch.trim();
    return p;
  }, [page, statusFilter, debouncedSearch, ordering]);

  const { data, isLoading, isError, isFetching, refetch } = useBusinessUnits(queryParams);
  const units: BusinessUnit[] = useMemo(() => data?.results ?? [], [data]);
  const meta = (data as any)?.meta ?? null;
  const totalPages = meta?.total_pages ?? 1;

  const { mutateAsync: deleteBu } = useDeleteBusinessUnit();
  const { mutateAsync: restoreBu } = useRestoreBusinessUnit();

  const handleCreate = useCallback(() => navigate('/platform/business-units/create'), [navigate]);
  const handleEdit   = useCallback((u: BusinessUnit) => navigate(`/platform/business-units/${u.id}/edit`), [navigate]);
  const handleView   = useCallback((u: BusinessUnit) => navigate(`/platform/business-units/${u.id}`), [navigate]);

  const executeConfirmAction = async () => {
    if (!confirmDialog) return;
    setIsConfirming(true);
    try {
      if (confirmDialog.type === 'archive') {
        await deleteBu({ id: confirmDialog.bu.id, reason: confirmReason });
        toast.success(`"${confirmDialog.bu.name}" archived.`);
      } else {
        await restoreBu({ id: confirmDialog.bu.id });
        toast.success(`"${confirmDialog.bu.name}" restored.`);
      }
    } catch (err: any) {
      toast.error('Action failed. Please try again.');
    } finally {
      setIsConfirming(false);
      setConfirmDialog(null);
      setConfirmReason('');
    }
  };

  return (
    <>
      <div className="p-6 max-w-7xl mx-auto space-y-6 pb-16">
        <PageHeader
          icon={GitBranch}
          iconGradient="from-indigo-500 to-blue-600"
          title="Business Units"
          subtitle="Manage operational branches, stores, and locations across your organization."
          countBadge={meta?.total}
          countBadgeLabel={`${meta?.total ?? 0} total units`}
          breadcrumbs={[
            { label: 'Platform' },
            { label: 'Business Units' }
          ]}
          actions={
            <PermissionGate permission="business_unit.create">
              <button
                onClick={handleCreate}
                aria-label="Create new business unit (N)"
                title="New Business Unit (N)"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/40 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:ring-offset-gray-950 whitespace-nowrap"
              >
                <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" aria-hidden="true" />
                New Business Unit
              </button>
            </PermissionGate>
          }
        />
        
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5" role="group" aria-label="Business Unit statistics filters">
          <StatCard 
            icon={Building2} 
            label="Total Units" 
            value={meta?.total ?? 0} 
            gradient="bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600" 
            onClick={() => { setStatusFilter('all'); setPage(1); }}
            isActive={statusFilter === 'all'}
          />
          <StatCard 
            icon={CheckCircle2} 
            label="Active" 
            value={meta?.total_active ?? 0} 
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600" 
            onClick={() => { setStatusFilter('active'); setPage(1); }}
            isActive={statusFilter === 'active'}
          />
          <StatCard 
            icon={XCircle} 
            label="Inactive" 
            value={meta?.total_inactive ?? 0} 
            gradient="bg-gradient-to-br from-amber-500 to-orange-500" 
            onClick={() => { setStatusFilter('inactive'); setPage(1); }}
            isActive={statusFilter === 'inactive'}
          />
          <StatCard 
            icon={Archive} 
            label="Archived" 
            value={meta?.total_deleted ?? 0} 
            gradient="bg-gradient-to-br from-rose-500 to-pink-600" 
            onClick={() => { setStatusFilter('deleted'); setPage(1); }}
            isActive={statusFilter === 'deleted'}
          />
          {/* H-04 FIX: Use server-side total_main_branches aggregate (all pages) not page-local filter */}
          <StatCard
            label="Main Branches"
            value={meta?.total_main_branches ?? 0}
            icon={Star}
            gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
            subLabel="across all units"
            onClick={() => { setStatusFilter('main_branch'); setPage(1); }}
            isActive={statusFilter === 'main_branch'}
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 shadow-sm">
          <RefetchBar visible={isFetching && !isLoading} />

          <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 px-5 py-3.5">
            <div className="relative w-full xl:max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="search" 
                placeholder="Search units..." 
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-2.5 pl-10 pr-8 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all hover:border-gray-300 dark:hover:border-gray-600"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <div
                className="hidden sm:inline-flex items-center gap-1 bg-gray-50/80 dark:bg-gray-800/40 p-1 rounded-2xl border border-gray-100 dark:border-gray-700/50"
                role="tablist"
              >
                {[
                  { label: 'All', value: 'all', count: meta?.total },
                  { label: 'Active', value: 'active', count: meta?.total_active },
                  { label: 'Inactive', value: 'inactive', count: meta?.total_inactive },
                  { label: 'Archived', value: 'deleted', count: meta?.total_deleted }
                ].map(tab => {
                  const isSelected = statusFilter === tab.value;
                  return (
                    <button
                      key={tab.value}
                      role="tab"
                      aria-selected={isSelected}
                      onClick={() => setStatusFilter(tab.value as any)}
                      className={`relative inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-200 ${
                        isSelected
                          ? 'bg-white dark:bg-gray-800 text-violet-700 dark:text-violet-400 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <span className="relative z-10">{tab.label}</span>
                      {tab.count !== undefined && tab.count !== null && (
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
              
              <div className="flex items-center gap-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 shadow-sm">
                <select 
                  className="bg-transparent focus:outline-none appearance-none pr-4 cursor-pointer"
                  value={ordering}
                  onChange={e => setOrdering(e.target.value)}
                >
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <button onClick={() => refetch()} className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-all shadow-sm">
                <RefreshCcw className="h-4 w-4" />
              </button>
              <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />
            </div>
          </div>
          

          <div id="unit-data-panel" role="tabpanel" className="p-0">
        {isLoading ? (
          <div className="p-6">
            <PageSkeleton variant="list" statCards={5} rows={6} />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertTriangle className="h-10 w-10 text-rose-500 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Failed to load</h3>
            <button onClick={() => refetch()} className="mt-4 text-sm font-semibold text-violet-600 hover:underline">Try again</button>
          </div>
        ) : units.length === 0 ? (
          <EmptyState
            icon={GitBranch}
            title="No Business Units Found"
            description="Adjust your filters or create a new unit to get started."
            hasFilters={statusFilter !== 'all' || debouncedSearch.trim().length > 0}
            onClear={() => { setStatusFilter('all'); setSearchInput(''); }}
            onCreate={handleCreate}
            createLabel="New Business Unit"
            createPermission="business_unit.create"
          />
        ) : viewMode === 'grid' ? (
          <CardGrid
            density="comfortable"
            isEmpty={units.length === 0}
            emptyState={
              <EmptyState
                icon={GitBranch}
                title="No Business Units Found"
                description="Adjust your filters or create a new unit to get started."
                hasFilters={statusFilter !== 'all' || debouncedSearch.trim().length > 0}
                onClear={() => { setStatusFilter('all'); setSearchInput(''); }}
                onCreate={handleCreate}
                createLabel="New Business Unit"
                createPermission="business_unit.create"
              />
            }
          >
            {units.map((bu, idx) => (
              <div
                key={bu.id}
                className={`flex flex-col h-full animate-fadeInUp delay-${Math.min(idx * 50, 300)}`}
              >
                <EntityCard
                  id={bu.id}
                  density="comfortable"
                  title={bu.name}
                  subtitle={bu.code}
                  badge={bu.is_main_branch ? <span title="Main Branch" className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-amber-100 text-amber-600"><Star className="h-3 w-3 fill-amber-500" /></span> : undefined}
                  avatar={<EntityAvatar name={bu.name} logoUrl={bu.logo_url} size={40} />}
                  statusBadge={<StatusBadge status={getEntityStatus(bu.is_deleted, bu.is_active)} />}
                  isSelected={false}
                  onSelect={undefined}
                  onClick={() => handleView(bu)}
                  metrics={[
                    { label: 'Domain', value: bu.business_domain_name || '—', icon: <Building2 className="h-3.5 w-3.5" /> },
                    { label: 'Org', value: bu.organization_name || '—', icon: <Building2 className="h-3.5 w-3.5" /> },
                    { label: 'Users', value: bu.users_count ?? 0, icon: <Users className="h-3.5 w-3.5" /> },
                  ]}
                  actions={[
                    { label: 'View Details', icon: <Eye className="h-4 w-4" />, onClick: () => handleView(bu) },
                    { label: 'Edit Unit', intent: 'edit', icon: <Edit2 className="h-4 w-4" />, onClick: () => handleEdit(bu) },
                    bu.is_deleted
                      ? { label: 'Restore Unit', intent: 'restore', icon: <RotateCcw className="h-4 w-4" />, onClick: () => setConfirmDialog({ type: 'restore', bu }) }
                      : { label: 'Archive Unit', intent: 'archive', icon: <Archive className="h-4 w-4" />, danger: true, onClick: () => setConfirmDialog({ type: 'archive', bu }) },
                  ]}
                />
              </div>
            ))}
          </CardGrid>
        ) : (
          <div className="overflow-auto max-h-[calc(100vh-380px)]">
            <table className="w-full text-sm text-left relative animate-fadeInUp">
              <thead className="sticky top-0 z-20 bg-gradient-to-r from-violet-700 via-purple-700 to-fuchsia-700 text-white shadow-md">
                  <tr className="divide-x divide-dashed divide-white/20">
                    {[
                      { key: 'Unit',       label: 'Business Unit' },
                      { key: 'Code',       label: 'Code'          },
                      { key: 'Status',     label: 'Status'        },
                      { key: 'Org',        label: 'Organization'  },
                      { key: 'Location',   label: 'Location'      },
                      { key: 'Users',      label: 'Users'         },
                      { key: 'Created',    label: 'Created'       },
                      { key: 'Actions',    label: 'Actions'       }
                    ].map(h => (
                      <th key={h.key} className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                        {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 border-b border-gray-200 dark:border-gray-800">
                  {units.map((bu, i) => (
                    <tr 
                      key={bu.id} 
                      className="group transition-colors divide-x divide-dashed divide-gray-200 dark:divide-gray-800 hover:bg-gray-50/70 dark:hover:bg-gray-800/40 bg-white dark:bg-gray-900"
                    >
                      <td className="px-4 py-3.5 min-w-[180px]">
                        <button onClick={() => handleView(bu)} className="flex items-center gap-3 group text-left transition-colors w-full">
                          <EntityAvatar name={bu.name} logoUrl={bu.logo_url} size={36} />
                          <div className="min-w-0">
                            <div className="text-[14px] font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate flex items-center gap-1">
                              {bu.name}
                              {bu.is_main_branch && <span title="Main Branch"><Star className="h-3 w-3 text-amber-500 fill-amber-500" /></span>}
                            </div>
                            <div className="text-xs text-gray-500">Domain: {bu.business_domain_name || '—'}</div>
                          </div>
                        </button>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap"><CopyChip value={bu.code} label="unit code" /></td>
                      <td className="px-4 py-3.5"><StatusBadge status={getEntityStatus(bu.is_deleted, bu.is_active)} /></td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                          <Building2 className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
                          <span className="font-medium text-sm">{bu.organization_name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                          <MapPin className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />
                          <span className="text-sm">{bu.city ? `${bu.city}${bu.country ? `, ${bu.country}` : ''}` : '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                          <span className={`font-bold tabular-nums text-sm ${(bu.users_count ?? 0) > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                            {bu.users_count ?? 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <Calendar className="h-3 w-3 shrink-0 text-blue-400" aria-hidden="true" />
                          {bu.created_at ? formatIST(bu.created_at, 'dd MMM yyyy') : '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex justify-end" onClick={e => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                aria-label={`Actions for ${bu.name}`}
                                className="flex h-8 w-8 items-center justify-center rounded-xl border border-transparent text-gray-400 transition-all hover:border-gray-200 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:opacity-100 data-[state=open]:border-gray-200 data-[state=open]:bg-gray-50 data-[state=open]:text-gray-900 data-[state=open]:shadow-sm dark:hover:border-gray-700 dark:hover:bg-gray-800/50 dark:hover:text-white dark:data-[state=open]:border-gray-700 dark:data-[state=open]:bg-gray-800/50 dark:data-[state=open]:text-white"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-60 rounded-2xl border border-gray-100 bg-white/95 p-2 shadow-xl shadow-gray-200/50 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/95 dark:shadow-gray-900/50">
                              <DropdownMenuLabel className="px-2.5 py-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                <span className="block truncate text-indigo-600 dark:text-indigo-400">{bu.name}</span>
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator className="my-1 bg-gray-100 dark:bg-gray-800" />

                              <DropdownMenuItem onClick={() => handleView(bu)} className="flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900 focus:bg-gray-50 focus:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800/50 dark:hover:text-white dark:focus:bg-gray-800/50 dark:focus:text-white">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                  <Eye className="h-4 w-4" />
                                </div>
                                View Details
                              </DropdownMenuItem>

                              {!bu.is_deleted && (
                                <PermissionGate permission="business_unit.update">
                                  <DropdownMenuItem onClick={() => handleEdit(bu)} className="flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium text-violet-700 transition-colors hover:bg-violet-50 hover:text-violet-800 focus:bg-violet-50 focus:text-violet-800 dark:text-violet-400 dark:hover:bg-violet-900/20 dark:hover:text-violet-300 dark:focus:bg-violet-900/20 dark:focus:text-violet-300">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400">
                                      <Edit2 className="h-4 w-4" />
                                    </div>
                                    Edit Unit
                                  </DropdownMenuItem>
                                </PermissionGate>
                              )}

                              <DropdownMenuSeparator className="my-1 bg-gray-100 dark:bg-gray-800" />

                              <PermissionGate permission="business_unit.delete">
                                {bu.is_deleted ? (
                                  <DropdownMenuItem
                                    onClick={() => setConfirmDialog({ type: 'restore', bu })}
                                    className="flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50 hover:text-emerald-800 focus:bg-emerald-50 focus:text-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-300 dark:focus:bg-emerald-900/20 dark:focus:text-emerald-300"
                                  >
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                                      <RotateCcw className="h-4 w-4" />
                                    </div>
                                    Restore Unit
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => setConfirmDialog({ type: 'archive', bu })}
                                    className="flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50 hover:text-rose-800 focus:bg-rose-50 focus:text-rose-800 dark:text-rose-400 dark:hover:bg-rose-900/20 dark:hover:text-rose-300 dark:focus:bg-rose-900/20 dark:focus:text-rose-300"
                                  >
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400">
                                      <Archive className="h-4 w-4" />
                                    </div>
                                    Archive Unit
                                  </DropdownMenuItem>
                                )}
                              </PermissionGate>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {(meta?.total ?? 0) > 0 && (
          <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 px-5 py-3 bg-gray-50/40 dark:bg-gray-900/40">
            <p className="text-xs text-gray-500 dark:text-gray-400" aria-live="polite">
              Showing{' '}
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {((page - 1) * PAGE_SIZE) + 1}—{Math.min(page * PAGE_SIZE, meta?.total ?? 0)}
              </span>
              {' '}of{' '}
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {meta?.total ?? 0}
              </span>
              {' '}units
            </p>
            {totalPages > 1 && (
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2 mb-2">
              {confirmDialog.type === 'archive' ? <Archive className="h-6 w-6 text-rose-500" /> : <RotateCcw className="h-6 w-6 text-emerald-500" />}
              {confirmDialog.type === 'archive' ? 'Archive Business Unit' : 'Restore Business Unit'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {confirmDialog.type === 'archive'
                ? `Are you sure you want to archive "${confirmDialog.bu.name}"? It will be hidden from all active lists.`
                : `Restore "${confirmDialog.bu.name}"? It will become active and visible again.`}
            </p>
            {confirmDialog.type === 'archive' && (
              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Reason for archiving (Optional)</label>
                <textarea
                  value={confirmReason}
                  onChange={e => setConfirmReason(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3 text-sm focus:border-rose-500 focus:ring-rose-500"
                  placeholder="Why is this being archived?"
                />
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDialog(null)} className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors">
                Cancel
              </button>
              <button
                onClick={executeConfirmAction}
                disabled={isConfirming}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white shadow-lg transition-all ${
                  confirmDialog.type === 'archive'
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/30'
                }`}
              >
                {isConfirming ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmDialog.type === 'archive' ? 'Archive' : 'Restore'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
