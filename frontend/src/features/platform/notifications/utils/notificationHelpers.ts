import { formatIST } from '@/utils/date';
// yss_orbit\frontend\src\modules\notification\utils\notificationHelpers.ts
/**
 * Helper functions for notification module
 */

export const formatNotificationData = (data: any) => {
  if (!data) return null;
  return {
    ...data,
    formattedDate: data.createdAt ? formatIST(new Date(data.createdAt), 'PPP') : 'N/A'
  };
};

export const validateNotificationPayload = (payload: any) => {
  const errors: string[] = [];
  if (!payload) {
    errors.push('Payload cannot be empty');
  }
  return errors;
};
