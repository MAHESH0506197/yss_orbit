// yss_orbit\frontend\src\modules\dashboard\components\StatSummary.tsx
import React from 'react';

export const StatSummary: React.FC<{ title: string, value: string | number, trend?: number, prefix?: string }> = ({ title, value, trend, prefix }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
      <div className="flex items-baseline space-x-2">
        <span className="text-3xl font-bold text-gray-900">{prefix}{value}</span>
        {trend !== undefined && (
          <span className={`text-sm font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
};
