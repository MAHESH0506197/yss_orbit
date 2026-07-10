// yss_orbit\frontend\src\app\guards\PermissionGuard.tsx
/**
 * YSS Orbit — Permission Guard
 * 5.1 fix: F09 §5.11 — Real RBAC permission enforcement.
 *
 * Previous implementation: hardcoded `isSuperAdmin = true` and `userPermissions = []`
 * → EVERY route was always accessible regardless of user permissions (security bypass).
 *
 * Now: Reads real permission set from authStore (populated from login response).
 * Super admins bypass permission checks (isSuperAdmin flag from backend).
 */
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface PermissionGuardProps {
  /** Required permission codes (format: "resource.action", e.g. "organization.view") */
  requiredPermissions: string[];
  /** If true, user must have ALL permissions. If false (default), ANY is sufficient. */
  requireAll?: boolean;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  requiredPermissions,
  requireAll = true,
}) => {
  const { isAuthenticated, isSuperAdmin, permissions } = useAuthStore();

  // Must be authenticated at all
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Super admins bypass all permission checks (B07 §5.3)
  if (isSuperAdmin) {
    return <Outlet />;
  }

  // Check permissions against user's permission set
  const hasAccess = requireAll
    ? requiredPermissions.every(p => permissions.includes(p))
    : requiredPermissions.some(p => permissions.includes(p));

  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
