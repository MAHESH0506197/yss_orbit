// yss_orbit\frontend\src\platform\tenancy\businessUnitContext.ts
import { createContext, useContext } from 'react';

export interface BusinessUnit {
  id: string;
  name: string;
  type: string;
}

export const BusinessUnitContext = createContext<{ currentBU: BusinessUnit | null; setCurrentBU: (bu: BusinessUnit) => void } | undefined>(undefined);

export const useBusinessUnit = () => {
  const context = useContext(BusinessUnitContext);
  if (context === undefined) {
    throw new Error('useBusinessUnit must be used within a BusinessUnitProvider');
  }
  return context;
};
