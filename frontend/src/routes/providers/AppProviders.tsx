// yss_orbit\frontend\src\app\providers\AppProviders.tsx
import React from 'react';
import { AuthProvider } from './AuthProvider';
import { BrandingProvider } from './BrandingProvider';
import { FeatureFlagProvider } from './FeatureFlagProvider';
import { ObservabilityProvider } from './ObservabilityProvider';
import { SecurityContextProvider } from './SecurityContextProvider';
import { TenantContextProvider } from './TenantContextProvider';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrandingProvider>
      <ObservabilityProvider>
        <FeatureFlagProvider>
          <AuthProvider>
            <SecurityContextProvider>
              <TenantContextProvider>
                {children}
              </TenantContextProvider>
            </SecurityContextProvider>
          </AuthProvider>
        </FeatureFlagProvider>
      </ObservabilityProvider>
    </BrandingProvider>
  );
};
