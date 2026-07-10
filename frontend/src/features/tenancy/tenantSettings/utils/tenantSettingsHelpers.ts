import { formatIST } from '@/utils/date';
// yss_orbit\frontend\src\modules\tenantSettings\utils\tenantSettingsHelpers.ts
/**
 * Helper functions for tenantSettings module
 */

export const formatTenantsettingsData = (data: any) => {
  if (!data) return null;
  return {
    ...data,
    formattedDate: data.createdAt ? formatIST(new Date(data.createdAt), 'PPP') : 'N/A'
  };
};

export const validateTenantsettingsPayload = (payload: any) => {
  const errors: string[] = [];
  if (!payload) {
    errors.push('Payload cannot be empty');
  }
  return errors;
};
