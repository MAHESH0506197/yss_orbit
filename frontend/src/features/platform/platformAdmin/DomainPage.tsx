import React, { useState, useMemo } from 'react';
import {
  Globe2, Plus, Edit2, Trash2, RefreshCcw, Eye,
  CheckCircle2, XCircle, AlertTriangle, MoreHorizontal,
  Search, X, Layers, Fingerprint, GitBranch, Zap,
  Calendar, ShieldCheck, Lock, Clock
} from 'lucide-react';

import toast from 'react-hot-toast';

import { useTenantDomains, useDeleteTenantDomain } from '@/features/tenancy/tenantDomains/hooks/useTenantDomains';
import type { TenantDomain } from '@/features/tenancy/tenantDomains/types/tenantDomainTypes';
import { DomainFormModal } from '@/features/tenancy/tenantDomains/components/DomainFormModal';
import { TenantDomainViewModal } from '@/features/tenancy/tenantDomains/components/TenantDomainViewModal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import type { ConfirmDialogOptions } from '@/components/common/ConfirmDialog';
import { PageHeader } from '@/components/ui/PageHeader';
import { RefetchBar } from '@/components/ui/RefetchBar';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable } from '@/components/ui/DataTable';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { useAuthStore } from '@/store/authStore';
import { useViewMode } from '@/hooks/useViewMode';
import { ViewModeToggle } from '@/components/platform/ViewModeToggle';
import { CardGrid } from '@/components/platform/CardGrid';
import { EntityCard } from '@/components/platform/EntityCard';
import { formatIST } from '@/utils/date';

