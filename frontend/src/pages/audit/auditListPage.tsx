// yss_orbit\frontend\src\modules\audit\pages\auditListPage.tsx
import React, { useEffect, useState } from 'react';
import { AuditTimeline } from '@/features/compliance/audit/components/AuditTimeline';
import { useAudit } from '@/features/compliance/audit/hooks/useaudit';
import { AuditLog } from '@/features/compliance/audit/types/auditTypes';

export const AuditListPage: React.FC = () => {
  const { data, loading } = useAudit();
  const raw = (data as any)?.data || (data as any)?.items || (data as any)?.records || data || [];
  const logs = Array.isArray(raw) ? raw : (Object.values(raw).find(Array.isArray) || []);

  

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">System Audit Trail</h1>
        <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-200">Export</button>
      </div>
      {loading ? (
        <p className="text-gray-500">Loading audit trail...</p>
      ) : (
        <AuditTimeline logs={logs} />
      )}
    </div>
  );
};
