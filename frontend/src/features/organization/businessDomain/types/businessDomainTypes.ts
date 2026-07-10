// src/features/organization/businessDomain/types/businessDomainTypes.ts
// Complete type definitions for the BusinessDomain module.
// Synced with backend BusinessDomainSerializer fields.

export interface BusinessDomain {
  id:          string;
  name:        string;
  code:        string;
  description: string;
  logo_url:    string | null;
  is_active:   boolean;
  is_deleted:  boolean;
  created_at:  string;
  updated_at:  string;
  created_by_id: string | null;
  created_reason: string | null;
  updated_by_id: string | null;
  updated_reason: string | null;
  deleted_at:    string | null;
  deleted_by_id: string | null;
  deleted_reason: string | null;
  restored_at:   string | null;
  restored_by_id: string | null;
  restored_reason: string | null;
  // Annotated fields (added by backend serializer via annotations)
  business_units_count?: number;
  organizations_count?: number;
  active_users_count?: number;
}

export interface BusinessDomainListParams {
  search?:    string;
  is_active?: boolean;
  status?:    'all' | 'active' | 'inactive' | 'deleted';
  ordering?:  string;
  page?:      number;
  page_size?: number;
  is_deleted?: boolean;
}

/**
 * BusinessDomainFormValues — matches the Zod schema exactly.
 * FIX: removed stale `icon: string` field; added `logo_url` to match form + schema.
 * Note: the Zod schema also exports this type via z.infer — prefer using
 * the schema's exported type to avoid drift.
 */
export interface BusinessDomainFormValues {
  name:        string;
  code:        string;
  description: string;
  logo_url:    string | null | undefined;
  is_active:   boolean;
  reason?:     string; // Added for audit trail
}

