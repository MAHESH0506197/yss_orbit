// yss_orbit\frontend\src\core\constants\domainConstants.ts
export const DOMAINS = {
  HRMS: 'hrms',
  PLATFORM_ADMIN: 'platform_admin',
  // POS, PHARMACY removed — modules deleted 29 Jun 2026
};

export const DOMAIN_LABELS: Record<string, string> = {
  [DOMAINS.HRMS]: 'Human Resources',
  [DOMAINS.PLATFORM_ADMIN]: 'Platform Administration',
};

