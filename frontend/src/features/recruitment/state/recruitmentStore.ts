// yss_orbit\frontend\src\modules\recruitment\state\recruitmentStore.ts
import { create } from 'zustand';
import { RecruitmentSlice, createRecruitmentSlice } from './recruitmentSlice';

export const useRecruitmentStore = create<RecruitmentSlice>((...a) => ({
  ...createRecruitmentSlice(...a),
}));
