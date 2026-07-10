// yss_orbit/frontend/src/modules/organization/api/organizationApi.ts
// ============================================================
// CRITICAL: All responses are wrapped in { success, data, meta }.
// This client correctly unwraps every endpoint.
// Synchronized with OrganizationViewSet endpoints.
// ============================================================

// 4.6 / C-2 fix: Migrated from deprecated @/api/axiosClient (localStorage Bearer tokens)
// to canonical @/api/client (HttpOnly cookies, CSRF, BU header auto-injected).
import { apiClient } from '@/api/client';
import type {
  Organization,
  OrganizationCreatePayload,
  OrganizationUpdatePayload,
  OrganizationListParams,
  OrganizationListResponse,
  OrganizationListMeta,
  OrganizationSettings,
  OrganizationSettingsUpdatePayload,
  OrganizationMeta,
} from '../types/organizationTypes';

const BASE = '/organizations';

// ─── Envelope Unwrappers ──────────────────────────────────────────────────────
function unwrapSingle<T>(response: any): T {
  return response?.data?.data ?? response?.data;
}

function unwrapList(response: any): OrganizationListResponse {
  const envelope = response?.data;
  // Backend returns: { success, data: { results, count, next, previous }, meta: { total, total_active, ... } }
  const payload = envelope?.data ?? envelope;
  const backendMeta = envelope?.meta ?? {};

  const meta: OrganizationListMeta = {
    count:          payload?.count       ?? 0,
    total:          backendMeta.total    ?? payload?.count ?? 0,
    total_active:   backendMeta.total_active   ?? 0,
    total_inactive: backendMeta.total_inactive ?? 0,
    total_deleted:  backendMeta.total_deleted  ?? 0,
    page:           backendMeta.page           ?? 1,
    page_size:      backendMeta.page_size      ?? 20,
    total_pages:    backendMeta.total_pages    ?? (Math.ceil((payload?.count ?? 0) / 20) || 1),
    next:           payload?.next     ?? null,
    previous:       payload?.previous ?? null,
  };

  return {
    results: Array.isArray(payload?.results) ? payload.results
           : Array.isArray(payload)          ? payload
           : [],
    meta,
  };
}

// ─── API Client ───────────────────────────────────────────────────────────────
export const organizationApi = {

  /** GET /organizations/?search=&is_active=&page=&page_size= */
  getOrganizations: async (
    params: OrganizationListParams = {},
  ): Promise<OrganizationListResponse> => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== ''),
    );
    const response = await apiClient.get(`${BASE}/`, { params: cleanParams });
    return unwrapList(response);
  },

  /** GET /organizations/meta/ */
  getOrganizationMeta: async (): Promise<OrganizationMeta> => {
    const response = await apiClient.get(`${BASE}/meta/`);
    return unwrapSingle<OrganizationMeta>(response);
  },

  /** GET /organizations/:id/ */
  getOrganization: async (id: string): Promise<Organization> => {
    const response = await apiClient.get(`${BASE}/${id}/`);
    return unwrapSingle<Organization>(response);
  },

  /** POST /organizations/ */
  createOrganization: async (payload: OrganizationCreatePayload): Promise<Organization> => {
    const response = await apiClient.post(`${BASE}/`, payload);
    return unwrapSingle<Organization>(response);
  },

  /** PATCH /organizations/:id/ */
  updateOrganization: async (
    id: string,
    payload: OrganizationUpdatePayload,
  ): Promise<Organization> => {
    const response = await apiClient.patch(`${BASE}/${id}/`, payload);
    return unwrapSingle<Organization>(response);
  },

  /** DELETE /organizations/:id/ — triggers soft-delete */
  deleteOrganization: async (id: string, reason?: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}/`, { data: { reason } });
  },

  /** POST /organizations/:id/restore/ */
  restoreOrganization: async (id: string, reason?: string): Promise<Organization> => {
    const response = await apiClient.post(`${BASE}/${id}/restore/`, { reason });
    return unwrapSingle<Organization>(response);
  },

  /** GET /organizations/:id/settings/ */
  getOrganizationSettings: async (id: string): Promise<OrganizationSettings> => {
    const response = await apiClient.get(`${BASE}/${id}/settings/`);
    return unwrapSingle<OrganizationSettings>(response);
  },

  /** PATCH /organizations/:id/settings/ */
  updateOrganizationSettings: async (
    id: string,
    payload: OrganizationSettingsUpdatePayload,
  ): Promise<OrganizationSettings> => {
    const response = await apiClient.patch(`${BASE}/${id}/settings/`, payload);
    return unwrapSingle<OrganizationSettings>(response);
  },

  /** POST /organizations/:id/upload-logo/  (multipart/form-data, field: 'logo') */
  uploadOrganizationLogo: async (id: string, file: File): Promise<string> => {
    const form = new FormData();
    form.append('logo', file);
    const response = await apiClient.post(`${BASE}/${id}/upload-logo/`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const data = unwrapSingle<{ logo_url: string }>(response);
    return data.logo_url;
  },

  /** DELETE /organizations/:id/?hard=true — hard delete */
  permanentDelete: async (id: string, confirmationName: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}/?hard=true`, {
      data: { confirmation_name: confirmationName },
    });
  },
};