function StatusBadge({ isTrue, trueText, falseText, type = 'emerald' }: { isTrue: boolean; trueText: string; falseText: string; type?: 'emerald' | 'purple' }) {
  if (isTrue) {
    const colorClass = type === 'emerald' 
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/25 dark:text-emerald-400 dark:ring-emerald-800/50'
      : 'bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-900/25 dark:text-purple-400 dark:ring-purple-800/50';
    const dotClass = type === 'emerald' ? 'bg-emerald-500' : 'bg-purple-500';
      
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${colorClass}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${dotClass} shrink-0`} /> {trueText}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-gray-50 text-gray-600 ring-1 ring-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:ring-gray-700">
      <span className="h-1.5 w-1.5 rounded-full bg-gray-400 shrink-0" /> {falseText}
    </span>
  );
}

function PageSkeleton() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
      <div className="h-14 bg-gray-100 dark:bg-gray-800 rounded-2xl w-72" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl" />)}
      </div>
      <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
    </div>
  );
}

type StatusFilter = 'all' | 'verified' | 'pending' | 'failed';

const STATUS_TABS = [
  { label: 'All',      value: 'all' as StatusFilter },
  { label: 'Verified', value: 'verified' as StatusFilter },
  { label: 'Pending',  value: 'pending' as StatusFilter },
  { label: 'Failed',   value: 'failed' as StatusFilter },
];

export function DomainPage() {
  const { data: domainsResponse, isLoading, refetch, isRefetching } = useTenantDomains();
  const domains = domainsResponse?.results || [];
  const deleteMutation = useDeleteTenantDomain();
  const { hasPermission } = useAuthStore();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<TenantDomain | null>(null);
  const [viewDomain, setViewDomain] = useState<TenantDomain | null>(null);
  
  const [viewMode, setViewMode, density, setDensity] = useViewMode('tenantDomains', 'grid');
  const [selectedDomainIds, setSelectedDomainIds] = useState<string[]>([]);

  const stats = useMemo(() => {
    return {
      total: domains.length,
      verified: domains.filter(d => d.domain_status === 'verified').length,
      ssl: domains.filter(d => d.ssl_status === 'active').length,
      pending: domains.filter(d => d.domain_status === 'pending').length,
    };
  }, [domains]);

  const filteredDomains = useMemo(() => {
    let result = domains;
    if (statusFilter !== 'all') {
      result = result.filter(d => d.domain_status === statusFilter);
    }
    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(d => 
        d.name.toLowerCase().includes(lowerSearch) || 
        d.business_unit_id?.toLowerCase().includes(lowerSearch) ||
        d.organization_id?.toLowerCase().includes(lowerSearch)
      );
    }
    return result;
  }, [domains, search, statusFilter]);

  const handleEdit = (domain: TenantDomain) => {
    setSelectedDomain(domain);
    setIsModalOpen(true);
  };

  const handleView = (domain: TenantDomain) => {
    setViewDomain(domain);
  };

  // Removed handleCreate since domains are managed in Org Settings

  // FIX: Replace window.confirm with ConfirmDialog (premium UX pattern)
  const [confirmOpts, setConfirmOpts] = useState<ConfirmDialogOptions | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDelete = (domain: TenantDomain) => {
    setConfirmOpts({
      title:        'Delete Domain',
      message:      `Delete "${domain.name}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      variant:      'danger',
      onConfirm: () => {
        deleteMutation.mutate(domain.id, {
          onSuccess: () => toast.success(`Domain "${domain.name}" deleted successfully.`),
          onError:   (err: any) => toast.error(err?.response?.data?.detail || 'Failed to delete domain.'),
        });
        setConfirmOpen(false);
      },
    });
    setConfirmOpen(true);
  };

  const columns = useMemo(() => [
    {
      header: 'Domain Name',
      accessorKey: 'name',
      cell: (info: any) => {
        const d = info.row.original as TenantDomain;
        return (
          <div 
            onClick={() => handleView(d)}
            className="flex items-center gap-3 group cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/30 -mx-2 px-2 py-1 rounded-xl transition-colors"
          >
            <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md transition-transform group-hover:scale-110">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {d.name}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Organization',
      accessorKey: 'organization_id',
      cell: (info: any) => {
        const d = info.row.original as TenantDomain;
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/60 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700" title={`ID: ${d.organization_id}`}>
            <Layers className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
            {d.organization_name || 'System'}
          </span>
        );
      },
    },
    {
      header: 'Verification',
      accessorKey: 'domain_status',
      cell: (info: any) => <StatusBadge isTrue={info.getValue() === 'verified'} trueText="Verified" falseText={info.getValue() === 'failed' ? "Failed" : "Pending"} type="emerald" />,
    },
    {
      header: 'SSL Provisioning',
      accessorKey: 'ssl_status',
      cell: (info: any) => <StatusBadge isTrue={info.getValue() === 'active'} trueText="Active" falseText={info.getValue() === 'failed' ? "Failed" : "Pending"} type="purple" />,
    },
    {
      header: 'Created',
      accessorKey: 'created_at',
      cell: (info: any) => {
        const d = info.row.original as TenantDomain;
        return d.created_at ? (
          <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            {formatIST(d.created_at, 'dd MMM yyyy')}
          </div>
        ) : '—';
      },
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      enableSorting: false,
      cell: (info: any) => {
        const d = info.row.original as TenantDomain;
        return (
          <div className="flex justify-end items-center gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); handleView(d); }}
              className="flex items-center justify-center h-8 w-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 transition-all hover:scale-105 border border-blue-100 dark:border-blue-500/20 shadow-sm"
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </button>

            {hasPermission("platform.domains.update") && (
              <button 
                onClick={(e) => { e.stopPropagation(); handleEdit(d); }}
                className="flex items-center justify-center h-8 w-8 rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100 hover:text-violet-700 dark:bg-violet-500/10 dark:text-violet-400 dark:hover:bg-violet-500/20 transition-all hover:scale-105 border border-violet-100 dark:border-violet-500/20 shadow-sm"
                title="Edit Configuration"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            )}

            {hasPermission("platform.domains.delete") && (
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(d); }}
                className="flex items-center justify-center h-8 w-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 transition-all hover:scale-105 border border-rose-100 dark:border-rose-500/20 shadow-sm"
                title="Delete Domain"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      },
    },
  ], [handleEdit, handleDelete]);

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pb-24">
      <RefetchBar visible={isRefetching} />

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <PageHeader
        icon={Globe2}
        iconGradient="from-blue-500 via-cyan-500 to-teal-500"
        title="Tenant Domains"
        subtitle="Manage and provision custom domains for tenant business units."
        countBadge={stats.total}
        breadcrumbs={[
          { label: 'Platform' },
          { label: 'Tenant Domains' },
        ]}
        actions={
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-2.5 text-gray-500 hover:text-gray-700 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCcw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Domains" value={stats.total} icon={Globe2} gradient="bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600" />
        <StatCard label="Verified Domains" value={stats.verified} icon={ShieldCheck} gradient="bg-gradient-to-br from-emerald-500 to-teal-600" />
        <StatCard label="SSL Active" value={stats.ssl} icon={Lock} gradient="bg-gradient-to-br from-amber-500 to-orange-500" />
        <StatCard label="Pending Review" value={stats.pending} icon={Clock} gradient="bg-gradient-to-br from-rose-500 to-pink-600" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 px-5 py-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search domains or orgs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 py-2 pl-9 pr-8 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20 transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-1 hidden md:flex">
              {STATUS_TABS.map(tab => (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    statusFilter === tab.value
                      ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} density={density} setDensity={setDensity} />
          </div>
        </div>
        
        {viewMode === 'grid' ? (
          <CardGrid 
            isEmpty={filteredDomains.length === 0} 
            emptyState={
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="h-16 w-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4 border border-gray-200 dark:border-gray-700">
                  <Globe2 className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">No domains found</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mt-1">
                  {search ? 'Try adjusting your search terms.' : 'Get started by creating a custom domain for a tenant.'}
                </p>
              </div>
            }
          >
            {filteredDomains.map(domain => {
              const isSelected = selectedDomainIds.includes(domain.id);
              const toggleSelect = (checked: boolean) => {
                if (checked) setSelectedDomainIds(prev => [...prev, domain.id]);
                else setSelectedDomainIds(prev => prev.filter(id => id !== domain.id));
              };

              return (
                <EntityCard
                  key={domain.id}
                  id={domain.id}
                  density={density}
                  title={domain.name}
                  subtitle={domain.organization_id}
                  avatar={
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-sm">
                      <Globe2 className="h-5 w-5" />
                    </div>
                  }
                  statusBadge={
                    <div className="flex items-center gap-1">
                      <StatusBadge isTrue={domain.domain_status === 'verified'} trueText="Verified" falseText={domain.domain_status} type="emerald" />
                    </div>
                  }
                  isSelected={isSelected}
                  onSelect={toggleSelect}
                  onClick={() => handleView(domain)}
                  metrics={[
                    { label: 'SSL', value: domain.ssl_status, icon: <Lock className="h-3.5 w-3.5" /> },
                    { label: 'Status', value: domain.domain_status, icon: <CheckCircle2 className="h-3.5 w-3.5" /> }
                  ]}
                  actions={[
                    { label: 'View Details', icon: <Eye />, onClick: () => handleView(domain) },
                    { label: 'Edit Configuration', icon: <Edit2 />, onClick: () => handleEdit(domain) },
                    { label: 'Delete Domain', icon: <Trash2 />, danger: true, onClick: () => handleDelete(domain) }
                  ]}
                />
              );
            })}
          </CardGrid>
        ) : (
          <DataTable
            columns={columns as any}
            data={filteredDomains}
            enableGlobalFilter={false}
          />
        )}
      </div>

      <DomainFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        domain={selectedDomain}
      />

      <TenantDomainViewModal
        isOpen={!!viewDomain}
        onClose={() => setViewDomain(null)}
        domain={viewDomain}
      />

      <ConfirmDialog
        isOpen={confirmOpen}
        opts={confirmOpts}
        onClose={() => setConfirmOpen(false)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
