// yss_orbit/frontend/src/modules/organization/components/OrganizationStatsCards.tsx

import React from 'react';
import { Building2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import type { OrganizationListMeta } from '../types/organizationTypes';

interface Props {
  meta?:      OrganizationListMeta;
  isLoading?: boolean;
}

function StatCard({
  label, value, sub, icon: Icon, colorClass, isLoading,
}: {
  label: string; value: number | string; sub?: string;
  icon: React.ElementType; colorClass: string; isLoading?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700/50 dark:bg-gray-800">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
          {isLoading ? (
            <div className="mt-2 h-7 w-16 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700" />
          ) : (
            <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900 dark:text-white">{value}</p>
          )}
          {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colorClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export const OrganizationStatsCards: React.FC<Props> = ({ meta, isLoading }) => {
  const cards = [
    {
      label:      'Total',
      value:      meta?.total ?? 0,
      sub:        'All organizations',
      icon:       Building2,
      colorClass: 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400',
    },
    {
      label:      'Active',
      value:      meta?.total_active ?? 0,
      sub:        'Currently operational',
      icon:       CheckCircle2,
      colorClass: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
    },
    {
      label:      'Inactive',
      value:      meta?.total_inactive ?? 0,
      sub:        'Deactivated',
      icon:       AlertTriangle,
      colorClass: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
    },
    {
      label:      'Archived',
      value:      meta?.total_deleted ?? 0,
      sub:        'Soft-deleted',
      icon:       XCircle,
      colorClass: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map(card => (
        <StatCard key={card.label} {...card} isLoading={isLoading} />
      ))}
    </div>
  );
};
