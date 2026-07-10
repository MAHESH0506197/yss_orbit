// yss_orbit\frontend\src\modules\observability\components\observabilityCard.tsx
import React from 'react';
import { ObservabilityMetric } from '../types/observabilityTypes';

export const ObservabilityCard: React.FC<{ metric: ObservabilityMetric }> = ({ metric }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-sm font-medium text-gray-500 uppercase">{metric.name}</h3>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-gray-900">{metric.value}</span>
        <span className="text-sm text-gray-500">{metric.unit}</span>
      </div>
    </div>
  );
};
