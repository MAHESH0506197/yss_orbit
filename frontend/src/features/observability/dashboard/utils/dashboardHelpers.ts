import { formatIST } from '@/utils/date';
// yss_orbit\frontend\src\modules\dashboard\utils\dashboardHelpers.ts
/**
 * Helper functions for dashboard module
 */

export const formatDashboardData = (data: any) => {
  if (!data) return null;
  return {
    ...data,
    formattedDate: data.createdAt ? formatIST(new Date(data.createdAt), 'PPP') : 'N/A'
  };
};

export const validateDashboardPayload = (payload: any) => {
  const errors: string[] = [];
  if (!payload) {
    errors.push('Payload cannot be empty');
  }
  return errors;
};
