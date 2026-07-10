// yss_orbit\frontend\src\modules\tenantSettings\pages\SettingsTemplatePage.tsx
import React from 'react';

export const SettingsTemplatePage: React.FC = () => {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Setting Templates</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <p className="text-gray-500 mb-4">Apply pre-configured setting templates across your organization.</p>
        <button className="bg-[var(--primary-color)] text-white px-4 py-2 rounded-md font-medium">Create New Template</button>
      </div>
    </div>
  );
};
