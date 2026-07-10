// yss_orbit\frontend\src\routes\guards\BusinessUnitGuard.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Building2 } from 'lucide-react';

export const BusinessUnitGuard: React.FC = () => {
  const selectedBusinessUnitId = useAuthStore((state) => state.selectedBusinessUnitId);

  if (!selectedBusinessUnitId) {
    return (
      <div className="flex h-[calc(100vh-64px)] w-full flex-col items-center justify-center p-8 text-center bg-gray-50/50 dark:bg-gray-900/50">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 mb-6">
          <Building2 className="h-10 w-10 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Business Unit Required</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          This module operates at the Business Unit level. Please select a Business Unit from the dropdown menu in the top navigation bar to access these features.
        </p>
      </div>
    );
  }

  return <Outlet />;
};
