// yss_orbit\frontend\src\modules\platformAdmin\pages\platformAdminListPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';

export const PlatformAdminListPage: React.FC = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Platform Administration</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link to="stats" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-bold text-gray-800">Platform Metrics</h3>
          <p className="text-sm text-gray-500 mt-2">View system health and usage statistics across all tenants.</p>
        </Link>
        <Link to="tenants" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-bold text-gray-800">Tenant Management</h3>
          <p className="text-sm text-gray-500 mt-2">Manage organizations, plans, and tenant lifecycles.</p>
        </Link>
        <Link to="break-glass" className="bg-white p-6 rounded-lg shadow-sm border border-red-200 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-bold text-red-800">Emergency Access</h3>
          <p className="text-sm text-red-600 mt-2">Initiate break-glass procedures for critical incidents.</p>
        </Link>
      </div>
    </div>
  );
};
