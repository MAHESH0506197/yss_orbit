// yss_orbit\frontend\src\core\stores\pendingAuthStore.ts
/**
 * YSS Orbit — Pending Auth Store
 * 4.12 fix: Replaces sessionStorage.setItem('pendingAuth', ...) pattern.
 *
 * B06 §5.19 mandates that pending auth state (MFA flow, OTP flow) is managed
 * in memory, not sessionStorage. sessionStorage persists across page navigations
 * within the same tab and can be read by any JS on the page.
 *
 * This store holds pending authentication context between the login step
 * and the OTP/MFA verification step. It is in-memory (Zustand), not persisted,
 * and automatically clears on logout or navigation away from auth flows.
 *
 * Usage:
 *   import { usePendingAuthStore } from '@/store/pendingAuthStore';
 *   const { setPendingAuth, pendingAuth, clearPendingAuth } = usePendingAuthStore();
 */
import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type PendingAuthPurpose =
  | 'MFA_REQUIRED'
  | 'EMAIL_VERIFICATION_REQUIRED'
  | 'PASSWORD_CHANGE_REQUIRED';

export interface PendingAuthState {
  /** The pending user ID — needed to complete OTP verification */
  pendingUserId: string | null;
  /** The purpose of the pending auth step */
  purpose: PendingAuthPurpose | null;
  /** Masked email for display (e.g. j***@example.com) */
  emailMasked: string | null;
  /** Whether the pending auth context is set (navigation guard) */
  hasPendingAuth: boolean;
}

interface PendingAuthActions {
  /** Set pending auth context after a partial login response */
  setPendingAuth: (state: Omit<PendingAuthState, 'hasPendingAuth'>) => void;
  /** Clear pending auth context after OTP verification or cancellation */
  clearPendingAuth: () => void;
}

// ---------------------------------------------------------------------------
// Initial State
// ---------------------------------------------------------------------------
const INITIAL_STATE: PendingAuthState = {
  pendingUserId: null,
  purpose: null,
  emailMasked: null,
  hasPendingAuth: false,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
export const usePendingAuthStore = create<PendingAuthState & PendingAuthActions>((set) => ({
  ...INITIAL_STATE,

  setPendingAuth: ({ pendingUserId, purpose, emailMasked }) => {
    set({
      pendingUserId,
      purpose,
      emailMasked,
      hasPendingAuth: true,
    });
  },

  clearPendingAuth: () => {
    set({ ...INITIAL_STATE });
  },
}));
