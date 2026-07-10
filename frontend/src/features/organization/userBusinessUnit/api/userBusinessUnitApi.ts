// yss_orbit\frontend\src\features\userBusinessUnit\api\userBusinessUnitApi.ts
// FIX-BUG-UBU-API: Migrated from deprecated @/api/apiConfig (localStorage Bearer tokens,
// no CSRF, no X-Business-Unit-Id header) to canonical @/api/client (HttpOnly cookies,
// CSRF auto-injected, BU header auto-injected). Matches pattern used by organizationApi,
// businessUnitApi, businessDomainApi, and userApi.
import { apiClient } from '@/api/client';
import type {
  UserBusinessUnitMembership,
  UserBusinessUnitCreatePayload,
  UserBusinessUnitUpdatePayload,
  UserBusinessUnitFilters,
} from '../types/userBusinessUnitTypes';

const BASE = '/api/v1/user-bu-mapping/memberships';

// ─── Envelope Unwrappers ──────────────────────────────────────────────────────

export interface MembershipsListResponse {
  success: boolean;
  data: UserBusinessUnitMembership[];
  meta: {
    total: number;
    totalActive: number;
    totalInactive: number;
    total_active?: number;
    total_inactive?: number;
    count: number;
    next: string | null;
    previous: string | null;
  };
}

function unwrapList(response: any): MembershipsListResponse {
  const envelope = response?.data;         // axios wraps: response.data = server body
  const payload  = envelope?.data ?? envelope;  // server: { success, data: [...], meta: {} }
  const rawMeta  = envelope?.meta ?? {};

  const dataArr = Array.isArray(payload?.results) ? payload.results
                : Array.isArray(payload?.data)    ? payload.data
                : Array.isArray(payload)           ? payload
                : [];

  return {
    success: envelope?.success ?? true,
    data: dataArr,
    meta: {
      total:        rawMeta.total         ?? payload?.count ?? dataArr.length,
      totalActive:  rawMeta.totalActive   ?? rawMeta.total_active   ?? 0,
      totalInactive: rawMeta.totalInactive ?? rawMeta.total_inactive ?? 0,
      total_active:  rawMeta.total_active  ?? rawMeta.totalActive   ?? 0,
      total_inactive: rawMeta.total_inactive ?? rawMeta.totalInactive ?? 0,
      count:        payload?.count        ?? dataArr.length,
      next:         payload?.next         ?? null,
      previous:     payload?.previous     ?? null,
    },
  };
}

function unwrapSingle(response: any): UserBusinessUnitMembership {
  const envelope = response?.data;
  return envelope?.data ?? envelope;
}

function buildParams(filters: UserBusinessUnitFilters = {}): Record<string, string> {
  const p: Record<string, string> = {};
  if (filters.userId)        p['user_id']          = filters.userId;
  if (filters.businessUnitId) p['business_unit_id'] = filters.businessUnitId;
  if (filters.isActive !== undefined && filters.isActive !== null)
    p['is_active'] = String(filters.isActive);
  if (filters.search)   p['search']   = filters.search;
  if (filters.ordering) p['ordering'] = filters.ordering;
  return p;
}

// ─── API Client ───────────────────────────────────────────────────────────────
export const userBusinessUnitApi = {

  /** GET /user-bu-mapping/memberships/ */
  getAll: async (filters?: UserBusinessUnitFilters): Promise<MembershipsListResponse> => {
    const response = await apiClient.get(BASE + '/', { params: buildParams(filters) });
    return unwrapList(response);
  },

  /** GET /user-bu-mapping/memberships/:id/ */
  getById: async (id: string): Promise<UserBusinessUnitMembership> => {
    const response = await apiClient.get(`${BASE}/${id}/`);
    return unwrapSingle(response);
  },

  /** POST /user-bu-mapping/memberships/ */
  create: async (data: UserBusinessUnitCreatePayload): Promise<UserBusinessUnitMembership> => {
    const payload = {
      user:                 data.user,
      business_unit:        data.businessUnit,
      role:                 data.role ?? null,
      is_active_membership: data.isActiveMembership ?? true,
      effective_from:       data.effectiveFrom ?? null,
      effective_to:         data.effectiveTo   ?? null,
    };
    const response = await apiClient.post(BASE + '/', payload);
    return unwrapSingle(response);
  },

  /** PUT /user-bu-mapping/memberships/:id/ */
  update: async (id: string, data: UserBusinessUnitUpdatePayload): Promise<UserBusinessUnitMembership> => {
    const payload: Record<string, any> = {};
    if (data.role              !== undefined) payload['role']                 = data.role;
    if (data.isActiveMembership !== undefined) payload['is_active_membership'] = data.isActiveMembership;
    if (data.effectiveFrom     !== undefined) payload['effective_from']       = data.effectiveFrom;
    if (data.effectiveTo       !== undefined) payload['effective_to']         = data.effectiveTo;
    const response = await apiClient.put(`${BASE}/${id}/`, payload);
    return unwrapSingle(response);
  },

  /** PATCH /user-bu-mapping/memberships/:id/ */
  patch: async (id: string, data: UserBusinessUnitUpdatePayload): Promise<UserBusinessUnitMembership> => {
    const payload: Record<string, any> = {};
    if (data.role              !== undefined) payload['role']                 = data.role;
    if (data.isActiveMembership !== undefined) payload['is_active_membership'] = data.isActiveMembership;
    if (data.effectiveFrom     !== undefined) payload['effective_from']       = data.effectiveFrom;
    if (data.effectiveTo       !== undefined) payload['effective_to']         = data.effectiveTo;
    const response = await apiClient.patch(`${BASE}/${id}/`, payload);
    return unwrapSingle(response);
  },

  /** DELETE /user-bu-mapping/memberships/:id/ */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}/`);
  },

  /** POST /user-bu-mapping/memberships/:id/deactivate/ */
  deactivate: async (id: string): Promise<UserBusinessUnitMembership> => {
    const response = await apiClient.post(`${BASE}/${id}/deactivate/`);
    return unwrapSingle(response);
  },

  /** POST /user-bu-mapping/memberships/:id/activate/ */
  activate: async (id: string): Promise<UserBusinessUnitMembership> => {
    const response = await apiClient.post(`${BASE}/${id}/activate/`);
    return unwrapSingle(response);
  },
};
