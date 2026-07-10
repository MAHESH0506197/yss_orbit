// yss_orbit\frontend\src\shared\hooks\useBrandingContext.ts
import { useContext } from 'react';
import { BrandingContext, BrandingContextType } from '@/utils/core/branding/brandingContext';

export const useBrandingContext = (): BrandingContextType => {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBrandingContext must be used within a BrandingProvider');
  }
  return context;
};
