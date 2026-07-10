// src/features/organization/types/organizationTypes.ts
// ============================================================
// ENTERPRISE AUDIT — Synchronized with Django Organization + OrganizationSettings models.
// CHANGES:
//   - Removed `slug` from Organization, payloads, and form values (field removed from model)
//   - Added `restored_at`, `restored_by_id` to Organization (audit trail)
//   - Added `business_domain_name` (method field returned by serializer)
//   - Updated OrganizationSettings.id to `string` (UUID now, was integer)
//   - Added `status` query param to OrganizationListParams
// ============================================================

// ─── OrganizationSettings ────────────────────────────────────────────────────
export interface OrganizationSettings {
  id: string; // UUID (upgraded from integer in Q3 audit)

  // Branding
  custom_domain?: string | null;
  domain_status?: 'pending' | 'verified' | 'failed';
  ssl_status?: 'pending' | 'active' | 'failed';

  // Security
  require_mfa: boolean;
  session_timeout_minutes: number;
  allowed_ip_ranges: string[];

  // Features
  enable_audit_log: boolean;
  enable_api_access: boolean;
  max_users: number | null;  // null = unlimited

  // Notifications
  notify_on_login: boolean;
  notify_on_data_export: boolean;

  // Timestamps (BaseModel)
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_deleted: boolean;
}

// ─── Organization ────────────────────────────────────────────────────────────
export interface Organization {
  // === SYSTEM (PlatformModel / BaseModel) ===
  id: string;                    // UUID
  is_active: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by_id: string | null;
  created_at: string;
  updated_at: string;
  created_by_id: string | null;
  updated_by_id: string | null;
  created_reason: string | null;
  updated_reason: string | null;

  // === RESTORE AUDIT ===
  restored_at: string | null;
  restored_by_id: string | null;
  restored_reason: string | null;
  deleted_reason: string | null;

  // === IDENTITY === (slug removed)
  name: string;
  logo_url: string | null;

  // === PLATFORM CONTACT ===
  email: string;
  phone: string;

  // === HQ ADDRESS ===
  headquarters_address_1: string;
  headquarters_address_2: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;

  // === LOCALE DEFAULTS ===
  timezone: string;
  currency_code: string;

  // === PLATFORM REFERENCES (loose FKs) ===
  owner_id: string | null;
  owner_name: string | null;
  business_domain_id: string;
  business_domain_name?: string | null; // method field

  // === ANNOTATIONS ===
  business_units_count?: number;

  // === NESTED ===
  settings?: OrganizationSettings | null;
}

// ─── List Response ────────────────────────────────────────────────────────────
export interface OrganizationListMeta {
  count?: number;
  total: number;
  total_active: number;
  total_inactive: number;
  total_deleted: number;
  page: number;
  page_size: number;
  total_pages: number;
  next: string | null;
  previous: string | null;
}

export interface OrganizationListResponse {
  results: Organization[];
  meta: OrganizationListMeta;
}

// ─── Meta / Config from /organizations/meta/ ─────────────────────────────────
export interface OrganizationMeta {
  validation: {
    slug_regex: string;
  };
}

// ─── Query Params ─────────────────────────────────────────────────────────────
export interface OrganizationListParams {
  search?: string;
  is_active?: boolean;
  is_deleted?: boolean;
  status?: 'all' | 'active' | 'inactive' | 'deleted';
  business_domain_id?: string;
  ordering?: OrganizationOrdering | string;
  page?: number;
  page_size?: number;
}

export type OrganizationOrdering =
  | 'name' | '-name'
  | 'created_at' | '-created_at'
  | 'is_active' | '-is_active';

// ─── Payloads (slug removed) ──────────────────────────────────────────────────
export interface OrganizationCreatePayload {
  name: string;
  logo_url?: string | null;
  email?: string;
  phone?: string;
  headquarters_address_1?: string;
  headquarters_address_2?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  timezone?: string;
  currency_code?: string;
  is_active?: boolean;
  owner_id?: string | null;
  business_domain_id: string;
  reason?: string;
}

export interface OrganizationUpdatePayload {
  name?: string;
  logo_url?: string | null;
  email?: string;
  phone?: string;
  headquarters_address_1?: string;
  headquarters_address_2?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  timezone?: string;
  currency_code?: string;
  is_active?: boolean;
  owner_id?: string | null;
  business_domain_id?: string;
  reason?: string;
}

export interface OrganizationSettingsUpdatePayload {
  custom_domain?: string | null;
  domain_status?: 'pending' | 'verified' | 'failed';
  ssl_status?: 'pending' | 'active' | 'failed';
  require_mfa?: boolean;
  session_timeout_minutes?: number;
  allowed_ip_ranges?: string[];
  enable_audit_log?: boolean;
  enable_api_access?: boolean;
  max_users?: number | null;
  notify_on_login?: boolean;
  notify_on_data_export?: boolean;
}

// ─── Form Values (slug removed) ───────────────────────────────────────────────
export interface OrganizationFormValues {
  name: string;
  logo_url?: string;
  is_active: boolean;
  email: string;
  phone: string;
  headquarters_address_1: string;
  headquarters_address_2: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  timezone: string;
  currency_code: string;
  business_domain_id: string;
  owner_id?: string | null;
  
  // Settings
  custom_domain?: string | null;
  require_mfa: boolean;
  session_timeout_minutes: number;
  enable_audit_log: boolean;
  enable_api_access: boolean;
  max_users?: number | null;
  notify_on_login: boolean;
  notify_on_data_export: boolean;
}

// ─── Status Utilities ─────────────────────────────────────────────────────────
export type OrganizationStatus = 'active' | 'inactive' | 'deleted';

export function getOrganizationStatus(org: Organization): OrganizationStatus {
  if (org.is_deleted) return 'deleted';
  if (org.is_active) return 'active';
  return 'inactive';
}
