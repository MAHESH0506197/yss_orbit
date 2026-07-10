export type LeaveSession = 'FULL_DAY' | 'FIRST_HALF' | 'SECOND_HALF';
export type LeaveStatus = 'DRAFT' | 'SUBMITTED' | 'MANAGER_APPROVED' | 'HR_APPROVED' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'WITHDRAWN' | 'CANCELLATION_REQUESTED';

export interface LeaveType {
  id: string;
  policy: string;
  code: string;
  name: string;
  is_paid: boolean;
  is_lop: boolean;
  requires_approval: boolean;
  requires_attachment: boolean;
  attachment_after_days: number;
  allow_half_day: boolean;
  color: string;
  is_active: boolean;
}

export interface LeaveBalance {
  id: string;
  employee: string;
  leave_type: string;
  leave_type_name: string;
  leave_type_color: string;
  year: number;
  opening_balance: string;
  accrued_days: string;
  consumed_days: string;
  adjusted_days: string;
  encashed_days: string;
  closing_balance: string;
}

export interface LeaveRequestHistory {
  id: string;
  status: LeaveStatus;
  changed_by: string;
  changed_by_name: string;
  remarks: string;
  created_at: string;
}

export interface LeaveAttachment {
  id: string;
  file: string;
  uploaded_by: string;
  uploaded_at: string;
}

export interface LeaveRequest {
  id: string;
  employee: string;
  leave_type: string;
  leave_type_name: string;
  start_date: string;
  end_date: string;
  session: LeaveSession;
  status: LeaveStatus;
  reason: string;
  manager_approved_by?: string;
  manager_comments?: string;
  hr_approved_by?: string;
  hr_comments?: string;
  history: LeaveRequestHistory[];
  attachments: LeaveAttachment[];
  created_at: string;
}
