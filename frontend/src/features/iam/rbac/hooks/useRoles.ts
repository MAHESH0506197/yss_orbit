// src/features/roles/hooks/useRoles.ts
// React Query hooks for the Roles & Permission Templates feature.
// All hooks are fully typed using interfaces from roleTypes.ts.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { roleApi } from '../api/roleApi';
import type {
  Role,
  RoleCreatePayload,
  RoleUpdatePayload,
  RoleListParams,
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
  StatusFilter,
} from '../types/roleTypes';

// ─────────────────────────────────────────────────────────────────────────────
// Query key factory (stable, typed, no magic strings scattered around)
// ─────────────────────────────────────────────────────────────────────────────

export const roleKeys = {
  all:          () => ['roles'] as const,
  list:         (params?: RoleListParams) => [...roleKeys.all(), 'list', params ?? {}] as const,
  detail:       (id: string) => [...roleKeys.all(), 'detail', id] as const,

  templates:    () => ['role-templates'] as const,
  templateList: (module?: string, statusFilter?: StatusFilter, includeDeleted?: boolean) =>
    [...roleKeys.templates(), module ?? '', statusFilter ?? 'active', includeDeleted ?? false] as const,

  permissions:  () => ['permissions'] as const,
  permissionList: (module?: string) => [...roleKeys.permissions(), module ?? 'all'] as const,

  modules:      () => ['rbac-modules'] as const,
  moduleList:   (includeInactive?: boolean, includeDeleted?: boolean) =>
    [...roleKeys.modules(), includeInactive ?? false, includeDeleted ?? false] as const,

  subModules:   () => ['rbac-sub-modules'] as const,
  subModuleList: (parentCode?: string, includeInactive?: boolean, includeDeleted?: boolean) =>
    [...roleKeys.subModules(), parentCode ?? 'all', includeInactive ?? false, includeDeleted ?? false] as const,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Roles
// ─────────────────────────────────────────────────────────────────────────────

export function useRoles(params?: RoleListParams) {
  return useQuery({
    queryKey: roleKeys.list(params),
    queryFn: () => roleApi.getMany(params),
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation<Role, Error, RoleCreatePayload>({
    mutationFn: roleApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleKeys.all() });
      toast.success('Role created successfully.');
    },
    onError: (err) => toast.error(`Failed to create role: ${err.message}`),
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation<Role, Error, { id: string; payload: RoleUpdatePayload }>({
    mutationFn: ({ id, payload }) => roleApi.update(id, payload),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: roleKeys.all() });
      qc.setQueryData(roleKeys.detail(updated.id), updated);
      toast.success('Role updated successfully.');
    },
    onError: (err) => toast.error(`Failed to update role: ${err.message}`),
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: roleApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleKeys.all() });
      toast.success('Role archived successfully.');
    },
    onError: (err) => toast.error(`Failed to archive role: ${err.message}`),
  });
}

export function useHardDeleteRole() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: roleApi.hardDelete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleKeys.all() });
      toast.success('Role permanently deleted.');
    },
    onError: (err) => toast.error(`Failed to permanently delete role: ${err.message}`),
  });
}

export function useRestoreRole() {
  const qc = useQueryClient();
  return useMutation<Role, Error, string>({
    mutationFn: roleApi.restore,
    onSuccess: (restored) => {
      qc.invalidateQueries({ queryKey: roleKeys.all() });
      qc.setQueryData(roleKeys.detail(restored.id), restored);
      toast.success('Role restored successfully.');
    },
    onError: (err) => toast.error(`Failed to restore role: ${err.message}`),
  });
}

export function useExportMatrix() {
  return useMutation<Blob, Error, void>({
    mutationFn: roleApi.exportMatrix,
    onSuccess: (blob) => {
      // Create a link to download the blob
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Role_Permission_Matrix.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Matrix downloaded successfully.');
    },
    onError: (err) => toast.error(`Failed to export matrix: ${err.message}`),
  });
}

