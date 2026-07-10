// yss_orbit\frontend\src\modules\appraisal\state\appraisalSlice.ts
import { StateCreator } from 'zustand';
import { Appraisal } from '../types/appraisalTypes';

export interface AppraisalSlice {
  appraisals: Appraisal[];
  setAppraisals: (appraisals: Appraisal[]) => void;
  activeCycle: string | null;
  setActiveCycle: (cycle: string) => void;
}

export const createAppraisalSlice: StateCreator<AppraisalSlice> = (set) => ({
  appraisals: [],
  setAppraisals: (appraisals) => set({ appraisals }),
  activeCycle: null,
  setActiveCycle: (activeCycle) => set({ activeCycle }),
});
