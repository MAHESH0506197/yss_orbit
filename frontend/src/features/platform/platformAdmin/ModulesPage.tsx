import React, { useState, useMemo } from 'react';
import { 
  Server, Layers, Users, Box, Plus, MoreHorizontal, Eye, Edit2, Archive, Trash2, CheckCircle2, XCircle, Activity, RotateCcw,
  Search, Loader2, PowerOff, Power
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { RefetchBar } from '@/components/ui/RefetchBar';
import { useSystemModules } from '@/features/tenancy/modules/api/useModules';
import { useUpdateCatalogModule, useDeleteCatalogModule } from '@/features/tenancy/subscription/hooks/useSubscription';
import { useViewMode } from '@/hooks/useViewMode';
import { ViewModeToggle } from '@/components/platform/ViewModeToggle';
import { CardGrid } from '@/components/platform/CardGrid';
import { EntityCard } from '@/components/platform/EntityCard';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { ModuleFormModal } from './ModuleFormModal';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import toast from 'react-hot-toast';

type StatusFilter = 'all' | 'active' | 'inactive' | 'archived';

export const ModulesPage: React.FC = () => {
  const { data: moduleData, isLoading, isFetching, error } = useSystemModules();
  const { mutate: updateModule } = useUpdateCatalogModule();
  const { mutate: deleteModule } = useDeleteCatalogModule();
  const [viewMode, setViewMode, density, setDensity] = useViewMode('modules', 'grid');
  
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<any | null>(null);
  
  const [confirmDialog, setConfirmDialog] = useState<{ type: 'deactivate' | 'activate' | 'delete'; module: any } | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const setContext = useWorkspaceStore((state) => state.setContext);
  const navigate = useNavigate();
  
  React.useEffect(() => {
    setContext({ pageTitle: 'Module Registry' });
    return () => setContext({ pageTitle: null });
  }, [setContext]);

  const modules = moduleData?.modules || [];
  const statistics = moduleData?.statistics || {
    total_modules: 0,
    active_subscriptions: 0,
    inactive_subscriptions: 0
  };

  const filteredModules = useMemo(() => {
    return modules.filter((mod: any) => {
      const matchesSearch = mod.name.toLowerCase().includes(searchQuery.toLowerCase()) || mod.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && mod.is_active && !mod.is_archived) ||
        (statusFilter === 'inactive' && !mod.is_active && !mod.is_archived) ||
        (statusFilter === 'archived' && mod.is_archived);

      const matchesCategory = categoryFilter === 'all' || mod.category_name === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [modules, searchQuery, statusFilter, categoryFilter]);

  const uniqueCategories = useMemo(() => {
    const cats = modules.map((m: any) => m.category_name).filter(Boolean);
    return Array.from(new Set(cats)) as string[];
  }, [modules]);

  const handleCreate = () => {
    setSelectedModule(null);
    setIsFormOpen(true);
  };

  const handleEdit = (mod: any) => {
    // The modal expects category as ID, but the system_modules endpoint returns category_name.
    // However, if we edit, we probably want to pass the raw module to the form.
    // Fortunately, the backend put endpoint accepts what we give it or ignores category if we don't change it.
    setSelectedModule(mod);
    setIsFormOpen(true);
  };

  const handleView = (mod: any) => {
    navigate(`/platform/module-registry/${mod.id}`);
  };

  const handleDeactivate = (mod: any) => {
    setConfirmDialog({ type: mod.is_active ? 'deactivate' : 'activate', module: mod });
  };

  const handleDelete = (mod: any) => {
    setConfirmDialog({ type: 'delete', module: mod });
  };

  const executeConfirmAction = async () => {
    if (!confirmDialog) return;
    setIsConfirming(true);
    try {
      if (confirmDialog.type === 'delete') {
        await deleteModule(confirmDialog.module.id, {
          onSuccess: () => {
            toast.success(`Module "${confirmDialog.module.name}" permanently deleted.`);
          },
          onError: () => {
            toast.error('Failed to delete module.');
          }
        });
      } else {
        const newStatus = confirmDialog.type === 'activate';
        await updateModule({ id: confirmDialog.module.id, data: { is_active: newStatus } }, {
          onSuccess: () => {
            toast.success(`Module "${confirmDialog.module.name}" ${newStatus ? 'activated' : 'deactivated'} successfully.`);
          },
          onError: () => {
            toast.error(`Failed to change module status.`);
          }
        });
      }
    } finally {
      setIsConfirming(false);
      setConfirmDialog(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !moduleData) {
    return (
      <div className="flex h-full items-center justify-center text-red-500">
        Error loading modules registry.
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50/50 dark:bg-gray-900/50">
      <RefetchBar visible={isFetching} />
      
      <PageHeader 
        title="Module Registry" 
        subtitle="System-wide module definitions, feature gating, and adoption statistics." 
        icon={Layers} 
        breadcrumbs={[{ label: 'Platform Admin' }, { label: 'Modules' }]} 
        iconGradient="from-violet-500 via-purple-500 to-fuchsia-600"
        actions={
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:scale-95"
          >
            <Plus size={18} />
            New Module
          </button>
        }
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4" role="group" aria-label="Module statistics filters">
          <StatCard 
            label="Total Modules" 
            value={statistics.total_modules || modules.length} 
            icon={Layers} 
            gradient="bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600" 
            onClick={() => setStatusFilter('all')}
            isActive={statusFilter === 'all'}
          />
          <StatCard 
            label="Active" 
            value={modules.filter((m: any) => m.is_active && !m.is_archived).length}
            icon={CheckCircle2} 
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600" 
            onClick={() => setStatusFilter('active')}
            isActive={statusFilter === 'active'}
          />
          <StatCard 
            label="Inactive" 
            value={modules.filter((m: any) => !m.is_active && !m.is_archived).length}
            icon={XCircle} 
            gradient="bg-gradient-to-br from-amber-500 to-orange-500" 
            onClick={() => setStatusFilter('inactive')}
            isActive={statusFilter === 'inactive'}
          />
          <StatCard 
            label="Archived" 
            value={modules.filter((m: any) => m.is_archived).length}
            icon={Archive} 
            gradient="bg-gradient-to-br from-slate-500 to-gray-600" 
            onClick={() => setStatusFilter('archived')}
            isActive={statusFilter === 'archived'}
          />
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex-1 w-full" />
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-40">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search modules..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="relative sm:w-36">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="relative sm:w-40">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                {uniqueCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} density={density} setDensity={setDensity} />
          </div>
        </div>

        {/* Modules List/Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
          {isFetching && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          )}
          {viewMode === 'grid' ? (
            <CardGrid isEmpty={filteredModules.length === 0} emptyState={<div className="p-8 text-center text-slate-500">No modules found.</div>}>
              {filteredModules.map((mod: any) => (
                <EntityCard
                  key={mod.code}
                  id={mod.code}
                  density={density}
                  title={mod.name}
                  avatar={
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-sm bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-700`}>
                      <Box className="h-5 w-5" />
                    </div>
                  }
                  statusBadge={
                    !mod.is_active 
                      ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600"><XCircle size={14} /> Inactive</span>
                      : <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"><CheckCircle2 size={14} /> Active</span>
                  }
                  metrics={[
                    { label: 'Category', value: mod.category_name, icon: <Layers className="h-3.5 w-3.5" /> },
                    { label: 'Active Subs', value: mod.active_subscription_count, icon: <Users className="h-3.5 w-3.5" /> }
                  ]}
                  badge={
                    <div className="flex gap-1">
                      <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200 uppercase">{mod.features?.length || 0} Features</span>
                    </div>
                  }
                  actions={[
                    { label: 'View Details', icon: <Eye size={16} />, onClick: () => handleView(mod), intent: 'view' },
                    { label: 'Edit Module', icon: <Edit2 size={16} />, onClick: () => handleEdit(mod), intent: 'edit' },
                    { label: mod.is_active ? 'Deactivate' : 'Activate', icon: mod.is_active ? <Archive size={16} /> : <RotateCcw size={16} />, onClick: () => handleDeactivate(mod), intent: mod.is_active ? 'archive' : 'restore' },
                    { label: 'Permanent Delete', icon: <Trash2 size={16} />, onClick: () => handleDelete(mod), intent: 'danger' }
                  ]}
                />
              ))}
            </CardGrid>
          ) : (
            <div className="overflow-auto max-h-[calc(100vh-380px)]">
              <table className="w-full text-sm text-left relative min-w-[800px]">
                <thead className="sticky top-0 z-20 bg-gradient-to-r from-violet-700 via-purple-700 to-fuchsia-700 text-white shadow-md">
                  <tr className="divide-x divide-dashed divide-white/20">
                    {[
                      { key: 'Module', label: 'Module' },
                      { key: 'Category', label: 'Category' },
                      { key: 'Status', label: 'Status' },
                      { key: 'Features', label: 'Features' },
                      { key: 'Actions', label: 'Actions' },
                    ].map(h => (
                      <th key={h.key} className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap">
                        {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 border-b border-gray-200 dark:border-gray-800">
                  {filteredModules.map((mod: any, i) => (
                    <tr 
                      key={mod.code} 
                      className="group transition-colors divide-x divide-dashed divide-gray-200 dark:divide-gray-800 hover:bg-gray-50/70 dark:hover:bg-gray-800/40 bg-white dark:bg-gray-900"
                      style={{ animationDelay: `${i * 30}ms` }}
                    >
                      <td className="px-4 py-3.5 min-w-[200px]">
                        <button
                          type="button"
                          onClick={() => handleView(mod)}
                          className="flex items-center gap-3 group text-left transition-colors w-full"
                        >
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm bg-gradient-to-br from-indigo-500 to-purple-600 text-white`}>
                            <Box size={18} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                              {mod.name}
                            </div>
                          </div>
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/60 shadow-sm dark:bg-blue-900/20 dark:border-blue-800/50 dark:text-blue-400 whitespace-nowrap">
                          <Layers className="h-3.5 w-3.5 text-blue-500" />
                          {mod.category_name}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {!mod.is_active ? (
                          <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-700 dark:border-orange-800/50 dark:bg-orange-900/20 dark:text-orange-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-orange-500"></span> Inactive
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-900/20 dark:text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-300">
                          <Box className="h-3.5 w-3.5 text-gray-400" />
                          {mod.features?.length || 0} Feature{mod.features?.length !== 1 ? 's' : ''}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex justify-end" onClick={e => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                aria-label={`Actions for ${mod.name}`}
                                className="flex h-8 w-8 items-center justify-center rounded-xl border border-transparent text-gray-400 transition-all hover:border-gray-200 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:opacity-100 data-[state=open]:border-gray-200 data-[state=open]:bg-gray-50 data-[state=open]:text-gray-900 data-[state=open]:shadow-sm dark:hover:border-gray-700 dark:hover:bg-gray-800/50 dark:hover:text-white dark:data-[state=open]:border-gray-700 dark:data-[state=open]:bg-gray-800/50 dark:data-[state=open]:text-white"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-60 rounded-2xl border border-gray-100 bg-white/95 p-2 shadow-xl shadow-gray-200/50 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/95 dark:shadow-gray-900/50">
                              <DropdownMenuLabel className="px-2.5 py-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                <span className="block truncate text-indigo-600 dark:text-indigo-400">{mod.name}</span>
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator className="my-1 bg-gray-100 dark:bg-gray-800" />
                              
                              <DropdownMenuItem onClick={() => handleView(mod)} className="flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900 focus:bg-gray-50 focus:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800/50 dark:hover:text-white dark:focus:bg-gray-800/50 dark:focus:text-white">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                  <Eye className="h-4 w-4" />
                                </div>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(mod)} className="flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium text-violet-700 transition-colors hover:bg-violet-50 hover:text-violet-800 focus:bg-violet-50 focus:text-violet-800 dark:text-violet-400 dark:hover:bg-violet-900/20 dark:hover:text-violet-300 dark:focus:bg-violet-900/20 dark:focus:text-violet-300">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400">
                                  <Edit2 className="h-4 w-4" />
                                </div>
                                Edit Module
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator className="my-1 bg-gray-100 dark:bg-gray-800" />
                              
                              {mod.is_active ? (
                                <DropdownMenuItem onClick={() => handleDeactivate(mod)} className="flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50 hover:text-rose-800 focus:bg-rose-50 focus:text-rose-800 dark:text-rose-400 dark:hover:bg-rose-900/20 dark:hover:text-rose-300 dark:focus:bg-rose-900/20 dark:focus:text-rose-300">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400">
                                    <Archive className="h-4 w-4" />
                                  </div>
                                  Deactivate
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleDeactivate(mod)} className="flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50 hover:text-emerald-800 focus:bg-emerald-50 focus:text-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-300 dark:focus:bg-emerald-900/20 dark:focus:text-emerald-300">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                                    <RotateCcw className="h-4 w-4" />
                                  </div>
                                  Activate
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuSeparator className="my-1 bg-gray-100 dark:bg-gray-800" />
                              <DropdownMenuItem onClick={() => handleDelete(mod)} className="flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50 hover:text-rose-800 focus:bg-rose-50 focus:text-rose-800 dark:text-rose-400 dark:hover:bg-rose-900/20 dark:hover:text-rose-300 dark:focus:bg-rose-900/20 dark:focus:text-rose-300">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400">
                                  <Trash2 className="h-4 w-4" />
                                </div>
                                Permanent Delete
                              </DropdownMenuItem>
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
        </div>
      </div>

      <ModuleFormModal 
        isOpen={isFormOpen} 
        onClose={() => {
          setIsFormOpen(false);
          setSelectedModule(null);
        }} 
        moduleToEdit={selectedModule} 
      />

      {/* ── Confirm Dialog ───────────────────────────────────────────────── */}
      {confirmDialog && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => !isConfirming && setConfirmDialog(null)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl ring-1 ring-black/5 overflow-hidden animate-[scaleIn_0.15s_ease-out]">
            {/* Accent stripe */}
            <div className={`h-1 w-full ${
              confirmDialog.type === 'delete' ? 'bg-gradient-to-r from-red-500 to-rose-600' :
              confirmDialog.type === 'deactivate' ? 'bg-gradient-to-r from-orange-400 to-amber-500' :
              'bg-gradient-to-r from-emerald-500 to-teal-600'
            }`} />
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                  confirmDialog.type === 'delete' ? 'bg-red-50 dark:bg-red-900/30' :
                  confirmDialog.type === 'deactivate' ? 'bg-amber-50 dark:bg-amber-900/30' :
                  'bg-emerald-50 dark:bg-emerald-900/30'
                }`}>
                  {confirmDialog.type === 'delete' ? <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" /> :
                   confirmDialog.type === 'deactivate' ? <PowerOff className="h-5 w-5 text-amber-600 dark:text-amber-400" /> :
                   <Power className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {confirmDialog.type === 'delete' ? 'Permanent Delete Module' :
                     confirmDialog.type === 'deactivate' ? 'Deactivate Module' : 'Activate Module'}
                  </h2>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {confirmDialog.type === 'delete' ? 'This will permanently remove the module and all its features from the registry. This action cannot be undone.' :
                     confirmDialog.type === 'deactivate' ? 'This will deactivate the module. Existing subscriptions may be suspended.' :
                     'This will make the module active and available for subscriptions again.'}
                  </p>
                  
                  <div className={`mt-3 flex items-center gap-3 rounded-xl px-4 py-3 ${
                    confirmDialog.type === 'delete' ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' :
                    confirmDialog.type === 'deactivate' ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800' :
                    'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                  }`}>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg shadow-sm ${
                      confirmDialog.type === 'delete' ? 'bg-gradient-to-br from-red-100 to-red-200 text-red-700' :
                      confirmDialog.type === 'deactivate' ? 'bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700' :
                      'bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700'
                    }`}>
                      <Box className="h-4 w-4" />
                    </div>
                    <span className="font-bold text-sm text-gray-900 dark:text-white truncate">
                      {confirmDialog.module.name}
                    </span>
                  </div>
                </div>
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
                  disabled={isConfirming}
                  className={`inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed ${
                    confirmDialog.type === 'delete' ? 'bg-gradient-to-r from-red-500 to-rose-600 focus:ring-red-500' :
                    confirmDialog.type === 'deactivate' ? 'bg-gradient-to-r from-orange-500 to-amber-600 focus:ring-orange-500' :
                    'bg-gradient-to-r from-emerald-500 to-teal-600 focus:ring-emerald-500'
                  }`}
                >
                  {isConfirming ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</> :
                   confirmDialog.type === 'delete' ? <><Trash2 className="h-4 w-4" /> Permanent Delete</> :
                   confirmDialog.type === 'deactivate' ? <><PowerOff className="h-4 w-4" /> Deactivate</> :
                   <><Power className="h-4 w-4" /> Activate</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