export function useImportMatrix() {
  const qc = useQueryClient();
  return useMutation<{ success: boolean; roles_created: number; roles_updated: number }, Error, File>({
    mutationFn: roleApi.importMatrix,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: roleKeys.all() });
      toast.success(`Import successful! ${res.roles_created} created, ${res.roles_updated} updated.`);
    },
    onError: (err) => toast.error(`Failed to import matrix: ${err.message}`),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Permissions
// ─────────────────────────────────────────────────────────────────────────────

export function usePermissions(module?: string) {
  return useQuery<Permission[], Error>({
    queryKey: roleKeys.permissionList(module),
    queryFn: () => roleApi.getPermissions(module),
    staleTime: 10 * 60 * 1000, // permissions are stable — 10 min cache
  });
}

export function usePermissionModules() {
  return useQuery<string[], Error>({
    queryKey: [...roleKeys.permissions(), 'modules'],
    queryFn: roleApi.getPermissionModules,
    staleTime: 10 * 60 * 1000,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Role Templates
// ─────────────────────────────────────────────────────────────────────────────

export function useRoleTemplates(
  moduleCode?: string,
  statusFilter?: StatusFilter,
) {
  const includeDeleted =
    statusFilter === 'archived' || statusFilter === 'all';

  return useQuery<RoleTemplate[], Error>({
    // statusFilter is part of the key so switching active↔inactive always refetches.
    queryKey: roleKeys.templateList(moduleCode, statusFilter, includeDeleted),
    queryFn:  () => roleApi.getRoleTemplates(moduleCode, includeDeleted),
  });
}

export function useCreateRoleTemplate() {
  const qc = useQueryClient();
  return useMutation<RoleTemplate, Error, RoleTemplateCreatePayload>({
    mutationFn: roleApi.createRoleTemplate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleKeys.templates() });
      toast.success('Role template created.');
    },
    onError: (err) => toast.error(`Failed to create template: ${err.message}`),
  });
}

export function useUpdateRoleTemplate() {
  const qc = useQueryClient();
  return useMutation<RoleTemplate, Error, { id: string; payload: RoleTemplateUpdatePayload }>({
    mutationFn: ({ id, payload }) => roleApi.updateRoleTemplate(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleKeys.templates() });
      toast.success('Role template updated.');
    },
    onError: (err) => toast.error(`Failed to update template: ${err.message}`),
  });
}

export function useDeleteRoleTemplate() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: roleApi.deleteRoleTemplate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleKeys.templates() });
      toast.success('Role template archived.');
    },
    onError: (err) => toast.error(`Failed to archive template: ${err.message}`),
  });
}

export function useHardDeleteRoleTemplate() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: roleApi.hardDeleteRoleTemplate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleKeys.templates() });
      toast.success('Role template permanently deleted.');
    },
    onError: (err) => toast.error(`Failed to permanently delete template: ${err.message}`),
  });
}

export function useRestoreRoleTemplate() {
  const qc = useQueryClient();
  return useMutation<RoleTemplate, Error, string>({
    mutationFn: roleApi.restoreRoleTemplate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleKeys.templates() });
      toast.success('Role template restored.');
    },
    onError: (err) => toast.error(`Failed to restore template: ${err.message}`),
  });
}

export function useToggleRoleTemplateActive() {
  const qc = useQueryClient();
  return useMutation<RoleTemplate, Error, string>({
    mutationFn: roleApi.toggleRoleTemplateActive,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleKeys.templates() });
    },
    onError: (err) => toast.error(`Failed to toggle template status: ${err.message}`),
  });
}

