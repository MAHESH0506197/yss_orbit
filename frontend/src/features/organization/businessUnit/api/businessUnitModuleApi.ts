// src/features/organization/businessUnit/api/businessUnitModuleApi.ts
// New API client for BusinessUnitModule subscription/access management
// (IMPLEMENTATION_PLAN.md items 3 & 4).
//
// Uses @/api/client (the architecturally correct HttpOnly-cookie client)
// NOT the legacy @/api/apiConfig (BUG-40 tracker: 34 legacy files still
// use apiConfig — those are NOT migrated in this session as it's out of
// scope; any NEW code uses client).
import { apiClient } from '@/api/client';

// ─── Types ──────────────────────────────────────────────────────────────────

export type ModuleCategory = 'CORE' | 'HRMS' | 'BUSINESS' | 'FINANCE' | 'ANALYTICS' | 'INTEGRATIONS';

export interface PlatformModule {
  id: string;
  code: string;
  name: string;
  description: string;
  category: ModuleCategory;
  icon: string;        // Lucide icon name, e.g. "Users", "Package"
  is_active: boolean;
  is_free: boolean;
  sort_order: number;
  depends_on: string[]; // List of module codes this one requires
}

export type ModuleStatus = 'active' | 'trial' | 'suspended' | 'expired' | 'not_subscribed';

export interface BusinessUnitModule {
  id: string | null;           // null = not yet activated (synthetic entry from backend list)
  business_unit_id: string;
  module: PlatformModule;
  status: ModuleStatus;
  is_active: boolean;          // computed: status===active/trial AND not expired
  plan_limit: Record<string, unknown>;
  trial_ends_at: string | null;
  activated_at: string | null;
  expires_at: string | null;
  activated_by_id: string | null;
}

export interface ActivateModulePayload {
  module_code: string;
  status?: 'active' | 'trial';
  trial_ends_at?: string | null;
  plan_limit?: Record<string, unknown>;
}

export interface SetPlanLimitPayload {
  module_code: string;
  plan_limit: Record<string, unknown>;
}

// ─── API client ─────────────────────────────────────────────────────────────

const BASE = '/api/v1/business-units/modules';

function buParam(businessUnitId: string): string {
  return `?business_unit_id=${businessUnitId}`;
}

function extract<T>(response: { data: unknown }): T {
  // Backend StandardPagination + SuccessResponse shape:
  //   { success, data: [...], message, meta }
  const payload = response.data as Record<string, unknown>;
  if (payload?.data !== undefined) return payload.data as T;
  return payload as T;
}

export const businessUnitModuleApi = {
  /** Returns all 18 modules for this BU (active rows + synthetic not_subscribed entries). */
  list: async (businessUnitId: string): Promise<BusinessUnitModule[]> => {
    const response = await apiClient.get(`${BASE}/${buParam(businessUnitId)}`);
    const data = extract<BusinessUnitModule[]>(response);
    return Array.isArray(data) ? data : [];
  },

  /** Activate (or re-activate) a module. */
  activate: async (businessUnitId: string, payload: ActivateModulePayload): Promise<BusinessUnitModule> => {
    const response = await apiClient.post(`${BASE}/activate/${buParam(businessUnitId)}`, payload);
    return extract<BusinessUnitModule>(response);
  },

  /** Deactivate (suspend) a module. */
  deactivate: async (businessUnitId: string, moduleCode: string): Promise<BusinessUnitModule> => {
    const response = await apiClient.post(`${BASE}/deactivate/${buParam(businessUnitId)}`, { module_code: moduleCode });
    return extract<BusinessUnitModule>(response);
  },

  /** Set a custom plan_limit override for a module on this BU. */
  setPlanLimit: async (businessUnitId: string, payload: SetPlanLimitPayload): Promise<BusinessUnitModule> => {
    const response = await apiClient.post(`${BASE}/set-plan-limit/${buParam(businessUnitId)}`, payload);
    return extract<BusinessUnitModule>(response);
  },
};
