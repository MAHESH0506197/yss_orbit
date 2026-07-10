// yss_orbit\frontend\src\features\admin\audit\pages\AuditLogPage.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AuditLogTable } from '../components/AuditLogTable';
import { PermissionGate } from '@/components/common/PermissionGate';

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  resource: string;
  resourceId: string;
  timestamp: string;
  ipAddress: string;
}

const fetchAuditLogs = async (): Promise<AuditLogEntry[]> => {
  await new Promise((resolve) => setTimeout(resolve, 900));
  return [
    { id: 'log-101', actor: 'alice@yssorbit.com', action: 'CREATE', resource: 'User', resourceId: 'usr-923', timestamp: '2026-05-29T10:12:45Z', ipAddress: '192.168.1.45' },
    { id: 'log-102', actor: 'bob@yssorbit.com', action: 'UPDATE', resource: 'BusinessUnit', resourceId: 'bu-44', timestamp: '2026-05-29T09:30:11Z', ipAddress: '10.0.4.12' },
    { id: 'log-103', actor: 'system', action: 'DELETE', resource: 'Organization', resourceId: 'org-22', timestamp: '2026-05-28T18:45:00Z', ipAddress: '127.0.0.1' },
    { id: 'log-104', actor: 'charlie@yssorbit.com', action: 'LOGIN', resource: 'Session', resourceId: 'sess-812', timestamp: '2026-05-28T08:00:22Z', ipAddress: '203.0.113.88' },
  ];
};

export default function AuditLogPage() {
  const { data: logs, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin_audit_logs'],
    queryFn: fetchAuditLogs,
  });

  return (
    <div className="p-6 bg-[var(--color-bg)] min-h-screen text-[var(--color-text)]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Audit Logs</h1>
        <div className="flex space-x-2 text-sm">
          <span className="bg-[var(--color-surface)] px-3 py-1.5 rounded-md border border-[var(--color-border)] text-[var(--color-text-muted)] font-medium">Read Only View</span>
        </div>
      </div>

      {isLoading ? (
        <div className="w-full h-64 bg-[var(--color-surface)] animate-pulse rounded-md border border-[var(--color-border)]" />
      ) : isError ? (
        <div className="p-4 bg-[var(--color-error-bg)] text-[var(--color-error-text)] rounded-md border border-[var(--color-error-border)]">
          <p className="font-medium">Failed to load audit logs.</p>
          <button onClick={() => refetch()} className="mt-2 underline font-medium hover:opacity-80">Retry</button>
        </div>
      ) : (
        <PermissionGate permission="audit:read" fallback={<div className="p-4 text-center">You do not have permission to view audit logs.</div>}>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md overflow-hidden">
            <AuditLogTable logs={logs || []} />
          </div>
        </PermissionGate>
      )}
    </div>
  );
}
