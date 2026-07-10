// src/features/roles/api/roleApi.ts
// Centralised API layer for Roles, Permissions, Role Templates,
// and RBAC Module/Sub-Module taxonomy.
//
// URL contract (from apps/rbac/api/urls.py):
//   /api/v1/roles/               → RoleViewSet
//   /api/v1/permissions/         → PermissionViewSet (read-only)
//   /api/v1/user-roles/          → UserRoleViewSet
//   /api/v1/role-templates/      → RoleTemplateViewSet
//   /api/v1/rbac-modules/        → RbacModuleViewSet
//   /api/v1/rbac-sub-modules/    → RbacSubModuleViewSet
import { apiClient } from '@/api/client';
import type {
  Role,
  RoleCreatePayload,
  RoleUpdatePayload,
  RoleListParams,
  RoleListResponse,
  RoleListMeta,
  Permission,
  RoleTemplate,
  RoleTemplateCreatePayload,
  RoleTemplateUpdatePayload,
  RbacModule,
  RbacModuleCreatePayload,
  RbacModuleUpdatePayload,
  RbacSubModule,
  RbacSubModuleCreatePayload,
  RbacSubModuleUpdatePayload,
} from '../types/roleTypes';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const ROLES_URL          = '/roles/';
const PERMISSIONS_URL    = '/permissions/';
const ROLE_TEMPLATES_URL = '/role-templates/';
const RBAC_MODULES_URL   = '/rbac-modules/';
const RBAC_SUB_MODULES_URL = '/rbac-sub-modules/';

/**
 * Maximum permissions per page when fetching for the matrix.
 * The backend supports up to 500; keep a safe large value so we can
 * use the module filter and get a complete single-page result per module.
 */
const PERMISSIONS_PAGE_SIZE = 500;

// ─────────────────────────────────────────────────────────────────────────────
// Response envelope helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Unwrap paginated list response: { data: { results, meta } } | DRF default */
function unwrapList(response: unknown): RoleListResponse {
  const envelope = (response as any)?.data;
  const payload  = envelope?.data ?? envelope;
  const backendMeta = envelope?.meta ?? {};

  const meta: RoleListMeta = {
    count:       payload?.count      ?? 0,
    total:       backendMeta.total   ?? payload?.count ?? 0,
    system:      backendMeta.system  ?? 0,
    custom:      backendMeta.custom  ?? 0,
    page:        backendMeta.page    ?? 1,
    page_size:   backendMeta.page_size ?? 20,
    total_pages: backendMeta.total_pages ?? (Math.ceil((payload?.count ?? 0) / 20) || 1),
    next:        payload?.next       ?? null,
    previous:    payload?.previous   ?? null,
  };

  return {
    results: Array.isArray(payload?.results)
      ? payload.results
      : Array.isArray(payload) ? payload : [],
    meta,
  };
}

/** Unwrap single-object response: { data: { ...obj } } | { ...obj } */
function unwrapSingle<T>(response: unknown): T {
  const envelope = (response as any)?.data;
  return (envelope?.data ?? envelope) as T;
}

