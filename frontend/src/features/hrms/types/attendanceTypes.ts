export type PunchStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'ON_LEAVE' | 'HOLIDAY' | 'WEEK_OFF' | 'LATE' | 'EARLY_OUT' | 'MISSED_PUNCH' | 'WORK_FROM_HOME' | 'ON_DUTY';
export type PunchSource = 'WEB' | 'MOBILE' | 'BIOMETRIC' | 'IMPORT' | 'ADMIN';
export type PunchType = 'IN' | 'OUT';

export interface AttendancePunch {
  id: string;
  punch_time: string;
  punch_type: PunchType;
  source: PunchSource;
  ip_address?: string;
  user_agent?: string;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_code: string;
  department_name: string;
  attendance_date: string;
  shift_name?: string;
  scheduled_in?: string;
  scheduled_out?: string;
  actual_in?: string;
  actual_out?: string;
  work_hours: string;
  late_minutes: number;
  early_out_minutes: number;
  overtime_minutes: number;
  status: PunchStatus;
  remarks?: string;
  is_locked: boolean;
  punches: AttendancePunch[];
}
