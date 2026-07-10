// yss_orbit\frontend\src\modules\errorLog\state\errorLogSlice.ts
import { StateCreator } from 'zustand';
import { ErrorLogEntry } from '../types/errorLogTypes';

export interface ErrorLogSlice {
  errors: ErrorLogEntry[];
  setErrors: (errors: ErrorLogEntry[]) => void;
  filters: Record<string, any>;
  setFilters: (filters: Record<string, any>) => void;
}

export const createErrorLogSlice: StateCreator<ErrorLogSlice> = (set) => ({
  errors: [],
  setErrors: (errors) => set({ errors }),
  filters: {},
  setFilters: (filters) => set({ filters }),
});
