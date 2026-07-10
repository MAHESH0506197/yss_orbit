import { formatIST } from '@/utils/date';
// yss_orbit\frontend\src\modules\tenantModule\utils\tenantModuleHelpers.ts
/**
 * Helper functions for tenantModule module
 */

export const formatTenantmoduleData = (data: any) => {
  if (!data) return null;
  return {
    ...data,
    formattedDate: data.createdAt ? formatIST(new Date(data.createdAt), 'PPP') : 'N/A'
  };
};

export const validateTenantmodulePayload = (payload: any) => {
  const errors: string[] = [];
  if (!payload) {
    errors.push('Payload cannot be empty');
  }
  return errors;
};
