import { formatIST } from '@/utils/date';
// yss_orbit\frontend\src\modules\platformAdmin\utils\platformAdminHelpers.ts
/**
 * Helper functions for platformAdmin module
 */

export const formatPlatformadminData = (data: any) => {
  if (!data) return null;
  return {
    ...data,
    formattedDate: data.createdAt ? formatIST(new Date(data.createdAt), 'PPP') : 'N/A'
  };
};

export const validatePlatformadminPayload = (payload: any) => {
  const errors: string[] = [];
  if (!payload) {
    errors.push('Payload cannot be empty');
  }
  return errors;
};
