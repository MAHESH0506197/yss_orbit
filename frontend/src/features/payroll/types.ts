// yss_orbit\frontend\src\features\payroll\types.ts
export type PayrollStatus = 'draft' | 'processed' | 'paid';

export interface PayrollRun {
  id: string;
  month: number;
  year: number;
  totalEmployees: number;
  totalAmount: number;
  status: PayrollStatus;
  processedAt?: string;
}

export interface Payslip {
  id: string;
  payrollRunId: string;
  employeeId: string;
  employeeName: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netPay: number;
}
