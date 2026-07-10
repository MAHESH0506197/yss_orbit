// yss_orbit\frontend\src\core\feature_flags\featureFlagGuard.tsx
import React from 'react';
import { useFeatureFlag } from './useFeatureFlag';
interface Props { flag: string; children: React.ReactNode; fallback?: React.ReactNode; }
export const FeatureFlagGuard: React.FC<Props> = ({ flag, children, fallback }) => { const enabled = useFeatureFlag(flag); return enabled ? <>{children}</> : <>{fallback}</>; };

