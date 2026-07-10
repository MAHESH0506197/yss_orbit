import { formatIST } from '@/utils/date';
// yss_orbit\frontend\src\modules\payroll\utils\payrollHelpers.ts
/**
 * Helper functions for payroll module
 */

export const formatPayrollData = (data: any) => {
  if (!data) return null;
  return {
    ...data,
    formattedDate: data.createdAt ? formatIST(new Date(data.createdAt), 'PPP') : 'N/A'
  };
};

export const validatePayrollPayload = (payload: any) => {
  const errors: string[] = [];
  if (!payload) {
    errors.push('Payload cannot be empty');
  }
  return errors;
};
