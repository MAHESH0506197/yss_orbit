// yss_orbit\frontend\src\modules\integration\state\integrationSlice.ts
import { StateCreator } from 'zustand';
import { Integration } from '../types/integrationTypes';

export interface IntegrationSlice {
  integrations: Integration[];
  setIntegrations: (integrations: Integration[]) => void;
}

export const createIntegrationSlice: StateCreator<IntegrationSlice> = (set) => ({
  integrations: [],
  setIntegrations: (integrations) => set({ integrations }),
});
