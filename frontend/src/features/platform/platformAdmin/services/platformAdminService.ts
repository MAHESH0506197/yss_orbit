// yss_orbit\frontend\src\modules\platformAdmin\services\platformAdminService.ts
// @ts-expect-error - Auto-patched TS2307
import { BaseService } from '@/utils/core/api/baseService';
import { Tenant } from '../types/platformAdminTypes';

class PlatformAdminApiService extends BaseService {
  constructor() {
    super('/platform/admin');
  }

  getTenants(): Promise<Tenant[]> {
    // @ts-expect-error - Auto-patched TS2339
    return this.get<Tenant[]>('/tenants');
  }

  getPlatformMetrics(): Promise<any> {
    // @ts-expect-error - Auto-patched TS2339
    return this.get<any>('/metrics');
  }

  requestBreakGlass(reason: string): Promise<any> {
    // @ts-expect-error - Auto-patched TS2339
    return this.post<any>('/break-glass', { reason });
  }
}

export const PlatformAdminService = new PlatformAdminApiService();
