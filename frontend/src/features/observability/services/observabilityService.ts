// yss_orbit\frontend\src\modules\observability\services\observabilityService.ts
// @ts-expect-error - Auto-patched TS2307
import { BaseService } from '@/utils/core/api/baseService';
import { ObservabilityMetric } from '../types/observabilityTypes';

class ObservabilityApiService extends BaseService {
  constructor() {
    super('/observability');
  }

  getMetrics(): Promise<ObservabilityMetric[]> {
    // @ts-expect-error - Auto-patched TS2339
    return this.get<ObservabilityMetric[]>('/metrics/summary');
  }

  getTrace(traceId: string): Promise<any> {
    // @ts-expect-error - Auto-patched TS2339
    return this.get<any>(`/traces/${traceId}`);
  }
}

export const ObservabilityService = new ObservabilityApiService();
