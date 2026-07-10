// yss_orbit\frontend\src\core\branding\brandingContext.ts
import { createContext } from 'react';

export type BrandingMode = 'platform' | 'co_brand' | 'white_label';

export interface PublicTenantConfig {
  found: boolean;
  logo_url?: string;
  mode?: BrandingMode;
}

export interface BrandingContextType {
  config: PublicTenantConfig | null;
  isLoading: boolean;
  error: string | null;
}

export const BrandingContext = createContext<BrandingContextType>({
  config: null,
  isLoading: true,
  error: null,
});
