// yss_orbit\frontend\src\modules\payroll\state\payrollStore.ts
import { create } from 'zustand';
import { PayrollSlice, createPayrollSlice } from './payrollSlice';

export const usePayrollStore = create<PayrollSlice>((...a) => ({
  ...createPayrollSlice(...a),
}));
