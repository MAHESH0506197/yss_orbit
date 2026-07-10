// yss_orbit\frontend\src\modules\platformAdmin\components\platformAdminCard.tsx
import React from 'react';

export const PlatformAdminCard: React.FC<{ title: string, value: string | number, desc: string }> = ({ title, value, desc }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-sm font-medium text-gray-500 uppercase">{title}</h3>
      <div className="mt-2 text-3xl font-bold text-gray-900">{value}</div>
      <p className="mt-1 text-xs text-gray-500">{desc}</p>
    </div>
  );
};
