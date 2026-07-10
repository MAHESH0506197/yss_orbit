// yss_orbit\frontend\src\modules\health\state\healthStore.ts
import { create } from 'zustand';
import { HealthSlice, createHealthSlice } from './healthSlice';

export const useHealthStore = create<HealthSlice>((...a) => ({
  ...createHealthSlice(...a),
}));
