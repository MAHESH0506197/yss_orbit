// yss_orbit/frontend/src/features/organization/businessUnit/types/businessUnitTypes.ts
// ============================================================
// FULLY SYNCHRONIZED with Django BusinessUnit model.
// Last sync: 2026-07-06 (Enterprise Audit)
// Model: apps.organization.models.business_unit_model.BusinessUnit
//
// ENTERPRISE AUDIT FIXES:
//   DEFECT-05: business_domain_id is optional — it's a @property from org, not a DB column
//   DEFECT-06: Removed dead BusinessUnitIndustry enum (field deleted from model)
//   DEFECT-07: BusinessUnitMeta.industries → business_domains (matches /meta/ API)
//   MED-11:    Added cascade_deleted, roles_count; fixed business_domain_id optionality
// ============================================================

// ─── Core Interface ───────────────────────────────────────────────────────────
export interface BusinessUnit {
  // === SYSTEM (BaseModel) ===
  id: string;
  is_active: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by_id: string | null;
  deleted_reason: string;       // ENTERPRISE AUDIT: parity with BusinessDomain + Organization
  created_at: string;
  updated_at: string;
  created_by_id: string | null;
  updated_by_id: string | null;
  created_reason: string;
  updated_reason: string;

  // === RESTORE AUDIT (parity with BusinessDomain + Organization) ===
  restored_at: string | null;
  restored_by_id: string | null;
  restored_reason: string;

  // === CASCADE FLAG ===
  /** True when this BU was cascade-soft-deleted because its parent Org was archived. */
  cascade_deleted: boolean;

  // === IDENTITY ===
  organization_id: string;
  organization_name?: string;
  name: string;
  code: string;
  /**
   * DEFECT-05 FIX: business_domain_id is a computed @property on the model
   * (derived from organization.business_domain), NOT a direct DB column.
   * It is always included in API responses but must be optional in payloads.
   */
  business_domain_id?: string | null;
  business_domain_name?: string | null;
  users_count?: number;
  roles_count?: number;

  // === CONTACT ===
  email: string | null;
  phone: string | null;

  // === ADDRESS ===
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  country: string;
  pincode: string | null;

  // === COMPLIANCE / LEGAL ===
  registration_number: string | null;
  gst_number: string | null;
  pan_number: string | null;

  // === LOCALE ===
  timezone: string | null;
  currency_code: string | null;
  effective_timezone: string;
  effective_currency: string;

  // === BRANDING ===
  logo_url: string | null;
  branding_mode?: 'platform' | 'co_brand' | 'white_label';
  custom_domain?: string | null;
  domain_status?: 'pending' | 'verified' | 'failed';
  ssl_status?: 'pending' | 'active' | 'failed';

  // === REFERENCES ===
  manager_id: string | null;

  // === FLAGS ===
  is_main_branch: boolean;
}

// ─── List Response ────────────────────────────────────────────────────────────
export interface BusinessUnitListMeta {
  count: number;
  total: number;
  total_active: number;
  total_inactive: number;
  total_deleted: number;
  /** H-04 FIX: Total main branches across ALL pages (server-side aggregate, not page count). */
  total_main_branches: number;
  page: number;
  page_size: number;
  total_pages: number;
  next: string | null;
  previous: string | null;
}

export interface BusinessUnitListResponse {
  results: BusinessUnit[];
  meta: BusinessUnitListMeta;
}

// ─── Meta from /business-units/meta/ ─────────────────────────────────────────
// DEFECT-07 FIX: API returns business_domains (not industries — field deleted).
export interface BusinessDomainOption {
  id: string;
  name: string;
  code: string;
  logo_url?: string | null;
}

export interface BusinessUnitMeta {
  business_domains: BusinessDomainOption[];
  validation: {
    code_pattern: string;
    gst_pattern: string;
    pan_pattern: string;
    hex_pattern: string;
  };
}

// ─── Query Params ─────────────────────────────────────────────────────────────
export interface BusinessUnitListParams {
  search?: string;
  organization_id?: string;
  business_domain_id?: string;
  is_active?: boolean;
  is_deleted?: boolean;
  is_main_branch?: boolean;
  ordering?: string;
  page?: number;
  page_size?: number;
}

// ─── Payloads ─────────────────────────────────────────────────────────────────
export interface BusinessUnitCreatePayload {
  organization_id?: string; // Only for super-admins
  name: string;
  code: string;
  email?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  registration_number?: string;
  gst_number?: string;
  pan_number?: string;
  timezone?: string;
  currency_code?: string;
  logo_url?: string | null;
  branding_mode?: 'platform' | 'co_brand' | 'white_label';
  custom_domain?: string | null;
  domain_status?: 'pending' | 'verified' | 'failed';
  ssl_status?: 'pending' | 'active' | 'failed';
  manager_id?: string;
  is_main_branch?: boolean;
  is_active?: boolean;
  // NOTE: business_domain_id is NOT included — it is a read-only computed property.
}

export type BusinessUnitUpdatePayload = Partial<Omit<BusinessUnitCreatePayload, 'organization_id'>>;

// ─── Status Utilities ─────────────────────────────────────────────────────────
export type BusinessUnitStatus = 'active' | 'inactive' | 'deleted';

export function getBusinessUnitStatus(bu: BusinessUnit): BusinessUnitStatus {
  if (bu.is_deleted) return 'deleted';
  if (bu.is_active) return 'active';
  return 'inactive';
}
