// yss_orbit\frontend\src\modules\moduleRegistry\pages\moduleRegistryDetailPage.tsx
import React from 'react';
import { useParams } from 'react-router-dom';

export const ModuleRegistryDetailPage: React.FC = () => {
  const { id } = useParams();

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Module Details: {id}</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <p>Detailed view of module configuration, dependencies, and settings.</p>
      </div>
    </div>
  );
};
