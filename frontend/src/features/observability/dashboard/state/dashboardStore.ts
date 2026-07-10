// yss_orbit\frontend\src\modules\dashboard\state\dashboardStore.ts
import { create } from 'zustand';
import { DashboardSlice, createDashboardSlice } from './dashboardSlice';

export const useDashboardStore = create<DashboardSlice>((...a) => ({
  ...createDashboardSlice(...a),
}));
