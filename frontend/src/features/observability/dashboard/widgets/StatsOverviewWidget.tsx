import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/api/services/dashboardService';
import { useTenantContext } from '@/store/context/TenantContext';
import { Users, CreditCard, Building2, TrendingUp } from 'lucide-react';
import { cn } from '@/utils/cn';

export const StatsOverviewWidget: React.FC = () => {
  const { businessUnit } = useTenantContext();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboardMetrics', businessUnit?.id],
    queryFn: () => dashboardService.getMetrics(businessUnit?.id || null),
  });

  if (isLoading) {
    return <div className="h-full flex items-center justify-center p-8 text-gray-500 animate-pulse">Loading real-time metrics...</div>;
  }

  if (isError || !data) {
    return <div className="h-full flex items-center justify-center p-8 text-red-500">Failed to load metrics.</div>;
  }

  const statCards = [
    { label: 'Total Users', value: data.totalUsers, icon: Users, iconColor: 'text-blue-600 dark:text-blue-400', iconBg: 'bg-blue-50 dark:bg-blue-500/10' },
    { label: 'Organizations', value: data.totalOrganizations, icon: Building2, iconColor: 'text-indigo-600 dark:text-indigo-400', iconBg: 'bg-indigo-50 dark:bg-indigo-500/10' },
    { label: 'Active Subs', value: data.activeSubscriptions, icon: CreditCard, iconColor: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { label: 'Business Units', value: data.totalBusinessUnits, icon: Building2, iconColor: 'text-rose-600 dark:text-rose-400', iconBg: 'bg-rose-50 dark:bg-rose-500/10' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, idx) => (
        <div key={idx} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700/50 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
            <span className={cn("p-2 rounded-lg", stat.iconBg, stat.iconColor)}>
              <stat.icon size={20} />
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
