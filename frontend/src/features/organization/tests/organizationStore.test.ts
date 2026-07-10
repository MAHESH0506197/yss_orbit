// yss_orbit/frontend/src/modules/organization/tests/organizationStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useOrganizationUIStore } from '../state/organizationSlice';

const org = {
  id: 'abc',
  name: 'Test',
  slug: 'test',
  is_active: true,
  is_deleted: false,
} as any;

describe('OrganizationUIStore', () => {
  beforeEach(() => {
    useOrganizationUIStore.getState().closeModal();
    useOrganizationUIStore.getState().setSelectedOrgId(null);
  });

  it('opens create modal', () => {
    useOrganizationUIStore.getState().openCreateModal();
    const state = useOrganizationUIStore.getState();
    expect(state.isFormModalOpen).toBe(true);
    expect(state.editingOrg).toBeNull();
  });

  it('opens edit modal with org', () => {
    useOrganizationUIStore.getState().openEditModal(org);
    const state = useOrganizationUIStore.getState();
    expect(state.isFormModalOpen).toBe(true);
    expect(state.editingOrg?.id).toBe('abc');
  });

  it('closes modal', () => {
    useOrganizationUIStore.getState().openCreateModal();
    useOrganizationUIStore.getState().closeModal();
    expect(useOrganizationUIStore.getState().isFormModalOpen).toBe(false);
  });

  it('sets view mode', () => {
    useOrganizationUIStore.getState().setViewMode('grid');
    expect(useOrganizationUIStore.getState().viewMode).toBe('grid');
  });
});
