import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Search, ArrowRight, ShieldAlert, Users, Shield, Loader2, X, MoreHorizontal, Eye } from 'lucide-react';
import { useBusinessUnits } from '@/features/organization/businessUnit/hooks/useBusinessUnits';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { CardGrid } from '@/components/platform/CardGrid';
import { EntityCard } from '@/components/platform/EntityCard';
import { getAvatarColor, getOrgInitials } from '@/features/organization/utils/organizationHelpers';
import { useViewMode } from '@/hooks/useViewMode';
import { ViewModeToggle } from '@/components/platform/ViewModeToggle';
import { RefetchBar } from '@/components/ui/RefetchBar';
import { ErrorState } from '@/components/ui/ErrorState';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';

function BuAvatar({ name, logoUrl, size = 40 }: { name: string; logoUrl?: string | null; size?: number }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl} alt={name}
        className="shrink-0 rounded-xl object-contain border border-gray-200 dark:border-gray-700 bg-white shadow-sm p-1"
        style={{ width: size, height: size }}
      />
    );
  }
  const { bg } = getAvatarColor(name);
  return (
    <div
      className="shrink-0 flex items-center justify-center rounded-xl text-white font-black select-none shadow-md"
      style={{
        width: size, height: size,
        background: `linear-gradient(135deg, ${bg} 0%, ${bg}aa 100%)`,
        fontSize: size * 0.32,
        letterSpacing: '-0.02em',
      }}
    >
      {getOrgInitials(name)}
    </div>
  );
}

