// yss_orbit\frontend\src\modules\health\components\DependencyGrid.tsx
import React from 'react';
import { HealthDependency } from '../types/healthTypes';
import { ServiceStatusIndicator } from './ServiceStatusIndicator';

export const DependencyGrid: React.FC<{ dependencies: HealthDependency[] }> = ({ dependencies }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {dependencies.map((dep, idx) => (
        <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium text-gray-800">{dep.name}</h4>
            <ServiceStatusIndicator status={dep.status} />
          </div>
          <p className="text-sm text-gray-500">Latency: {dep.latencyMs}ms</p>
          {dep.error && <p className="text-xs text-red-500 mt-2 truncate">{dep.error}</p>}
        </div>
      ))}
    </div>
  );
};
