// yss_orbit\frontend\src\modules\recruitment\state\recruitmentSlice.ts
import { StateCreator } from 'zustand';

export interface RecruitmentSlice {
  jobs: any[];
  setJobs: (jobs: any[]) => void;
  applicants: any[];
  setApplicants: (applicants: any[]) => void;
}

export const createRecruitmentSlice: StateCreator<RecruitmentSlice> = (set) => ({
  jobs: [],
  setJobs: (jobs) => set({ jobs }),
  applicants: [],
  setApplicants: (applicants) => set({ applicants }),
});
