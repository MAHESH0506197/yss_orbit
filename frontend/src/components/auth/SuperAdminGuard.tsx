// yss_orbit\frontend\src\components\auth\SuperAdminGuard.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export function SuperAdminGuard() {
  const { isSuperAdmin } = useAuthStore();

  if (!isSuperAdmin) {
    // Redirect to home if they are not super admin
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}
