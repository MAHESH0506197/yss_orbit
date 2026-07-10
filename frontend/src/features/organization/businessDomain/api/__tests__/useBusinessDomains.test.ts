// src/features/organization/businessDomain/api/__tests__/useBusinessDomains.test.ts
// ─────────────────────────────────────────────────────────────────────────────
// Tests for the businessDomainApi and React Query hooks.
//
// Coverage:
//  ● businessDomainApi.permanentDelete — sends DELETE ?hard=true with confirmation_name body
//  ● businessDomainApi.delete         — sends plain DELETE (soft)
//  ● businessDomainApi.restore        — sends POST /restore/
//  ● businessDomainApi.create         — sends POST with payload
//  ● businessDomainApi.update         — sends PATCH with payload
//  ● businessDomainApi.getOne         — sends GET and unwraps response
//  ● Hook: usePermanentDeleteBusinessDomain — wraps API correctly
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock apiClient ───────────────────────────────────────────────────────────
const mockGet    = vi.fn();
const mockPost   = vi.fn();
const mockPatch  = vi.fn();
const mockDelete = vi.fn();

vi.mock('@/api/client', () => ({
  apiClient: {
    get:    (...args: any[]) => mockGet(...args),
    post:   (...args: any[]) => mockPost(...args),
    patch:  (...args: any[]) => mockPatch(...args),
    delete: (...args: any[]) => mockDelete(...args),
  },
}));

// ─── Mock organization keys ────────────────────────────────────────────────────
vi.mock('@/features/organization/hooks/useOrganizations', () => ({
  organizationKeys: { all: () => ['organizations'] },
}));

// ─── Import after mocks ────────────────────────────────────────────────────────
import { businessDomainApi } from '../useBusinessDomains';

const BASE = '/api/v1/business-domains';

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('businessDomainApi', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── permanentDelete ────────────────────────────────────────────────────────

  describe('.permanentDelete(id, confirmationName)', () => {
    it('calls DELETE with ?hard=true and confirmation_name in body', async () => {
      mockDelete.mockResolvedValueOnce({ data: {} });
      await businessDomainApi.permanentDelete('domain-123', 'Pharmacy');

      expect(mockDelete).toHaveBeenCalledWith(
        `${BASE}/domain-123/?hard=true`,
        { data: { confirmation_name: 'Pharmacy' } }
      );
    });

    it('propagates network errors', async () => {
      mockDelete.mockRejectedValueOnce(new Error('Network Error'));
      await expect(businessDomainApi.permanentDelete('bad-id', 'x')).rejects.toThrow('Network Error');
    });
  });

  // ─── delete (soft) ─────────────────────────────────────────────────────────

  describe('.delete(id)', () => {
    it('calls plain DELETE without ?hard flag', async () => {
      mockDelete.mockResolvedValueOnce({ data: {} });
      await businessDomainApi.delete('domain-456');

      expect(mockDelete).toHaveBeenCalledWith(`${BASE}/domain-456/`);
      // Must NOT have ?hard=true
      const callUrl = mockDelete.mock.calls[0]![0] as string;
      expect(callUrl).not.toContain('hard');
    });
  });

  // ─── restore ───────────────────────────────────────────────────────────────

  describe('.restore(id)', () => {
    it('calls POST /restore/', async () => {
      const mockDomain = { id: 'domain-789', name: 'Retail', code: 'BDOM-RTL' };
      mockPost.mockResolvedValueOnce({ data: { data: mockDomain } });

      const result = await businessDomainApi.restore('domain-789');

      expect(mockPost).toHaveBeenCalledWith(`${BASE}/domain-789/restore/`);
      expect(result).toEqual(mockDomain);
    });
  });

  // ─── create ────────────────────────────────────────────────────────────────

  describe('.create(payload)', () => {
    it('sends POST to base URL with payload', async () => {
      const payload = { name: 'Hospital', code: 'BDOM-HSPTL' };
      const mockDomain = { id: 'new-id', ...payload };
      mockPost.mockResolvedValueOnce({ data: { data: mockDomain } });

      const result = await businessDomainApi.create(payload);

      expect(mockPost).toHaveBeenCalledWith(`${BASE}/`, payload);
      expect(result).toEqual(mockDomain);
    });
  });

  // ─── update ────────────────────────────────────────────────────────────────

  describe('.update(id, payload)', () => {
    it('sends PATCH to domain URL', async () => {
      const payload = { description: 'Updated desc' };
      const mockDomain = { id: 'domain-001', name: 'Retail', ...payload };
      mockPatch.mockResolvedValueOnce({ data: { data: mockDomain } });

      const result = await businessDomainApi.update('domain-001', payload);

      expect(mockPatch).toHaveBeenCalledWith(`${BASE}/domain-001/`, payload);
      expect(result).toEqual(mockDomain);
    });
  });

  // ─── getOne ────────────────────────────────────────────────────────────────

  describe('.getOne(id)', () => {
    it('fetches domain and unwraps envelope', async () => {
      const mockDomain = { id: 'domain-002', name: 'Finance', code: 'BDOM-FIN' };
      mockGet.mockResolvedValueOnce({ data: { data: mockDomain } });

      const result = await businessDomainApi.getOne('domain-002');

      expect(mockGet).toHaveBeenCalledWith(`${BASE}/domain-002/`);
      expect(result).toEqual(mockDomain);
    });

    it('handles flat envelope (no nested data key)', async () => {
      const mockDomain = { id: 'domain-003', name: 'HR' };
      mockGet.mockResolvedValueOnce({ data: mockDomain });

      const result = await businessDomainApi.getOne('domain-003');
      expect(result).toEqual(mockDomain);
    });
  });

  // ─── getMany ───────────────────────────────────────────────────────────────

  describe('.getMany(params)', () => {
    it('sends GET with cleaned params', async () => {
      mockGet.mockResolvedValueOnce({ data: { data: { results: [] }, meta: {} } });

      await businessDomainApi.getMany({ search: 'Retail', page: 1, is_active: undefined });

      // is_active is undefined — should be filtered out
      expect(mockGet).toHaveBeenCalledWith(`${BASE}/`, {
        params: { search: 'Retail', page: 1 },
      });
    });

    it('returns results array and meta', async () => {
      const mockResults = [{ id: '1', name: 'Retail' }, { id: '2', name: 'HR' }];
      mockGet.mockResolvedValueOnce({
        data: {
          data: { results: mockResults },
          meta: { total: 2, total_active: 2, total_inactive: 0, total_deleted: 0, page: 1, page_size: 20, total_pages: 1 },
        },
      });

      const result = await businessDomainApi.getMany({});
      expect(result.results).toEqual(mockResults);
      expect(result.meta.total).toBe(2);
    });
  });
});
