// yss_orbit\frontend\src\modules\audit\pages\auditDetailPage.tsx
import React from 'react';
import { useParams } from 'react-router-dom';

export const AuditDetailPage: React.FC = () => {
  const { id } = useParams();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Audit Log: {id}</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <p>Detailed view of the audit event including raw request/response payloads if available.</p>
      </div>
    </div>
  );
};
