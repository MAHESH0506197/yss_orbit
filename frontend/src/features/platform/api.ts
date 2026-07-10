import { apiClient } from '@/api/client';

export interface PlatformMetrics {
  total_organizations: number;
  total_business_units: number;
  total_users: number;
  active_subscriptions: number;
  uptime: string;
}

export interface PlatformActivity {
  id: string;
  action: string;
  resource_type: string;
  user: string;
  time: string;
}

export interface PlatformDashboardResponse {
  metrics: PlatformMetrics;
  recent_activity: PlatformActivity[];
}

class PlatformService {
  async getDashboardMetrics(): Promise<PlatformDashboardResponse> {
    const response = await apiClient.get<{ data: PlatformDashboardResponse }>('/platform/dashboard/');
    return response.data.data;
  }
}

export const platformService = new PlatformService();
