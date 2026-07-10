// yss_orbit\frontend\src\design_system\themes\tenantTheme.ts
import { baseTheme } from './baseTheme';

export const generateTenantTheme = (tenantConfig: any) => {
  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: tenantConfig.primaryColor || baseTheme.colors.primary,
      secondary: tenantConfig.secondaryColor || baseTheme.colors.secondary,
    }
  };
};
