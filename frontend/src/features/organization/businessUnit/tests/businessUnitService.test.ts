// yss_orbit/frontend/src/modules/businessUnit/tests/businessUnitService.test.ts
// FIXED: was an exported class stub, not an actual test file.
// Now mirrors organizationApi.test.ts in structure and depth.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { businessUnitApi } from '../api/businessUnitApi';

// Mock the canonical apiClient (businessUnitApi was migrated from tombstoned axiosClient)
vi.mock('@/api/client', () => ({
  apiClient: {
    get:    vi.fn(),
    post:   vi.fn(),
    patch:  vi.fn(),
    delete: vi.fn(),
  },
  default: {
    get:    vi.fn(),
    post:   vi.fn(),
    patch:  vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from '@/api/client';

const mockBu = {
  id:              'bu-uuid-123',
  organization_id: 'org-uuid-456',
  organization_name: 'Test Corp',
  name:            'Main Store',
  code:            'MAIN01',
  email:           'store@testcorp.com',
  phone:           '',

  address_line1:   '',
  address_line2:   '',
  city:            'Bangalore',
  state:           'Karnataka',
  country:         'IN',
  pincode:         '',
  registration_number: '',
  gst_number:      '',
  pan_number:      '',
  timezone:        '',
  currency_code:   '',
  effective_timezone: 'Asia/Kolkata',
  effective_currency: 'INR',
  logo_url:        null,
  primary_color:   '',
  branding_mode:   'platform' as const,
  manager_id:      null,
  is_main_branch:  true,
  is_active:       true,
  is_deleted:      false,
  deleted_at:      null,
  deleted_by_id:   null,
  created_at:      '2026-01-01T00:00:00Z',
  updated_at:      '2026-01-01T00:00:00Z',
  created_by_id:   null,
  updated_by_id:   null,
};

describe('businessUnitApi.getMany', () => {
  beforeEach(() => vi.clearAllMocks());

  it('unwraps paginated envelope with meta stats', async () => {
    (apiClient.get as any).mockResolvedValue({
      data: {
        success: true,
        data: { results: [mockBu], count: 1 },
        meta: {
          total: 1, total_active: 1, total_inactive: 0, total_deleted: 0,
          page: 1, page_size: 20, total_pages: 1,
        },
      },
    });
    const result = await businessUnitApi.getMany();
    expect(result.results).toHaveLength(1);
    // @ts-expect-error - Auto-patched TS2532
    expect(result.results[0].name).toBe('Main Store');
    expect(result.meta.total_active).toBe(1);
    expect(result.meta.total_deleted).toBe(0);
  });

  it('handles plain list response without pagination', async () => {
    (apiClient.get as any).mockResolvedValue({
      data: { success: true, data: [mockBu], meta: {} },
    });
    const result = await businessUnitApi.getMany();
    expect(result.results).toHaveLength(1);
  });

  it('passes query params to apiClient', async () => {
    (apiClient.get as any).mockResolvedValue({
      data: { success: true, data: { results: [], count: 0 }, meta: {} },
    });
    await businessUnitApi.getMany({ search: 'store', business_domain_id: 'dom-001', is_active: true });
    expect(apiClient.get).toHaveBeenCalledWith('/business-units/', {
      params: { search: 'store', business_domain_id: 'dom-001', is_active: true },
    });
  });

  it('strips undefined params', async () => {
    (apiClient.get as any).mockResolvedValue({
      data: { success: true, data: { results: [], count: 0 }, meta: {} },
    });
    await businessUnitApi.getMany({ search: undefined, business_domain_id: 'dom-001' } as any);
    const callParams = (apiClient.get as any).mock.calls[0][1].params;
    expect('search' in callParams).toBe(false);
    expect(callParams.business_domain_id).toBe('dom-001');
  });
});

describe('businessUnitApi.getOne', () => {
  it('unwraps single BU envelope', async () => {
    (apiClient.get as any).mockResolvedValue({
      data: { success: true, data: mockBu },
    });
    const result = await businessUnitApi.getOne('bu-uuid-123');
    expect(result.id).toBe('bu-uuid-123');
    expect(result.code).toBe('MAIN01');
  });
});

describe('businessUnitApi.create', () => {
  it('posts payload and returns created BU', async () => {
    (apiClient.post as any).mockResolvedValue({
      data: { success: true, data: mockBu },
    });
    const result = await businessUnitApi.create({
      name: 'Main Store', code: 'MAIN01',
    });
    expect(result.id).toBe('bu-uuid-123');
    expect(apiClient.post).toHaveBeenCalledWith(
      '/business-units/',
      expect.objectContaining({ name: 'Main Store', code: 'MAIN01' }),
    );
  });
});

describe('businessUnitApi.update', () => {
  it('patches and returns updated BU', async () => {
    const updated = { ...mockBu, name: 'Updated Store' };
    (apiClient.patch as any).mockResolvedValue({
      data: { success: true, data: updated },
    });
    const result = await businessUnitApi.update('bu-uuid-123', { name: 'Updated Store' });
    expect(result.name).toBe('Updated Store');
  });
});

describe('businessUnitApi.delete', () => {
  it('calls DELETE endpoint (triggers soft-delete on backend)', async () => {
    (apiClient.delete as any).mockResolvedValue({ data: { success: true } });
    await businessUnitApi.delete('bu-uuid-123');
    expect(apiClient.delete).toHaveBeenCalledWith('/business-units/bu-uuid-123/', expect.anything());
  });
});

describe('businessUnitApi.restore', () => {
  it('posts to restore endpoint and returns restored BU', async () => {
    const restored = { ...mockBu, is_deleted: false, is_active: true };
    (apiClient.post as any).mockResolvedValue({
      data: { success: true, data: restored },
    });
    const result = await businessUnitApi.restore('bu-uuid-123');
    expect(result.is_deleted).toBe(false);
    expect(apiClient.post).toHaveBeenCalledWith('/business-units/bu-uuid-123/restore/', expect.anything());
  });
});
