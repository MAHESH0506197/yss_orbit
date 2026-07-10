// yss_orbit\frontend\src\modules\audit\state\auditStore.ts
import { create } from 'zustand';
import { AuditSlice, createAuditSlice } from './auditSlice';

export const useAuditStore = create<AuditSlice>((...a) => ({
  ...createAuditSlice(...a),
}));
