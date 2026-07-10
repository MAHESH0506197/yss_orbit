// yss_orbit\frontend\src\modules\appraisal\components\KpiTracker.tsx
import React from 'react';

export const KpiTracker: React.FC<{ kpis: any[] }> = ({ kpis }) => {
  return (
    <div className="space-y-4">
      {kpis?.map((kpi, idx) => (
        <div key={idx} className="border p-4 rounded-lg">
          <div className="flex justify-between mb-1">
            <span className="font-medium">{kpi.title}</span>
            <span className="text-sm font-bold">{kpi.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-[var(--primary-color)] h-2.5 rounded-full" style={{ width: `${kpi.progress}%` }}></div>
          </div>
        </div>
      ))}
    </div>
  );
};
