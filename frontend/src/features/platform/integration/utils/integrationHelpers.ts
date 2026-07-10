import { formatIST } from '@/utils/date';
// yss_orbit\frontend\src\modules\integration\utils\integrationHelpers.ts
/**
 * Helper functions for integration module
 */

export const formatIntegrationData = (data: any) => {
  if (!data) return null;
  return {
    ...data,
    formattedDate: data.createdAt ? formatIST(new Date(data.createdAt), 'PPP') : 'N/A'
  };
};

export const validateIntegrationPayload = (payload: any) => {
  const errors: string[] = [];
  if (!payload) {
    errors.push('Payload cannot be empty');
  }
  return errors;
};
