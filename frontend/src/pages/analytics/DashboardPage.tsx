import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useTenantContext } from '@/store/context/TenantContext';
import { WidgetRegistry } from '@/features/observability/dashboard/engine/WidgetRegistry';
import { DEFAULT_LAYOUT, DashboardLayout } from '@/features/observability/dashboard/engine/DashboardConfig';
import { Activity, Building2, ExternalLink, Bell, BarChart3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/api/services/apiService';
import { useNavigate } from 'react-router-dom';
import { NotificationList } from '@/features/platform/notifications/components/NotificationList';
import { useNotification } from '@/features/platform/notifications/hooks/usenotification';
import { formatIST } from '@/utils/date';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { firstName, isSuperAdmin, selectBusinessUnit } = useAuthStore();
  const { businessUnit } = useTenantContext();
  const navigate = useNavigate();
  const [layout, setLayout] = useState<DashboardLayout | null>(null);
  const [loading, setLoading] = useState(true);

  // Notifications logic
  const { data: notificationsData, loading: notificationsLoading } = useNotification();
  const [notifications, setNotifications] = useState<any[]>([]);
  useEffect(() => { setNotifications(notificationsData || []) }, [notificationsData]);

  const handleReadNotification = async (id: any) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  // Fetch Business Units for the switcher
  const { data: businessUnits } = useQuery({
    queryKey: ['businessUnitsList'],
    queryFn: () => apiService.getBusinessUnits(),
    enabled: isSuperAdmin, // Only fetch if they have permission to switch
  });

  // Simulate fetching the layout from backend
  useEffect(() => {
    setLoading(true);
    // In a real scenario, this would be an API call fetching the JSON blueprint
    // based on businessUnit.id and the user's role.
    setTimeout(() => {
      setLayout({ ...DEFAULT_LAYOUT, businessUnitId: businessUnit?.id || null });
      setLoading(false);
    }, 400); // Small fake network delay for layout config fetch
  }, [businessUnit?.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-gray-500 space-y-4">
        <Activity className="w-8 h-8 animate-pulse text-[var(--color-primary)]" />
        <p>Loading your dashboard layout...</p>
      </div>
    );
  }

  if (!layout || layout.widgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-gray-500">
        <p>Your dashboard is empty. No widgets configured.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Platform Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Welcome back, {firstName}. Here's what's happening today.
          </p>
        </div>
        
        <div className="flex items-center gap-3">


          {/* Date Badge */}
          <span className="text-sm text-gray-500 dark:text-gray-400 hidden md:inline-block">
            {formatIST(new Date(), 'PPP')}
          </span>
        </div>
      </div>

      {/* Dynamic Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[minmax(180px,auto)]">
        {layout.widgets.map((widget) => {
          const colSpanClass = {
            1: 'lg:col-span-1',
            2: 'lg:col-span-2',
            3: 'lg:col-span-3',
            4: 'lg:col-span-4',
          }[widget.colSpan] || 'lg:col-span-2';

          return (
            <div 
              key={widget.id} 
              className={`col-span-1 md:col-span-2 ${colSpanClass}`}
              style={{ gridRow: `span ${widget.rowSpan}` }}
            >
              <WidgetRegistry type={widget.type} />
            </div>
          );
        })}
      </div>

      {/* Platform Engineering Specific Cards (Super Admin Only) */}
      {!businessUnit && isSuperAdmin && (
        <div className="mt-8 space-y-6">
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Platform Services</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Notifications Panel */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col h-96">
              <div className="flex items-center mb-4">
                <Bell className="text-gray-400 mr-2" size={24} />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Platform Notifications</h3>
              </div>
              <div className="overflow-y-auto flex-1 pr-2">
                {notificationsLoading ? (
                  <p className="text-sm text-gray-500">Loading notifications...</p>
                ) : (
                  <NotificationList notifications={notifications} onMarkRead={handleReadNotification} />
                )}
              </div>
            </div>

            {/* Platform Stats Panel */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col h-96">
              <div className="flex items-center mb-4">
                <BarChart3 className="text-gray-400 mr-2" size={24} />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Platform Statistics</h3>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <Activity className="text-[var(--color-primary)] mb-3 animate-pulse" size={48} />
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-4">
                  Aggregated infrastructure metrics, resource utilization, and overall platform health data will appear here.
                </p>
                <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  View Detailed Metrics
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
