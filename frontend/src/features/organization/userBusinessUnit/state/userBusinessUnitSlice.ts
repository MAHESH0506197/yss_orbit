// yss_orbit\frontend\src\modules\userBusinessUnit\state\userBusinessUnitSlice.ts
/**
 * Slice definition — used if you compose this into a root store.
 * Otherwise, use useUserBusinessUnitStore directly.
 */
import { StateCreator } from 'zustand';
import type { UserBusinessUnitState } from '../types/userBusinessUnitTypes';
import { userBusinessUnitApi } from '../api/userBusinessUnitApi';
import type { UserBusinessUnitMembership } from '../types/userBusinessUnitTypes';

export const createUserBusinessUnitSlice: StateCreator<UserBusinessUnitState> = (set, get) => ({
  memberships: [],
  meta: null,
  isLoading: false,
  error: null,
  filters: {},

  fetchMemberships: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await userBusinessUnitApi.getAll(get().filters);
      const raw = response.data ?? [];
      const memberships: UserBusinessUnitMembership[] = raw.map((item: any) => ({
        id: item.id,
        user: item.user,
        userEmail: item.user_email ?? '',
        userFullName: item.user_full_name ?? '',
        businessUnit: item.business_unit,
        businessUnitName: item.business_unit_name ?? '',
        role: item.role ?? null,
        roleName: item.role_name ?? null,
        isActiveMembership: item.is_active_membership ?? true,
        joinedAt: item.joined_at,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        effectiveFrom: item.effective_from,
        effectiveTo: item.effective_to,
      }));
      set({ memberships, isLoading: false });
    } catch (error: any) {
      set({ error: error?.message ?? 'Failed to fetch.', isLoading: false });
    }
  },

  setFilters: (filters) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
    get().fetchMemberships();
  },

  addMembership: (m) =>
    set((state) => ({ memberships: [m, ...state.memberships] })),

  updateMembership: (id, changes) =>
    set((state) => ({
      memberships: state.memberships.map((m) =>
        m.id === id ? { ...m, ...changes } : m
      ),
    })),

  removeMembership: (id) =>
    set((state) => ({
      memberships: state.memberships.filter((m) => m.id !== id),
    })),
});
