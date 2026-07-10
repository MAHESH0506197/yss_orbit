import { formatIST } from '@/utils/date';
// yss_orbit\frontend\src\modules\moduleRegistry\utils\moduleRegistryHelpers.ts
/**
 * Helper functions for moduleRegistry module
 */

export const formatModuleregistryData = (data: any) => {
  if (!data) return null;
  return {
    ...data,
    formattedDate: data.createdAt ? formatIST(new Date(data.createdAt), 'PPP') : 'N/A'
  };
};

export const validateModuleregistryPayload = (payload: any) => {
  const errors: string[] = [];
  if (!payload) {
    errors.push('Payload cannot be empty');
  }
  return errors;
};
