import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/api/services/dashboardService';
import { Server, Database, HardDrive, Activity } from 'lucide-react';

export const SystemHealthWidget: React.FC = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['systemHealth'],
    queryFn: () => dashboardService.getSystemHealth(),
  });

  if (isLoading) {
    return <div className="p-6 h-full flex items-center justify-center animate-pulse text-gray-500">Checking system health...</div>;
  }

  if (isError || !data) {
    return <div className="p-6 h-full flex items-center justify-center text-red-500">System health unavailable.</div>;
  }

  const items = [
    { label: 'Database', status: data.database, icon: Database, colorClass: data.database === 'OK' ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' : 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10' },
    { label: 'Cache', status: data.cache, icon: HardDrive, colorClass: data.cache === 'OK' ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' : 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10' },
    { label: 'Queue', status: data.queue, icon: Server, colorClass: data.queue === 'OK' ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' : 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10' },
    { label: 'Error Rate', status: `${data.errorRate}%`, icon: Activity, colorClass: data.errorRate < 1 ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' : 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 h-full p-6 flex flex-col hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">System Health</h3>
      <div className="grid grid-cols-2 gap-4 flex-1">
        {items.map((item, idx) => (
          <div key={idx} className="flex flex-col justify-center items-center text-center p-4 bg-gray-50/50 dark:bg-gray-900/20 rounded-xl border border-gray-100 dark:border-gray-700/50">
            <div className={`p-2 rounded-full mb-3 ${item.colorClass}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <span className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">{item.label}</span>
            <span className={`text-lg font-bold ${item.colorClass.split(' ')[0]}`}>
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
