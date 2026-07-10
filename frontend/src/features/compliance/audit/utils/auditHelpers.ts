import { formatIST } from '@/utils/date';
// yss_orbit\frontend\src\modules\audit\utils\auditHelpers.ts
/**
 * Helper functions for audit module
 */

export const formatAuditData = (data: any) => {
  if (!data) return null;
  return {
    ...data,
    formattedDate: data.createdAt ? formatIST(new Date(data.createdAt), 'PPP') : 'N/A'
  };
};

export const validateAuditPayload = (payload: any) => {
  const errors: string[] = [];
  if (!payload) {
    errors.push('Payload cannot be empty');
  }
  return errors;
};