/** Unwrap a plain array response. */
function unwrapArray<T>(response: unknown): T[] {
  const envelope = (response as any)?.data;
  const payload  = envelope?.data ?? envelope;
  if (Array.isArray(payload?.results)) return payload.results as T[];
  if (Array.isArray(payload))          return payload as T[];
  return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Roles API
// ─────────────────────────────────────────────────────────────────────────────

export const roleApi = {
  // ── Roles ──────────────────────────────────────────────────────────────────

  getMany: async (params?: RoleListParams): Promise<RoleListResponse> => {
    const response = await apiClient.get(ROLES_URL, { params });
    return unwrapList(response);
  },

  getOne: async (id: string): Promise<Role> => {
    const response = await apiClient.get(`${ROLES_URL}${id}/`);
    return unwrapSingle<Role>(response);
  },

  create: async (payload: RoleCreatePayload): Promise<Role> => {
    const response = await apiClient.post(ROLES_URL, payload);
    return unwrapSingle<Role>(response);
  },

  update: async (id: string, payload: RoleUpdatePayload): Promise<Role> => {
    const response = await apiClient.patch(`${ROLES_URL}${id}/`, payload);
    return unwrapSingle<Role>(response);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`${ROLES_URL}${id}/`);
  },

  hardDelete: async (id: string): Promise<void> => {
    await apiClient.delete(`${ROLES_URL}${id}/?hard=true`);
  },

  restore: async (id: string): Promise<Role> => {
    const response = await apiClient.post(`${ROLES_URL}${id}/restore/`);
    return unwrapSingle<Role>(response);
  },

  exportMatrix: async (): Promise<Blob> => {
    const response = await apiClient.get(`${ROLES_URL}export-matrix/`, {
      responseType: 'blob',
    });
    return response.data;
  },

  importMatrix: async (file: File): Promise<{ success: boolean; roles_created: number; roles_updated: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(`${ROLES_URL}import-matrix/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return unwrapSingle(response);
  },

  // ── Permissions ────────────────────────────────────────────────────────────

  /**
   * Fetch all active permissions, optionally filtered by module.
   * Uses a large page_size to ensure a single-page result.
   * For very large catalogues, callers should pass module to stay focused.
   */
  getPermissions: async (module?: string): Promise<Permission[]> => {
    const params: Record<string, string | number> = { page_size: PERMISSIONS_PAGE_SIZE };
    if (module) params.module = module;
    const response = await apiClient.get(PERMISSIONS_URL, { params });
    return unwrapArray<Permission>(response);
  },

  /** Returns the distinct list of module strings for grouping the permission matrix. */
  getPermissionModules: async (): Promise<string[]> => {
    const response = await apiClient.get(`${PERMISSIONS_URL}modules/`);
    const data = (response as any).data?.data ?? (response as any).data;
    return Array.isArray(data) ? (data as string[]) : [];
  },

  // ── Role Templates ─────────────────────────────────────────────────────────

  getRoleTemplates: async (
    moduleCode?: string,
    includeDeleted?: boolean,
  ): Promise<RoleTemplate[]> => {
    const params: Record<string, string> = {};
    if (moduleCode)     params.module_code     = moduleCode;
    if (includeDeleted) params.include_deleted = 'true';
    const response = await apiClient.get(ROLE_TEMPLATES_URL, { params });
    return unwrapArray<RoleTemplate>(response);
  },

  createRoleTemplate: async (payload: RoleTemplateCreatePayload): Promise<RoleTemplate> => {
    const response = await apiClient.post(ROLE_TEMPLATES_URL, payload);
    return unwrapSingle<RoleTemplate>(response);
  },

  updateRoleTemplate: async (
    id: string,
    payload: RoleTemplateUpdatePayload,
  ): Promise<RoleTemplate> => {
    const response = await apiClient.patch(`${ROLE_TEMPLATES_URL}${id}/`, payload);
    return unwrapSingle<RoleTemplate>(response);
  },

  deleteRoleTemplate: async (id: string): Promise<void> => {
    await apiClient.delete(`${ROLE_TEMPLATES_URL}${id}/`);
  },

  hardDeleteRoleTemplate: async (id: string): Promise<void> => {
    await apiClient.delete(`${ROLE_TEMPLATES_URL}${id}/?hard=true`);
  },

  restoreRoleTemplate: async (id: string): Promise<RoleTemplate> => {
    const response = await apiClient.post(`${ROLE_TEMPLATES_URL}${id}/restore/`);
    return unwrapSingle<RoleTemplate>(response);
  },

  toggleRoleTemplateActive: async (id: string): Promise<RoleTemplate> => {
    const response = await apiClient.post(`${ROLE_TEMPLATES_URL}${id}/toggle_active/`);
    return unwrapSingle<RoleTemplate>(response);
  },

  applyRoleTemplate: async (id: string, payload: any): Promise<Role> => {
    const response = await apiClient.post(`${ROLE_TEMPLATES_URL}${id}/apply_to_bu/`, payload);
    return unwrapSingle<Role>(response);
  },

  // ── RBAC Modules ───────────────────────────────────────────────────────────

  getModules: async (
    includeInactive?: boolean,
    includeDeleted?: boolean,
  ): Promise<RbacModule[]> => {
    const params: Record<string, string> = {};
    if (includeInactive) params.include_inactive = 'true';
    if (includeDeleted)  params.include_deleted  = 'true';
    const response = await apiClient.get(RBAC_MODULES_URL, { params });
    return unwrapArray<RbacModule>(response);
  },

  createModule: async (payload: RbacModuleCreatePayload): Promise<RbacModule> => {
    const response = await apiClient.post(RBAC_MODULES_URL, payload);
    return unwrapSingle<RbacModule>(response);
  },

  updateModule: async (id: string, payload: RbacModuleUpdatePayload): Promise<RbacModule> => {
    const response = await apiClient.patch(`${RBAC_MODULES_URL}${id}/`, payload);
    return unwrapSingle<RbacModule>(response);
  },

  archiveModule: async (id: string): Promise<RbacModule> => {
    const response = await apiClient.post(`${RBAC_MODULES_URL}${id}/archive/`);
    return unwrapSingle<RbacModule>(response);
  },

  restoreModule: async (id: string): Promise<RbacModule> => {
    const response = await apiClient.post(`${RBAC_MODULES_URL}${id}/restore/`);
    return unwrapSingle<RbacModule>(response);
  },

  hardDeleteModule: async (id: string): Promise<void> => {
    await apiClient.delete(`${RBAC_MODULES_URL}${id}/?hard=true`);
  },

  // ── RBAC Sub-Modules ───────────────────────────────────────────────────────

  getSubModules: async (
    parentModuleCode?: string,
    includeInactive?: boolean,
    includeDeleted?: boolean,
  ): Promise<RbacSubModule[]> => {
    const params: Record<string, string> = {};
    if (parentModuleCode) params.parent_module_code = parentModuleCode;
    if (includeInactive)  params.include_inactive   = 'true';
    if (includeDeleted)   params.include_deleted    = 'true';
    const response = await apiClient.get(RBAC_SUB_MODULES_URL, { params });
    return unwrapArray<RbacSubModule>(response);
  },

  createSubModule: async (payload: RbacSubModuleCreatePayload): Promise<RbacSubModule> => {
    const response = await apiClient.post(RBAC_SUB_MODULES_URL, payload);
    return unwrapSingle<RbacSubModule>(response);
  },

  updateSubModule: async (
    id: string,
    payload: RbacSubModuleUpdatePayload,
  ): Promise<RbacSubModule> => {
    const response = await apiClient.patch(`${RBAC_SUB_MODULES_URL}${id}/`, payload);
    return unwrapSingle<RbacSubModule>(response);
  },

  archiveSubModule: async (id: string): Promise<RbacSubModule> => {
    const response = await apiClient.post(`${RBAC_SUB_MODULES_URL}${id}/archive/`);
    return unwrapSingle<RbacSubModule>(response);
  },

  restoreSubModule: async (id: string): Promise<RbacSubModule> => {
    const response = await apiClient.post(`${RBAC_SUB_MODULES_URL}${id}/restore/`);
    return unwrapSingle<RbacSubModule>(response);
  },

  hardDeleteSubModule: async (id: string): Promise<void> => {
    await apiClient.delete(`${RBAC_SUB_MODULES_URL}${id}/?hard=true`);
  },
};
