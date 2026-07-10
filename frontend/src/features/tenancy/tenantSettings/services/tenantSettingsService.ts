// yss_orbit\frontend\src\modules\tenantSettings\services\tenantSettingsService.ts
// @ts-expect-error - Auto-patched TS2307
import { BaseService } from '@/utils/core/api/baseService';

class TenantSettingsApiService extends BaseService {
  constructor() {
    super('/tenant-settings');
  }

  getSettings(): Promise<any> {
    // @ts-expect-error - Auto-patched TS2339
    return this.get<any>('/');
  }

  updateSetting(sdata: any): Promise<any> {
    // @ts-expect-error - Auto-patched TS2339
    return this.put<any>('/', data);
  }
}

export const TenantSettingsService = new TenantSettingsApiService();
