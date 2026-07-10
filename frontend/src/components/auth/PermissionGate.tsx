// yss_orbit\frontend\src\components\auth\PermissionGate.tsx
/**
 * YSS Orbit — PermissionGate
 * Renders children only if user has the specified permission.
 * Checks authStore.permissions — never role names.
 */
import React from 'react';
import { useAuthStore } from '@/store/authStore';

interface PermissionGateProps {
  /** Permission code e.g. "inventory.items.create" */
  permission: string;
  /** What to render if permission not held (default: null) */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGate({
  permission,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { hasPermission } = useAuthStore();
  return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
}

/** Multi-permission gate: renders if user has ALL permissions */
interface AllPermissionsGateProps {
  permissions: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function AllPermissionsGate({ permissions, fallback = null, children }: AllPermissionsGateProps) {
  const { hasAllPermissions } = useAuthStore();
  return hasAllPermissions(...permissions) ? <>{children}</> : <>{fallback}</>;
}

/** Multi-permission gate: renders if user has ANY of the permissions */
interface AnyPermissionGateProps {
  permissions: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function AnyPermissionGate({ permissions, fallback = null, children }: AnyPermissionGateProps) {
  const { hasAnyPermission } = useAuthStore();
  return hasAnyPermission(...permissions) ? <>{children}</> : <>{fallback}</>;
}
