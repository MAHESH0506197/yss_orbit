import { formatIST } from '@/utils/date';
// yss_orbit\frontend\src\modules\observability\utils\observabilityHelpers.ts
/**
 * Helper functions for observability module
 */

export const formatObservabilityData = (data: any) => {
  if (!data) return null;
  return {
    ...data,
    formattedDate: data.createdAt ? formatIST(new Date(data.createdAt), 'PPP') : 'N/A'
  };
};

export const validateObservabilityPayload = (payload: any) => {
  const errors: string[] = [];
  if (!payload) {
    errors.push('Payload cannot be empty');
  }
  return errors;
};
