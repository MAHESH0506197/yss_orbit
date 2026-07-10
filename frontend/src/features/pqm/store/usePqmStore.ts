// yss_orbit/frontend/src/features/pqm/store/usePqmStore.ts
/**
 * PQM Zustand Store — global client-side state for the PQM module.
 * Follows the same pattern as useHrmsStore.
 */
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  NonConformance,
  NCListItem,
  DashboardKPI,
  PQMProject,
  PQMSite,
  PQMCategory,
  PQMContractor,
  NCFilters,
  PaginatedResponse,
  PQMDropdownOption,
} from "../types";
import { pqmService } from "../api/pqmService";

// ─── State ────────────────────────────────────────────────────────────────────
interface PqmState {
  ncList: NCListItem[];
  ncListLoading: boolean;
  ncListTotal: number;
  ncListPage: number;
  ncFilters: NCFilters;

  selectedNc: NonConformance | null;
  ncDetailLoading: boolean;

  dashboard: DashboardKPI | null;
  dashboardTrends: { month: string; created_count: number }[];
  dashboardLoading: boolean;

  projects: PQMProject[];
  sites: PQMSite[];
  categories: PQMDropdownOption[];
  subCategories: PQMDropdownOption[];
  contractors: PQMContractor[];
  priorities: PQMDropdownOption[];
  severities: PQMDropdownOption[];
  referenceTypes: PQMDropdownOption[];
  areas: PQMDropdownOption[];
  configLoading: boolean;

  createDialogOpen: boolean;
  approvalDialogOpen: boolean;
  reassignDialogOpen: boolean;
  reopenDialogOpen: boolean;
  duplicateWarning: NCListItem[];
}

// ─── Actions ──────────────────────────────────────────────────────────────────
interface PqmActions {
  fetchNcList: (filters?: Partial<NCFilters>, page?: number) => Promise<void>;
  setFilters: (filters: Partial<NCFilters>) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;
  fetchNcDetail: (id: string) => Promise<void>;
  clearSelectedNc: () => void;
  fetchDashboard: (projectId?: string) => Promise<void>;
  submitNc: (id: string) => Promise<NonConformance | null>;
  makeReviewDecision: (id: string, decision: string, comments: string) => Promise<void>;
  assignNc: (id: string, assigneeId: string) => Promise<void>;
  startWork: (id: string) => Promise<void>;
  requestClosure: (id: string) => Promise<void>;
  makeVerificationDecision: (id: string, level: number, decision: string, comments: string) => Promise<void>;
  reopenNc: (id: string, reason: string) => Promise<void>;
  mergeNc: (sourceId: string, targetId: string) => Promise<void>;
  checkDuplicates: (id: string) => Promise<void>;
  fetchConfig: () => Promise<void>;
  fetchDropdownConfig: () => Promise<void>;
  setCreateDialogOpen: (open: boolean) => void;
  setApprovalDialogOpen: (open: boolean) => void;
  setReassignDialogOpen: (open: boolean) => void;
  setReopenDialogOpen: (open: boolean) => void;
}

const DEFAULT_FILTERS: NCFilters = {
  status: "",
  priority: "",
  severity: "",
  project: "",
  site: "",
  search: "",
};

