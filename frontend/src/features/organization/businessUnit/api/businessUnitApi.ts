// apps/organization/businessUnit/api/businessUnitApi.ts
// ENTERPRISE AUDIT FIX: delete() and restore() now accept optional reason param (SYNC-04/05).
// ============================================================
// CRITICAL: All responses are wrapped in { success, data, meta }.
// Synchronized with BusinessUnitViewSet endpoints.
// DELETE /business-units/:id/ → soft delete internally.
// ============================================================

// 4.6 / C-2 fix: Migrated from deprecated @/api/axiosClient (localStorage Bearer tokens)
// to canonical @/api/client (HttpOnly cookies, CSRF, BU header auto-injected).
import { apiClient } from '@/api/client';
import type {
  BusinessUnit,
  BusinessUnitCreatePayload,
  BusinessUnitUpdatePayload,
  BusinessUnitListParams,
  BusinessUnitListResponse,
  BusinessUnitListMeta,
  BusinessUnitMeta,
} from '../types/businessUnitTypes';

const BASE = '/business-units';

// ─── Envelope unwrappers ──────────────────────────────────────────────────────
function unwrapSingle<T>(response: any): T {
  return response?.data?.data ?? response?.data;
}

function unwrapList(response: any): BusinessUnitListResponse {
  const envelope   = response?.data;
  const payload    = envelope?.data ?? envelope;
  const backendMeta = envelope?.meta ?? {};

  const meta: BusinessUnitListMeta = {
    count:                payload?.count                          ?? 0,
    total:                backendMeta.total                       ?? payload?.count ?? 0,
    total_active:         backendMeta.total_active                ?? 0,
    total_inactive:       backendMeta.total_inactive              ?? 0,
    total_deleted:        backendMeta.total_deleted               ?? 0,
    // H-04 FIX: total_main_branches is now computed server-side (aggregate over all pages).
    total_main_branches:  backendMeta.total_main_branches        ?? 0,
    page:                 backendMeta.page                        ?? 1,
    page_size:            backendMeta.page_size                   ?? 20,
    total_pages:          backendMeta.total_pages                 ?? (Math.ceil((payload?.count ?? 0) / 20) || 1),
    next:                 payload?.next                           ?? null,
    previous:             payload?.previous                       ?? null,
  };

  return {
    results: Array.isArray(payload?.results) ? payload.results
           : Array.isArray(payload)           ? payload
           : [],
    meta,
  };
}

// ─── API Client ───────────────────────────────────────────────────────────────
export const businessUnitApi = {

  /** GET /business-units/?search=&is_active=&page=&page_size= */
  getMany: async (params: BusinessUnitListParams = {}): Promise<BusinessUnitListResponse> => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== ''),
    );
    const response = await apiClient.get(`${BASE}/`, { params: cleanParams });
    return unwrapList(response);
  },

  /** GET /business-units/meta/ */
  getMeta: async (): Promise<BusinessUnitMeta> => {
    const response = await apiClient.get(`${BASE}/meta/`);
    return unwrapSingle<BusinessUnitMeta>(response);
  },

  /** GET /business-units/:id/ */
  getOne: async (id: string): Promise<BusinessUnit> => {
    const response = await apiClient.get(`${BASE}/${id}/`);
    return unwrapSingle<BusinessUnit>(response);
  },

  /** POST /business-units/ */
  create: async (payload: BusinessUnitCreatePayload): Promise<BusinessUnit> => {
    const response = await apiClient.post(`${BASE}/`, payload);
    return unwrapSingle<BusinessUnit>(response);
  },

  /** PATCH /business-units/:id/ */
  update: async (id: string, payload: BusinessUnitUpdatePayload): Promise<BusinessUnit> => {
    const response = await apiClient.patch(`${BASE}/${id}/`, payload);
    return unwrapSingle<BusinessUnit>(response);
  },

  /** DELETE /business-units/:id/ — REST standard, triggers soft delete internally */
  delete: async (id: string, reason?: string): Promise<void> => {
    // SYNC-04 FIX: Send reason in body so backend can record audit trail.
    await apiClient.delete(`${BASE}/${id}/`, { data: reason ? { reason } : undefined });
  },

  /** POST /business-units/:id/restore/ */
  restore: async (id: string, reason?: string): Promise<BusinessUnit> => {
    // SYNC-05 FIX: Send reason in body to match OrganizationService.restore_organization().
    const response = await apiClient.post(`${BASE}/${id}/restore/`, reason ? { reason } : {});
    return unwrapSingle<BusinessUnit>(response);
  },

  /** POST /business-units/:id/upload-logo/  (multipart/form-data, field: 'logo') */
  uploadLogo: async (id: string, file: File): Promise<string> => {
    const form = new FormData();
    form.append('logo', file);
    const response = await apiClient.post(`${BASE}/${id}/upload-logo/`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const data = unwrapSingle<{ logo_url: string }>(response);
    return data.logo_url;
  },

  /**
   * DELETE /business-units/:id/?permanent=true — hard (permanent) delete.
   * C-03 FIX: This endpoint was called in the UI but never implemented in the API client.
   * Only available to users with business_unit.permanent_delete permission.
   */
  permanentDelete: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}/`, { params: { permanent: 'true' } });
  },
};
