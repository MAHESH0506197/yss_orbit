// src/features/tenancy/tenantDomains/api/tenantDomainApi.ts
import { apiClient } from '@/api/client';
import type {
  TenantDomain,
  TenantDomainCreatePayload,
  TenantDomainUpdatePayload,
  TenantDomainListParams,
  TenantDomainListResponse,
} from '../types/tenantDomainTypes';

const BASE = '/platform-admin/domains';

function unwrapSingle<T>(response: any): T {
  return response?.data?.data ?? response?.data;
}

function unwrapList(response: any): TenantDomainListResponse {
  const envelope = response?.data;
  const payload = envelope?.data ?? envelope;
  const meta = envelope?.meta ?? {};

  return {
    results: Array.isArray(payload?.results) ? payload.results : Array.isArray(payload) ? payload : [],
    meta: {
      count: payload?.count ?? 0,
      total: meta.total ?? payload?.count ?? 0,
      page: meta.page ?? 1,
      page_size: meta.page_size ?? 20,
      total_pages: meta.total_pages ?? (Math.ceil((payload?.count ?? 0) / 20) || 1),
      next: payload?.next ?? null,
      previous: payload?.previous ?? null,
    },
  };
}

export const tenantDomainApi = {
  getMany: async (params: TenantDomainListParams = {}): Promise<TenantDomainListResponse> => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== ''),
    );
    const response = await apiClient.get(`${BASE}/`, { params: cleanParams });
    return unwrapList(response);
  },

  getOne: async (id: string): Promise<TenantDomain> => {
    const response = await apiClient.get(`${BASE}/${id}/`);
    return unwrapSingle<TenantDomain>(response);
  },

  create: async (payload: TenantDomainCreatePayload): Promise<TenantDomain> => {
    const response = await apiClient.post(`${BASE}/`, payload);
    return unwrapSingle<TenantDomain>(response);
  },

  update: async (id: string, payload: TenantDomainUpdatePayload): Promise<TenantDomain> => {
    const response = await apiClient.patch(`${BASE}/${id}/`, payload);
    return unwrapSingle<TenantDomain>(response);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}/`);
  },
};
