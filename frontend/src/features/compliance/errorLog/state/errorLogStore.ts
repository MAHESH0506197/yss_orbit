// yss_orbit\frontend\src\modules\errorLog\state\errorLogStore.ts
import { create } from 'zustand';
import { ErrorLogSlice, createErrorLogSlice } from './errorLogSlice';

export const useErrorLogStore = create<ErrorLogSlice>((...a) => ({
  ...createErrorLogSlice(...a),
}));
