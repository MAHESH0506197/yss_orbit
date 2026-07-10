// src/features/organization/hooks/useOrganizations.ts
// FIX-BUG12: Added useRestoreOrganization (was missing — components called API directly).
// FIX: useUpdateOrganization now invalidates detail cache after update.
// FIX: Correct envelope unwrapping for all responses.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import toast from 'react-hot-toast';
import type { Organization, OrganizationListParams } from '@/features/organization/types/organizationTypes';
import { businessDomainKeys } from '@/features/organization/businessDomain/api/useBusinessDomains';

const BASE = '/organizations';

// ─── Query key factory ────────────────────────────────────────────────────────
export const organizationKeys = {
  all:    ()           => ['organizations']                        as const,
  lists:  ()           => [...organizationKeys.all(), 'list']      as const,
  list:   (p: any)     => [...organizationKeys.lists(), p]         as const,
  detail: (id: string) => [...organizationKeys.all(), 'detail', id] as const,
  meta:   ()           => [...organizationKeys.all(), 'meta']      as const,
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface OrganizationListMeta {
  total:          number;
  total_active:   number;
  total_inactive: number;
  total_deleted:  number;
  page:           number;
  page_size:      number;
  total_pages:    number;
  next:           string | null;
  previous:       string | null;
}

export interface OrganizationListResponse {
  results: Organization[];
  meta:    OrganizationListMeta;
}

// ─── Envelope unwrappers ──────────────────────────────────────────────────────
// Backend structure: { success, data: { results: [...], count: N }, meta: { total, ... } }
function unwrapList(response: any): OrganizationListResponse {
  const envelope    = response?.data;
  const payload     = envelope?.data ?? envelope;
  const backendMeta = envelope?.meta ?? {};

  const results: Organization[] = Array.isArray(payload?.results) ? payload.results
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
      next:           payload?.next     ?? null,
      previous:       payload?.previous ?? null,
    },
  };
}

function unwrapSingle(response: any): Organization {
  const envelope = response?.data;
  return envelope?.data ?? envelope;
}

// ─── API calls ────────────────────────────────────────────────────────────────
export const organizationApi = {
  getMany: async (params: Partial<OrganizationListParams> = {}): Promise<OrganizationListResponse> => {
    const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''));
    const response = await apiClient.get(`${BASE}/`, { params: clean });
    return unwrapList(response);
  },

  getOne: async (id: string): Promise<Organization> => {
    const response = await apiClient.get(`${BASE}/${id}/`);
    return unwrapSingle(response);
  },

  create: async (payload: Partial<Organization>): Promise<Organization> => {
    const response = await apiClient.post(`${BASE}/`, payload);
    return unwrapSingle(response);
  },

  update: async (id: string, payload: Partial<Organization>): Promise<Organization> => {
    const response = await apiClient.patch(`${BASE}/${id}/`, payload);
    return unwrapSingle(response);
  },

  updateSettings: async (id: string, payload: any): Promise<any> => {
    const response = await apiClient.patch(`${BASE}/${id}/settings/`, payload);
    return unwrapSingle(response);
  },

  delete: async (id: string, reason?: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}/`, { data: { reason } });
  },

  // FIX-BUG12: restore was previously inlined in components — now properly hooked
  restore: async (id: string, reason?: string): Promise<Organization> => {
    const response = await apiClient.post(`${BASE}/${id}/restore/`, { reason });
    return unwrapSingle(response);
  },

  uploadLogo: async (id: string, file: File): Promise<string> => {
    const form = new FormData();
    form.append('logo', file);
    const response = await apiClient.post(`${BASE}/${id}/upload-logo/`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const data = response?.data?.data ?? response?.data;
    return data.logo_url as string;
  },

  /**
   * Permanently delete an organization (hard DELETE).
   * Super admin only. Org must already be archived (soft-deleted).
   * Backend requires { confirmation_name } in body matching org.name exactly.
   */
  permanentDelete: async (id: string, confirmationName: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}/?hard=true`, {
      data: { confirmation_name: confirmationName },
    });
  },
};

// ─── React Query hooks ────────────────────────────────────────────────────────
export function useOrganizations(params: Partial<OrganizationListParams> = {}) {
  return useQuery({
    queryKey:  organizationKeys.list(params),
    queryFn:   () => organizationApi.getMany(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useOrganization(id: string) {
  return useQuery({
    queryKey: organizationKeys.detail(id),
    queryFn:  () => organizationApi.getOne(id),
    enabled:  !!id,
  });
}

export function useCreateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: organizationApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: organizationKeys.all() });
      qc.invalidateQueries({ queryKey: businessDomainKeys.all() });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail
        || err?.response?.data?.message
        || 'Failed to create organization.';
      toast.error(msg);
    },
  });
}

export function useUpdateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Organization> }) =>
      organizationApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: organizationKeys.all() });
      qc.invalidateQueries({ queryKey: businessDomainKeys.all() });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Failed to update organization.');
    },
  });
}

export function useUpdateOrganizationSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      organizationApi.updateSettings(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: organizationKeys.all() });
      qc.invalidateQueries({ queryKey: ['tenant-context'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Failed to update organization settings.');
    },
  });
}

export function useDeleteOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => organizationApi.delete(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: organizationKeys.all() });
      qc.invalidateQueries({ queryKey: businessDomainKeys.all() });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Failed to archive organization.');
    },
  });
}

// FIX-BUG12: useRestoreOrganization — was entirely absent.
// Components previously called organizationApi.restore() directly,
// bypassing React Query cache invalidation entirely.
export function useRestoreOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => organizationApi.restore(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: organizationKeys.all() });
      qc.invalidateQueries({ queryKey: businessDomainKeys.all() });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Failed to restore organization.');
    },
  });
}

export function useUploadOrganizationLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      organizationApi.uploadLogo(id, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: organizationKeys.all() });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Failed to upload logo.');
    },
  });
}

/** Permanently (hard) delete an organization. Super admin only. */
export function usePermanentDeleteOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, confirmationName }: { id: string; confirmationName: string }) =>
      organizationApi.permanentDelete(id, confirmationName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: organizationKeys.all() });
      qc.invalidateQueries({ queryKey: businessDomainKeys.all() });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || 'Failed to permanently delete organization.';
      toast.error(msg);
    },
  });
}

// ─── Convenience bundle (matches BusinessDomain pattern) ─────────────────────
export function useOrganizationMutations() {
  const create       = useCreateOrganization();
  const update       = useUpdateOrganization();
  const del          = useDeleteOrganization();
  const restore      = useRestoreOrganization();
  const permanentDel = usePermanentDeleteOrganization();

  return {
    createOrg:        (payload: any) => create.mutateAsync(payload),
    updateOrg:        (id: string, payload: any) => update.mutateAsync({ id, payload }),
    deleteOrg:        (id: string, reason?: string) => del.mutateAsync({ id, reason }),
    restoreOrg:       (id: string, reason?: string) => restore.mutateAsync({ id, reason }),
    permanentDeleteOrg: (id: string, confirmationName: string) =>
      permanentDel.mutateAsync({ id, confirmationName }),
    isLoading:
      create.isPending || update.isPending || del.isPending ||
      restore.isPending || permanentDel.isPending,
    isPermanentDeleting: permanentDel.isPending,
  };
}
