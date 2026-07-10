// yss_orbit\frontend\src\modules\audit\state\auditSlice.ts
import { StateCreator } from 'zustand';
import { AuditLog } from '../types/auditTypes';

export interface AuditSlice {
  logs: AuditLog[];
  setLogs: (logs: AuditLog[]) => void;
  filters: Record<string, any>;
  setFilters: (filters: Record<string, any>) => void;
}

export const createAuditSlice: StateCreator<AuditSlice> = (set) => ({
  logs: [],
  setLogs: (logs) => set({ logs }),
  filters: {},
  setFilters: (filters) => set({ filters }),
});
