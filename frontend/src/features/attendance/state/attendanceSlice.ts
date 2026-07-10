// yss_orbit\frontend\src\modules\attendance\state\attendanceSlice.ts
import { StateCreator } from 'zustand';
import { AttendanceRecord } from '../types/attendanceTypes';

export interface AttendanceSlice {
  records: AttendanceRecord[];
  setRecords: (records: AttendanceRecord[]) => void;
  isCheckedIn: boolean;
  setIsCheckedIn: (status: boolean) => void;
}

export const createAttendanceSlice: StateCreator<AttendanceSlice> = (set) => ({
  records: [],
  setRecords: (records) => set({ records }),
  isCheckedIn: false,
  setIsCheckedIn: (isCheckedIn) => set({ isCheckedIn }),
});
