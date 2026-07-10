import { formatIST } from '@/utils/date';
// yss_orbit\frontend\src\modules\errorLog\utils\errorLogHelpers.ts
/**
 * Helper functions for errorLog module
 */

export const formatErrorlogData = (data: any) => {
  if (!data) return null;
  return {
    ...data,
    formattedDate: data.createdAt ? formatIST(new Date(data.createdAt), 'PPP') : 'N/A'
  };
};

export const validateErrorlogPayload = (payload: any) => {
  const errors: string[] = [];
  if (!payload) {
    errors.push('Payload cannot be empty');
  }
  return errors;
};
export const getSeverityColor = (s: string) => 'red'; 
