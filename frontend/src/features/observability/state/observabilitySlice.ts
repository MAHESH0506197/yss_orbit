// yss_orbit\frontend\src\modules\observability\state\observabilitySlice.ts
import { StateCreator } from 'zustand';
import { ObservabilityMetric } from '../types/observabilityTypes';

export interface ObservabilitySlice {
  metrics: ObservabilityMetric[];
  setMetrics: (metrics: ObservabilityMetric[]) => void;
}

export const createObservabilitySlice: StateCreator<ObservabilitySlice> = (set) => ({
  metrics: [],
  setMetrics: (metrics) => set({ metrics }),
});
