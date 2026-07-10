// yss_orbit\frontend\src\modules\observability\pages\observabilityListPage.tsx
import React, { useEffect, useState } from 'react';
import { ObservabilityCard } from './components/observabilityCard';
import { useObservability } from './hooks/useobservability';
import { ObservabilityMetric } from './types/observabilityTypes';
import { Link } from 'react-router-dom';

export const ObservabilityListPage: React.FC = () => {
  const { data, loading } = useObservability();
  const metrics = (data || []) as any;

  

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Observability Dashboard</h1>
        <div className="space-x-4">
          <Link to="metrics" className="text-[var(--primary-color)] hover:underline">Detailed Metrics</Link>
          <Link to="traces" className="text-[var(--primary-color)] hover:underline">Distributed Traces</Link>
        </div>
      </div>
      
      {loading ? (
        <p>Loading metrics...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric: any) => (
            <ObservabilityCard key={metric.id} metric={metric} />
          ))}
        </div>
      )}
    </div>
  );
};
