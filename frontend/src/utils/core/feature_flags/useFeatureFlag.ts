// yss_orbit\frontend\src\core\feature_flags\useFeatureFlag.ts
import { useContext } from 'react';
import { FeatureFlagContext } from './featureFlagContext';
export const useFeatureFlag = (code: string): boolean => useContext(FeatureFlagContext)[code] ?? false;

