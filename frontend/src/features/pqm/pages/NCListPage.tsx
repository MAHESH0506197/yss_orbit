import React, { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ClipboardList, Plus, Eye, Edit2 } from 'lucide-react';
import { usePqmStore } from "../store/usePqmStore";
import { NCStatusBadge } from "../components/NCStatusBadge";
import { NCPriorityTag } from "../components/NCPriorityTag";
import { SLACountdown } from "../components/SLACountdown";
import type { NCFilters, NonConformance, NCStatus } from "../types";

import { PageHeader } from '@/components/ui/PageHeader';
import { SectionCard } from '@/components/platform/SectionCard';
import { FilterBar } from '@/components/platform/FilterBar';
import { CardGrid } from '@/components/platform/CardGrid';
import { EntityCard } from '@/components/platform/EntityCard';
import { EntityAvatar } from '@/components/platform/EntityAvatar';
import { EmptyState } from '@/components/platform/EmptyState';
import { useViewMode } from '@/hooks/useViewMode';
import { RefetchBar } from '@/components/ui/RefetchBar';
import { CopyChip } from '@/components/platform/CopyChip';

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "Draft", label: "Draft" },
  { value: "Submitted", label: "Submitted" },
  { value: "Approved", label: "Approved" },
  { value: "Assigned", label: "Assigned" },
  { value: "In Progress", label: "In Progress" },
  { value: "Verification Pending", label: "Verification Pending" },
  { value: "Closed", label: "Closed" },
  { value: "Rejected", label: "Rejected" },
];

const SORT_OPTIONS = [
  { label: 'Newest First',  value: '-created_at' },
  { label: 'Oldest First',  value: 'created_at'  },
  { label: 'NC Number A→Z', value: 'nc_number'   },
  { label: 'NC Number Z→A', value: '-nc_number'  },
];

