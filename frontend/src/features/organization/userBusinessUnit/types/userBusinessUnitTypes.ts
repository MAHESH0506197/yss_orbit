// yss_orbit\frontend\src\modules\userBusinessUnit\types\userBusinessUnitTypes.ts

export interface UserBusinessUnitMembership {
  id: string;
  user: string;            // UUID
  userEmail: string;
  userFullName: string;
  businessUnit: string;    // UUID
  businessUnitName: string;
  role: string | null;     // UUID
  roleName: string | null;
  isActiveMembership: boolean;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserBusinessUnitCreatePayload {
  user: string;
  businessUnit: string;
  role?: string | null;
  isActiveMembership?: boolean;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
}

export interface UserBusinessUnitUpdatePayload {
  role?: string | null;
  isActiveMembership?: boolean;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
}

export interface UserBusinessUnitListMeta {
  total: number;
  totalActive: number;
  totalInactive: number;
}

export interface UserBusinessUnitFilters {
  userId?: string;
  businessUnitId?: string;
  isActive?: boolean | null;
  search?: string;
  ordering?: string;
}

export interface UserBusinessUnitState {
  memberships: UserBusinessUnitMembership[];
  meta: UserBusinessUnitListMeta | null;
  isLoading: boolean;
  error: string | null;
  filters: UserBusinessUnitFilters;

  // Actions
  fetchMemberships: () => Promise<void>;
  setFilters: (filters: Partial<UserBusinessUnitFilters>) => void;
  addMembership: (m: UserBusinessUnitMembership) => void;
  updateMembership: (id: string, m: Partial<UserBusinessUnitMembership>) => void;
  removeMembership: (id: string) => void;
}
