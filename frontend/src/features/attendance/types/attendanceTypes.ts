// yss_orbit\frontend\src\modules\attendance\types\attendanceTypes.ts
// @ts-expect-error - Auto-patched TS2307
import { BaseEntity } from '@/utils/core/types/commonTypes';

export interface AttendanceRecord extends BaseEntity {
  employeeId: number;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: 'Present' | 'Absent' | 'Half Day' | 'Late';
  overtimeHours?: number;
}
