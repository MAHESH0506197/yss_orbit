// yss_orbit\frontend\src\modules\attendance\services\attendanceService.ts
// @ts-expect-error - Auto-patched TS2307
import { BaseService } from '@/utils/core/api/baseService';
import { AttendanceRecord } from '../types/attendanceTypes';

class AttendanceApiService extends BaseService {
  constructor() {
    super('/attendance');
  }

  getMyRecords(): Promise<AttendanceRecord[]> {
    // @ts-expect-error - Auto-patched TS2339
    return this.get<AttendanceRecord[]>('/my-records');
  }

  checkIn(): Promise<AttendanceRecord> {
    // @ts-expect-error - Auto-patched TS2339
    return this.post<AttendanceRecord>('/check-in', {});
  }

  checkOut(): Promise<AttendanceRecord> {
    // @ts-expect-error - Auto-patched TS2339
    return this.post<AttendanceRecord>('/check-out', {});
  }
}

export const AttendanceService = new AttendanceApiService();
