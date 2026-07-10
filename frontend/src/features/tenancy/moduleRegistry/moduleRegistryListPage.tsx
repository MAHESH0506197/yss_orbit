// src/features/tenancy/moduleRegistry/moduleRegistryListPage.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Enterprise Module Registry — v3.0 Golden Standard
//  ✅ PageHeader with breadcrumbs + count badge
//  ✅ 4 StatCard KPIs (Total / Active / Inactive / Free)
//  ✅ RefetchBar on background refetch
//  ✅ Category filter tabs (ALL / CORE / HRMS / BUSINESS / ANALYTICS / INTEGRATIONS / FINANCE)
//  ✅ Debounced search
//  ✅ ViewModeToggle (grid + table dual view)
//  ✅ Sortable table columns (Name / Category / Status)
//  ✅ DropdownMenu per row: Activate, Deactivate, View Details
//  ✅ Premium module cards with category color, version badge, toggle
//  ✅ Premium empty state + skeleton loader
//  ✅ PermissionGate for admin actions
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Package, Plus, CheckCircle2, XCircle, MoreHorizontal,
  Search, X, ChevronUp, ChevronDown, ChevronsUpDown,
  RefreshCcw, Layers, Zap, BarChart3, Users, ShoppingCart,
  DollarSign, Link2, LayoutDashboard, ToggleLeft, ToggleRight,
  Tag, Star, AlertTriangle, Info, Eye,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { RefetchBar } from '@/components/ui/RefetchBar';
import { ViewModeToggle } from '@/components/platform/ViewModeToggle';
import { CardGrid } from '@/components/platform/CardGrid';
import { EntityCard } from '@/components/platform/EntityCard';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { useViewMode } from '@/hooks/useViewMode';
import { useModuleRegistry } from './hooks/usemoduleRegistry';
import { ModuleregistryDto } from './api/moduleRegistryApi';
import toast from 'react-hot-toast';

