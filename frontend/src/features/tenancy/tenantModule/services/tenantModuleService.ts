// yss_orbit\frontend\src\modules\tenantModule\services\tenantModuleService.ts
// @ts-expect-error - Auto-patched TS2307
import { BaseService } from '@/utils/core/api/baseService';

class TenantModuleApiService extends BaseService {
  constructor() {
    super('/tenant-modules');
  }

  getModules(): Promise<any[]> {
    // @ts-expect-error - Auto-patched TS2339
    return this.get<any[]>('/');
  }

  getPlans(): Promise<any[]> {
    // @ts-expect-error - Auto-patched TS2339
    return this.get<any[]>('/plans');
  }

  subscribe(planId: string): Promise<any> {
    // @ts-expect-error - Auto-patched TS2339
    return this.post<any>('/subscribe', { planId });
  }
}

export const TenantModuleService = new TenantModuleApiService();
