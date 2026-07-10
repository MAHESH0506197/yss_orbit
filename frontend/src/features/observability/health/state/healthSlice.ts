// yss_orbit\frontend\src\modules\health\state\healthSlice.ts
import { StateCreator } from 'zustand';
import { HealthStatus } from '../types/healthTypes';

export interface HealthSlice {
  status: HealthStatus | null;
  setStatus: (status: HealthStatus | null) => void;
}

export const createHealthSlice: StateCreator<HealthSlice> = (set) => ({
  status: null,
  setStatus: (status) => set({ status }),
});
