import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderGit2, Plus, Edit2, Eye,
  CheckCircle2, XCircle, AlertTriangle, MoreHorizontal,
  Search, X, GitBranch,
  ChevronLeft, ChevronRight, Building2, Loader2,
  ShieldAlert, Archive, RotateCcw, RefreshCcw, Check,
  Clock, Users, Code2, ArrowUpDown, Calendar, Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useQueryClient } from '@tanstack/react-query';
import { pqmService } from '../../api/pqmService';
import { useProjects } from '../../api/useProjects';
import type { PQMProject } from '../../types';
import { useUsers } from '@/features/iam/users/hooks/useUsers';

import { useAuthStore } from '@/store/authStore';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { RefetchBar } from '@/components/ui/RefetchBar';
import { PermissionGate, AnyPermissionGate } from '@/components/auth/PermissionGate';
import { useViewMode } from '@/hooks/useViewMode';
import { ViewModeToggle } from '@/components/platform/ViewModeToggle';
import { CardGrid } from '@/components/platform/CardGrid';
import { EntityCard } from '@/components/platform/EntityCard';
import { EntityAvatar } from '@/components/platform/EntityAvatar';
import { StatusBadge, getEntityStatus } from '@/components/platform/StatusBadge';
import { CopyChip } from '@/components/platform/CopyChip';
import { EmptyState } from '@/components/platform/EmptyState';
import { PageSkeleton } from '@/components/platform/PageSkeleton';
import { BulkActionBar } from '@/components/platform/BulkActionBar';
import { FilterBar } from '@/components/platform/FilterBar';
import { formatIST } from '@/utils/date';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';

const PAGE_SIZE = 20;
type StatusFilter = 'all' | 'active' | 'inactive' | 'deleted';

const SORT_OPTIONS = [
  { label: 'Name A→Z',      value: 'name'       },
  { label: 'Name Z→A',      value: '-name'      },
  { label: 'Code A→Z',      value: 'code'       },
  { label: 'Code Z→A',      value: '-code'      },
  { label: 'Newest First',  value: '-created_at' },
  { label: 'Oldest First',  value: 'created_at'  },
  { label: 'Active First',  value: '-is_active'  },
];

