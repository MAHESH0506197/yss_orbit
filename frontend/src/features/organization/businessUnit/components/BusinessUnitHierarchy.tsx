// yss_orbit\frontend\src\modules\businessUnit\components\BusinessUnitHierarchy.tsx
import React from 'react';

export const BusinessUnitHierarchy: React.FC<{ hierarchyData: any }> = ({ hierarchyData }) => {
  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h4 className="font-medium text-gray-700 mb-4">Organizational Structure</h4>
      {/* Implement tree view here */}
      <div className="pl-4 border-l-2 border-gray-300 space-y-2">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-[var(--primary-color)]"></span>
          <span>Root Organization</span>
        </div>
        <div className="pl-6 border-l-2 border-gray-300 space-y-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            <span>Subsidiary A</span>
          </div>
        </div>
      </div>
    </div>
  );
};
