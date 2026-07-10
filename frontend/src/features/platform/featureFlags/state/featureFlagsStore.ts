// yss_orbit\frontend\src\modules\featureFlags\state\featureFlagsStore.ts
import { create } from 'zustand';
import { FeatureFlagsSlice, createFeatureFlagsSlice } from './featureFlagsSlice';

export const useFeatureFlagsStore = create<FeatureFlagsSlice>((...a) => ({
  ...createFeatureFlagsSlice(...a),
}));
