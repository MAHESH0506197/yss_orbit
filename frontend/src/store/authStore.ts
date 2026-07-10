// yss_orbit\frontend\src\core\stores\authStore.ts
/**
 * YSS Orbit — Auth Store (Zustand)
 * In-memory ONLY — tokens are in HttpOnly cookies, not here.
 * This store holds decoded identity state from the JWT claims.
 */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface BusinessUnitSummary {
  business_unit_id: string;
  name: string;
  role_id: string | null;
  domain: string; // NOT "sector"
}

export interface AuthData {
  userId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  timezone: string;
  language: string;
  avatar?: string;
  permissions: string[];
  allowedBusinessUnits: BusinessUnitSummary[];
  isSuperAdmin: boolean;
}

export interface AuthState {
  // Identity
  isAuthenticated: boolean;
  userId: string | null;
  username: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  timezone: string;
  language: string;
  avatar: string | null;
  isSuperAdmin: boolean;

  // Business unit context
  allowedBusinessUnits: BusinessUnitSummary[];
  selectedBusinessUnitId: string | null;

  // Permissions (from token)
  permissions: string[];

  // Actions
  setAuth: (data: AuthData) => void;
  clearAuth: () => void;
  selectBusinessUnit: (buId: string) => void;
  hasPermission: (code: string) => boolean;
  hasAnyPermission: (...codes: string[]) => boolean;
  hasAllPermissions: (...codes: string[]) => boolean;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state — not authenticated
        isAuthenticated: false,
        userId: null,
        username: null,
        email: null,
        firstName: null,
        lastName: null,
      timezone: 'UTC',
      language: 'en',
      avatar: null,
      isSuperAdmin: false,
      allowedBusinessUnits: [],
      selectedBusinessUnitId: null,
      permissions: [],

      setAuth: (data: AuthData) => {
        const currentBu = get().selectedBusinessUnitId;
        set(
          {
            isAuthenticated: true,
            userId: data.userId,
            username: data.username,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            timezone: data.timezone,
            language: data.language,
            avatar: data.avatar ?? null,
            isSuperAdmin: data.isSuperAdmin,
            allowedBusinessUnits: data.allowedBusinessUnits,
            permissions: data.permissions,
            // Auto-select BU if user only has one (but never for super admin, who defaults to global)
            // Preserve currentBu if it exists and is valid
            selectedBusinessUnitId:
              currentBu ?? (data.isSuperAdmin ? null : (data.allowedBusinessUnits.length === 1
                ? data.allowedBusinessUnits[0]?.business_unit_id ?? null
                : null)),
          },
          false,
          'setAuth'
        );
      },

      clearAuth: () => {
        set(
          {
            isAuthenticated: false,
            userId: null,
            username: null,
            email: null,
            firstName: null,
            lastName: null,
            avatar: null,
            isSuperAdmin: false,
            allowedBusinessUnits: [],
            selectedBusinessUnitId: null,
            permissions: [],
          },
          false,
          'clearAuth'
        );
      },

      selectBusinessUnit: (buId: string) => {
        const { allowedBusinessUnits, isSuperAdmin } = get();
        if (buId === '' && isSuperAdmin) {
          set({ selectedBusinessUnitId: null }, false, 'selectBusinessUnit');
          return;
        }
        
        const bu = allowedBusinessUnits.find(b => b.business_unit_id === buId);
        if (!bu) {
          console.error('[AuthStore] BU not in allowed list:', buId);
          return;
        }
        set({ selectedBusinessUnitId: buId }, false, 'selectBusinessUnit');
      },

      hasPermission: (code: string): boolean => {
        const { isSuperAdmin, permissions } = get();
        if (isSuperAdmin) return true;
        return permissions.includes(code);
      },

      hasAnyPermission: (...codes: string[]): boolean => {
        const { isSuperAdmin, permissions } = get();
        if (isSuperAdmin) return true;
        return codes.some(c => permissions.includes(c));
      },

      hasAllPermissions: (...codes: string[]): boolean => {
        const { isSuperAdmin, permissions } = get();
        if (isSuperAdmin) return true;
        return codes.every(c => permissions.includes(c));
      },
    }),
    {
      name: 'yss-orbit-auth-persist',
      partialize: (state) => ({ selectedBusinessUnitId: state.selectedBusinessUnitId })
    }
  ),
  { name: 'YSS-Orbit-Auth' }
  )
);
