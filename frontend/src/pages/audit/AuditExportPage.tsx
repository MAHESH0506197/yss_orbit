// yss_orbit\frontend\src\modules\audit\pages\AuditExportPage.tsx
import React from 'react';

export const AuditExportPage: React.FC = () => {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Export Audit Logs</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date Range</label>
            <div className="flex space-x-4 mt-1">
              <input type="date" className="border rounded-md p-2 flex-1" />
              <input type="date" className="border rounded-md p-2 flex-1" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Format</label>
            <select className="border rounded-md p-2 mt-1 w-full">
              <option>CSV</option>
              <option>PDF</option>
              <option>JSON</option>
            </select>
          </div>
          <button type="button" className="w-full bg-[var(--primary-color)] text-white py-2 rounded-md font-medium">Generate Export</button>
        </form>
      </div>
    </div>
  );
};
