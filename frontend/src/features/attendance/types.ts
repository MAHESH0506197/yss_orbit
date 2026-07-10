// yss_orbit\frontend\src\features\attendance\types.ts
export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: 'present' | 'absent' | 'on_leave' | 'half_day';
  businessUnit: string;
}

export interface AttendanceSummary {
  present: number;
  absent: number;
  onLeave: number;
  halfDay: number;
  total: number;
}
