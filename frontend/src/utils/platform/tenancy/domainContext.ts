// yss_orbit\frontend\src\platform\tenancy\domainContext.ts
import { createContext, useContext } from 'react';

export interface Domain {
  id: string;
  domainName: string;
  status: 'active' | 'inactive';
}

export const DomainContext = createContext<{ currentDomain: Domain | null; setCurrentDomain: (domain: Domain) => void } | undefined>(undefined);

export const useDomain = () => {
  const context = useContext(DomainContext);
  if (context === undefined) {
    throw new Error('useDomain must be used within a DomainProvider');
  }
  return context;
};
