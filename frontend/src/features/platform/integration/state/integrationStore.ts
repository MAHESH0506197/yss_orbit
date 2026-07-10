// yss_orbit\frontend\src\modules\integration\state\integrationStore.ts
import { create } from 'zustand';
import { IntegrationSlice, createIntegrationSlice } from './integrationSlice';

export const useIntegrationStore = create<IntegrationSlice>((...a) => ({
  ...createIntegrationSlice(...a),
}));
