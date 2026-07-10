// yss_orbit\frontend\src\modules\featureFlags\pages\FeatureFlagCreatePage.tsx
import React from 'react';

export const FeatureFlagCreatePage: React.FC = () => {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Create Feature Flag</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Flag Name</label>
            <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Flag Key (e.g., enable_new_dashboard)</label>
            <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border font-mono text-sm" />
          </div>
          <button type="button" className="bg-[var(--primary-color)] text-white px-4 py-2 rounded-md font-medium">Create Flag</button>
        </form>
      </div>
    </div>
  );
};
