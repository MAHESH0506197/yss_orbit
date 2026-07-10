// yss_orbit\frontend\src\modules\tenantSettings\state\tenantSettingsSlice.ts
import { StateCreator } from 'zustand';

export interface TenantSettingsSlice {
  settings: any | null;
  setSettings: (settings: any) => void;
}

export const createTenantSettingsSlice: StateCreator<TenantSettingsSlice> = (set) => ({
  settings: null,
  setSettings: (settings) => set({ settings }),
});
