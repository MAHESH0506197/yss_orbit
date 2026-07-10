// yss_orbit\frontend\src\modules\observability\components\MetricsChart.tsx
import React from 'react';

export const MetricsChart: React.FC<{ data: any[], title: string }> = ({ data, title }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 min-h-[300px] flex flex-col">
      <h3 className="font-bold text-gray-800 mb-4">{title}</h3>
      <div className="flex-grow flex items-center justify-center bg-gray-50 rounded border border-dashed border-gray-300">
        <p className="text-gray-500 text-sm">Chart Visualization Placeholder<br/>(e.g., Recharts, Chart.js)</p>
      </div>
    </div>
  );
};