export function useApplyRoleTemplate() {
  const qc = useQueryClient();
  return useMutation<Role, Error, { templateId: string; payload: any }>({
    mutationFn: ({ templateId, payload }) => roleApi.applyRoleTemplate(templateId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleKeys.all() });
    },
    onError: (err) => toast.error(`Failed to apply template: ${err.message}`),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// RBAC Modules
// ─────────────────────────────────────────────────────────────────────────────

export function useModules(includeInactive?: boolean, includeDeleted?: boolean) {
  return useQuery<RbacModule[], Error>({
    queryKey: roleKeys.moduleList(includeInactive, includeDeleted),
    queryFn:  () => roleApi.getModules(includeInactive, includeDeleted),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateModule() {
  const qc = useQueryClient();
  return useMutation<RbacModule, Error, RbacModuleCreatePayload>({
    mutationFn: roleApi.createModule,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleKeys.modules() });
      toast.success('Module created.');
    },
    onError: (err) => toast.error(`Failed to create module: ${err.message}`),
  });
}

export function useUpdateModule() {
  const qc = useQueryClient();
  return useMutation<RbacModule, Error, { id: string; payload: RbacModuleUpdatePayload }>({
    mutationFn: ({ id, payload }) => roleApi.updateModule(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleKeys.modules() });
      toast.success('Module updated.');
    },
    onError: (err) => toast.error(`Failed to update module: ${err.message}`),
  });
}

export function useArchiveModule() {
  const qc = useQueryClient();
  return useMutation<RbacModule, Error, string>({
    mutationFn: roleApi.archiveModule,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleKeys.modules() });
      toast.success('Module archived.');
    },
    onError: (err) => toast.error(`Failed to archive module: ${err.message}`),
  });
}

export function useRestoreModule() {
  const qc = useQueryClient();
  return useMutation<RbacModule, Error, string>({
    mutationFn: roleApi.restoreModule,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleKeys.modules() });
      toast.success('Module restored.');
    },
    onError: (err) => toast.error(`Failed to restore module: ${err.message}`),
  });
}

export function useHardDeleteModule() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: roleApi.hardDeleteModule,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleKeys.modules() });
      toast.success('Module permanently deleted.');
    },
    onError: (err) => toast.error(`Failed to permanently delete module: ${err.message}`),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// RBAC Sub-Modules
// ─────────────────────────────────────────────────────────────────────────────

export function useSubModules(
  parentModuleCode?: string,
  includeInactive?: boolean,
  includeDeleted?: boolean,
) {
  return useQuery<RbacSubModule[], Error>({
    queryKey: roleKeys.subModuleList(parentModuleCode, includeInactive, includeDeleted),
    queryFn:  () => roleApi.getSubModules(parentModuleCode, includeInactive, includeDeleted),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateSubModule() {
  const qc = useQueryClient();
  return useMutation<RbacSubModule, Error, RbacSubModuleCreatePayload>({
    mutationFn: roleApi.createSubModule,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleKeys.subModules() });
      toast.success('Sub-module created.');
    },
    onError: (err) => toast.error(`Failed to create sub-module: ${err.message}`),
  });
}

export function useUpdateSubModule() {
  const qc = useQueryClient();
  return useMutation<RbacSubModule, Error, { id: string; payload: RbacSubModuleUpdatePayload }>({
    mutationFn: ({ id, payload }) => roleApi.updateSubModule(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleKeys.subModules() });
      toast.success('Sub-module updated.');
    },
    onError: (err) => toast.error(`Failed to update sub-module: ${err.message}`),
  });
}

export function useArchiveSubModule() {
  const qc = useQueryClient();
  return useMutation<RbacSubModule, Error, string>({
    mutationFn: roleApi.archiveSubModule,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleKeys.subModules() });
      toast.success('Sub-module archived.');
    },
    onError: (err) => toast.error(`Failed to archive sub-module: ${err.message}`),
  });
}

export function useRestoreSubModule() {
  const qc = useQueryClient();
  return useMutation<RbacSubModule, Error, string>({
    mutationFn: roleApi.restoreSubModule,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleKeys.subModules() });
      toast.success('Sub-module restored.');
    },
  });
}

export function useHardDeleteSubModule() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: roleApi.hardDeleteSubModule,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleKeys.subModules() });
      toast.success('Sub-module permanently deleted.');
    },
    onError: (err) => toast.error(`Failed to permanently delete sub-module: ${err.message}`),
  });
}
