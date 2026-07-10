// yss_orbit\frontend\src\modules\userBusinessUnit\constants\userBusinessUnitConstants.ts
export const UBU_ENDPOINTS = {
  BASE: '/api/v1/user-bu-mapping/memberships',
} as const;

export const UBU_ORDERING_OPTIONS = [
  { value: '-joined_at', label: 'Newest First' },
  { value: 'joined_at', label: 'Oldest First' },
  { value: '-created_at', label: 'Recently Created' },
  { value: 'created_at', label: 'Earliest Created' },
] as const;

export const UBU_STATUS_LABELS = {
  true: 'Active',
  false: 'Inactive',
} as const;

/** @deprecated use UBU_ENDPOINTS */
export const USERBUSINESSUNIT_CONSTANTS = UBU_ENDPOINTS;
