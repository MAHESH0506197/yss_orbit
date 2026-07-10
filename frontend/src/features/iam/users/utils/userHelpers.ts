import { formatIST } from '@/utils/date';
// yss_orbit\frontend\src\modules\user\utils\userHelpers.ts
/**
 * Helper functions for user module
 */

export const formatUserData = (data: any) => {
  if (!data) return null;
  return {
    ...data,
    formattedDate: data.createdAt ? formatIST(new Date(data.createdAt), 'PPP') : 'N/A'
  };
};

export const validateUserPayload = (payload: any) => {
  const errors: string[] = [];
  if (!payload) {
    errors.push('Payload cannot be empty');
  }
  return errors;
};

export function getUserInitials(user: { 
  first_name?: string | null, 
  last_name?: string | null, 
  firstName?: string | null, 
  lastName?: string | null,
  username?: string | null,
  email?: string | null 
}): string {
  const fName = user.first_name || user.firstName;
  const lName = user.last_name || user.lastName;
  const parts = [fName, lName].filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  if (user.username) return user.username.slice(0, 2).toUpperCase();
  if (user.email) return user.email.slice(0, 2).toUpperCase();
  return 'U';
}
