// yss_orbit\frontend\src\app\providers\TenantContextProvider.tsx
/**
 * H-6 fix: F03 §3.1 / B02 §5.1 — Sources business_unit_id from canonical
 * useAuthStore (selectedBU.id). Removes the hardcoded mock tenantId="t_123".
 *
 * NOTE: The correct term is "businessUnitId" per B02 §5.1.
 * tenantId alias is kept for backward compatibility with existing consumers only.
 */
import React, { createContext, useContext } from 'react';
import { useAuthStore } from '@/store/authStore';

interface TenantContextType {
  businessUnitId: string | null; // H-6 fix: B02 §5.1 canonical term
  tenantId: string | null;       // @deprecated — use businessUnitId
  setTenantId: (id: string) => void; // @deprecated — select via useAuthStore.selectBU()
}

const TenantContext = createContext<TenantContextType>({
  businessUnitId: null,
  tenantId: null,
  setTenantId: () => {},
});

export const useTenantContext = () => useContext(TenantContext);

export const TenantContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // H-6 fix: Source from canonical Zustand store — NOT hardcoded mock "t_123"
  const { selectedBusinessUnitId } = useAuthStore();
  const businessUnitId = selectedBusinessUnitId;

  return (
    <TenantContext.Provider value={{
      businessUnitId,
      tenantId: businessUnitId,      // @deprecated alias
      setTenantId: () => {
        // @deprecated — use useAuthStore().selectBU() instead
        console.warn('[TenantContextProvider] setTenantId is deprecated. Use useAuthStore().selectBU()');
      },
    }}>
      {children}
    </TenantContext.Provider>
  );
};
