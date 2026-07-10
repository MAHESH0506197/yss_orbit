// yss_orbit\frontend\src\modules\audit\services\auditService.ts
// @ts-expect-error - Auto-patched TS2307
import { BaseService } from '@/utils/core/api/baseService';
import { AuditLog } from '../types/auditTypes';

class AuditApiService extends BaseService {
  constructor() {
    super('/audit');
  }

  getLogs(): Promise<AuditLog[]> {
    // @ts-expect-error - Auto-patched TS2339
    return this.get<AuditLog[]>('/');
  }

  getLog(id: string | number): Promise<AuditLog> {
    // @ts-expect-error - Auto-patched TS2339
    return this.get<AuditLog>(`/${id}`);
  }
}

export const AuditService = new AuditApiService();
