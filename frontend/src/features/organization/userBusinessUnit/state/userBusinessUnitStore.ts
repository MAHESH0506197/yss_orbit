// yss_orbit\frontend\src\modules\userBusinessUnit\state\userBusinessUnitStore.ts
import { create } from 'zustand';
import type {
  UserBusinessUnitMembership,
  UserBusinessUnitListMeta,
  UserBusinessUnitFilters,
  UserBusinessUnitState,
} from '../types/userBusinessUnitTypes';
import { userBusinessUnitApi } from '../api/userBusinessUnitApi';

export const useUserBusinessUnitStore = create<UserBusinessUnitState>((set, get) => ({
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
      // Normalize snake_case from API to camelCase
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

      const meta = response.meta
        ? {
            total: response.meta.total ?? 0,
            totalActive: response.meta.totalActive ?? (response.meta as any).total_active ?? 0,
            totalInactive: response.meta.totalInactive ?? (response.meta as any).total_inactive ?? 0,
          }
        : null;

      set({ memberships, meta, isLoading: false });
    } catch (error: any) {
      set({
        error: error?.response?.data?.message ?? error?.message ?? 'Failed to load memberships.',
        isLoading: false,
      });
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
}));
