// yss_orbit\frontend\src\modules\observability\types\observabilityTypes.ts
// @ts-expect-error - Auto-patched TS2307
import { BaseEntity } from '@/utils/core/types/commonTypes';

export interface ObservabilityMetric extends BaseEntity {
  name: string;
  value: number | string;
  unit: string;
  timestamp: string;
  tags?: Record<string, string>;
}
