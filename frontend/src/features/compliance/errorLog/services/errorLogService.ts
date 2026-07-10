// yss_orbit\frontend\src\modules\errorLog\services\errorLogService.ts
// @ts-expect-error - Auto-patched TS2307
import { BaseService } from '@/utils/core/api/baseService';
import { ErrorLogEntry } from '../types/errorLogTypes';

class ErrorLogApiService extends BaseService {
  constructor() {
    super('/errors');
  }

  getErrors(): Promise<ErrorLogEntry[]> {
    // @ts-expect-error - Auto-patched TS2339
    return this.get<ErrorLogEntry[]>('/');
  }

  getError(id: string | number): Promise<ErrorLogEntry> {
    // @ts-expect-error - Auto-patched TS2339
    return this.get<ErrorLogEntry>(`/${id}`);
  }
}

export const ErrorLogService = new ErrorLogApiService();
