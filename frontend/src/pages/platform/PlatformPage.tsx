// yss_orbit\frontend\src\pages\platform\PlatformPage.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Server, Zap, HardDrive, Cpu, Activity, LayoutTemplate, Building2, Users, CreditCard } from 'lucide-react';
import { platformService } from '@/features/platform/api';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { formatIST } from '@/utils/date';

export default function PlatformPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['platformMetrics'],
    queryFn: () => platformService.getDashboardMetrics()
  });

  if (isLoading) return <LoadingScreen />;
  
  if (error || !data) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          Failed to load platform dashboard data.
        </div>
      </div>
    );
  }

  const { metrics, recent_activity } = data;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 shadow-lg shadow-violet-500/30">
                <LayoutTemplate className="h-6 w-6 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Platform Engineering</h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-4xl pl-[62px]">
            Manage infrastructure, deployments, and core platform services.
          </p>
        </div>
        <button className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/40 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:ring-offset-gray-950">
          <Activity className="h-4 w-4" />
          <span>System Diagnostics</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="text-blue-500" size={20} />
            <h3 className="font-semibold text-gray-900 dark:text-white">Organizations</h3>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{metrics.total_organizations}</div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total registered tenants</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <Server className="text-amber-500" size={20} />
            <h3 className="font-semibold text-gray-900 dark:text-white">Business Units</h3>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{metrics.total_business_units}</div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total isolated spaces</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="text-purple-500" size={20} />
            <h3 className="font-semibold text-gray-900 dark:text-white">Subscriptions</h3>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{metrics.active_subscriptions}</div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Active enterprise plans</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <Users className="text-green-500" size={20} />
            <h3 className="font-semibold text-gray-900 dark:text-white">Total Users</h3>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{metrics.total_users}</div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Registered platform users</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
          <h2 className="font-semibold text-gray-900 dark:text-white">Recent Platform Activity</h2>
          <span className="text-xs font-medium px-2 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-md">View Audit Logs</span>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {recent_activity.length > 0 ? (
            recent_activity.map((audit) => (
              <div key={audit.id} className="p-4 sm:px-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full bg-blue-500`} />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{audit.action} ({audit.resource_type})</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">by {audit.user}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-900 dark:text-white">{formatIST(new Date(audit.time), 'PP pp')}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500">No recent platform activity found.</div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 dark:bg-gray-800/20">
          <LayoutTemplate className="text-gray-400 mb-3" size={32} />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Feature Flags</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-4">Manage progressive delivery and a/b testing across different tenant tiers.</p>
          <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            Configure Flags
          </button>
        </div>
        
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 dark:bg-gray-800/20">
          <Activity className="text-gray-400 mb-3" size={32} />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Service Mesh</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-4">Monitor inter-service communication and enforce mTLS policies.</p>
          <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            View Topology
          </button>
        </div>
      </div>
    </div>
  );
}
