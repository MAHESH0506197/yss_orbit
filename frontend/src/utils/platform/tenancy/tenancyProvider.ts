// yss_orbit\frontend\src\platform\tenancy\tenancyProvider.ts
import React, { useState } from 'react';
import { BusinessUnitContext, BusinessUnit } from './businessUnitContext';
import { DomainContext, Domain } from './domainContext';

interface TenancyProviderProps {
  children: React.ReactNode;
}

export const TenancyProvider: React.FC<TenancyProviderProps> = ({ children }) => {
  const [currentBU, setCurrentBU] = useState<BusinessUnit | null>(null);
  const [currentDomain, setCurrentDomain] = useState<Domain | null>(null);

  return React.createElement(DomainContext.Provider, { value: { currentDomain, setCurrentDomain } },
    React.createElement(BusinessUnitContext.Provider, { value: { currentBU, setCurrentBU } },
      children
    )
  );
};
