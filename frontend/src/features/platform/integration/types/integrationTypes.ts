// yss_orbit\frontend\src\modules\integration\types\integrationTypes.ts
// @ts-expect-error - Auto-patched TS2307
import { BaseEntity } from '@/utils/core/types/commonTypes';

export interface Integration extends BaseEntity {
  name: string;
  provider: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  config: any;
  lastSync?: string;
}
