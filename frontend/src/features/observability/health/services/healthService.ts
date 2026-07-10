// yss_orbit\frontend\src\modules\health\services\healthService.ts
// @ts-expect-error - Auto-patched TS2307
import { BaseService } from '@/utils/core/api/baseService';
import { HealthStatus } from '../types/healthTypes';

class HealthApiService extends BaseService {
  constructor() {
    super('/health');
  }

  getHealth(): Promise<HealthStatus> {
    // @ts-expect-error - Auto-patched TS2339
    return this.get<HealthStatus>('/');
  }
}

export const HealthService = new HealthApiService();
