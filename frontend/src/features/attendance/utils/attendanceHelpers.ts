import { formatIST } from '@/utils/date';
// yss_orbit\frontend\src\modules\attendance\utils\attendanceHelpers.ts
/**
 * Helper functions for attendance module
 */

export const formatAttendanceData = (data: any) => {
  if (!data) return null;
  return {
    ...data,
    formattedDate: data.createdAt ? formatIST(new Date(data.createdAt), 'PPP') : 'N/A'
  };
};

export const validateAttendancePayload = (payload: any) => {
  const errors: string[] = [];
  if (!payload) {
    errors.push('Payload cannot be empty');
  }
  return errors;
};
export const formatTime = (time: string) => time; 
