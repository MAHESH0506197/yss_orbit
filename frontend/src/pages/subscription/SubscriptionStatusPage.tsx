// yss_orbit\frontend\src\modules\subscription\pages\SubscriptionStatusPage.tsx
import React, { useState } from 'react';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { RefetchBar } from '@/components/ui/RefetchBar';
import { CreditCard, Zap, Server, ShieldCheck, ArrowUpCircle, Plus, RefreshCcw, MoreHorizontal, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';

import { useTenantContext } from '@/store/context/TenantContext';
import { useAuthStore } from '@/store/authStore';
import { useTenantModules, useBusinessUnitSubscription } from '@/features/tenancy/subscription/hooks/useSubscription';
import { useBusinessUnits } from '@/features/organization/businessUnit/hooks/useBusinessUnits';
import { useViewMode } from '@/hooks/useViewMode';
import { ViewModeToggle } from '@/components/platform/ViewModeToggle';
import { CardGrid } from '@/components/platform/CardGrid';
import { EntityCard } from '@/components/platform/EntityCard';
import { SubscriptionPlanModal } from './SubscriptionPlanModal';
import { formatIST } from '@/utils/date';

const SubscriptionStatus = () => {
  const { businessUnit } = useTenantContext();

  const { data: moduleResponse, isLoading: modulesLoading } = useTenantModules(businessUnit?.id);
  const { data: subResponse, isLoading: subLoading } = useBusinessUnitSubscription(businessUnit?.id);

  const modules = moduleResponse?.data || [];
  const subscription = subResponse?.data;
  const isLoading = modulesLoading || subLoading;

  const [viewMode, setViewMode, density, setDensity] = useViewMode('subscriptions', 'grid');
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  const columns = [
    {
      header: 'Module Code',
      accessorKey: 'module_code',
      cell: (info: any) => <span className="font-medium text-indigo-600 dark:text-indigo-400">{info.getValue()?.toUpperCase()}</span>
    },
    {
      header: 'Plan',
      accessorKey: 'plan.name',
      cell: (info: any) => <span>{info.getValue() || 'Custom'}</span>
    },
    {
      header: 'Auto Renew',
      accessorKey: 'auto_renew',
      cell: (info: any) => <span>{info.getValue() ? 'Yes' : 'No'}</span>
    },
    {
      header: 'Valid Until',
      accessorKey: 'valid_until',
      cell: (info: any) => <span>{info.getValue() ? new Date(info.getValue()).toLocaleDateString() : 'Lifetime'}</span>
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (info: any) => {
        const status = info.getValue()?.toLowerCase() || 'unknown';
        const isActive = status === 'active';
        const isTrial = status === 'trial';
        return (
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
            isActive ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' 
            : isTrial ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                   : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
          }`}>
            {status.toUpperCase()}
          </span>
        );
      }
    }
  ];

  const { data: buResponse, isLoading: busLoading } = useBusinessUnits({});
  const businessUnits = buResponse?.results || [];
  const selectBusinessUnit = useAuthStore((state: any) => state.selectBusinessUnit);

  const buColumns = [
    {
      header: 'Business Unit',
      accessorKey: 'name',
      cell: (info: any) => <span className="font-bold">{info.getValue()}</span>
    },
    {
      header: 'Code',
      accessorKey: 'code',
    },
    {
      header: 'Organization',
      accessorKey: 'organization_name',
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: (info: any) => (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => selectBusinessUnit(info.row.original.id)}
        >
          View Subscriptions
        </Button>
      )
    }
  ];

  if (!businessUnit) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6 pb-16">

        {/* ── Page Header ─────────────────────────────────────────────────────── */}
        <PageHeader
          icon={CreditCard}
          iconGradient="from-emerald-500 via-teal-500 to-cyan-500"
          title="Business Unit Subscriptions"
          subtitle="Select a Business Unit below to view and manage its subscriptions and modules."
          countBadge={businessUnits.length}
          breadcrumbs={[{ label: 'Platform' }, { label: 'Subscriptions' }]}
        />

        <div className="bg-white dark:bg-gray-900 rounded-[1.5rem] border border-gray-200/80 dark:border-gray-800/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/20">
            <h2 className="text-lg font-bold">All Business Units</h2>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
                {businessUnits.length}
              </span>
            </div>
          </div>
          
          <div className="overflow-auto max-h-[calc(100vh-320px)]">
            {busLoading ? (
              <div className="flex flex-col gap-4 p-8 items-center justify-center min-h-[400px]">
                <div className="h-8 w-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
                <p className="text-sm text-gray-500 font-medium">Loading business units...</p>
              </div>
            ) : businessUnits.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center h-[400px]">
                <p className="text-gray-500 dark:text-gray-400">No business units found.</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left relative">
                <thead className="sticky top-0 z-20 bg-gradient-to-r from-violet-700 via-purple-700 to-fuchsia-700 text-white shadow-md">
                  <tr className="divide-x divide-dashed divide-white/20">
                    {[
                      { key: 'Domain', label: 'Business Unit' },
                      { key: 'Code', label: 'Code' },
                      { key: 'Organization', label: 'Organization' },
                      { key: 'Actions', label: 'Actions' },
                    ].map(h => (
                      <th key={h.key} className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap">
                        {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 border-b border-gray-200 dark:border-gray-800">
                  {businessUnits.map((bu, i) => (
                    <tr
                      key={bu.id}
                      className="group transition-colors divide-x divide-dashed divide-gray-200 dark:divide-gray-800 hover:bg-gray-50/70 dark:hover:bg-gray-800/40 bg-white dark:bg-gray-900"
                      style={{ animationDelay: `${i * 30}ms` }}
                    >
                      <td className="px-4 py-3.5 min-w-[200px]">
                        <div className="flex items-center gap-3 group text-left w-full">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-600 dark:from-indigo-900/40 dark:to-violet-900/40 dark:text-indigo-400">
                            <span className="text-xs font-bold">{bu.name.substring(0, 2).toUpperCase()}</span>
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                              {bu.name}
                            </div>
                            <div className="text-xs text-gray-500 truncate mt-0.5">
                              {bu.business_domain_name || 'No Domain'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 dark:bg-gray-800/50 dark:text-gray-400 dark:ring-gray-700">
                          {bu.code}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {bu.organization_name || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => selectBusinessUnit(bu.id)}
                          className="h-8 text-xs font-semibold bg-white hover:bg-violet-50 hover:text-violet-700 border-gray-200 hover:border-violet-200 transition-all dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-violet-900/20 dark:hover:border-violet-800/50 dark:hover:text-violet-400"
                        >
                          View Subscriptions
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 px-5 py-3 bg-gray-50/40 dark:bg-gray-900/40">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Showing <span className="font-semibold text-gray-700 dark:text-gray-200">{businessUnits.length}</span> records
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 shadow-lg shadow-violet-500/30">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Subscription & Billing</h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-4xl pl-[62px]">
            Manage your enterprise plan, limits, and invoices for {businessUnit?.name}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Update Payment Method</Button>
          <Button 
            variant="primary" 
            className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 border-0 shadow-lg shadow-violet-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/40"
            onClick={() => setIsPlanModalOpen(true)}
          >
            <ArrowUpCircle className="mr-2 h-4 w-4" /> Change Plan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard 
          label="Current Plan" 
          value={subscription?.plan?.name || "No Plan"} 
          icon={ShieldCheck} 
          gradient="bg-gradient-to-br from-indigo-500 to-purple-600" 
        />
        <StatCard 
          label="Status" 
          value={subscription?.status ? subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1) : "Unknown"} 
          icon={Zap} 
          gradient="bg-gradient-to-br from-blue-500 to-cyan-500" 
        />
        <StatCard 
          label="Billing Cycle" 
          value={subscription?.billing_cycle || "Monthly"} 
          icon={Server} 
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600" 
        />
        <StatCard 
          label="Next Billing" 
          value={subscription?.current_period_end ? formatIST(new Date(subscription.current_period_end), 'PPP') : "N/A"} 
          icon={CreditCard} 
          gradient="bg-gradient-to-br from-amber-500 to-orange-500" 
        />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-border shadow-sm">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <h2 className="text-lg font-bold ml-2">Active Module Subscriptions</h2>
          <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} density={density} setDensity={setDensity} />
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading subscriptions...</div>
        ) : viewMode === 'grid' ? (
          <CardGrid isEmpty={modules.length === 0} emptyState={<div className="p-8 text-center text-gray-500">No active subscriptions found.</div>}>
            {modules.map((mod: any) => {
              const status = mod.status?.toLowerCase() || 'unknown';
              const isActive = status === 'active';
              const isTrial = status === 'trial';
              
              return (
                <EntityCard
                  key={mod.module_code}
                  id={mod.module_code}
                  density={density}
                  title={mod.module_code?.toUpperCase()}
                  subtitle={mod.plan?.name || 'Custom Plan'}
                  avatar={
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 text-white shadow-sm font-bold">
                      {mod.module_code?.substring(0, 2).toUpperCase()}
                    </div>
                  }
                  statusBadge={
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                      isActive ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' 
                      : isTrial ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                             : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                    }`}>
                      {status}
                    </span>
                  }
                  metrics={[
                    { label: 'Auto Renew', value: mod.auto_renew ? 'Yes' : 'No', icon: <ArrowUpCircle className="h-3.5 w-3.5" /> },
                    { label: 'Valid Until', value: mod.valid_until ? formatIST(new Date(mod.valid_until), 'PPP') : 'Lifetime', icon: <Server className="h-3.5 w-3.5" /> }
                  ]}
                />
              );
            })}
          </CardGrid>
        ) : (
          <div className="p-4">
            <DataTable 
              data={modules}
              columns={columns}
              searchKey="module_code"
            />
          </div>
        )}
      </div>

      <SubscriptionPlanModal 
        isOpen={isPlanModalOpen} 
        onClose={() => setIsPlanModalOpen(false)} 
        currentPlanId={subscription?.plan?.id} 
      />
    </div>
  );
};

export default function SubscriptionStatusPage() {
  return (
    <ErrorBoundary>
      <SubscriptionStatus />
    </ErrorBoundary>
  );
}
