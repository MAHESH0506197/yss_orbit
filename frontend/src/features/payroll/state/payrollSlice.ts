// yss_orbit\frontend\src\modules\payroll\state\payrollSlice.ts
import { StateCreator } from 'zustand';
import { PayrollRun } from '../types/payrollTypes';

export interface PayrollSlice {
  runs: PayrollRun[];
  setRuns: (runs: PayrollRun[]) => void;
}

export const createPayrollSlice: StateCreator<PayrollSlice> = (set) => ({
  runs: [],
  setRuns: (runs) => set({ runs }),
});
