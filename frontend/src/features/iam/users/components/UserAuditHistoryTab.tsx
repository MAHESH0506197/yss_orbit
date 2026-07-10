import React from 'react';
import { useAudit } from '@/features/compliance/audit/hooks/useaudit';
import { Clock, CheckCircle, Shield, Edit, Trash, LogIn, Activity, AlertCircle } from 'lucide-react';
import { parseISO } from 'date-fns';
import { formatIST } from '@/utils/date';

interface UserAuditHistoryTabProps {
  userId: string;
}

const getActionIcon = (action: string) => {
  switch (action) {
    case 'CREATE':
    case 'ROLE_ASSIGNED':
      return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    case 'UPDATE':
      return <Edit className="w-4 h-4 text-blue-500" />;
    case 'DELETE':
    case 'PERMISSION_REVOKED':
      return <Trash className="w-4 h-4 text-rose-500" />;
    case 'LOGIN':
      return <LogIn className="w-4 h-4 text-indigo-500" />;
    default:
      return <Activity className="w-4 h-4 text-slate-500" />;
  }
};

const getActionColor = (action: string) => {
  switch (action) {
    case 'CREATE':
    case 'ROLE_ASSIGNED':
      return 'bg-emerald-100 border-emerald-200';
    case 'UPDATE':
      return 'bg-blue-100 border-blue-200';
    case 'DELETE':
    case 'PERMISSION_REVOKED':
      return 'bg-rose-100 border-rose-200';
    case 'LOGIN':
      return 'bg-indigo-100 border-indigo-200';
    default:
      return 'bg-slate-100 border-slate-200';
  }
};

const formatActionText = (action: string) => {
  return action.replace(/_/g, ' ').toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
};

export const UserAuditHistoryTab: React.FC<UserAuditHistoryTabProps> = ({ userId }) => {
  const { data: logs, loading, error } = useAudit(userId);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-slate-500 animate-pulse">
        Loading audit history...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-rose-500 bg-rose-50 rounded-xl border border-rose-200 p-6 text-center">
        <div>
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-rose-400" />
          <h3 className="text-lg font-bold">Failed to load audit history</h3>
          <p className="text-sm mt-1">{error.message || 'An unknown error occurred'}</p>
        </div>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
        <Clock className="w-12 h-12 mb-3 text-slate-300" />
        <h3 className="text-lg font-semibold text-slate-700">No History Available</h3>
        <p className="text-sm">There are no audit logs recorded for this user yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between dark:border-slate-800 dark:bg-slate-800/50">
        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold text-lg">
          <Shield className="w-5 h-5 text-indigo-500" />
          Activity & Audit Log
        </div>
        <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-full dark:bg-slate-800 dark:text-slate-400">
          {logs.length} Records
        </span>
      </div>
      
      <div className="p-6">
        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent dark:before:via-slate-800">
          {logs.map((log: any, idx) => {
            const isRightSide = idx % 2 === 0;
            return (
              <div key={log.id || idx} className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group`}>
                {/* Icon Marker */}
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 ${getActionColor(log.action)}`}>
                  {getActionIcon(log.action)}
                </div>
                
                {/* Content Box */}
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow dark:bg-slate-900 dark:border-slate-800 relative group-hover:border-indigo-200">
                  <div className="flex flex-col mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {formatActionText(log.action)}
                      </span>
                      <time className="font-mono font-medium text-slate-500 text-xs bg-slate-100 px-2 py-1 rounded dark:bg-slate-800">
                        {log.createdAt ? formatIST(parseISO(log.createdAt), 'MMM d, yyyy HH:mm') : 'Unknown Date'}
                      </time>
                    </div>
                    
                    {log.userUsername && (
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        By <span className="font-semibold text-slate-700 dark:text-slate-300">@{log.userUsername}</span>
                        {log.ipAddress && <span className="text-slate-400">({log.ipAddress})</span>}
                      </div>
                    )}
                  </div>
                  
                  {log.resourceDisplay && (
                    <div className="text-sm text-slate-600 mb-2 dark:text-slate-400">
                      <strong>Target:</strong> {log.resourceDisplay}
                    </div>
                  )}

                  {log.newValues && typeof log.newValues === 'object' && Object.keys(log.newValues).length > 0 && (
                    <div className="mt-3">
                      <details className="group/details">
                        <summary className="text-xs font-semibold text-indigo-600 cursor-pointer select-none hover:text-indigo-700 flex items-center gap-1">
                          <span className="group-open/details:hidden">View Changes</span>
                          <span className="hidden group-open/details:inline">Hide Changes</span>
                        </summary>
                        <div className="mt-2 bg-slate-50 p-3 rounded text-xs font-mono text-slate-700 overflow-x-auto border border-slate-100 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300">
                          <pre>{JSON.stringify(log.newValues, null, 2)}</pre>
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
