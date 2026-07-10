// src/features/organization/businessDomain/api/useBusinessDomains.ts
// FIX-BUG11: Correct response envelope unwrapping.
// Previously accessed response.data.results directly — missed the
// { success, data: { results, meta }, meta } envelope structure.
// Also adds useBusinessDomainMutations export needed by BusinessDomainPage.
// v2.0: Added permanentDelete API call + usePermanentDeleteBusinessDomain hook.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import toast from 'react-hot-toast';
import type { BusinessDomain, BusinessDomainListParams } from '@/features/organization/businessDomain/types/businessDomainTypes';
import { organizationKeys } from '@/features/organization/hooks/useOrganizations';

const BASE = '/business-domains';

// ─── Query key factory ────────────────────────────────────────────────────────
export const businessDomainKeys = {
  all:    ()           => ['businessDomains']                      as const,
  lists:  ()           => [...businessDomainKeys.all(), 'list']    as const,
  list:   (p: any)     => [...businessDomainKeys.lists(), p]       as const,
  detail: (id: string) => [...businessDomainKeys.all(), 'detail', id] as const,
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface BusinessDomainListResponse {
  results: BusinessDomain[];
  meta: {
    total:          number;
    total_active:   number;
    total_inactive: number;
    total_deleted:  number;
    page:           number;
    page_size:      number;
    total_pages:    number;
  };
}

// ─── FIX-BUG11: Envelope unwrapper ───────────────────────────────────────────
// Backend wraps all responses as:
// { success: true, data: { results: [...], count: N, ... }, meta: { total, ... } }
// Previously this was accessed as response.data.results (wrong — one level too shallow).
function unwrapList(response: any): BusinessDomainListResponse {
  const envelope   = response?.data;          // axios wraps: response.data = server body
  const payload    = envelope?.data ?? envelope;   // server body: { data: { results } } or just { results }
  const backendMeta = envelope?.meta ?? {};

  const results: BusinessDomain[] = Array.isArray(payload?.results) ? payload.results
    : Array.isArray(payload) ? payload
    : [];

  return {
    results,
    meta: {
      total:          backendMeta.total          ?? payload?.count ?? results.length,
      total_active:   backendMeta.total_active   ?? 0,
      total_inactive: backendMeta.total_inactive ?? 0,
      total_deleted:  backendMeta.total_deleted  ?? 0,
      page:           backendMeta.page           ?? 1,
      page_size:      backendMeta.page_size      ?? 20,
      total_pages:    (backendMeta.total_pages    ?? Math.ceil((payload?.count ?? results.length) / 20)) || 1,
    },
  };
}

function unwrapSingle(response: any): BusinessDomain {
  const envelope = response?.data;
  return envelope?.data ?? envelope;
}

// ─── API calls ────────────────────────────────────────────────────────────────
export const businessDomainApi = {
  getMany: async (params: Partial<BusinessDomainListParams> = {}): Promise<BusinessDomainListResponse> => {
    const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''));
    const response = await apiClient.get(`${BASE}/`, { params: clean });
    return unwrapList(response);
  },

  getOne: async (id: string): Promise<BusinessDomain> => {
    const response = await apiClient.get(`${BASE}/${id}/`);
    return unwrapSingle(response);
  },

  create: async (payload: Partial<BusinessDomain>): Promise<BusinessDomain> => {
    const response = await apiClient.post(`${BASE}/`, payload);
    return unwrapSingle(response);
  },

  update: async (id: string, payload: Partial<BusinessDomain>): Promise<BusinessDomain> => {
    const response = await apiClient.patch(`${BASE}/${id}/`, payload);
    return unwrapSingle(response);
  },

  delete: async (id: string, reason?: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}/`, { data: { reason } });
  },

  /**
   * Permanently delete a domain (hard DELETE).
   * Only callable by super admins.
   * Backend requires { confirmation_name } in the request body matching domain.name exactly.
   */
  permanentDelete: async (id: string, confirmationName: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}/?hard=true`, {
      data: { confirmation_name: confirmationName },
    });
  },

  restore: async (id: string, reason?: string): Promise<BusinessDomain> => {
    const response = await apiClient.post(`${BASE}/${id}/restore/`, { reason });
    return unwrapSingle(response);
  },
};

// ─── React Query hooks ────────────────────────────────────────────────────────
export function useBusinessDomains(params: Partial<BusinessDomainListParams> = {}) {
  return useQuery({
    queryKey:  businessDomainKeys.list(params),
    queryFn:   () => businessDomainApi.getMany(params),
    staleTime: 5 * 60 * 1000, // domains change infrequently
  });
}

export function useBusinessDomain(id: string) {
  return useQuery({
    queryKey: businessDomainKeys.detail(id),
    queryFn:  () => businessDomainApi.getOne(id),
    enabled:  !!id,
  });
}

export function useCreateBusinessDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: businessDomainApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: businessDomainKeys.all() });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Failed to create domain.');
    },
  });
}

export function useUpdateBusinessDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<BusinessDomain> }) =>
      businessDomainApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: businessDomainKeys.all() });
      qc.invalidateQueries({ queryKey: organizationKeys.all() });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Failed to update domain.');
    },
  });
}

export function useDeleteBusinessDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => businessDomainApi.delete(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: businessDomainKeys.all() });
      qc.invalidateQueries({ queryKey: organizationKeys.all() });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Failed to archive domain.');
    },
  });
}

/** Permanently (hard) delete a business domain. Super admin only. */
export function usePermanentDeleteBusinessDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, confirmationName }: { id: string; confirmationName: string }) =>
      businessDomainApi.permanentDelete(id, confirmationName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: businessDomainKeys.all() });
      qc.invalidateQueries({ queryKey: organizationKeys.all() });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || 'Failed to permanently delete domain.';
      toast.error(msg);
    },
  });
}

export function useRestoreBusinessDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => businessDomainApi.restore(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: businessDomainKeys.all() });
      qc.invalidateQueries({ queryKey: organizationKeys.all() });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Failed to restore domain.');
    },
  });
}

// ─── Convenience bundle used by BusinessDomainPage ────────────────────────────
// Exposes simple async functions so the page doesn't need to unwrap mutation objects.
export function useBusinessDomainMutations() {
  const create        = useCreateBusinessDomain();
  const update        = useUpdateBusinessDomain();
  const del           = useDeleteBusinessDomain();
  const restore       = useRestoreBusinessDomain();
  const permanentDel  = usePermanentDeleteBusinessDomain();

  return {
    createDomain:        (payload: Partial<BusinessDomain>) => create.mutateAsync(payload),
    updateDomain:        (id: string, payload: Partial<BusinessDomain>) => update.mutateAsync({ id, payload }),
    deleteDomain:        ({ id, reason }: { id: string; reason?: string }) => del.mutateAsync({ id, reason }),
    restoreDomain:       ({ id, reason }: { id: string; reason?: string }) => restore.mutateAsync({ id, reason }),
    permanentDeleteDomain: (id: string, confirmationName: string) =>
      permanentDel.mutateAsync({ id, confirmationName }),
    isLoading:
      create.isPending || update.isPending || del.isPending ||
      restore.isPending || permanentDel.isPending,
    isPermanentDeleting: permanentDel.isPending,
  };
}


