import { formatIST } from '@/utils/date';
// yss_orbit\frontend\src\modules\appraisal\utils\appraisalHelpers.ts
/**
 * Helper functions for appraisal module
 */

export const formatAppraisalData = (data: any) => {
  if (!data) return null;
  return {
    ...data,
    formattedDate: data.createdAt ? formatIST(new Date(data.createdAt), 'PPP') : 'N/A'
  };
};

export const validateAppraisalPayload = (payload: any) => {
  const errors: string[] = [];
  if (!payload) {
    errors.push('Payload cannot be empty');
  }
  return errors;
};
