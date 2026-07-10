import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient as axios } from '@/api/client';
import toast from 'react-hot-toast';
import { AttendanceRecord, PunchSource } from '../types/attendanceTypes';
import { useAuthStore } from '@/store/authStore';

declare module 'axios' {
  export interface AxiosRequestConfig {
    _disableToast?: boolean;
  }
}

// --- Fetch Admin Attendance List ---
export function useAttendanceList(filters: any) {
  const { t } = useTranslation();
  const buId = useAuthStore((state) => state.selectedBusinessUnitId);
  return useQuery({
    queryKey: ['attendance', filters, buId],
    queryFn: async () => {
      const { data } = await axios.get<any>('/api/v1/hrms/attendance/', { params: filters });
      // The list endpoint uses pagination which wraps the response in { success: true, data: { count, results } }
      return data?.data || data;
    },
    enabled: !!buId,
  });
}

// --- Fetch Attendance Stats ---
export function useAttendanceStats(filters: any) {
  const buId = useAuthStore((state) => state.selectedBusinessUnitId);
  return useQuery({
    queryKey: ['attendanceStats', filters, buId],
    queryFn: async () => {
      const { data } = await axios.get<any>('/api/v1/hrms/attendance/stats/', { params: filters });
      return data?.data || data;
    },
    enabled: !!buId,
  });
}

// --- Fetch Current Employee's Today Attendance ---
export function useMyAttendance() {
  const buId = useAuthStore((state) => state.selectedBusinessUnitId);
  return useQuery({
    queryKey: ['my-attendance-today', buId],
    queryFn: async () => {
      try {
        const { data } = await axios.get<AttendanceRecord>('/api/v1/hrms/attendance/me/', { _disableToast: true });
        return data; // May be empty object if no punches today
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null; // Not an employee
        }
        throw error;
      }
    },
    enabled: !!buId,
  });
}

// --- Punch In/Out ---
export function usePunch() {
  const queryClient = useQueryClient();
  const buId = useAuthStore((state) => state.selectedBusinessUnitId);
  
  return useMutation({
    mutationFn: async (source: PunchSource = 'WEB') => {
      const { data } = await axios.post<AttendanceRecord>('/api/v1/hrms/attendance/punch/', { source }, { _disableToast: true });
      return data;
    },
    onSuccess: (data) => {
      toast.success('Punch recorded successfully');
      queryClient.setQueryData(['my-attendance-today', buId], data);
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error || 'Failed to record punch';
      toast.error(msg);
    }
  });
}

// --- Request/Submit Correction ---
export function useRequestCorrection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { record: string, reason: string, requested_in_time?: string, requested_out_time?: string }) => {
      const res = await axios.post('/api/v1/hrms/attendance-corrections/', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Attendance correction submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceStats'] });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error || 'Failed to submit correction';
      toast.error(msg);
    }
  });
}

// --- Approve Correction ---
export function useApproveCorrection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.post(`/api/v1/hrms/attendance-corrections/${id}/approve/`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Correction approved');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceStats'] });
    },
    onError: () => {
      toast.error('Failed to approve correction');
    }
  });
}

// --- Export Attendance ---
export function useExportAttendance() {
  const buId = useAuthStore((state) => state.selectedBusinessUnitId);
  return useMutation({
    mutationFn: async (filters: any) => {
      const response = await axios.get('/api/v1/hrms/attendance/export/', {
        params: filters,
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Attendance_Export_${filters.date_from || 'All'}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    },
    onSuccess: () => {
      toast.success('Export downloaded successfully');
    },
    onError: () => {
      toast.error('Failed to export data');
    }
  });
}
