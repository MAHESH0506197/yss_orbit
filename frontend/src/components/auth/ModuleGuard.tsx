// yss_orbit\frontend\src\components\auth\ModuleGuard.tsx
/**
 * YSS Orbit — Module Guard
 * Route-level guard that checks if a module is subscribed.
 * Shows upgrade page if not subscribed.
 */
import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useTenantContext } from '@/store/context/TenantContext';

interface ModuleGuardProps {
  module: string;
}

export function ModuleGuard({ module }: ModuleGuardProps) {
  const { subscribedModules, isLoading } = useTenantContext();

  if (isLoading) return null;

  if (!subscribedModules.includes(module)) {
    return <Navigate to={`/module-not-subscribed?module=${module}`} replace />;
  }

  return <Outlet />;
}
