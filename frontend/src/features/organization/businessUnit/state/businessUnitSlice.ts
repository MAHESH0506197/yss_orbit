// yss_orbit/frontend/src/modules/businessUnit/state/businessUnitSlice.ts

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { BusinessUnit, BusinessUnitListParams } from '../types/businessUnitTypes';

interface ConfirmDialogState {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  variant: 'danger' | 'warning' | 'success';
  onConfirm: (() => void) | null;
}

interface BusinessUnitUIState {
  // Active selection
  selectedBuId: string | null;
  setSelectedBuId: (id: string | null) => void;

  // Modal state
  isFormModalOpen: boolean;
  editingBu: BusinessUnit | null;
  openCreateModal: () => void;
  openEditModal:   (bu: BusinessUnit) => void;
  closeModal:      () => void;

  // Confirm dialog (replaces window.confirm anti-pattern)
  confirmDialog: ConfirmDialogState;
  openConfirmDialog: (opts: {
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: 'danger' | 'warning' | 'success';
    onConfirm: () => void;
  }) => void;
  closeConfirmDialog: () => void;

  // Filter persistence
  savedParams: BusinessUnitListParams;
  setSavedParams: (params: BusinessUnitListParams) => void;
  resetParams: () => void;

  // View mode
  viewMode: 'table' | 'grid';
  setViewMode: (mode: 'table' | 'grid') => void;
}

const DEFAULT_PARAMS: BusinessUnitListParams = {
  page:      1,
  page_size: 20,
  ordering:  'name',
};

const DEFAULT_CONFIRM: ConfirmDialogState = {
  open:         false,
  title:        '',
  message:      '',
  confirmLabel: 'Confirm',
  variant:      'danger',
  onConfirm:    null,
};

export const useBusinessUnitUIStore = create<BusinessUnitUIState>()(
  devtools(
    persist(
      (set) => ({
        selectedBuId:    null,
        setSelectedBuId: (id) => set({ selectedBuId: id }),

        isFormModalOpen: false,
        editingBu:       null,
        openCreateModal: ()    => set({ isFormModalOpen: true, editingBu: null }),
        openEditModal:   (bu)  => set({ isFormModalOpen: true, editingBu: bu }),
        closeModal:      ()    => set({ isFormModalOpen: false, editingBu: null }),

        confirmDialog: DEFAULT_CONFIRM,
        openConfirmDialog: (opts) =>
          set({
            confirmDialog: {
              open:         true,
              title:        opts.title,
              message:      opts.message,
              confirmLabel: opts.confirmLabel ?? 'Confirm',
              variant:      opts.variant      ?? 'danger',
              onConfirm:    opts.onConfirm,
            },
          }),
        closeConfirmDialog: () => set({ confirmDialog: DEFAULT_CONFIRM }),

        savedParams:    DEFAULT_PARAMS,
        setSavedParams: (params) => set({ savedParams: params }),
        resetParams:    ()       => set({ savedParams: DEFAULT_PARAMS }),

        viewMode:    'table',
        setViewMode: (mode) => set({ viewMode: mode }),
      }),
      {
        name: 'bu-ui-store',
        // Persist only UI preferences — ephemeral modal/confirm/selection state resets on load
        partialize: (state) => ({
          viewMode:    state.viewMode,
          savedParams: state.savedParams,
        }),
      },
    ),
    { name: 'BusinessUnitUIStore' },
  ),
);
