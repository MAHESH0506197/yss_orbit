// yss_orbit\frontend\src\modules\featureFlags\state\featureFlagsSlice.ts
import { StateCreator } from 'zustand';
import { FeatureFlag } from '../types/featureFlagsTypes';

export interface FeatureFlagsSlice {
  flags: FeatureFlag[];
  setFlags: (flags: FeatureFlag[]) => void;
  activeFlag: FeatureFlag | null;
  setActiveFlag: (flag: FeatureFlag | null) => void;
}

export const createFeatureFlagsSlice: StateCreator<FeatureFlagsSlice> = (set) => ({
  flags: [],
  setFlags: (flags) => set({ flags }),
  activeFlag: null,
  setActiveFlag: (activeFlag) => set({ activeFlag }),
});
