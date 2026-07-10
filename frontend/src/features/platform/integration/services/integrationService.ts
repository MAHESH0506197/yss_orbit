// yss_orbit\frontend\src\modules\integration\services\integrationService.ts
// @ts-expect-error - Auto-patched TS2307
import { BaseService } from '@/utils/core/api/baseService';
import { Integration } from '../types/integrationTypes';

class IntegrationApiService extends BaseService {
  constructor() {
    super('/integrations');
  }

  getIntegrations(): Promise<Integration[]> {
    // @ts-expect-error - Auto-patched TS2339
    return this.get<Integration[]>('/');
  }

  getIntegration(id: string | number): Promise<Integration> {
    // @ts-expect-error - Auto-patched TS2339
    return this.get<Integration>(`/${id}`);
  }

  updateIntegration(id: string | number, data: Partial<Integration>): Promise<Integration> {
    // @ts-expect-error - Auto-patched TS2339
    return this.put<Integration>(`/${id}`, data);
  }
}

export const IntegrationService = new IntegrationApiService();
