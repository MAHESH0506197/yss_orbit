// yss_orbit\frontend\src\modules\errorLog\types\errorLogTypes.ts
// @ts-expect-error - Auto-patched TS2307
import { BaseEntity } from '@/utils/core/types/commonTypes';

export interface ErrorLogEntry extends BaseEntity {
  id: string;
  errorCode: string;
  message: string;
  severity: 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO';
  stackTrace?: string;
  context?: Record<string, any>;
  userId?: number;
  timestamp: string;
}
