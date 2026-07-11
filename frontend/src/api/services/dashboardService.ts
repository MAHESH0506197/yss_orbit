import { apiClient } from '@/api/client'; // Migrated from tombstoned axiosClient (B06 §5.10)

export interface DashboardMetrics {
  totalUsers: number;
  activeSubscriptions: number;
  totalBusinessUnits: number;
  totalOrganizations: number;
}

export interface SystemHealth {
  database: string;
  cache: string;
  queue: string;
  activeJobs: number;
  errorRate: number;
}

export interface ActivityLog {
  id: string;
  action: string;
  user: string;
  timestamp: string;
}

class DashboardService {
  async getMetrics(buId: string | null): Promise<DashboardMetrics> {
    const res = await apiClient.get('/platform/dashboard/');
    const data = res.data.data.metrics;
    return {
      totalUsers: data.total_users,
      activeSubscriptions: data.active_subscriptions,
      totalBusinessUnits: data.total_business_units, // Replaced dummy revenue with business units count
      totalOrganizations: data.total_organizations
    };
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const res = await apiClient.get('/platform/dashboard/');
    const health = res.data.data.health;
    return {
      database: health.database,
      cache: health.cache,
      queue: health.queue,
      activeJobs: health.active_jobs,
      errorRate: health.error_rate
    };
  }

  async getRecentActivity(buId: string | null): Promise<ActivityLog[]> {
    const res = await apiClient.get('/platform/dashboard/');
    const activity = res.data.data.recent_activity;
    return activity.map((item: any) => ({
      id: item.id,
      action: item.action,
      user: item.user,
      timestamp: item.time
    }));
  }
}

export const dashboardService = new DashboardService();