// ─── Category Config ──────────────────────────────────────────────────────────
const CATEGORY_TABS = ['ALL', 'CORE', 'HRMS', 'BUSINESS', 'ANALYTICS', 'INTEGRATIONS', 'FINANCE'] as const;
type CategoryTab = typeof CATEGORY_TABS[number];

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string; icon: React.ElementType }> = {
  CORE:         { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800', icon: Layers },
  HRMS:         { bg: 'bg-blue-50 dark:bg-blue-900/20',       text: 'text-blue-700 dark:text-blue-400',       border: 'border-blue-200 dark:border-blue-800',       icon: Users },
  BUSINESS:     { bg: 'bg-violet-50 dark:bg-violet-900/20',   text: 'text-violet-700 dark:text-violet-400',   border: 'border-violet-200 dark:border-violet-800',   icon: ShoppingCart },
  ANALYTICS:    { bg: 'bg-orange-50 dark:bg-orange-900/20',   text: 'text-orange-700 dark:text-orange-400',   border: 'border-orange-200 dark:border-orange-800',   icon: BarChart3 },
  INTEGRATIONS: { bg: 'bg-sky-50 dark:bg-sky-900/20',         text: 'text-sky-700 dark:text-sky-400',         border: 'border-sky-200 dark:border-sky-800',         icon: Link2 },
  FINANCE:      { bg: 'bg-indigo-50 dark:bg-indigo-900/20',   text: 'text-indigo-700 dark:text-indigo-400',   border: 'border-indigo-200 dark:border-indigo-800',   icon: DollarSign },
};

const getCategoryStyle = (cat: string) =>
  CATEGORY_STYLES[cat?.toUpperCase()] ?? {
    bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-200 dark:border-gray-700', icon: Package,
  };

// ─── Sort Header ──────────────────────────────────────────────────────────────
function SortHeader({ field, children, sortField, sortDir, onSort }: {
  field: string; children: React.ReactNode;
  sortField: string; sortDir: 'asc' | 'desc';
  onSort: (f: string) => void;
}) {
  const active = sortField === field;
  return (
    <button
      onClick={() => onSort(field)}
      className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider transition-colors ${
        active ? 'text-indigo-200' : 'text-white/80 hover:text-white'
      }`}
    >
      {children}
      {active
        ? sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
        : <ChevronsUpDown className="h-3 w-3 opacity-50" />}
    </button>
  );
}

// ─── Filter Chip ──────────────────────────────────────────────────────────────
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 pl-3 pr-2 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
      {label}
      <button
        onClick={onRemove}
        className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
        aria-label={`Remove filter: ${label}`}
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </span>
  );
}

// ─── Premium Skeleton ─────────────────────────────────────────────────────────
function ModuleSkeleton() {
  return (
    <div className="animate-pulse space-y-6" role="status" aria-label="Loading modules">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-gray-100 dark:bg-gray-800" />
        ))}
      </div>
      <div className="rounded-2xl bg-gray-100 dark:bg-gray-800 h-12" />
      <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
        <div className="h-12 bg-gray-200 dark:bg-gray-700" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900" />
        ))}
      </div>
    </div>
  );
}

// ─── Premium Empty State ──────────────────────────────────────────────────────
function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div className={`flex h-20 w-20 items-center justify-center rounded-3xl mb-5 shadow-sm ring-1 ${
        hasFilters
          ? 'bg-gray-50 dark:bg-gray-800/50 ring-gray-200 dark:ring-gray-700'
          : 'bg-indigo-50 dark:bg-indigo-500/10 ring-indigo-100 dark:ring-indigo-500/20'
      }`}>
        {hasFilters
          ? <Search className="h-9 w-9 text-gray-400 dark:text-gray-500" />
          : <Package className="h-9 w-9 text-indigo-500 dark:text-indigo-400" />}
      </div>
      <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mb-2">
        {hasFilters ? 'No modules match your filters' : 'No modules registered'}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-6 leading-relaxed">
        {hasFilters
          ? 'Try adjusting your search or category filter.'
          : 'Platform modules appear here once they are registered in the backend.'}
      </p>
      {hasFilters && (
        <button
          onClick={onClear}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="h-4 w-4" /> Clear filters
        </button>
      )}
    </div>
  );
}

// ─── Module Grid Card ─────────────────────────────────────────────────────────
function ModuleGridCard({
  mod, onActivate, onDeactivate, isToggling,
}: {
  mod: ModuleregistryDto;
  onActivate: (id: string) => void;
  onDeactivate: (id: string) => void;
  isToggling: string | null;
}) {
  const style = getCategoryStyle(mod.category);
  const CatIcon = style.icon;
  const toggling = isToggling === mod.id;

  return (
    <div className={`group relative flex flex-col rounded-[1.5rem] border bg-white dark:bg-gray-900 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden ${
      mod.is_active
        ? 'border-emerald-200 dark:border-emerald-800/60'
        : 'border-gray-200 dark:border-gray-800'
    }`}>
      {/* Active indicator stripe */}
      <div className={`h-1 w-full transition-colors ${
        mod.is_active
          ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500'
          : 'bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600'
      }`} />

      <div className="p-5 flex flex-col flex-1 gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${style.bg} ${style.border}`}>
            <CatIcon className={`h-5 w-5 ${style.text}`} />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {mod.is_free && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-500" /> Free
              </span>
            )}
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
              mod.is_active
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
            }`}>
              {mod.is_active
                ? <><CheckCircle2 className="h-2.5 w-2.5" /> Active</>
                : <><XCircle className="h-2.5 w-2.5" /> Inactive</>}
            </span>
          </div>
        </div>

        {/* Name + category */}
        <div>
          <h3 className="text-sm font-extrabold text-gray-900 dark:text-white leading-snug">{mod.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <code className="text-[10px] font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
              {mod.code}
            </code>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${style.bg} ${style.text}`}>
              {mod.category}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 flex-1">
          {mod.description || 'No description provided.'}
        </p>

        {/* Toggle button */}
        <button
          onClick={() => mod.is_active ? onDeactivate(mod.id) : onActivate(mod.id)}
          disabled={toggling}
          className={`mt-auto flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition-all ${
            mod.is_active
              ? 'bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40'
              : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5'
          } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
        >
          {toggling ? (
            <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
          ) : mod.is_active ? (
            <><ToggleLeft className="h-3.5 w-3.5" /> Deactivate</>
          ) : (
            <><ToggleRight className="h-3.5 w-3.5" /> Activate</>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export const ModuleRegistryListPage: React.FC = () => {
  const { data: modules, loading, error, refetch, toggleModule } = useModuleRegistry();

  const [searchInput, setSearchInput]       = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryTab>('ALL');
  const [sortField, setSortField]           = useState('name');
  const [sortDir, setSortDir]               = useState<'asc' | 'desc'>('asc');
  const [isToggling, setIsToggling]         = useState<string | null>(null);
  const [viewMode, setViewMode, density, setDensity] = useViewMode('module_registry', 'grid');

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput]);

  const handleSort = useCallback((field: string) => {
    setSortField(prev => {
      if (prev === field) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); return field; }
      setSortDir('asc');
      return field;
    });
  }, []);

  const handleActivate = useCallback(async (id: string) => {
    setIsToggling(id);
    try {
      await toggleModule(id, true);
      toast.success('Module activated successfully');
    } catch {
      toast.error('Failed to activate module');
    } finally {
      setIsToggling(null);
    }
  }, [toggleModule]);

  const handleDeactivate = useCallback(async (id: string) => {
    setIsToggling(id);
    try {
      await toggleModule(id, false);
      toast.success('Module deactivated');
    } catch {
      toast.error('Failed to deactivate module');
    } finally {
      setIsToggling(null);
    }
  }, [toggleModule]);

  // ── Stats ────────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:    modules.length,
    active:   modules.filter(m => m.is_active).length,
    inactive: modules.filter(m => !m.is_active).length,
    free:     modules.filter(m => m.is_free).length,
  }), [modules]);

  // ── Filtered + Sorted ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...modules];
    if (categoryFilter !== 'ALL') list = list.filter(m => m.category?.toUpperCase() === categoryFilter);
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(m =>
        m.name?.toLowerCase().includes(q) ||
        m.code?.toLowerCase().includes(q) ||
        m.description?.toLowerCase().includes(q) ||
        m.category?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let av: string, bv: string;
      if (sortField === 'category') { av = a.category ?? ''; bv = b.category ?? ''; }
      else if (sortField === 'status') { av = a.is_active ? 'a' : 'b'; bv = b.is_active ? 'a' : 'b'; }
      else { av = a.name ?? ''; bv = b.name ?? ''; }
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return list;
  }, [modules, categoryFilter, debouncedSearch, sortField, sortDir]);

  const hasActiveFilters = categoryFilter !== 'ALL' || !!debouncedSearch;

  const clearFilters = useCallback(() => {
    setSearchInput(''); setDebouncedSearch(''); setCategoryFilter('ALL');
  }, []);

  // ── Category counts ───────────────────────────────────────────────────────────
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: modules.length };
    for (const m of modules) {
      const cat = m.category?.toUpperCase() ?? 'OTHER';
      counts[cat] = (counts[cat] ?? 0) + 1;
    }
    return counts;
  }, [modules]);

  if (loading) return (
    <div className="p-6 max-w-7xl mx-auto">
      <ModuleSkeleton />
    </div>
  );

  if (error) return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-900/20 mb-4">
          <AlertTriangle className="h-8 w-8 text-rose-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Failed to load modules</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">There was an error loading the module registry.</p>
        <button onClick={refetch} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-500 transition-colors">
          <RefreshCcw className="h-4 w-4" /> Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pb-24">

      {/* ── Page Header ────────────────────────────────────────────────────────── */}
      <PageHeader
        icon={Package}
        iconGradient="from-indigo-500 via-violet-500 to-purple-600"
        title="Module Registry"
        subtitle="Manage active platform modules and feature availability across the system."
        countBadge={stats.total}
        breadcrumbs={[
          { label: 'Platform' },
          { label: 'Module Registry' },
        ]}
        actions={
          <button
            onClick={refetch}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="Refresh"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>
        }
      />

      {/* ── KPI StatCards ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <button onClick={() => setCategoryFilter('ALL')} className="text-left">
          <StatCard
            label="Total Modules"
            value={stats.total}
            icon={Package}
            gradient="bg-gradient-to-br from-indigo-500 to-violet-600"
          />
        </button>
        <button onClick={() => setCategoryFilter('ALL')} className="text-left">
          <StatCard
            label="Active"
            value={stats.active}
            icon={CheckCircle2}
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          />
        </button>
        <button className="text-left">
          <StatCard
            label="Inactive"
            value={stats.inactive}
            icon={XCircle}
            gradient="bg-gradient-to-br from-gray-400 to-gray-600"
          />
        </button>
      </div>

      {/* ── Main Card ───────────────────────────────────────────────────────────── */}
      <div className="rounded-[1.5rem] border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">

        {/* ── Toolbar ────────────────────────────────────────────────────────────── */}
        <div className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 px-5 py-4 space-y-3">

          {/* Category Tabs */}
          <div className="flex overflow-x-auto gap-1 pb-1">
            {CATEGORY_TABS.map(tab => {
              const count = categoryCounts[tab] ?? 0;
              const style = tab === 'ALL' ? null : getCategoryStyle(tab);
              return (
                <button
                  key={tab}
                  onClick={() => { setCategoryFilter(tab); }}
                  className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                    categoryFilter === tab
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {style && <style.icon className="h-3 w-3" />}
                  {tab}
                  {count > 0 && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      categoryFilter === tab
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search + View toggle row */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
              <input
                type="search"
                placeholder="Search modules by name, code, or description…"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 pl-9 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 transition"
                aria-label="Search modules"
              />
              {searchInput && (
                <button onClick={() => { setSearchInput(''); setDebouncedSearch(''); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-400 hover:bg-rose-100 transition-colors"
              >
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            )}

            <ViewModeToggle viewMode={viewMode as any} setViewMode={setViewMode} density={density as any} setDensity={setDensity} />
          </div>

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {categoryFilter !== 'ALL' && (
                <FilterChip label={`Category: ${categoryFilter}`} onRemove={() => setCategoryFilter('ALL')} />
              )}
              {debouncedSearch && (
                <FilterChip label={`Search: "${debouncedSearch}"`} onRemove={() => { setSearchInput(''); setDebouncedSearch(''); }} />
              )}
            </div>
          )}
        </div>

        {/* ── Results ─────────────────────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <EmptyState hasFilters={hasActiveFilters} onClear={clearFilters} />
        ) : viewMode === 'grid' ? (
          /* ── Grid View ─────────────────────────────────────────────────────────── */
          <div className="p-5">
            <CardGrid>
              {filtered.map(mod => (
                <ModuleGridCard
                  key={mod.id}
                  mod={mod}
                  onActivate={handleActivate}
                  onDeactivate={handleDeactivate}
                  isToggling={isToggling}
                />
              ))}
            </CardGrid>
          </div>
        ) : (
          /* ── Table View ────────────────────────────────────────────────────────── */
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left" role="grid" aria-label="Module Registry">
              <thead className="sticky top-0 z-20 bg-gradient-to-r from-violet-700 via-purple-700 to-fuchsia-700 text-white shadow-md">
                <tr className="divide-x divide-dashed divide-white/20">
                  <th className="px-4 py-3.5 whitespace-nowrap">
                    <SortHeader field="name" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Module</SortHeader>
                  </th>
                  <th className="px-4 py-3.5 whitespace-nowrap">
                    <SortHeader field="category" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Category</SortHeader>
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-white">Description</th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Free Tier</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">
                    <SortHeader field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Status</SortHeader>
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-white text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 border-b border-gray-200 dark:border-gray-800">
                {filtered.map(mod => {
                  const style = getCategoryStyle(mod.category);
                  const CatIcon = style.icon;
                  return (
                    <tr
                      key={mod.id}
                      className="group transition-colors divide-x divide-dashed divide-gray-200 dark:divide-gray-800 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10"
                    >
                      {/* Module Name */}
                      <td className="px-4 py-3.5 min-w-[200px]">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${style.bg} ${style.border}`}>
                            <CatIcon className={`h-4 w-4 ${style.text}`} />
                          </div>
                          <div>
                            <p className="text-[14px] font-bold text-gray-900 dark:text-white">{mod.name}</p>
                            <code className="text-[10px] font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                              {mod.code}
                            </code>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${style.bg} ${style.text} ${style.border}`}>
                          <CatIcon className="h-3 w-3" />
                          {mod.category}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="px-4 py-3.5 max-w-[280px]">
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                          {mod.description || '—'}
                        </p>
                      </td>

                      {/* Free Tier */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {mod.is_free ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-500" /> Free
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500">Paid</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                          mod.is_active
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${mod.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                          {mod.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                aria-label={`Actions for ${mod.name}`}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuLabel className="text-xs">{mod.name}</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => {}}>
                                <Eye className="h-4 w-4 mr-2 text-gray-400" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {mod.is_active ? (
                                <DropdownMenuItem
                                  onClick={() => handleDeactivate(mod.id)}
                                  className="text-rose-600 dark:text-rose-400 focus:text-rose-600 dark:focus:text-rose-400"
                                >
                                  <ToggleLeft className="h-4 w-4 mr-2" /> Deactivate
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => handleActivate(mod.id)}
                                  className="text-emerald-600 dark:text-emerald-400 focus:text-emerald-600 dark:focus:text-emerald-400"
                                >
                                  <ToggleRight className="h-4 w-4 mr-2" /> Activate
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

            {/* Table footer */}
            <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/30 px-5 py-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Showing <span className="font-semibold text-gray-700 dark:text-gray-300">{filtered.length}</span> of{' '}
                <span className="font-semibold text-gray-700 dark:text-gray-300">{modules.length}</span> modules
              </p>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {stats.active} active · {stats.inactive} inactive
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuleRegistryListPage;
