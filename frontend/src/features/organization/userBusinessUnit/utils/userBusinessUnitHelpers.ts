// yss_orbit\frontend\src\modules\userBusinessUnit\utils\userBusinessUnitHelpers.ts
/**
 * Helper functions for the userBusinessUnit module.
 */
import type { UserBusinessUnitMembership } from '../types/userBusinessUnitTypes';
import { formatIST } from '@/utils/date';

/** Format a membership's joined date for display. */
export const formatJoinedDate = (membership: UserBusinessUnitMembership): string => {
  if (!membership.joinedAt) return 'N/A';
  return formatIST(new Date(membership.joinedAt), 'PPP');
};

/** Get display label for a membership status. */
export const getMembershipStatusLabel = (isActive: boolean): string =>
  isActive ? 'Active' : 'Inactive';

/** Get CSS classes for status badge. */
export const getMembershipStatusClasses = (isActive: boolean): string =>
  isActive
    ? 'bg-green-100 text-green-800'
    : 'bg-gray-100 text-gray-600';

/** Normalize a raw API membership response to camelCase shape. */
export const normalizeMembership = (raw: any): UserBusinessUnitMembership => ({
  id: raw.id,
  user: raw.user,
  userEmail: raw.user_email ?? '',
  userFullName: raw.user_full_name ?? '',
  businessUnit: raw.business_unit,
  businessUnitName: raw.business_unit_name ?? '',
  role: raw.role ?? null,
  roleName: raw.role_name ?? '',
  isActiveMembership: raw.is_active_membership ?? false,
  joinedAt: raw.joined_at ?? '',
  createdAt: raw.created_at ?? '',
  updatedAt: raw.updated_at ?? '',
  effectiveFrom: raw.effective_from ?? null,
  effectiveTo: raw.effective_to ?? null,
});

/** Validate a membership create payload. Returns array of error strings. */
export const validateMembershipPayload = (payload: {
  user?: string;
  businessUnit?: string;
}): string[] => {
  const errors: string[] = [];
  if (!payload.user?.trim()) errors.push('User is required.');
  if (!payload.businessUnit?.trim()) errors.push('Business Unit is required.');
  return errors;
};

/** @deprecated use normalizeMembership */
export const formatUserbusinessunitData = (data: any) => {
  if (!data) return null;
  return normalizeMembership(data);
};

/** @deprecated use validateMembershipPayload */
export const validateUserbusinessunitPayload = (payload: any): string[] =>
  validateMembershipPayload(payload ?? {});
