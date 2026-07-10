// yss_orbit\frontend\src\modules\featureFlags\types\featureFlagsTypes.ts
// @ts-expect-error - Auto-patched TS2307
import { BaseEntity } from '@/utils/core/types/commonTypes';

export interface FeatureFlag extends BaseEntity {
  id: string;
  name: string;
  key: string;
  description: string;
  isEnabled: boolean;
  type: 'BOOLEAN' | 'JSON' | 'STRING' | 'NUMBER';
  defaultValue?: any;
  rules?: any[];
}
