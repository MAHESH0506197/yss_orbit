// yss_orbit\frontend\src\app\providers\AuthProvider.tsx
/**
 * H-6 fix: F03 §3.1 — Zustand is the single source of truth for auth state.
 * This provider bridges the canonical useAuthStore to React Context for legacy
 * consumers that use useAuthContext(). New code should use useAuthStore() directly.
 *
 * The hardcoded mock (user: { id: 1, name: 'Admin' }) has been removed.
 */
import React, { createContext, useContext } from 'react';
import { useAuthStore, type BusinessUnitSummary } from '@/store/authStore';

interface AuthContextType {
  user: { id: string; email: string; username: string } | null;
  currentBusinessUnit: BusinessUnitSummary | null;
  setBusinessUnit: (buId: string) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  currentBusinessUnit: null,
  setBusinessUnit: () => {},
  isAuthenticated: false,
});

export const useAuthContext = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // H-6 fix: Source from canonical Zustand store — NOT hardcoded mock
  const {
    userId, email, username,
    isAuthenticated,
    allowedBusinessUnits, selectedBusinessUnitId,
    selectBusinessUnit,
  } = useAuthStore();

  const selectedBU = allowedBusinessUnits.find(
    (bu) => bu.business_unit_id === selectedBusinessUnitId
  ) ?? null;

  const contextValue: AuthContextType = {
    user: userId ? { id: userId, email: email ?? '', username: username ?? '' } : null,
    currentBusinessUnit: selectedBU,
    setBusinessUnit: selectBusinessUnit,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
