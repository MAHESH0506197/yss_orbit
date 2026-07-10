import React, { useState, useMemo, useCallback } from 'react';
import {
  Users, Plus, CheckCircle2, XCircle, MoreHorizontal, UserCheck,
  ShieldOff, Trash2, Search, ChevronLeft, ChevronRight,
  RefreshCcw, Link2, Building2, Shield, Loader2, X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { RefetchBar } from '@/components/ui/RefetchBar';
import { BuAssignFormModal } from './components/BuAssignFormModal';
import {
  useUserBusinessUnits, useCreateUBU,
} from './hooks/useUserBusinessUnits';
import type { UserBusinessUnitMembership, UserBusinessUnitCreatePayload } from './types/userBusinessUnitTypes';
import { DataTable } from '@/components/ui/DataTable';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { useViewMode } from '@/hooks/useViewMode';
import { ViewModeToggle } from '@/components/platform/ViewModeToggle';
import { CardGrid } from '@/components/platform/CardGrid';
import { EntityCard } from '@/components/platform/EntityCard';
import { MODULE_ROUTES } from '@/routes/AppRouter';

export interface UserBusinessUnitListPageProps {
  className?: string;
}

// ─── Grouped Interface ────────────────────────────────────────────────────────
export interface UserGroupedMembership {
  user: string;
  userEmail: string;
  userFullName: string;
  businessUnitsCount: number;
  rolesCount: number;
  isActive: boolean;
  joinedAt: string;
  memberships: UserBusinessUnitMembership[];
}


// ─── Premium Empty State ─────────────────────────────────────────────────────
function EmptyState({
  hasFilters,
  onClear,
  onCreate,
}: {
  hasFilters: boolean;
  onClear: () => void;
  onCreate: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div
        className={`flex h-20 w-20 items-center justify-center rounded-3xl mb-5 shadow-sm ring-1 ${
          hasFilters
            ? 'bg-gray-50/50 dark:bg-gray-800/50 ring-gray-200 dark:ring-gray-800'
            : 'bg-violet-50/50 dark:bg-violet-500/10 ring-violet-100 dark:ring-violet-500/20'
        }`}
      >
        <Link2
          className={`h-10 w-10 ${hasFilters ? 'text-gray-400 dark:text-gray-500' : 'text-violet-500 dark:text-violet-400'}`}
          aria-hidden="true"
        />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {hasFilters ? 'No Mappings Match Your Filters' : 'No User-BU Mappings Yet'}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm leading-relaxed">
        {hasFilters
          ? 'Try adjusting your search query or status filter to find what you\'re looking for.'
          : 'Assign your first user to a business unit to start mapping access.'}
      </p>
      {hasFilters ? (
        <button
          onClick={onClear}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
        >
          <X className="h-4 w-4" aria-hidden="true" /> Clear Filters
        </button>
      ) : (
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/40 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
        >
          <Plus className="h-4 w-4" aria-hidden="true" /> Assign First User
        </button>
      )}
    </div>
  );
}

export const UserBusinessUnitListPage: React.FC<UserBusinessUnitListPageProps> = () => {
  // ── Server-side state ─────────────────────────────────────────────────────
  const [page, setPage]             = useState(1);
  const [pageSize]                  = useState(50); // Increased page size for better client grouping
  const [search, setSearch]         = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const isActiveParam = statusFilter === 'active'   ? true
                      : statusFilter === 'inactive' ? false
                      : undefined;

  // ── React Query ───────────────────────────────────────────────────────────
  const { data, isLoading, error, refetch } = useUserBusinessUnits({
    page,
    page_size:  pageSize,
    search:     search || undefined,
    is_active:  isActiveParam,
  });

  const results   = data?.results ?? [];
  const meta      = data?.meta;
  const totalPages = (meta as any)?.total_pages ?? 1;

  // ── Group by User ─────────────────────────────────────────────────────────
  const groupedResults = useMemo(() => {
    const map = new Map<string, UserGroupedMembership>();
    results.forEach((m: UserBusinessUnitMembership) => {
      if (!map.has(m.user)) {
        map.set(m.user, {
          user: m.user,
          userEmail: m.userEmail,
          userFullName: m.userFullName,
          businessUnitsCount: 0,
          rolesCount: 0,
          isActive: false,
          joinedAt: m.joinedAt,
          memberships: []
        });
      }
      const group = map.get(m.user)!;
      group.memberships.push(m);
      group.businessUnitsCount += 1;
      if (m.roleName) group.rolesCount += 1;
      if (m.isActiveMembership) group.isActive = true;
      if (new Date(m.joinedAt) < new Date(group.joinedAt)) {
        group.joinedAt = m.joinedAt;
      }
    });
    return Array.from(map.values());
  }, [results]);

  // ── Mutations (RQ — automatic cache invalidation) ─────────────────────────
  const createMutation = useCreateUBU();

  // ── UI state ──────────────────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen]     = useState(false);

  const viewModeResult  = useViewMode('userBuList', 'grid');
  const viewMode   = viewModeResult[0];
  const setViewMode = viewModeResult[1];
  const density    = viewModeResult[2];
  const setDensity = viewModeResult[3];
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // ── KPI from server meta ──────────────────────────────────────────────────
  const kpi = useMemo(() => ({
    total:    (meta as any)?.total         ?? 0,
    active:   (meta as any)?.total_active  ?? 0,
    inactive: (meta as any)?.total_inactive ?? 0,
  }), [meta]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCreate = useCallback(async (data: UserBusinessUnitCreatePayload) => {
    await createMutation.mutateAsync(data);
    setIsModalOpen(false);
  }, [createMutation]);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  }, [searchInput]);

  const handleFilterChange = useCallback((f: 'all' | 'active' | 'inactive') => {
    setStatusFilter(f);
    setPage(1);
  }, []);

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns = useMemo(() => [
    {
      id: 'select',
      header: ({ table }: any) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          aria-label="Select all"
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer bg-white dark:bg-gray-800 dark:border-gray-700"
        />
      ),
      cell: ({ row }: any) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          aria-label="Select row"
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer bg-white dark:bg-gray-800 dark:border-gray-700"
        />
      ),
    },
    {
      header: 'User',
      accessorKey: 'userEmail',
      cell: (info: any) => {
        const m = info.row.original as UserGroupedMembership;
        const displayName = m.userFullName || m.userEmail || '—';
        const initial = displayName.charAt(0).toUpperCase();
        return (
          <div className="flex items-center gap-3 group w-full">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/30 text-violet-600 dark:text-violet-400 font-bold shadow-sm">
              {initial}
            </div>
            <div className="flex min-w-0 flex-col">
              <Link
                to={MODULE_ROUTES.userBuMappingDetail(m.user)}
                className="text-[14px] font-bold text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate"
              >
                {displayName}
              </Link>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Business Units',
      accessorKey: 'businessUnitsCount',
      cell: (info: any) => {
        const m = info.row.original as UserGroupedMembership;
        return (
          <div className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
            <span className={`font-bold tabular-nums text-sm ${m.businessUnitsCount > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
              {m.businessUnitsCount}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Roles',
      accessorKey: 'rolesCount',
      cell: (info: any) => {
        const m = info.row.original as UserGroupedMembership;
        return (
          <div className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-violet-400" aria-hidden="true" />
            <span className={`font-bold tabular-nums text-sm ${m.rolesCount > 0 ? 'text-violet-600 dark:text-violet-400' : 'text-gray-400'}`}>
              {m.rolesCount}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (info: any) => {
        const m = info.row.original as UserGroupedMembership;
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={`Actions for ${m.userFullName || m.userEmail}`}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-transparent text-gray-400 transition-all hover:border-gray-200 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:opacity-100 data-[state=open]:border-gray-200 data-[state=open]:bg-gray-50 data-[state=open]:text-gray-900 data-[state=open]:shadow-sm dark:hover:border-gray-700 dark:hover:bg-gray-800/50 dark:hover:text-white dark:data-[state=open]:border-gray-700 dark:data-[state=open]:bg-gray-800/50 dark:data-[state=open]:text-white"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl border border-gray-100 bg-white/95 p-2 shadow-xl shadow-gray-200/50 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/95 dark:shadow-gray-900/50">
                <DropdownMenuLabel className="px-2.5 py-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <span className="block truncate text-violet-600 dark:text-violet-400">{m.userFullName || m.userEmail}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1 bg-gray-100 dark:bg-gray-800" />
                <DropdownMenuItem asChild className="flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900 focus:bg-gray-50 focus:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800/50 dark:hover:text-white dark:focus:bg-gray-800/50 dark:focus:text-white">
                  <Link to={MODULE_ROUTES.userBuMappingDetail(m.user)}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      <Link2 className="h-4 w-4" />
                    </div>
                    View / Edit Mappings
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], []);

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
        <span>Failed to load memberships.</span>
        <button onClick={() => refetch()} className="font-semibold underline hover:no-underline">Retry</button>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pb-16">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <PageHeader
        icon={Users}
        iconGradient="from-violet-500 via-purple-500 to-fuchsia-600"
        title="User Access Mappings"
        subtitle="Manage user access across multiple Business Units and Roles"
        countBadge={groupedResults.length}
        countBadgeLabel={`${groupedResults.length} users on this page`}
        actions={
          <button
            onClick={() => setIsModalOpen(true)}
            aria-label="Assign User"
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/40 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:ring-offset-gray-950 whitespace-nowrap"
          >
            <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" aria-hidden="true" />
            Assign User
          </button>
        }
      />

      {/* ── KPI StatCards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <button onClick={() => handleFilterChange('all')} className="text-left">
          <StatCard
            label="Total Mappings"
            value={(meta as any)?.total ?? results.length}
            icon={Link2}
            gradient="bg-gradient-to-br from-violet-500 to-purple-600"
          />
        </button>
        <button onClick={() => handleFilterChange('active')} className="text-left">
          <StatCard
            label="Active Users"
            value={kpi.active || groupedResults.filter(g => g.isActive).length}
            icon={UserCheck}
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          />
        </button>
        <button onClick={() => handleFilterChange('inactive')} className="text-left">
          <StatCard
            label="Inactive"
            value={kpi.inactive || groupedResults.filter(g => !g.isActive).length}
            icon={ShieldOff}
            gradient="bg-gradient-to-br from-gray-400 to-gray-600"
          />
        </button>
        <button className="text-left">
          <StatCard
            label="Business Units"
            value={new Set(results.map((m: UserBusinessUnitMembership) => m.businessUnit)).size}
            icon={Building2}
            gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
          />
        </button>
      </div>

      {/* ── Main Data Card ────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 shadow-sm">

        {/* RefetchBar — top progress indicator during background refetch */}
        <RefetchBar visible={false} />

        {/* Toolbar */}
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 px-5 py-3.5">
          
          {/* Search */}
          <div className="relative w-full xl:max-w-xs flex-1">
            <form onSubmit={handleSearchSubmit}>
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" aria-hidden="true" />
              <input
                type="search"
                placeholder="Search memberships…"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                aria-label="Search memberships"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-2.5 pl-10 pr-8 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all hover:border-gray-300 dark:hover:border-gray-600"
              />
            </form>
          </div>

          <div className="flex w-full xl:w-auto items-center justify-between xl:justify-end gap-2 overflow-x-auto pb-1 xl:pb-0 hide-scrollbar">
            {/* Status filter chips */}
            <div className="flex items-center gap-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-1">
              {[
                { label: 'All', value: 'all' },
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleFilterChange(opt.value as any)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all capitalize whitespace-nowrap ${
                    statusFilter === opt.value
                      ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => refetch()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 transition-all hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm"
              title="Refresh"
            >
              <RefreshCcw className="h-4 w-4" />
            </button>

            <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} density={density} setDensity={setDensity} />
          </div>
        </div>

        {/* Data */}
        {groupedResults.length === 0 && !isLoading ? (
          <EmptyState
            hasFilters={searchInput !== '' || statusFilter !== 'all'}
            onClear={() => { setSearchInput(''); setStatusFilter('all'); setPage(1); }}
            onCreate={() => setIsModalOpen(true)}
          />
        ) : viewMode === 'grid' ? (
          <CardGrid
            isEmpty={groupedResults.length === 0}
            emptyState={<></>}
          >
            {groupedResults.map((m: UserGroupedMembership) => (
              <EntityCard
                key={m.user}
                id={m.user}
                density={density}
                title={m.userFullName || m.userEmail || '—'}
                subtitle={m.userEmail}
                isSelected={selectedIds.includes(m.user)}
                onSelect={checked => {
                  if (checked) setSelectedIds(p => [...p, m.user]);
                  else setSelectedIds(p => p.filter(id => id !== m.user));
                }}
                metrics={[
                  { label: 'Business Units', value: `${m.businessUnitsCount} Assigned`, icon: <Building2 className="h-3.5 w-3.5" /> },
                  { label: 'Roles', value: `${m.rolesCount} Assigned`, icon: <Shield className="h-3.5 w-3.5" /> },
                ]}
                actions={[
                  { 
                    label: 'Manage Access', 
                    icon: <Link2 />, 
                    onClick: () => {
                       // Handled implicitly by link but EntityCard onClick wrapper might be needed if custom EntityCard doesn't support Links cleanly
                       window.location.href = MODULE_ROUTES.userBuMappingDetail(m.user);
                    } 
                  },
                ]}
              />
            ))}
          </CardGrid>
        ) : (
          <div className="[&>div>div]:border-0 [&>div>div]:shadow-none [&>div>div]:rounded-none [&>div>div]:bg-transparent [&_thead]:bg-gradient-to-r [&_thead]:from-violet-700 [&_thead]:via-purple-700 [&_thead]:to-fuchsia-700 [&_thead_th]:!text-white [&_thead_th]:border-dashed [&_thead_th]:border-white/20 [&_thead_tr]:divide-x [&_thead_tr]:divide-dashed [&_thead_tr]:divide-white/20 [&_thead_th:last-child]:!bg-transparent [&_thead_th:last-child]:!border-white/20 [&_tbody_tr]:divide-x [&_tbody_tr]:divide-dashed [&_tbody_tr]:divide-gray-200 dark:[&_tbody_tr]:divide-gray-800">
            <DataTable data={groupedResults} columns={columns} isLoading={isLoading} enableGlobalFilter={false} />
          </div>
        )}

        {/* ── Server-side Pagination ──────────────────────────────────────── */}
        {(kpi.total > pageSize) && (
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 px-4 py-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Showing page <span className="font-semibold text-gray-700 dark:text-gray-300">{page}</span> of <span className="font-semibold text-gray-700 dark:text-gray-300">{totalPages}</span>
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1 || isLoading}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 transition-all hover:bg-gray-50 dark:hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = totalPages <= 5 ? i + 1
                        : page <= 3       ? i + 1
                        : page >= totalPages - 2 ? totalPages - 4 + i
                        : page - 2 + i;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                      p === page
                        ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm'
                        : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >{p}</button>
                );
              })}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isLoading}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 transition-all hover:bg-gray-50 dark:hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <BuAssignFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
};

export default UserBusinessUnitListPage;
