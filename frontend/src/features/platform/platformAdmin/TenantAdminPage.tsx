// yss_orbit\frontend\src\modules\platformAdmin\pages\TenantAdminPage.tsx
import React, { useEffect, useState } from 'react';
import { TenantTable } from './components/TenantTable';
import { usePlatformAdmin } from './hooks/useplatformAdmin';
import { Tenant } from './types/platformAdminTypes';

export const TenantAdminPage: React.FC = () => {
  const { data, loading } = usePlatformAdmin();
  const tenants = (data || []) as any;

  

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Tenant Administration</h1>
      {loading ? <p>Loading tenants...</p> : <TenantTable tenants={tenants} />}
    </div>
  );
};
