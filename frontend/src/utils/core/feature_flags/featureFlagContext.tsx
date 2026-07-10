// yss_orbit\frontend\src\core\feature_flags\featureFlagContext.tsx
import React, { createContext, useContext } from 'react';
const FeatureFlagContext = createContext<Record<string, boolean>>({});
export { FeatureFlagContext };

