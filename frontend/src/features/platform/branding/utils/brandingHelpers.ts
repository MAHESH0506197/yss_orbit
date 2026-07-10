import { formatIST } from '@/utils/date';
// yss_orbit\frontend\src\modules\branding\utils\brandingHelpers.ts
/**
 * Helper functions for branding module
 */

export const formatBrandingData = (data: any) => {
  if (!data) return null;
  return {
    ...data,
    formattedDate: data.createdAt ? formatIST(new Date(data.createdAt), 'PPP') : 'N/A'
  };
};

export const validateBrandingPayload = (payload: any) => {
  const errors: string[] = [];
  if (!payload) {
    errors.push('Payload cannot be empty');
  }
  return errors;
};
