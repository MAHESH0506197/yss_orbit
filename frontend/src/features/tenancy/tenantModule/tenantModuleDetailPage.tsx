// yss_orbit\frontend\src\modules\tenantModule\pages\tenantModuleDetailPage.tsx
import React from 'react';
import { useParams } from 'react-router-dom';

export const TenantModuleDetailPage: React.FC = () => {
  const { id } = useParams();

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Module Configuration: {id}</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <p>Manage settings and access controls for a specific licensed module.</p>
      </div>
    </div>
  );
};
