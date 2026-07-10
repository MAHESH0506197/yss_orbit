// yss_orbit\frontend\src\components\auth\AuthGuard.tsx
/**
 * YSS Orbit — Auth Guard
 * Protects all authenticated routes. Redirects unauthenticated users to /login.
 * Handles initial session restoration on page load.
 */
import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/store/authStore';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { api } from '@/api/client';

interface MeResponse {
  success: boolean;
  data: {
    user_id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    timezone: string;
    language: string;
    avatar: string | null;
    is_super_admin: boolean;
    permissions: string[];
    allowed_business_units: Array<{
      business_unit_id: string;
      name: string;
      role_id: string | null;
      domain: string;
    }>;
  };
}

export function AuthGuard() {
  const location = useLocation();
  const { isAuthenticated, setAuth } = useAuthStore();

  // Try to restore session on first load by calling /me/
  const {
    isLoading,
    isError,
    data,
  } = useQuery({
    queryKey: ['session-restore'],
    queryFn: () => api.get<MeResponse>('/auth/me/'),
    retry: false,
    staleTime: 5 * 60 * 1000,
    enabled: !isAuthenticated, // Only run if not already authenticated
  });

  useEffect(() => {
    if (data?.data && !isAuthenticated) {
      const me = data.data;
      setAuth({
        userId: me.user_id,
        username: me.username,
        email: me.email,
        firstName: me.first_name,
        lastName: me.last_name,
        timezone: me.timezone,
        language: me.language,
        // @ts-expect-error - Auto-patched TS2322
        avatar: me.avatar,
        isSuperAdmin: me.is_super_admin,
        permissions: me.permissions,
        allowedBusinessUnits: me.allowed_business_units.map((bu: any) => ({
          business_unit_id: bu.id || bu.business_unit_id,
          name: bu.name,
          role_id: bu.role_id ?? null,
          domain: bu.code || bu.domain || '',
        })),
      });
    }
  }, [data, isAuthenticated, setAuth]);

  // While checking session
  if (isLoading && !isAuthenticated) {
    return <LoadingScreen />;
  }

  // Not authenticated — redirect to login
  if (!isAuthenticated && isError) {
    return (
      <Navigate
        to={`/login?return=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  return <Outlet />;
}