function ConfirmDialog({
  type,
  project,
  onCancel,
  onConfirm,
  isLoading,
}: {
  type: 'archive' | 'restore';
  project: PQMProject;
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
          <div className="flex items-center gap-4 mb-6">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
              type === 'archive' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'
            }`}>
              {type === 'archive' ? <Archive className="h-6 w-6" /> : <RotateCcw className="h-6 w-6" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {type === 'archive' ? 'Archive Project' : 'Restore Project'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {type === 'archive'
                  ? 'This will hide the project from active views.'
                  : 'This will make the project active again.'}
              </p>
            </div>
          </div>
          
          <div className={`flex items-center gap-3 rounded-xl px-4 py-3 mb-4 ${
            type === 'archive'
              ? 'bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800'
              : 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
          }`}>
            <EntityAvatar name={project.name} size={36} />
            <div>
              <div className="font-bold text-sm text-gray-900 dark:text-white">{project.name}</div>
              <code className="text-[11px] text-gray-500 dark:text-gray-400">{project.code}</code>
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
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
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

export const ProjectListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission, isSuperAdmin } = useAuthStore();
  const canManageProjects = isSuperAdmin || hasPermission('MANAGE_CONFIG');

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [ordering, setOrdering] = useState('name');
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewMode, setViewMode, density, setDensity] = useViewMode('pqmProjects', 'grid');

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

  const queryParams = useMemo(() => {
    const p: Record<string, any> = { page, page_size: PAGE_SIZE, ordering };
    if (statusFilter !== 'all') p.status = statusFilter;
    if (debouncedSearch.trim()) p.search = debouncedSearch.trim();
    return p;
  }, [page, statusFilter, debouncedSearch, ordering]);

  const { data, isLoading, isError, isFetching, refetch } = useProjects(queryParams);

  const { data: usersData } = useUsers({ is_active: true, page_size: 1000 });
  const users = useMemo(() => usersData?.results || [], [usersData]);

  const getUserName = useCallback((userId: string | null) => {
    if (!userId) return '-';
    const user = users.find((u) => u.id === userId);
    return user ? `${user.first_name} ${user.last_name}` : userId;
  }, [users]);

  const projects: PQMProject[] = useMemo(() => data?.results ?? [], [data]);
  const meta = (data as any)?.meta ?? null;
  const totalPages = meta?.total_pages ?? 1;
  const isRefetching = isFetching && !isLoading;

  const handleCreate = useCallback(() => navigate('/pqm/projects/create'), [navigate]);
  const handleEdit = useCallback((p: PQMProject) => navigate(`/pqm/projects/${p.id}/edit`), [navigate]);
  const handleView = useCallback((p: PQMProject) => navigate(`/pqm/projects/${p.id}`), [navigate]);

  const [confirmType, setConfirmType] = useState<'archive' | 'restore' | null>(null);
  const [confirmProject, setConfirmProject] = useState<PQMProject | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleDelete = (p: PQMProject) => {
    setConfirmProject(p);
    setConfirmType('archive');
  };

  const handleRestore = (p: PQMProject) => {
    setConfirmProject(p);
    setConfirmType('restore');
  };

  const executeConfirmAction = async (reason: string) => {
    if (!confirmProject || !confirmType) return;
    
    setIsConfirming(true);
    try {
      if (confirmType === 'archive') {
        await pqmService.deleteProject(confirmProject.id, reason);
        toast.success(`Archived project ${confirmProject.name}`);
      } else {
        await pqmService.restoreProject(confirmProject.id); // Assuming restoreProject also can take reason in future, but for now we just call it.
        toast.success(`Restored project ${confirmProject.name}`);
      }
      queryClient.invalidateQueries({ queryKey: ['pqm-projects'] });
      queryClient.invalidateQueries({ queryKey: ['pqm-project', confirmProject.id] });
      refetch();
    } catch (err) {
      toast.error(`Failed to ${confirmType} project`);
    } finally {
      setIsConfirming(false);
      setConfirmType(null);
      setConfirmProject(null);
    }
  };

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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
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
  }, [handleCreate, refetch]);

  const toggleSelect = useCallback((id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id));
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.length === projects.length) setSelectedIds([]);
    else setSelectedIds(projects.map(p => p.id));
  }, [selectedIds.length, projects]);

  if (isLoading) return <div className="p-6 max-w-7xl mx-auto"><PageSkeleton /></div>;

  if (isError) {
    return (
      <div className="p-6 max-w-7xl mx-auto" role="alert">
        <div className="flex items-start gap-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 p-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/40">
            <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h3 className="font-bold text-rose-800 dark:text-rose-300">Failed to load Projects</h3>
            <button onClick={() => refetch()} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700">
              <RefreshCcw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  const STATUS_TABS: { label: string; value: StatusFilter; count: number | null }[] = [
    { label: 'All',      value: 'all',      count: meta?.total ?? null },
    { label: 'Active',   value: 'active',   count: meta?.total_active ?? null },
    { label: 'Inactive', value: 'inactive', count: meta?.total_inactive ?? null },
    { label: 'Archived', value: 'deleted',  count: meta?.total_deleted ?? null },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      
      {/* Confirm Dialog */}
      {confirmType && confirmProject && (
        <ConfirmDialog
          type={confirmType}
          project={confirmProject}
          onCancel={() => {
            setConfirmType(null);
            setConfirmProject(null);
          }}
          onConfirm={executeConfirmAction}
          isLoading={isConfirming}
        />
      )}

      {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
      <PageHeader
        icon={FolderGit2}
        iconGradient="from-indigo-500 to-blue-600"
        title="Project Management"
        subtitle="Manage quality projects and access configurations."
        countBadge={meta?.total}
        countBadgeLabel={`${meta?.total ?? 0} total projects`}
        breadcrumbs={[{ label: 'PQM' }, { label: 'Project Management' }]}
        actions={
          canManageProjects && (
            <button
              onClick={handleCreate}
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl focus:outline-none"
            >
              <Plus className="h-4 w-4" />
              New Project
              <kbd className="hidden sm:inline-flex ml-1 items-center rounded border border-violet-400/40 bg-violet-700/30 px-1.5 py-0.5 font-mono text-[10px] text-violet-200">
                N
              </kbd>
            </button>
          )
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4" role="group">
        <StatCard
          label="Total Projects"
          value={meta?.total ?? projects.length}
          icon={FolderGit2}
          gradient="bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600"
          onClick={() => handleFilterClick('all')}
          isActive={statusFilter === 'all'}
        />
        <StatCard
          label="Active"
          value={meta?.total_active ?? projects.filter(p => p.is_active && !p.is_deleted).length}
          icon={CheckCircle2}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          onClick={() => handleFilterClick('active')}
          isActive={statusFilter === 'active'}
        />
        <StatCard
          label="Inactive"
          value={meta?.total_inactive ?? projects.filter(p => !p.is_active && !p.is_deleted).length}
          icon={XCircle}
          gradient="bg-gradient-to-br from-amber-500 to-orange-500"
          onClick={() => handleFilterClick('inactive')}
          isActive={statusFilter === 'inactive'}
        />
        <StatCard
          label="Archived"
          value={meta?.total_deleted ?? projects.filter(p => p.is_deleted).length}
          icon={Archive}
          gradient="bg-gradient-to-br from-rose-500 to-pink-600"
          onClick={() => handleFilterClick('deleted')}
          isActive={statusFilter === 'deleted'}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 shadow-sm">
        <RefetchBar visible={isRefetching} />
        
        <FilterBar
          search={searchInput}
          onSearch={setSearchInput}
          placeholder="Search projects…"
          isSearching={isSearching}
          sortOptions={[]}
          sort={ordering}
          onSort={(v) => { setOrdering(v); setPage(1); }}
          viewMode={viewMode}
          onViewMode={setViewMode}
          isFetching={isFetching}
          onRefresh={() => refetch()}
          rightSlot={
            <>
              <div className="hidden sm:inline-flex items-center gap-1 bg-gray-50/80 dark:bg-gray-800/40 p-1 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                {STATUS_TABS.map(tab => {
                  const isSelected = statusFilter === tab.value;
                  return (
                    <button
                      key={tab.value}
                      onClick={() => handleFilterClick(tab.value)}
                      className={`relative inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-white dark:bg-gray-800 text-violet-700 shadow-sm ring-1 ring-gray-200'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      {tab.label}
                      {tab.count !== null && (
                        <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isSelected ? 'bg-violet-100 text-violet-700' : 'bg-gray-200/50 text-gray-500'
                        }`}>
                          {tab.count > 99 ? '99+' : tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
                >
                  <X className="h-3.5 w-3.5" /> Clear
                </button>
              )}
            </>
          }
        />

        <div id="project-data-panel">
          {viewMode === 'grid' ? (
            <CardGrid
              density={density}
              isEmpty={projects.length === 0}
              emptyState={
                <EmptyState
                  title={hasActiveFilters ? 'No Projects Match' : 'No Projects Yet'}
                  description={hasActiveFilters ? 'Try adjusting your search.' : 'Create your first project.'}
                  hasFilters={hasActiveFilters}
                  onClear={clearAllFilters}
                  onCreate={handleCreate}
                  createPermission="MANAGE_CONFIG"
                  createLabel="Create Project"
                />
              }
            >
              {projects.map((proj, i) => {
                const isSelected = selectedIds.includes(proj.id);
                const actionsList = [
                  { label: 'View Details', icon: <Eye className="h-4 w-4" />, onClick: () => handleView(proj) },
                  ...(canManageProjects ? (
                    proj.is_deleted ? [
                      { label: 'Restore', icon: <RotateCcw className="h-4 w-4" />, onClick: () => handleRestore(proj) }
                    ] : [
                      { label: 'Edit Project', icon: <Edit2 className="h-4 w-4" />, onClick: () => handleEdit(proj) },
                      { label: 'Archive', icon: <Archive className="h-4 w-4" />, danger: true, onClick: () => handleDelete(proj) },
                    ]
                  ) : []),
                ];
                
                return (
                  <div key={proj.id} style={{ animationDelay: `${i * 40}ms` }} className="flex flex-col h-full animate-fadeInUp">
                    <EntityCard
                      id={proj.id}
                      density={density}
                      title={proj.name}
                      subtitle={proj.code}
                      avatar={<EntityAvatar name={proj.name} size={40} />}
                      statusBadge={<StatusBadge status={getEntityStatus(proj.is_deleted, proj.is_active)} />}
                      isSelected={isSelected}
                      onSelect={checked => toggleSelect(proj.id, checked)}
                      onClick={() => handleView(proj)}
                      metrics={[
                        { label: 'Capacity', value: proj.capacity || '—', icon: <Building2 className="h-3.5 w-3.5" /> },
                        { label: 'Location', value: proj.location || '—', icon: <Building2 className="h-3.5 w-3.5" /> }
                      ]}
                      actions={actionsList}
                    />
                  </div>
                );
              })}
            </CardGrid>
          ) : (
            projects.length === 0 ? (
              <EmptyState
                title={hasActiveFilters ? 'No Projects Match' : 'No Projects Yet'}
                description={hasActiveFilters ? 'Try adjusting your search.' : 'Create your first project.'}
                hasFilters={hasActiveFilters}
                onClear={clearAllFilters}
                onCreate={handleCreate}
                createPermission="MANAGE_CONFIG"
                createLabel="Create Project"
              />
            ) : (
              <div className="overflow-auto max-h-[calc(100vh-380px)]">
                <table className="w-full text-sm text-left relative">
                  <thead className="sticky top-0 z-20 bg-gradient-to-r from-violet-700 via-purple-700 to-fuchsia-700 text-white shadow-md">
                    <tr className="divide-x divide-dashed divide-white/20">

                      {['Project', 'Code', 'Location', 'Capacity', 'Status', 'Actions'].map(label => (
                        <th key={label} className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {projects.map((proj, i) => {
                      const isSelected = selectedIds.includes(proj.id);
                      return (
                        <tr key={proj.id} className={`group hover:bg-gray-50/70 dark:hover:bg-gray-800/50 transition-colors animate-fadeInUp divide-x divide-dashed divide-gray-100 dark:divide-gray-800 ${isSelected ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : 'bg-white dark:bg-gray-900'}`} style={{ animationDelay: `${i * 30}ms` }}>

                          <td className="px-4 py-3.5 min-w-[180px]">
                            <button onClick={() => handleView(proj)} className="flex items-center gap-3 group text-left transition-colors w-full">
                              <EntityAvatar name={proj.name} size={36} />
                              <div className="text-[14px] font-bold text-gray-900 group-hover:text-indigo-600 truncate">{proj.name}</div>
                            </button>
                          </td>
                          <td className="px-4 py-3.5"><CopyChip value={proj.code} label="project code" /></td>
                          <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">{proj.location || '-'}</td>
                          <td className="px-4 py-3.5 text-xs font-medium text-gray-700 whitespace-nowrap">{proj.capacity || '-'}</td>
                          <td className="px-4 py-3.5"><StatusBadge status={getEntityStatus(proj.is_deleted, proj.is_active)} /></td>
                          <td className="px-4 py-3.5">
                            <div className="flex justify-end" onClick={e => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gray-900">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem onClick={() => handleView(proj)} className="flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium cursor-pointer text-gray-700">
                                    <Eye className="h-4 w-4" /> View Details
                                  </DropdownMenuItem>
                                  {canManageProjects && (
                                    <>
                                      <DropdownMenuSeparator />
                                      {proj.is_deleted ? (
                                        <DropdownMenuItem onClick={() => handleRestore(proj)} className="flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium cursor-pointer text-indigo-700">
                                          <RotateCcw className="h-4 w-4" /> Restore Project
                                        </DropdownMenuItem>
                                      ) : (
                                        <>
                                          <DropdownMenuItem onClick={() => handleEdit(proj)} className="flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium cursor-pointer">
                                            <Edit2 className="h-4 w-4 text-gray-500" /> Edit Project
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem onClick={() => handleDelete(proj)} className="flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium cursor-pointer text-red-700">
                                            <Archive className="h-4 w-4" /> Archive Project
                                          </DropdownMenuItem>
                                        </>
                                      )}
                                    </>
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
        </div>

        {(meta?.total ?? 0) > 0 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 bg-gray-50/40">
            <p className="text-xs text-gray-500">
              Showing <span className="font-semibold text-gray-700">{((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, meta?.total ?? 0)}</span> of <span className="font-semibold text-gray-700">{meta?.total ?? 0}</span> projects
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1 || isFetching} className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                  return (
                    <button key={p} onClick={() => setPage(p)} className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${p === page ? 'bg-violet-600 text-white' : 'border border-gray-200'}`}>
                      {p}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages || isFetching} className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
