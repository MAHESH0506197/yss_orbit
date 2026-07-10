// yss_orbit\frontend\src\platform\context\TenantContext.tsx
/**
 * YSS Orbit — Tenant Context
 * Provides BU-scoped platform context: modules, features, settings, permissions.
 * Refreshed on BU switch via TanStack Query invalidation.
 */
import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/api/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface BusinessUnitContext {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  domain: string; // NOT "sector"
  logo_url: string | null;
  timezone: string;
  currency_code: string;
  currency_symbol: string;
}

export interface BrandConfiguration {
  branding_mode: 'platform' | 'co_brand' | 'white_label';
  logo_url: string | null;
}

interface TenantContextValue {
  businessUnit: BusinessUnitContext | null;
  branding: BrandConfiguration | null;
  subscribedModules: string[];
  subscribedFeatures: string[];
  featureFlags: Record<string, boolean>;
  settings: Record<string, string | number | boolean>;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const TenantCtx = createContext<TenantContextValue | null>(null);

interface TenantContextProviderProps {
  children: ReactNode;
}

export function TenantContextProvider({ children }: TenantContextProviderProps) {
  const { selectedBusinessUnitId, isAuthenticated } = useAuthStore();

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['tenant-context', selectedBusinessUnitId],
    queryFn: () =>
      api.get<{
        data: {
          business_unit: BusinessUnitContext;
          branding: BrandConfiguration;
          subscribed_modules: string[];
          subscribed_features: string[];
          feature_flags: Record<string, boolean>;
          settings: Record<string, string | number | boolean>;
        };
      }>('/platform/context/', {
        // @ts-ignore - custom internal config
        _disableToast: true 
      }),
    enabled: isAuthenticated && !!selectedBusinessUnitId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000,
  });

  const value: TenantContextValue = {
    businessUnit: data?.data.business_unit ?? null,
    branding: data?.data.branding ?? null,
    subscribedModules: data?.data.subscribed_modules ?? [],
    subscribedFeatures: data?.data.subscribed_features ?? [],
    featureFlags: data?.data.feature_flags ?? {},
    settings: data?.data.settings ?? {},
    isLoading,
    isError,
    refetch,
  };



  return <TenantCtx.Provider value={value}>{children}</TenantCtx.Provider>;
}

export function useTenantContext(): TenantContextValue {
  const ctx = useContext(TenantCtx);
  if (!ctx) throw new Error('useTenantContext must be used within TenantContextProvider');
  return ctx;
}
