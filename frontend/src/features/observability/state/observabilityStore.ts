// yss_orbit\frontend\src\modules\observability\state\observabilityStore.ts
import { create } from 'zustand';
import { ObservabilitySlice, createObservabilitySlice } from './observabilitySlice';

export const useObservabilityStore = create<ObservabilitySlice>((...a) => ({
  ...createObservabilitySlice(...a),
}));
