// yss_orbit\frontend\src\modules\dashboard\state\dashboardSlice.ts
import { StateCreator } from 'zustand';
import { DashboardConfig } from '../types/dashboardTypes';

export interface DashboardSlice {
  config: DashboardConfig | null;
  setConfig: (config: DashboardConfig) => void;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
}

export const createDashboardSlice: StateCreator<DashboardSlice> = (set) => ({
  config: null,
  setConfig: (config) => set({ config }),
  isEditing: false,
  setIsEditing: (isEditing) => set({ isEditing }),
});
