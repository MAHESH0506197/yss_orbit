// src/features/roles/types/roleTypes.ts
// Canonical TypeScript types for the Roles & Permission Templates feature.
// All API response shapes are defined here; no 'any' is permitted in
// consuming components. Update this file when the backend serializers change.

// ─────────────────────────────────────────────────────────────────────────────
// Core entity types (mirror backend serializers exactly)
// ─────────────────────────────────────────────────────────────────────────────

/** Immutable permission entry seeded by sync_rbac. */
export interface Permission {
  id: string;
  code: string;
  name: string;
  description: string;
  module: string;
  is_active: boolean;
  created_at: string;
}

/** Business-unit-scoped role (SYSTEM or CUSTOM). */
export interface Role {
  id: string;
  name: string;
  description: string;
  department_name?: string | null;
  module_code: string | null;
  role_type: 'SYSTEM' | 'CUSTOM';
  is_default: boolean;
  is_active: boolean;
  is_deleted: boolean;
  permissions: string[]; // List of Permission UUIDs
  business_unit_id: string;
  source_template_id?: string | null;
  source_template_name?: string | null;
  created_at: string;
  updated_at: string;
  created_by_id: string | null;
  updated_by_id: string | null;
  deleted_at: string | null;
  deleted_by_id: string | null;
}

/** Platform-level role template (blueprint for BU roles). */
export interface RoleTemplate {
  id: string;
  module_code: string;
  name: string;
  description: string;
  /** Full permission objects (expanded by to_representation in serializer). */
  permissions: Permission[];
  is_active: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
}

/** Top-level module taxonomy grouping (e.g. "HR & Payroll"). */
export interface RbacModule {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  is_active: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Second-level taxonomy inside an RbacModule (e.g. "Payroll", "Attendance"). */
export interface RbacSubModule {
  id: string;
  code: string;
  /** UUID — write-only field when creating (set parent_module_id). */
  parent_module_id?: string;
  /** Code of the parent module — read-only, returned by serializer. */
  parent_module_code: string;
  title: string;
  description: string;
  is_active: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Payload types (what we SEND to the API)
// ─────────────────────────────────────────────────────────────────────────────

export type RoleCreatePayload = {
  name: string;
  description?: string;
  department_name?: string | null;
  business_unit_id: string;
  module_code?: string;
  is_default?: boolean;
  permissions?: string[]; // Permission UUIDs
};

export type RoleUpdatePayload = Partial<RoleCreatePayload>;

export type RoleTemplateCreatePayload = {
  name: string;
  module_code: string;
  description?: string;
  permissions?: string[]; // Permission UUIDs
};

export type RoleTemplateUpdatePayload = Partial<RoleTemplateCreatePayload>;

export type RbacModuleCreatePayload = {
  code: string;
  title: string;
  description?: string;
  icon?: string;
  is_active?: boolean;
};

export type RbacModuleUpdatePayload = Partial<Omit<RbacModuleCreatePayload, 'code'>>;

export type RbacSubModuleCreatePayload = {
  code: string;
  parent_module_id: string;
  title: string;
  description?: string;
  is_active?: boolean;
};

export type RbacSubModuleUpdatePayload = Partial<Omit<RbacSubModuleCreatePayload, 'code' | 'parent_module_id'>>;

// ─────────────────────────────────────────────────────────────────────────────
// List / pagination types
// ─────────────────────────────────────────────────────────────────────────────

export interface RoleListParams {
  page?: number;
  page_size?: number;
  search?: string;
  role_type?: 'SYSTEM' | 'CUSTOM';
  is_active?: boolean;
  business_unit_id?: string;
  module_code?: string;
  is_deleted?: boolean | string;
}

export interface RoleListMeta {
  count: number;
  total: number;
  total_pages: number;
  page: number;
  page_size: number;
  system: number;
  custom: number;
  next: string | null;
  previous: string | null;
}

export interface RoleListResponse {
  results: Role[];
  meta: RoleListMeta;
}

export type StatusFilter = 'all' | 'active' | 'inactive' | 'archived';
export type SearchScope = 'domains' | 'submodules' | 'roles';
