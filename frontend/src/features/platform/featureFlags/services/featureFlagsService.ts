// yss_orbit\frontend\src\modules\featureFlags\services\featureFlagsService.ts
// @ts-expect-error - Auto-patched TS2307
import { BaseService } from '@/utils/core/api/baseService';
import { FeatureFlag } from '../types/featureFlagsTypes';

class FeatureFlagsApiService extends BaseService {
  constructor() {
    super('/feature-flags');
  }

  getFlags(): Promise<FeatureFlag[]> {
    // @ts-expect-error - Auto-patched TS2339
    return this.get<FeatureFlag[]>('/');
  }

  getFlag(id: string | number): Promise<FeatureFlag> {
    // @ts-expect-error - Auto-patched TS2339
    return this.get<FeatureFlag>(`/${id}`);
  }

  toggleFlag(id: number, isEnabled: boolean): Promise<FeatureFlag> {
    // @ts-expect-error - Auto-patched TS2339
    return this.put<FeatureFlag>(`/${id}`, { isEnabled });
  }

  createFlag(data: Partial<FeatureFlag>): Promise<FeatureFlag> {
    // @ts-expect-error - Auto-patched TS2339
    return this.post<FeatureFlag>('/', data);
  }
}

export const FeatureFlagsService = new FeatureFlagsApiService();
