// yss_orbit\frontend\src\features\hrms\types.ts
export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
  status: 'active' | 'on_leave' | 'terminated';
}

export interface EmployeeFilters {
  page?: number;
  limit?: number;
}
