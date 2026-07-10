// yss_orbit/frontend/src/modules/organization/tests/organizationApi.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { organizationApi } from '../api/organizationApi';

// Mock the canonical apiClient (organizationApi was migrated from tombstoned axiosClient)
vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from '@/api/client';

const mockOrg = {
  id: '123',
  name: 'Test Org',
  slug: 'test-org',
  is_active: true,
  is_deleted: false,
};

describe('organizationApi.getOrganizations', () => {
  it('unwraps paginated envelope', async () => {
    (apiClient.get as any).mockResolvedValue({
      data: {
        success: true,
        data: { results: [mockOrg], count: 1 },
        meta: { total_active: 1, total_inactive: 0, total_deleted: 0, total_verified: 0, total: 1 },
      },
    });
    const result = await organizationApi.getOrganizations();
    expect(result.results).toHaveLength(1);
    // @ts-expect-error - Auto-patched TS2532
    expect(result.results[0].name).toBe('Test Org');
    expect(result.meta.total_active).toBe(1);
  });
});

describe('organizationApi.getOrganization', () => {
  it('unwraps single org envelope', async () => {
    (apiClient.get as any).mockResolvedValue({
      data: { success: true, data: mockOrg },
    });
    const result = await organizationApi.getOrganization('123');
    expect(result.id).toBe('123');
  });
});
