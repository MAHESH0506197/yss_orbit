import { formatIST } from '@/utils/date';
// yss_orbit\frontend\src\modules\fileStorage\utils\fileStorageHelpers.ts
/**
 * Helper functions for fileStorage module
 */

export const formatFilestorageData = (data: any) => {
  if (!data) return null;
  return {
    ...data,
    formattedDate: data.createdAt ? formatIST(new Date(data.createdAt), 'PPP') : 'N/A'
  };
};

export const validateFilestoragePayload = (payload: any) => {
  const errors: string[] = [];
  if (!payload) {
    errors.push('Payload cannot be empty');
  }
  return errors;
};
export const formatFileSize = (s: number) => s.toString(); 
