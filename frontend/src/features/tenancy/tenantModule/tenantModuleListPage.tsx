// yss_orbit\frontend\src\modules\tenantModule\pages\tenantModuleListPage.tsx
import React, { useEffect, useState } from 'react';
import { TenantModuleCard } from '@/features/tenancy/tenantModule/components/tenantModuleCard';
import { SubscriptionStatus } from '@/features/tenancy/tenantModule/components/SubscriptionStatus';
import { useTenantModule } from '@/features/tenancy/tenantModule/hooks/usetenantModule';
import { Link } from 'react-router-dom';
import { Package, ArrowUpRight } from 'lucide-react';

export const TenantModuleListPage: React.FC = () => {
  const { data: modules, loading, toggleModule } = useTenantModule();

  const dummySub = { planName: 'Professional Plan', status: 'Active', billingCycle: 'Monthly', nextBillingDate: '2023-11-01' };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-600 shadow-lg shadow-indigo-500/30">
              <Package className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Modules & Subscription</h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-4xl pl-[62px]">
            Manage your organization's active modules and subscription plans.
          </p>
        </div>
        <Link 
          to="plans" 
          className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/25 transition-all hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:ring-offset-gray-950"
        >
          Upgrade Plan
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </div>
      
      <SubscriptionStatus subscription={dummySub} />

      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          Platform Modules
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            {modules.length}
          </span>
        </h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 rounded-2xl bg-gray-50 dark:bg-gray-800/50 animate-pulse border border-gray-100 dark:border-gray-800" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((mod: any) => (
              <TenantModuleCard key={mod.id || mod.module?.id} module={mod} onToggle={toggleModule} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
