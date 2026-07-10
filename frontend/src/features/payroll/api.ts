import { useTranslation } from 'react-i18next';
// yss_orbit\frontend\src\features\payroll\api.ts
import { apiClient } from '@/api/client'; // Migrated from tombstoned axiosClient (B06 §5.10)

export const PayrollApi = {
  getPayrollRuns: () => apiClient.get('/payroll/runs'),
  getPayslips: () => apiClient.get('/payroll/payslips'),
};
export const usePayslips = (p?: any) => ({ data: [], isLoading: false, error: null, refetch: () => {} });
export const usePayrollRuns = (p?: any) => ({ data: [], isLoading: false, error: null, refetch: () => {} });
export const useRunPayroll = () => ({ mutate: async (data?: any, options?: any) => {}, isPending: false });
