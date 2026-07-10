import { apiClient } from '@/api/client'; // Migrated from tombstoned axiosClient (B06 §5.10)

export interface DashboardMetrics {
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
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
    // Faked until backend supports it
    return new Promise(resolve => setTimeout(() => {
      resolve({
        totalUsers: 1420,
        activeSubscriptions: 85,
        totalRevenue: 24500,
        totalOrganizations: 12
      });
    }, 300));
  }

  async getSystemHealth(): Promise<SystemHealth> {
    return new Promise(resolve => setTimeout(() => {
      resolve({
        database: 'OK',
        cache: 'OK',
        queue: 'OK',
        activeJobs: 0,
        errorRate: 0.2
      });
    }, 300));
  }

  async getRecentActivity(buId: string | null): Promise<ActivityLog[]> {
    return new Promise(resolve => setTimeout(() => resolve([]), 300));
  }
}

export const dashboardService = new DashboardService();
