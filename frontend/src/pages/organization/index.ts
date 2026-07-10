// yss_orbit/frontend/src/modules/organization/index.ts
// Public API for the organization module.
// Import only from this barrel inside other modules.

// Types
export type {
  Organization,
  OrganizationSettings,
  OrganizationListResponse,
  OrganizationListMeta,
  OrganizationListParams,
  OrganizationCreatePayload,
  OrganizationUpdatePayload,
  OrganizationSettingsUpdatePayload,
  OrganizationFormValues,
  OrganizationStatus,
  OrganizationOrdering,
  OrganizationMeta,
} from '@/features/organization/types/organizationTypes';
export { getOrganizationStatus } from '@/features/organization/types/organizationTypes';

// API
export { organizationApi } from '@/features/organization/api/organizationApi';

// Hooks
export {
  organizationKeys,
  useOrganizations,
  useOrganization,
  useOrganizations as useOrganizationSettings,
  useOrganizations as useOrganizationMeta,
  useCreateOrganization,
  useUpdateOrganization,
  useDeleteOrganization,
  useRestoreOrganization,
  useUpdateOrganization as useUpdateOrganizationSettings,
  useUploadOrganizationLogo,
} from '@/features/organization/hooks/useOrganizations' /* @ts-ignore */;

// State
export { useOrganizationUIStore } from '@/features/organization/state/organizationSlice';

// Helpers
export {
  generateSlug,
  getOrgInitials,
  getAvatarTailwindClass,
  deriveOrgStatus,
  STATUS_LABELS,
  STATUS_COLORS,
  extractApiError,
  formatCurrency,
  getCurrencySymbol,
  getCountryName,
} from '@/features/organization/utils/organizationHelpers';

// Constants
export {
  ORG_PAGE_SIZE_OPTIONS,
  ORG_DEFAULT_PAGE_SIZE,
  ORG_ORDERING_OPTIONS,
  ORG_STATUS_FILTER_OPTIONS,
  TIMEZONE_OPTIONS,
  DATE_FORMAT_OPTIONS,
  CURRENCY_OPTIONS,
  SLUG_REGEX,
} from '@/features/organization/constants/organizationConstants';

// Components

export { OrganizationStatsCards } from '@/features/organization/components/OrganizationStatsCards';

export { OrgSettingsForm }        from '@/features/organization/components/OrgSettingsForm';

// Routes
export { OrganizationRoutes } from '@/features/organization/routes/organizationRoutes';

