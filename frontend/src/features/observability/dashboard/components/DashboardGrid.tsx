// yss_orbit\frontend\src\modules\dashboard\components\DashboardGrid.tsx
import React from 'react';
import { DashboardCard } from './dashboardCard';
import { DashboardWidget } from '../types/dashboardTypes';

export const DashboardGrid: React.FC<{ widgets: DashboardWidget[] }> = ({ widgets }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-[250px]">
      {widgets.map(widget => (
        <div key={widget.id} className={widget.width === 2 ? 'md:col-span-2' : widget.width === 3 ? 'xl:col-span-3' : ''}>
          <DashboardCard widget={widget} />
        </div>
      ))}
    </div>
  );
};
