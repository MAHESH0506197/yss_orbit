// yss_orbit\frontend\src\modules\dashboard\components\DashboardWidget.tsx
import React from 'react';

export const DashboardWidget: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 className="font-bold text-gray-800 mb-4">{title}</h3>
      {children}
    </div>
  );
};
