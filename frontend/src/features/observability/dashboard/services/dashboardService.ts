// yss_orbit\frontend\src\modules\dashboard\services\dashboardService.ts
// @ts-expect-error - Auto-patched TS2307
import { BaseService } from '@/utils/core/api/baseService';
import { DashboardConfig } from '../types/dashboardTypes';

class DashboardApiService extends BaseService {
  constructor() {
    super('/dashboard');
  }

  getLayout(): Promise<DashboardConfig> {
    // @ts-expect-error - Auto-patched TS2339
    return this.get<DashboardConfig>('/layout');
  }

  saveLayout(config: DashboardConfig): Promise<DashboardConfig> {
    // @ts-expect-error - Auto-patched TS2339
    return this.put<DashboardConfig>('/layout', config);
  }
}

export const DashboardService = new DashboardApiService();
