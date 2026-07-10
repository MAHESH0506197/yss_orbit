// yss_orbit\frontend\src\modules\tenantSettings\types\tenantSettingsTypes.ts
// @ts-expect-error - Auto-patched TS2307
import { BaseEntity } from '@/utils/core/types/commonTypes';

export interface TenantSettings extends BaseEntity {
  currency: string;
  timezone: string;
  dateFormat: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
}
