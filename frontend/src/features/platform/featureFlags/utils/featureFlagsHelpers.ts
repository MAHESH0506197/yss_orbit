import { formatIST } from '@/utils/date';
// yss_orbit\frontend\src\modules\featureFlags\utils\featureFlagsHelpers.ts
/**
 * Helper functions for featureFlags module
 */

export const formatFeatureflagsData = (data: any) => {
  if (!data) return null;
  return {
    ...data,
    formattedDate: data.createdAt ? formatIST(new Date(data.createdAt), 'PPP') : 'N/A'
  };
};

export const validateFeatureflagsPayload = (payload: any) => {
  const errors: string[] = [];
  if (!payload) {
    errors.push('Payload cannot be empty');
  }
  return errors;
};
