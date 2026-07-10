// yss_orbit/frontend/src/modules/organization/state/organizationSlice.ts

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Organization, OrganizationListParams } from '../types/organizationTypes';

interface OrganizationUIState {
  // Active selection
  selectedOrgId: string | null;
  setSelectedOrgId: (id: string | null) => void;

  // Modal state
  isFormModalOpen: boolean;
  editingOrg: Organization | null;
  openCreateModal: () => void;
  openEditModal:   (org: Organization) => void;
  closeModal:      () => void;

  // Filter persistence across page navigations
  savedParams: OrganizationListParams;
  setSavedParams: (params: OrganizationListParams) => void;
  resetParams: () => void;

  // View mode
  viewMode: 'table' | 'grid';
  setViewMode: (mode: 'table' | 'grid') => void;
}

const DEFAULT_PARAMS: OrganizationListParams = {
  page:     1,
  page_size: 20,
  ordering: 'name',
};

export const useOrganizationUIStore = create<OrganizationUIState>()(
  devtools(
    persist(
      (set) => ({
        selectedOrgId: null,
        setSelectedOrgId: (id) => set({ selectedOrgId: id }),

        isFormModalOpen: false,
        editingOrg:      null,
        openCreateModal: ()    => set({ isFormModalOpen: true, editingOrg: null }),
        openEditModal:   (org) => set({ isFormModalOpen: true, editingOrg: org }),
        closeModal:      ()    => set({ isFormModalOpen: false, editingOrg: null }),

        savedParams: DEFAULT_PARAMS,
        setSavedParams: (params) => set({ savedParams: params }),
        resetParams:    ()       => set({ savedParams: DEFAULT_PARAMS }),

        viewMode: 'table',
        setViewMode: (mode) => set({ viewMode: mode }),
      }),
      {
        name: 'org-ui-store',
        // Persist only UI preferences — ephemeral modal/selection state resets on load
        partialize: (state) => ({
          viewMode:    state.viewMode,
          savedParams: state.savedParams,
        }),
      },
    ),
    { name: 'OrganizationUIStore' },
  ),
);
