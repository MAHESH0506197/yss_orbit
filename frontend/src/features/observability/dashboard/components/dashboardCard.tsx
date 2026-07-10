// yss_orbit\frontend\src\modules\dashboard\components\dashboardCard.tsx
import React from 'react';
import { DashboardWidget } from '../types/dashboardTypes';

export const DashboardCard: React.FC<{ widget: DashboardWidget }> = ({ widget }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      <h3 className="font-bold text-gray-800 mb-2">{widget.title}</h3>
      <div className="flex-1 flex items-center justify-center bg-gray-50 rounded border border-dashed border-gray-200 text-gray-400">
        [Widget Content: {widget.type}]
      </div>
    </div>
  );
};
