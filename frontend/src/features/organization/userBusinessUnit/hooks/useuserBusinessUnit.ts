// yss_orbit\frontend\src\modules\userBusinessUnit\hooks\useuserBusinessUnit.ts
import { useCallback } from 'react';
import { useUserBusinessUnitStore } from '../state/userBusinessUnitStore';
import { userBusinessUnitApi } from '../api/userBusinessUnitApi';
import type {
  UserBusinessUnitCreatePayload,
  UserBusinessUnitUpdatePayload,
  UserBusinessUnitFilters,
} from '../types/userBusinessUnitTypes';

/**
 * Hook for consuming and manipulating UBU memberships.
 * Integrates with the Zustand store for reactive state.
 */
export const useUserBusinessUnit = () => {
  const {
    memberships,
    meta,
    isLoading,
    error,
    filters,
    fetchMemberships,
    setFilters,
    addMembership,
    updateMembership,
    removeMembership,
  } = useUserBusinessUnitStore();

  const createMembership = useCallback(
    async (data: UserBusinessUnitCreatePayload) => {
      const created = await userBusinessUnitApi.create(data);
      // Normalize the returned item
      addMembership({
        id: created.id,
        user: (created as any).user,
        userEmail: (created as any).user_email ?? '',
        userFullName: (created as any).user_full_name ?? '',
        businessUnit: (created as any).business_unit,
        businessUnitName: (created as any).business_unit_name ?? '',
        role: (created as any).role ?? null,
        roleName: (created as any).role_name ?? null,
        isActiveMembership: (created as any).is_active_membership ?? true,
        effectiveFrom: (created as any).effective_from ?? null,
        effectiveTo: (created as any).effective_to ?? null,
        joinedAt: (created as any).joined_at,
        createdAt: (created as any).created_at,
        updatedAt: (created as any).updated_at,
      });
      return created;
    },
    [addMembership]
  );

  const patchMembership = useCallback(
    async (id: string, data: UserBusinessUnitUpdatePayload) => {
      const updated = await userBusinessUnitApi.patch(id, data);
      updateMembership(id, {
        isActiveMembership: (updated as any).is_active_membership ?? data.isActiveMembership,
        role: (updated as any).role ?? data.role,
        roleName: (updated as any).role_name ?? null,
        effectiveFrom: (updated as any).effective_from ?? data.effectiveFrom,
        effectiveTo: (updated as any).effective_to ?? data.effectiveTo,
      });
      return updated;
    },
    [updateMembership]
  );

  const deleteMembership = useCallback(
    async (id: string) => {
      await userBusinessUnitApi.delete(id);
      removeMembership(id);
    },
    [removeMembership]
  );

  const toggleMembership = useCallback(
    async (id: string, activate: boolean) => {
      const result = activate
        ? await userBusinessUnitApi.activate(id)
        : await userBusinessUnitApi.deactivate(id);
      updateMembership(id, {
        isActiveMembership: (result as any).is_active_membership ?? activate,
      });
      return result;
    },
    [updateMembership]
  );

  const applyFilters = useCallback(
    (f: Partial<UserBusinessUnitFilters>) => setFilters(f),
    [setFilters]
  );

  return {
    memberships,
    meta,
    isLoading,
    error,
    filters,
    refetch: fetchMemberships,
    applyFilters,
    createMembership,
    patchMembership,
    deleteMembership,
    toggleMembership,
  };
};

// Legacy alias
export const useUserbusinessunit = useUserBusinessUnit;
