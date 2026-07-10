// yss_orbit/frontend/src/modules/businessUnit/tests/businessUnitStore.test.ts
// FIXED: was a stub exporting a hook stub — not an actual test.
// Now mirrors organizationStore.test.ts in structure and depth.

import { describe, it, expect, beforeEach } from 'vitest';
import { useBusinessUnitUIStore } from '../state/businessUnitSlice';

const mockBu = {
  id: 'bu-uuid-123',
  organization_id: 'org-uuid-456',
  organization_name: 'Test Corp',
  name: 'Main Store',
  code: 'MAIN01',
  email: null,
  phone: null,

  address_line1: null,
  address_line2: null,
  city: null,
  state: null,
  country: 'IN',
  pincode: null,
  registration_number: null,
  gst_number: null,
  pan_number: null,
  timezone: null,
  currency_code: null,
  effective_timezone: 'Asia/Kolkata',
  effective_currency: 'INR',
  logo_url: null,
  primary_color: null,
  branding_mode: 'platform' as const,
  manager_id: null,
  is_main_branch: true,
  is_active: true,
  is_deleted: false,
  deleted_at: null,
  deleted_by_id: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  created_by_id: null,
  updated_by_id: null,
};

describe('BusinessUnitUIStore — modal state', () => {
  beforeEach(() => {
    useBusinessUnitUIStore.getState().closeModal();
    useBusinessUnitUIStore.getState().setSelectedBuId(null);
  });

  it('opens create modal with null editingBu', () => {
    useBusinessUnitUIStore.getState().openCreateModal();
    const state = useBusinessUnitUIStore.getState();
    expect(state.isFormModalOpen).toBe(true);
    expect(state.editingBu).toBeNull();
  });

  it('opens edit modal with the provided BU', () => {
    useBusinessUnitUIStore.getState().openEditModal(mockBu as any);
    const state = useBusinessUnitUIStore.getState();
    expect(state.isFormModalOpen).toBe(true);
    expect(state.editingBu?.id).toBe('bu-uuid-123');
  });

  it('closes modal and clears editingBu', () => {
    useBusinessUnitUIStore.getState().openEditModal(mockBu as any);
    useBusinessUnitUIStore.getState().closeModal();
    const state = useBusinessUnitUIStore.getState();
    expect(state.isFormModalOpen).toBe(false);
    expect(state.editingBu).toBeNull();
  });
});

describe('BusinessUnitUIStore — selectedBuId', () => {
  it('sets and clears selectedBuId', () => {
    useBusinessUnitUIStore.getState().setSelectedBuId('bu-uuid-123');
    expect(useBusinessUnitUIStore.getState().selectedBuId).toBe('bu-uuid-123');
    useBusinessUnitUIStore.getState().setSelectedBuId(null);
    expect(useBusinessUnitUIStore.getState().selectedBuId).toBeNull();
  });
});

describe('BusinessUnitUIStore — view mode', () => {
  it('defaults to table view', () => {
    expect(useBusinessUnitUIStore.getState().viewMode).toBe('table');
  });

  it('switches to grid view', () => {
    useBusinessUnitUIStore.getState().setViewMode('grid');
    expect(useBusinessUnitUIStore.getState().viewMode).toBe('grid');
    useBusinessUnitUIStore.getState().setViewMode('table'); // restore
  });
});

describe('BusinessUnitUIStore — saved params', () => {
  it('defaults to page 1, page_size 20, ordering name', () => {
    useBusinessUnitUIStore.getState().resetParams();
    const { savedParams } = useBusinessUnitUIStore.getState();
    expect(savedParams.page).toBe(1);
    expect(savedParams.page_size).toBe(20);
    expect(savedParams.ordering).toBe('name');
  });

  it('persists saved params', () => {
    useBusinessUnitUIStore.getState().setSavedParams({ page: 3, page_size: 50, search: 'store' });
    const { savedParams } = useBusinessUnitUIStore.getState();
    expect(savedParams.page).toBe(3);
    expect(savedParams.search).toBe('store');
  });

  it('resetParams restores defaults', () => {
    useBusinessUnitUIStore.getState().setSavedParams({ page: 5 });
    useBusinessUnitUIStore.getState().resetParams();
    expect(useBusinessUnitUIStore.getState().savedParams.page).toBe(1);
  });
});

describe('BusinessUnitUIStore — confirm dialog', () => {
  beforeEach(() => {
    useBusinessUnitUIStore.getState().closeConfirmDialog();
  });

  it('opens confirm dialog with options', () => {
    const onConfirm = () => {};
    useBusinessUnitUIStore.getState().openConfirmDialog({
      title:        'Archive BU?',
      message:      'This will archive the business unit.',
      confirmLabel: 'Archive',
      variant:      'danger',
      onConfirm,
    });
    const { confirmDialog } = useBusinessUnitUIStore.getState();
    expect(confirmDialog.open).toBe(true);
    expect(confirmDialog.title).toBe('Archive BU?');
    expect(confirmDialog.variant).toBe('danger');
    expect(confirmDialog.onConfirm).toBe(onConfirm);
  });

  it('closes confirm dialog', () => {
    useBusinessUnitUIStore.getState().openConfirmDialog({
      title: 'Test', message: 'Test', onConfirm: () => {},
    });
    useBusinessUnitUIStore.getState().closeConfirmDialog();
    expect(useBusinessUnitUIStore.getState().confirmDialog.open).toBe(false);
    expect(useBusinessUnitUIStore.getState().confirmDialog.onConfirm).toBeNull();
  });
});
