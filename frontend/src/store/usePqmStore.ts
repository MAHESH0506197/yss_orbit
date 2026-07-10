// yss_orbit\frontend\src\store\usePqmStore.ts
import { create } from 'zustand';
import { pqmService } from '@/features/pqm/api/pqmService';
import {
  NonConformance,
  NCListItem,
  NCFilters,
  DashboardKPI,
} from '@/features/pqm/types';

interface PqmState {
  // NC List
  ncList: NCListItem[];
  ncTotal: number;
  ncFilters: NCFilters;
  // NC Detail
  currentNC: NonConformance | null;
  // Dashboard
  dashboardKPI: DashboardKPI | null;
  // UI state
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  // Actions
  setFilters: (filters: Partial<NCFilters>) => void;
  fetchNCList: () => Promise<void>;
  fetchNCDetail: (id: string) => Promise<void>;
  fetchDashboardKPI: () => Promise<void>;
  submitAction: (action: () => Promise<NonConformance>) => Promise<NonConformance>;
  clearError: () => void;
  clearCurrentNC: () => void;
}

export const usePqmStore = create<PqmState>((set, get) => ({
  ncList: [],
  ncTotal: 0,
  ncFilters: { page: 1, page_size: 25 },
  currentNC: null,
  dashboardKPI: null,
  isLoading: false,
  isSubmitting: false,
  error: null,

  setFilters: (filters) =>
    set((state) => ({ ncFilters: { ...state.ncFilters, ...filters, page: 1 } })),

  fetchNCList: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await pqmService.listNCs(get().ncFilters);
      set({ ncList: response.results, ncTotal: response.count, isLoading: false });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load non-conformances';
      set({ error: message, isLoading: false });
    }
  },

  fetchNCDetail: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const nc = await pqmService.getNC(id);
      set({ currentNC: nc, isLoading: false });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load NC detail';
      set({ error: message, isLoading: false });
    }
  },

  fetchDashboardKPI: async () => {
    set({ isLoading: true, error: null });
    try {
      const kpi = await pqmService.getDashboardKPI();
      set({ dashboardKPI: kpi, isLoading: false });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load dashboard';
      set({ error: message, isLoading: false });
    }
  },

  submitAction: async (action) => {
    set({ isSubmitting: true, error: null });
    try {
      const result = await action();
      set({ currentNC: result, isSubmitting: false });
      return result;
    } catch (err: unknown) {
      let message = 'Action failed';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
        message = axiosErr.response?.data?.message ?? axiosErr.message ?? message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      set({ error: message, isSubmitting: false });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
  clearCurrentNC: () => set({ currentNC: null }),
}));
