// yss_orbit\frontend\src\app\guards\DomainGuard.tsx
/**
 * YSS Orbit — Domain Guard
 * 5.2 fix: F09 §5.11 — Real domain-based access control.
 *
 * Previous: hardcoded `isLicensed = true` — all domain routes always accessible.
 * Now: checks that the user's selected BU has the required domain.
 * Super admins bypass all domain restrictions (B07 §5.3).
 *
 * Domain is the BU's specialization (e.g. 'hrms', 'pos', 'pharmacy').
 * Set by the backend in allowed_business_units[].domain from login response.
 */
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface DomainGuardProps {
  /** The domain code required to access this route (e.g. 'hrms', 'pos', 'pharmacy') */
  domain: string;
}

export const DomainGuard: React.FC<DomainGuardProps> = ({ domain }) => {
  const { isAuthenticated, isSuperAdmin, selectedBusinessUnitId, allowedBusinessUnits } = useAuthStore();

  // Must be authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Super admins have global access (B07 §5.3)
  if (isSuperAdmin) {
    return <Outlet />;
  }

  // Find the selected BU and check its domain
  const selectedBU = allowedBusinessUnits.find(
    (bu) => bu.business_unit_id === selectedBusinessUnitId
  );

  // No BU selected yet → redirect to selection
  if (!selectedBU) {
    return <Navigate to="/select-business-unit" replace />;
  }

  // BU domain must match the required domain
  const isLicensed = selectedBU.domain === domain;

  if (!isLicensed) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
