// yss_orbit\frontend\src\modules\dashboard\pages\dashboardListPage.tsx
import React, { useEffect, useState } from 'react';
import { StatSummary } from './components/StatSummary';
import { DashboardGrid } from './components/DashboardGrid';
import { useDashboard } from './hooks/usedashboard';
import { DashboardConfig } from './types/dashboardTypes';
import { Link } from 'react-router-dom';

export const DashboardListPage: React.FC = () => {
  const { data, loading } = useDashboard();
  const [config, setConfig] = useState<DashboardConfig | null>(null);

  

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <Link to="customize" className="text-[var(--primary-color)] hover:underline font-medium">Customize</Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatSummary title="Total Revenue" value="124,500" prefix="$" trend={12.5} />
        <StatSummary title="Active Users" value="2,450" trend={5.2} />
        <StatSummary title="New Orders" value="142" trend={-2.1} />
        <StatSummary title="Customer Satisfaction" value="4.8/5" />
      </div>

      {loading ? (
        <p>Loading widgets...</p>
      ) : (
        <DashboardGrid widgets={config?.widgets || []} />
      )}
    </div>
  );
};
