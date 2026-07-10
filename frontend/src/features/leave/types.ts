// yss_orbit\frontend\src\features\leave\types.ts
export type LeaveStatus = 'pending' | 'approved' | 'rejected';
export type LeaveType = 'annual' | 'sick' | 'unpaid' | 'maternity';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  type: LeaveType;
  status: LeaveStatus;
  reason: string;
  appliedAt: string;
}

export interface LeaveFormData {
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
}
