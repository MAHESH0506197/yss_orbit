// yss_orbit\frontend\src\modules\attendance\state\attendanceStore.ts
import { create } from 'zustand';
import { AttendanceSlice, createAttendanceSlice } from './attendanceSlice';

export const useAttendanceStore = create<AttendanceSlice>((...a) => ({
  ...createAttendanceSlice(...a),
}));