export default function NCListPage() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  const {
    ncList, ncListLoading, ncListTotal, ncListPage, ncFilters,
    fetchNcList, setFilters, resetFilters, setPage,
  } = usePqmStore();

  useEffect(() => {
    if (projectId && ncFilters.project !== projectId) {
      setFilters({ project: projectId });
    }
  }, [projectId, ncFilters.project, setFilters]);

  const [viewMode, setViewMode, density, setDensity] = useViewMode('pqmNCs', 'table');
  const [searchInput, setSearchInput] = useState(ncFilters.search || "");
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(ncList.map((nc) => String(nc.id))));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) newSet.add(id);
    else newSet.delete(id);
    setSelectedIds(newSet);
  };

  const handleBulkExport = async () => {
    if (selectedIds.size === 0) return;
    try {
      await fetch('/pqm/nc/bulk-action/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'export', nc_ids: Array.from(selectedIds) })
      });
      setSelectedIds(new Set());
    } catch (e) {
      console.error('Failed to export', e);
    }
  };

  useEffect(() => {
    fetchNcList();
  }, []);

  // Handle debounced search
  useEffect(() => {
    setIsSearching(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (searchInput !== ncFilters.search) {
        setFilters({ search: searchInput });
        fetchNcList(undefined, 1);
      }
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput, ncFilters.search, setFilters, fetchNcList]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      if (inInput) return;
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        projectId ? navigate(`/pqm/nc-management/${projectId}/nc/create`) : navigate("/pqm/nc-management/nc/create");
      }
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        fetchNcList(undefined, ncListPage);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, fetchNcList, ncListPage]);

  const handleFilterClick = useCallback((statusValue: string) => {
    setFilters({ status: statusValue as NCStatus | "" });
    fetchNcList(undefined, 1);
  }, [setFilters, fetchNcList]);

  const clearAllFilters = useCallback(() => {
    setSearchInput("");
    resetFilters();
    fetchNcList(undefined, 1);
  }, [resetFilters, fetchNcList]);

  const hasActiveFilters = Boolean(ncFilters.status || searchInput);

  const totalPages = Math.ceil(ncListTotal / 25);

  const handleCreate = () => projectId ? navigate(`/pqm/nc-management/${projectId}/nc/create`) : navigate("/pqm/nc-management/nc/create");

  const newNCButton = (
    <button
      onClick={handleCreate}
      aria-label="Raise new NC (N)"
      title="Raise NC (N)"
      className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/40 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:ring-offset-gray-950 whitespace-nowrap"
    >
      <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" aria-hidden="true" />
      Raise NC
      <kbd className="hidden sm:inline-flex ml-1 items-center rounded border border-violet-400/40 bg-violet-700/30 px-1.5 py-0.5 font-mono text-[10px] text-violet-200">
        N
      </kbd>
    </button>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pb-16">
      <PageHeader
        icon={ClipboardList}
        iconGradient="from-indigo-500 to-blue-600"
        title="Non-Conformances"
        subtitle={projectId ? "Manage and track non-conformances for this project." : "Manage and track PQM non-conformances across all your projects and contractors."}
        countBadge={ncListTotal}
        countBadgeLabel={`${ncListTotal} total records`}
        actions={newNCButton}
      />

      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 shadow-sm">
        <RefetchBar visible={ncListLoading} />

        <FilterBar
          search={searchInput}
          onSearch={setSearchInput}
          placeholder="Search NC number or title…"
          isSearching={isSearching}
          sortOptions={SORT_OPTIONS}
          sort="-created_at"
          onSort={() => {}} // Store currently doesn't support generic sort, placeholder for now
          viewMode={viewMode}
          onViewMode={setViewMode}
          isFetching={ncListLoading}
          onRefresh={() => fetchNcList(undefined, ncListPage)}
          rightSlot={
            <div className="hidden sm:inline-flex items-center gap-1 bg-gray-50/80 dark:bg-gray-800/40 p-1 rounded-2xl border border-gray-100 dark:border-gray-700/50">
              {STATUS_OPTIONS.slice(0, 5).map(tab => {
                const isSelected = ncFilters.status === tab.value;
                return (
                  <button
                    key={tab.label}
                    onClick={() => handleFilterClick(tab.value)}
                    className={`relative inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-200 ${
                      isSelected
                        ? 'bg-white dark:bg-gray-800 text-violet-700 dark:text-violet-400 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          }
        />

        <div role="tabpanel" aria-live="polite">
          {selectedIds.size > 0 && (
            <div className="bg-violet-50 dark:bg-violet-900/20 px-4 py-3 border-b border-violet-100 dark:border-violet-800/30 flex items-center justify-between">
              <span className="text-sm font-semibold text-violet-700 dark:text-violet-400">
                {selectedIds.size} selected
              </span>
              <button
                onClick={handleBulkExport}
                className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-violet-700 transition-colors"
              >
                Export Selected
              </button>
            </div>
          )}
          {viewMode === 'grid' ? (
            <CardGrid
              density={density}
              isEmpty={ncList.length === 0}
              emptyState={
                <EmptyState
                  title={hasActiveFilters ? 'No NCs Match' : 'No Non-Conformances Yet'}
                  description={hasActiveFilters ? 'Try adjusting your search or status filter.' : 'Raise your first NC to get started.'}
                  hasFilters={hasActiveFilters}
                  onClear={clearAllFilters}
                  onCreate={handleCreate}
                  createLabel="Raise First NC"
                />
              }
            >
              {ncList.map((nc, i) => (
                <div key={nc.id} style={{ animationDelay: `${i * 40}ms` }} className="flex flex-col h-full animate-fadeInUp">
                  <EntityCard
                    id={nc.id}
                    density={density}
                    title={nc.title}
                    subtitle={nc.nc_number || 'DRAFT'}
                    avatar={<EntityAvatar name={nc.title} size={40} />}
                    statusBadge={<NCStatusBadge status={nc.status} size="sm" />}
                    onClick={() => projectId ? navigate(`/pqm/nc-management/${projectId}/nc/${nc.id}`) : navigate(`/pqm/nc-management/nc/${nc.id}`)}
                    metrics={[
                      { label: 'Priority', value: nc.priority },
                    ]}
                    actions={[
                      { label: 'View Details', icon: <Eye className="h-4 w-4" />, onClick: () => projectId ? navigate(`/pqm/nc-management/${projectId}/nc/${nc.id}`) : navigate(`/pqm/nc-management/nc/${nc.id}`) },
                      { label: 'Edit NC', icon: <Edit2 className="h-4 w-4" />, onClick: () => projectId ? navigate(`/pqm/nc-management/${projectId}/nc/${nc.id}/edit`) : navigate(`/pqm/nc-management/nc/${nc.id}/edit`) },
                      { label: 'Go to Project Details', icon: <Eye className="h-4 w-4" />, onClick: () => navigate(`/platform/projects/${nc.project}`) },
                    ]}
                  />
                </div>
              ))}
            </CardGrid>
          ) : (
            ncList.length === 0 ? (
              <EmptyState
                title={hasActiveFilters ? 'No NCs Match' : 'No Non-Conformances Yet'}
                description={hasActiveFilters ? 'Try adjusting your search or status filter.' : 'Raise your first NC to get started.'}
                hasFilters={hasActiveFilters}
                onClear={clearAllFilters}
                onCreate={handleCreate}
                createLabel="Raise First NC"
              />
            ) : (
              <div className="overflow-auto max-h-[calc(100vh-380px)]">
                <table className="w-full text-sm text-left relative">
                  <thead className="sticky top-0 z-20 bg-gradient-to-r from-violet-700 via-purple-700 to-fuchsia-700 text-white shadow-md">
                    <tr className="divide-x divide-dashed divide-white/20">
                      <th className="px-4 py-3.5 w-10 text-center">
                        <input
                          type="checkbox"
                          className="rounded border-white/30 bg-white/10 text-violet-500 focus:ring-white/20"
                          checked={ncList.length > 0 && selectedIds.size === ncList.length}
                          onChange={handleSelectAll}
                        />
                      </th>
                      {[
                        { key: 'Title',    label: 'Title' },
                        { key: 'NCNumber', label: 'NC Number' },
                        { key: 'Status',   label: 'Status' },
                        { key: 'Priority', label: 'Priority' },
                        { key: 'Raised',   label: 'Raised' },
                        { key: 'SLA',      label: 'SLA' },
                      ].map(h => (
                        <th key={h.key} className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          {h.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 border-b border-gray-200 dark:border-gray-800">
                    {ncList.map((nc, i) => (
                      <tr
                        key={nc.id}
                        className={`group transition-colors divide-x divide-dashed divide-gray-200 dark:divide-gray-800 hover:bg-gray-50/70 dark:hover:bg-gray-800/40 animate-fadeInUp cursor-pointer ${selectedIds.has(String(nc.id)) ? 'bg-violet-50 dark:bg-violet-900/10' : 'bg-white dark:bg-gray-900'}`}
                        style={{ animationDelay: `${i * 30}ms` }}
                        onClick={() => projectId ? navigate(`/pqm/nc-management/${projectId}/nc/${nc.id}`) : navigate(`/pqm/nc-management/nc/${nc.id}`)}
                      >
                        <td className="px-4 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                            checked={selectedIds.has(String(nc.id))}
                            onChange={(e) => handleSelectOne(String(nc.id), e.target.checked)}
                          />
                        </td>
                        <td className="px-4 py-3.5 min-w-[200px]">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              projectId ? navigate(`/pqm/nc-management/${projectId}/nc/${nc.id}`) : navigate(`/pqm/nc-management/nc/${nc.id}`);
                            }}
                            aria-label={`View details for ${nc.title}`}
                            className="flex items-center gap-3 group text-left transition-colors w-full"
                          >
                            <EntityAvatar name={nc.title} size={36} />
                            <div className="min-w-0">
                              <div className="text-[14px] font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                                {nc.title}
                              </div>
                            </div>
                          </button>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <CopyChip value={nc.nc_number || 'DRAFT'} />
                            {nc.is_safety_critical && (
                              <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                                SC
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <NCStatusBadge status={nc.status} />
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <NCPriorityTag priority={nc.priority} />
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-gray-500">
                          {nc.raised_date}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {nc.target_closure_date && !["Closed", "Merged", "Rejected"].includes(nc.status) ? (
                            <SLACountdown targetClosureDate={nc.target_closure_date} isSafetyCritical={nc.is_safety_critical} />
                          ) : <span className="text-gray-400">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/20 px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => setPage(ncListPage - 1)}
                disabled={ncListPage === 1}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(ncListPage + 1)}
                disabled={ncListPage >= totalPages}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing page <span className="font-semibold text-gray-900 dark:text-white">{ncListPage}</span> of <span className="font-semibold text-gray-900 dark:text-white">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => setPage(ncListPage - 1)}
                    disabled={ncListPage === 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                  >
                    <span className="sr-only">Previous</span>
                    &larr;
                  </button>
                  <button
                    onClick={() => setPage(ncListPage + 1)}
                    disabled={ncListPage >= totalPages}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                  >
                    <span className="sr-only">Next</span>
                    &rarr;
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