// ─── Store creation ───────────────────────────────────────────────────────────
export const usePqmStore = create<PqmState & PqmActions>()(
  devtools(
    (set, get) => ({
      // ── Initial state ────────────────────────────────────────────────────
      ncList: [],
      ncListLoading: false,
      ncListTotal: 0,
      ncListPage: 1,
      ncFilters: { ...DEFAULT_FILTERS },
      selectedNc: null,
      ncDetailLoading: false,
      dashboard: null,
      dashboardTrends: [],
      dashboardLoading: false,
      projects: [],
      sites: [],
      categories: [],
      subCategories: [],
      contractors: [],
      priorities: [],
      severities: [],
      referenceTypes: [],
      areas: [],
      configLoading: false,
      createDialogOpen: false,
      approvalDialogOpen: false,
      reassignDialogOpen: false,
      reopenDialogOpen: false,
      duplicateWarning: [],

      // ── NC List ──────────────────────────────────────────────────────────
      fetchNcList: async (filters, page = 1) => {
        set({ ncListLoading: true });
        try {
          const merged = { ...get().ncFilters, ...filters, page } as NCFilters;
          const data: PaginatedResponse<NCListItem> = await pqmService.listNCs(merged);
          set({ ncList: data.results, ncListTotal: data.count, ncListPage: page, ncListLoading: false });
        } catch {
          set({ ncListLoading: false });
        }
      },

      setFilters: (filters) =>
        set((s) => ({ ncFilters: { ...s.ncFilters, ...filters }, ncListPage: 1 })),

      resetFilters: () => set({ ncFilters: { ...DEFAULT_FILTERS }, ncListPage: 1 }),

      setPage: (page) => {
        set({ ncListPage: page });
        get().fetchNcList(undefined, page);
      },

      // ── NC Detail ────────────────────────────────────────────────────────
      fetchNcDetail: async (id) => {
        set({ ncDetailLoading: true });
        try {
          const nc = await pqmService.getNC(id);
          set({ selectedNc: nc, ncDetailLoading: false });
        } catch {
          set({ ncDetailLoading: false });
        }
      },

      clearSelectedNc: () => set({ selectedNc: null }),

      // ── Dashboard ────────────────────────────────────────────────────────
      fetchDashboard: async (projectId?: string) => {
        set({ dashboardLoading: true });
        try {
          const [data, trends] = await Promise.all([
            pqmService.getDashboardKPI(projectId),
            pqmService.getDashboardTrends(projectId),
          ]);
          set({ dashboard: data, dashboardTrends: trends, dashboardLoading: false });
        } catch {
          set({ dashboardLoading: false });
        }
      },

      // ── Lifecycle actions ────────────────────────────────────────────────
      submitNc: async (id) => {
        const nc = await pqmService.submitNC(id);
        await get().fetchNcDetail(id);
        return nc;
      },

      makeReviewDecision: async (id, decision, comments) => {
        await pqmService.reviewDecision(id, decision, comments);
        await get().fetchNcDetail(id);
        set({ approvalDialogOpen: false });
      },

      assignNc: async (id, assigneeId) => {
        await pqmService.assignNC(id, assigneeId);
        await get().fetchNcDetail(id);
      },

      startWork: async (id) => {
        await pqmService.startWork(id);
        await get().fetchNcDetail(id);
      },

      requestClosure: async (id) => {
        await pqmService.requestClosure(id);
        await get().fetchNcDetail(id);
      },

      makeVerificationDecision: async (id, level, decision, comments) => {
        await pqmService.verificationDecision(id, level, decision, comments);
        await get().fetchNcDetail(id);
        set({ approvalDialogOpen: false });
      },

      reopenNc: async (id, reason) => {
        await pqmService.reopenNC(id, reason);
        await get().fetchNcDetail(id);
        set({ reopenDialogOpen: false });
      },

      mergeNc: async (sourceId, targetId) => {
        await pqmService.mergeNC(sourceId, targetId);
        await get().fetchNcList();
      },

      checkDuplicates: async (id) => {
        const dupes = await pqmService.checkDuplicates(id);
        set({ duplicateWarning: dupes });
      },

      fetchConfig: async () => {
        set({ configLoading: true });
        try {
          const [projects, contractors] = await Promise.all([
            pqmService.listProjects().then(res => res.results),
            pqmService.listContractors(),
          ]);
          set({ projects, contractors, configLoading: false });
        } catch {
          set({ configLoading: false });
        }
      },

      fetchDropdownConfig: async () => {
        try {
          const options = await pqmService.listDropdownOptions();
          set({
            priorities: options.filter(o => o.field_type === 'PRIORITY'),
            severities: options.filter(o => o.field_type === 'SEVERITY'),
            referenceTypes: options.filter(o => o.field_type === 'REFERENCE_TYPE'),
            areas: options.filter(o => o.field_type === 'AREA'),
            categories: options.filter(o => o.field_type === 'CATEGORY'),
            subCategories: options.filter(o => o.field_type === 'SUB_CATEGORY'),
          });
        } catch (e) {
          console.error("Failed to fetch dropdown config", e);
        }
      },


      // ── UI ───────────────────────────────────────────────────────────────
      setCreateDialogOpen: (open) => set({ createDialogOpen: open }),
      setApprovalDialogOpen: (open) => set({ approvalDialogOpen: open }),
      setReassignDialogOpen: (open) => set({ reassignDialogOpen: open }),
      setReopenDialogOpen: (open) => set({ reopenDialogOpen: open }),
    }),
    { name: "pqm-store" }
  )
);
