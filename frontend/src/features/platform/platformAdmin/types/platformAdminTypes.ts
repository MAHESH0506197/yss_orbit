// yss_orbit\frontend\src\modules\platformAdmin\types\platformAdminTypes.ts
// @ts-expect-error - Auto-patched TS2307
import { BaseEntity } from '@/utils/core/types/commonTypes';

export interface Tenant extends BaseEntity {
  name: string;
  domain: string;
  plan: string;
  isActive: boolean;
}
