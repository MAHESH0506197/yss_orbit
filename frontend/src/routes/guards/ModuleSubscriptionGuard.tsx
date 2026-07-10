// yss_orbit\frontend\src\app\guards\ModuleSubscriptionGuard.tsx
/**
 * YSS Orbit — Module Subscription Guard
 * 5.3 fix: F09 §5.11, E04 — Real module subscription access control.
 *
 * Previous: hardcoded `hasAccess = true` — every module always accessible.
 * Now: Checks for a module-level permission code in the user's permissions.
 *
 * Permission format: 'module.{moduleCode}.access'
 * Examples: 'module.hrms_core.access', 'module.pos_core.access'
 *
 * These permissions are granted at the BU level when a BU subscribes to a module.
 * Super admins bypass all module checks (B07 §5.3).
 *
 * NOTE: When the full Module Registry (E04) is implemented, replace the
 * permission check with a real subscription query from the module registry API.
 */
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface ModuleSubscriptionGuardProps {
  /** Module code to check subscription for (e.g. 'hrms_core', 'pos_core') */
  moduleCode: string;
}

export const ModuleSubscriptionGuard: React.FC<ModuleSubscriptionGuardProps> = ({ moduleCode }) => {
  const { isAuthenticated, isSuperAdmin, selectedBusinessUnitId, hasPermission } = useAuthStore();

  // Must be authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Super admins have global module access (B07 §5.3)
  if (isSuperAdmin) {
    return <Outlet />;
  }

  // Must have a BU selected to determine module access
  if (!selectedBusinessUnitId) {
    return <Navigate to="/select-business-unit" replace />;
  }

  // Check for module access permission
  // Convention: module.{moduleCode}.access permission granted when BU subscribes to module
  const hasAccess = hasPermission(`module.${moduleCode}.access`);

  if (!hasAccess) {
    return <Navigate to="/module-not-available" replace />;
  }

  return <Outlet />;
};
