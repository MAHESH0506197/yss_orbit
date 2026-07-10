// yss_orbit\frontend\src\modules\dashboard\pages\DashboardCustomizePage.tsx
import React from 'react';
import { DashboardGrid } from './components/DashboardGrid';

export const DashboardCustomizePage: React.FC = () => {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customize Dashboard</h1>
        <button className="bg-[var(--primary-color)] text-white px-4 py-2 rounded-md font-medium">Save Layout</button>
      </div>
      <div className="bg-gray-100 p-6 rounded-lg min-h-[60vh] border-2 border-dashed border-gray-300">
        <p className="text-gray-500 text-center mb-8">Drag and drop widgets to reorder them.</p>
        <DashboardGrid widgets={[
          { id: '1', title: 'Revenue', type: 'chart', position: 0, width: 2 },
          { id: '2', title: 'Users', type: 'stat', position: 1, width: 1 }
        ]} />
      </div>
    </div>
  );
};
