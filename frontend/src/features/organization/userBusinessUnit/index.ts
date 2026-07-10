// yss_orbit\frontend\src\features\userBusinessUnit\index.ts
// FIX-BUG-UBU-EXPORTS: Corrected page export paths — files live at feature root,
// NOT in a ./pages/ subdirectory. Removed all @ts-expect-error suppressions.

// ── Routes ────────────────────────────────────────────────────────────────────
export { UserBusinessUnitRoutes } from './routes/userBusinessUnitRoutes';

// ── Pages (at feature root — not in ./pages/) ─────────────────────────────────
export { UserBusinessUnitListPage } from './userBusinessUnitListPage';
export { UserBusinessUnitDetailPage } from './userBusinessUnitDetailPage';
export { BusinessUnitMemberPage } from './BusinessUnitMemberPage';

// ── Components ────────────────────────────────────────────────────────────────
export { MembershipTable } from './components/MembershipTable';
export { BuAssignForm } from './components/BuAssignForm';
export { UserBusinessUnitCard } from './components/userBusinessUnitCard';

// ── Hooks ─────────────────────────────────────────────────────────────────────
// Legacy Zustand-backed hook (kept for backward compat, migrate consumers to RQ hooks)
export { useUserBusinessUnit, useUserbusinessunit } from './hooks/useuserBusinessUnit';
// New React Query hooks (D2 migration)
export {
  useUserBusinessUnits,
  useUserBusinessUnit as useUserBusinessUnitQuery,
  useCreateUBU,
  useUpdateUBU,
  useDeleteUBU,
  useActivateUBU,
  useDeactivateUBU,
  UBU_QUERY_KEYS,
} from './hooks/useUserBusinessUnits';

// ── Store ─────────────────────────────────────────────────────────────────────
export { useUserBusinessUnitStore } from './state/userBusinessUnitStore';

// ── API ───────────────────────────────────────────────────────────────────────
export { userBusinessUnitApi } from './api/userBusinessUnitApi';
export type { MembershipsListResponse } from './api/userBusinessUnitApi';

// ── Service ───────────────────────────────────────────────────────────────────
export { userBusinessUnitService } from './services/userBusinessUnitService';

// ── Types ─────────────────────────────────────────────────────────────────────
export type {
  UserBusinessUnitMembership,
  UserBusinessUnitCreatePayload,
  UserBusinessUnitUpdatePayload,
  UserBusinessUnitFilters,
  UserBusinessUnitListMeta,
  UserBusinessUnitState,
} from './types/userBusinessUnitTypes';

// ── Constants ─────────────────────────────────────────────────────────────────
export { UBU_ENDPOINTS, UBU_ORDERING_OPTIONS, UBU_STATUS_LABELS } from './constants/userBusinessUnitConstants';