// ─── Premium Empty State ─────────────────────────────────────────────────────
function EmptyState({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div
        className={`flex h-20 w-20 items-center justify-center rounded-3xl mb-5 shadow-sm ring-1 ${
          hasFilters
            ? 'bg-gray-50/50 dark:bg-gray-800/50 ring-gray-200 dark:ring-gray-800'
            : 'bg-indigo-50/50 dark:bg-indigo-500/10 ring-indigo-100 dark:ring-indigo-500/20'
        }`}
      >
        <Building2
          className={`h-10 w-10 ${hasFilters ? 'text-gray-400 dark:text-gray-500' : 'text-indigo-500 dark:text-indigo-400'}`}
          aria-hidden="true"
        />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {hasFilters ? 'No Business Units Match Your Search' : 'No Business Units Yet'}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm leading-relaxed">
        {hasFilters
          ? 'Try adjusting your search query to find what you\'re looking for.'
          : 'Business units must be created in the organization module before roles can be assigned.'}
      </p>
      {hasFilters && (
        <button
          onClick={onClear}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
        >
          <X className="h-4 w-4" aria-hidden="true" /> Clear Search
        </button>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gray-200 dark:bg-gray-800" />
          <div className="space-y-2">
            <div className="h-7 w-48 rounded-xl bg-gray-200 dark:bg-gray-800" />
            <div className="h-4 w-72 rounded-lg bg-gray-100 dark:bg-gray-800/60" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-gray-100 dark:bg-gray-800" />
        ))}
      </div>
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-5 py-4 gap-4">
          <div className="h-9 w-64 rounded-xl bg-gray-100 dark:bg-gray-800" />
          <div className="flex gap-2">
            <div className="h-9 w-20 rounded-xl bg-gray-100 dark:bg-gray-800" />
          </div>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className="h-10 w-10 rounded-xl bg-gray-100 dark:bg-gray-800 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded bg-gray-100 dark:bg-gray-800" />
              </div>
              <div className="h-4 w-24 rounded bg-gray-100 dark:bg-gray-800" />
              <div className="h-4 w-24 rounded bg-gray-100 dark:bg-gray-800" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const BUGridScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode, density, setDensity] = useViewMode('roles_bu', 'grid');
  
  const { data: buResponse, isLoading, isFetching, error, isRefetching } = useBusinessUnits();
  const businessUnits = buResponse?.results || [];

  // Debounce search
  useEffect(() => {
    setIsSearching(true);
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const filteredBUs = useMemo(() => {
    if (!debouncedSearch) return businessUnits;
    const lower = debouncedSearch.toLowerCase();
    return businessUnits.filter((bu: any) => 
      bu.name.toLowerCase().includes(lower) || 
      (bu.organization_name && bu.organization_name.toLowerCase().includes(lower)) ||
      (bu.business_domain_name && bu.business_domain_name.toLowerCase().includes(lower))
    );
  }, [businessUnits, debouncedSearch]);

  const totalRoles = useMemo(() => businessUnits.reduce((acc: number, bu: any) => acc + (bu.roles_count || 0), 0), [businessUnits]);
  const totalUsers = useMemo(() => businessUnits.reduce((acc: number, bu: any) => acc + (bu.users_count || 0), 0), [businessUnits]);

  if (isLoading) return <PageSkeleton />;

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto w-full">
        <ErrorState error={error instanceof Error ? error : new Error("Failed to load Business Units")} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pb-16">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <PageHeader
        icon={ShieldAlert}
        iconGradient="from-indigo-500 via-purple-500 to-pink-500"
        title="Roles & Permissions"
        subtitle="Manage role-based access control (RBAC) across your organisation. Select a business unit below to configure custom roles, assign users, and enforce granular permission boundaries."
        countBadge={businessUnits.length}
        countBadgeLabel={`${businessUnits.length} Business Units`}
      />



      {/* ── Main Data Card ────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 shadow-sm animate-[fadeInUp_0.3s_ease-out_both]">
        
        <RefetchBar visible={isRefetching} />

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 px-5 py-3.5">
          <div className="relative w-full sm:max-w-xs flex-1">
            {isSearching || (isFetching && !isLoading)
              ? <Loader2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500 animate-spin pointer-events-none" aria-label="Searching…" />
              : <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" aria-hidden="true" />
            }
            <input
              type="search"
              placeholder="Search business units…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <ViewModeToggle 
              viewMode={viewMode} 
              setViewMode={setViewMode} 
              density={density} 
              setDensity={setDensity} 
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {filteredBUs.length === 0 ? (
            <EmptyState 
              hasFilters={searchInput.trim().length > 0} 
              onClear={() => setSearchInput('')} 
            />
          ) : viewMode === 'grid' ? (
            <CardGrid>
              {filteredBUs.map((bu: any, i: number) => {
                const roleCount = bu.roles_count || 0;
                const userCount = bu.users_count || 0;

                return (
                  <div 
                    key={bu.id}
                    style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}
                    className="animate-[fadeInUp_0.3s_ease-out_both] flex flex-col h-full"
                  >
                    <EntityCard
                      id={bu.id}
                      title={bu.name}
                      avatar={<BuAvatar name={bu.name} logoUrl={bu.logo_url} size={40} />}
                      onClick={() => navigate(`/platform/roles/${bu.id}`)}
                      metricsLayout="vertical"
                      metrics={[
                        { label: 'Roles', value: roleCount, icon: <Shield className="h-3.5 w-3.5 text-violet-500" /> },
                        { label: 'Users', value: userCount, icon: <Users className="h-3.5 w-3.5 text-blue-500" /> },
                        { label: 'Organization', value: bu.organization_name || 'None', icon: <Building2 className="h-3.5 w-3.5 text-emerald-500" /> },
                      ]}

                    />
                  </div>
                );
              })}
            </CardGrid>
          ) : (
            <div className="overflow-auto max-h-[calc(100vh-380px)]">
              <table className="w-full text-sm text-left relative">
                <thead className="sticky top-0 z-20 bg-gradient-to-r from-violet-700 via-purple-700 to-fuchsia-700 text-white shadow-md">
                  <tr className="divide-x divide-dashed divide-white/20">
                    <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap">Business Unit</th>
                    <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap">Organization</th>
                    <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap">Roles</th>
                    <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap">Users</th>

                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 border-b border-gray-200 dark:border-gray-800">
                  {filteredBUs.map((bu: any, i: number) => {
                    const roleCount = bu.roles_count || 0;
                    const userCount = bu.users_count || 0;
                    return (
                      <tr 
                        key={bu.id} 
                        onClick={() => navigate(`/platform/roles/${bu.id}`)}
                        style={{ animationDelay: `${i * 30}ms` }}
                        className="group transition-colors divide-x divide-dashed divide-gray-200 dark:divide-gray-800 hover:bg-gray-50/70 dark:hover:bg-gray-800/40 bg-white dark:bg-gray-900 cursor-pointer"
                      >
                        <td className="px-4 py-3.5 min-w-[200px]">
                          <div className="flex items-center gap-3">
                            <BuAvatar name={bu.name} logoUrl={bu.logo_url} size={32} />
                            <span className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                              {bu.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-300 font-medium truncate">
                              {bu.organization_name || 'None'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-violet-400" />
                            <span className={`font-bold tabular-nums text-sm ${roleCount > 0 ? 'text-violet-600 dark:text-violet-400' : 'text-gray-400'}`}>{roleCount}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-blue-400" />
                            <span className={`font-bold tabular-nums text-sm ${userCount > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>{userCount}</span>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-between items-center px-2 text-xs text-gray-500 font-medium">
        <span>Showing <span className="font-bold text-gray-900 dark:text-white">{filteredBUs.length}</span> of <span className="font-bold text-gray-900 dark:text-white">{businessUnits.length}</span> business units</span>
      </div>
    </div>
  );
};
