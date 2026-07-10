// yss_orbit\frontend\src\modules\errorLog\pages\errorLogListPage.tsx
import React, { useEffect, useState } from 'react';
import { ErrorTable } from '@/features/compliance/errorLog/components/ErrorTable';
import { ErrorFilter } from '@/features/compliance/errorLog/components/ErrorFilter';
import { useErrorLog } from '@/features/compliance/errorLog/hooks/useerrorLog';
import { ErrorLogEntry } from '@/features/compliance/errorLog/types/errorLogTypes';

export const ErrorLogListPage: React.FC = () => {
  const { data, loading } = useErrorLog();
  const errors = (data || []) as any;

  

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">System Error Logs</h1>
      <ErrorFilter onFilter={console.log} />
      
      {loading ? (
        <p>Loading errors...</p>
      ) : (
        <ErrorTable errors={errors} />
      )}
    </div>
  );
};
