// yss_orbit\frontend\src\modules\audit\types\auditTypes.ts
// @ts-expect-error - Auto-patched TS2307
import { BaseEntity } from '@/utils/core/types/commonTypes';

export interface AuditLog extends BaseEntity {
  action: string;
  description: string;
  userId: number;
  ipAddress: string;
  resourceType: string;
  resourceId?: string | number;
  timestamp: string;
  metadata?: Record<string, any>;
}
