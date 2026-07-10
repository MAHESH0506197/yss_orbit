import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/api/services/dashboardService';
import { useTenantContext } from '@/store/context/TenantContext';
import { Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const RecentActivityWidget: React.FC = () => {
  const { businessUnit } = useTenantContext();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['recentActivity', businessUnit?.id],
    queryFn: () => dashboardService.getRecentActivity(businessUnit?.id || null),
  });

  if (isLoading) {
    return <div className="p-6 h-full flex items-center justify-center animate-pulse text-gray-500">Loading recent activity...</div>;
  }

  if (isError || !data) {
    return <div className="p-6 h-full flex items-center justify-center text-red-500">Failed to load activity.</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 h-full p-6 flex flex-col hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Recent Activity</h3>
      
      {data.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-10 space-y-4 bg-gray-50/50 dark:bg-gray-900/20 rounded-xl border-2 border-dashed border-gray-100 dark:border-gray-700/50">
          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full">
            <Clock className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-medium">No recent activity found.</p>
        </div>
      ) : (
        <div className="space-y-4 flex-1 overflow-y-auto pr-2">
          {data.map((log: any) => (
            <div key={log.id} className="flex items-start space-x-3 text-sm">
              <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 flex-shrink-0" />
              <div>
                <p className="text-gray-800 dark:text-gray-200">{log.action}</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  by {log.user} • {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
