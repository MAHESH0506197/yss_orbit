// yss_orbit\frontend\src\core\types\tenantTypes.ts
export interface Tenant {
  id: string;
  name: string;
  domain: string;
  isActive: boolean;
  settings: Record<string, any>;
}
