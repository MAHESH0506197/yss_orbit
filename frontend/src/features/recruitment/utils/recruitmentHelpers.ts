import { formatIST } from '@/utils/date';
// yss_orbit\frontend\src\modules\recruitment\utils\recruitmentHelpers.ts
/**
 * Helper functions for recruitment module
 */

export const formatRecruitmentData = (data: any) => {
  if (!data) return null;
  return {
    ...data,
    formattedDate: data.createdAt ? formatIST(new Date(data.createdAt), 'PPP') : 'N/A'
  };
};

export const validateRecruitmentPayload = (payload: any) => {
  const errors: string[] = [];
  if (!payload) {
    errors.push('Payload cannot be empty');
  }
  return errors;
};
