import { useTranslation } from 'react-i18next';
// yss_orbit\frontend\src\features\attendance\api.ts
import { AttendanceRecord, AttendanceSummary } from './types';
import { formatIST } from '@/utils/date';

// Mock data
const mockAttendance: AttendanceRecord[] = [
  { id: 'att-1', employeeId: 'emp-1', employeeName: 'Alice Smith', date: new Date().toISOString().split('T')[0]!, checkIn: '09:00 AM', checkOut: null, status: 'present', businessUnit: 'Engineering' },
  { id: 'att-2', employeeId: 'emp-2', employeeName: 'Bob Jones', date: new Date().toISOString().split('T')[0]!, checkIn: '09:15 AM', checkOut: '05:30 PM', status: 'present', businessUnit: 'Marketing' },
  { id: 'att-3', employeeId: 'emp-3', employeeName: 'Charlie Davis', date: new Date().toISOString().split('T')[0]!, checkIn: null, checkOut: null, status: 'on_leave', businessUnit: 'Sales' },
  { id: 'att-4', employeeId: 'emp-4', employeeName: 'Diana Prince', date: new Date().toISOString().split('T')[0]!, checkIn: null, checkOut: null, status: 'absent', businessUnit: 'Engineering' },
];

export const getAttendance = async (date: string): Promise<AttendanceRecord[]> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  return mockAttendance.filter(a => a.date === date || a.date === new Date().toISOString().split('T')[0]!);
};

export const getAttendanceSummary = async (date: string): Promise<AttendanceSummary> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  const records = mockAttendance.filter(a => a.date === date || a.date === new Date().toISOString().split('T')[0]!);
  
  return {
    present: records.filter(r => r.status === 'present').length,
    absent: records.filter(r => r.status === 'absent').length,
    onLeave: records.filter(r => r.status === 'on_leave').length,
    halfDay: records.filter(r => r.status === 'half_day').length,
    total: records.length,
  };
};

export const checkIn = async (employeeId: string): Promise<AttendanceRecord> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const record = mockAttendance.find(r => r.employeeId === employeeId);
  if (record) {
    record.checkIn = formatIST(new Date(), 'pp');
    record.status = 'present';
    return record;
  }
  throw new Error('Employee not found');
};

export const checkOut = async (employeeId: string): Promise<AttendanceRecord> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const record = mockAttendance.find(r => r.employeeId === employeeId);
  if (record) {
    record.checkOut = formatIST(new Date(), 'pp');
    return record;
  }
  throw new Error('Employee not found');
};
