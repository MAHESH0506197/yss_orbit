// yss_orbit\frontend\src\app\providers\FeatureFlagProvider.tsx
import React, { createContext, useContext, useState } from 'react';
import { appConfig } from '@/utils/app/config/appConfig';

const FeatureFlagContext = createContext<typeof appConfig.features>(appConfig.features);

export const FeatureFlagProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [flags, setFlags] = useState(appConfig.features);
  return (
    <FeatureFlagContext.Provider value={flags}>
      {children}
    </FeatureFlagContext.Provider>
  );
};
