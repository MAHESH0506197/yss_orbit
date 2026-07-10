// yss_orbit\frontend\src\modules\errorLog\components\ErrorFilter.tsx
import React from 'react';

export const ErrorFilter: React.FC<{ onFilter: (f: any) => void }> = ({ onFilter }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex space-x-4">
      <select className="border rounded-md p-2 flex-1 text-sm text-gray-700 focus:ring-[var(--primary-color)]" onChange={(e) => onFilter({ severity: e.target.value })}>
        <option value="">All Severities</option>
        <option value="CRITICAL">Critical</option>
        <option value="ERROR">Error</option>
        <option value="WARNING">Warning</option>
      </select>
      <input 
        type="text" 
        placeholder="Search by code or message..." 
        className="border rounded-md p-2 flex-2 flex-grow text-sm focus:ring-[var(--primary-color)]" 
        onChange={(e) => onFilter({ search: e.target.value })}
      />
    </div>
  );
};
