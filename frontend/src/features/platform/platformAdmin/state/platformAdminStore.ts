// yss_orbit\frontend\src\modules\platformAdmin\state\platformAdminStore.ts
import { create } from 'zustand';
import { PlatformAdminSlice, createPlatformAdminSlice } from './platformAdminSlice';

export const usePlatformAdminStore = create<PlatformAdminSlice>((...a) => ({
  ...createPlatformAdminSlice(...a),
}));
