// yss_orbit\frontend\src\modules\appraisal\state\appraisalStore.ts
import { create } from 'zustand';
import { AppraisalSlice, createAppraisalSlice } from './appraisalSlice';

// Isolated store for the appraisal module, if needed.
// Often this might just be integrated into the global appStore depending on architecture.
export const useAppraisalStore = create<AppraisalSlice>((...a) => ({
  ...createAppraisalSlice(...a),
}));
