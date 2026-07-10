import React from 'react';

import { History, Clock, User, MessageSquare } from 'lucide-react';
import type { Organization } from '../types/organizationTypes';
import { formatIST } from '@/utils/date';

interface AuditTrailProps {
  organization: Organization;
}

export const OrganizationAuditTrail: React.FC<AuditTrailProps> = ({ organization }) => {
  const events = [
    {
      type: 'created',
      label: 'Created',
      date: organization.created_at,
      userId: organization.created_by_id,
      reason: organization.created_reason,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    },
    {
      type: 'updated',
      label: 'Last Updated',
      date: organization.updated_at,
      userId: organization.updated_by_id,
      reason: organization.updated_reason,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-500/10',
    },
    {
      type: 'deleted',
      label: 'Deleted',
      date: organization.deleted_at,
      userId: organization.deleted_by_id,
      reason: organization.deleted_reason,
      color: 'text-rose-500',
      bg: 'bg-rose-50 dark:bg-rose-500/10',
    },
    {
      type: 'restored',
      label: 'Restored',
      date: organization.restored_at,
      userId: organization.restored_by_id,
      reason: organization.restored_reason,
      color: 'text-violet-500',
      bg: 'bg-violet-50 dark:bg-violet-500/10',
    },
  ].filter(event => event.date);

  // Sort events by date descending
  events.sort((a, b) => new Date(b.date as string).getTime() - new Date(a.date as string).getTime());

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500 dark:text-gray-400">
        <History className="mb-3 h-8 w-8 text-gray-400 dark:text-gray-500" />
        <p>No audit trail available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col space-y-6">
        {events.map((event, index) => (
          <div key={`${event.type}-${index}`} className="relative flex gap-4">
            {index !== events.length - 1 && (
              <div className="absolute left-5 top-10 -bottom-6 w-px bg-gray-200 dark:bg-gray-800" />
            )}
            <div className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${event.bg}`}>
              <History className={`h-5 w-5 ${event.color}`} />
            </div>
            <div className="flex flex-col pt-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {event.label}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="h-3.5 w-3.5" />
                  {formatIST(event.date as string, 'MMM d, yyyy h:mm a')}
                </span>
              </div>
              
              {(event.userId || event.reason) && (
                <div className="mt-2 flex flex-col gap-1.5 rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-900/50">
                  {event.userId && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <User className="h-4 w-4" />
                      <span className="font-medium">User ID:</span>
                      <span className="font-mono text-xs text-gray-500">{event.userId}</span>
                    </div>
                  )}
                  {event.reason && (
                    <div className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                      <MessageSquare className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>
                        <span className="font-medium">Reason: </span>
                        <span>{event.reason}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
