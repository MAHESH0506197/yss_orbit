import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient as client } from '@/api/client';
import { LeaveBalance, LeaveRequest } from '../types/leaveTypes';

export const useLeaveBalances = (employeeId: string, year: number) => {
  const { t } = useTranslation();
  return useQuery({
    queryKey: ['leaveBalances', employeeId, year],
    queryFn: async () => {
      const res = await client.get('/api/v1/hrms/leave/balances/', {
        params: { employee_id: employeeId, year }
      });
      return res.data?.data?.results || res.data?.data || res.data;
    },
    enabled: !!employeeId && !!year,
  });
};

export const useLeaveRequests = (employeeId?: string) => {
  return useQuery({
    queryKey: ['leaveRequests', employeeId],
    queryFn: async () => {
      const res = await client.get('/api/v1/hrms/leave/requests/', {
        params: employeeId ? { employee_id: employeeId } : undefined
      });
      return res.data?.data?.results || res.data?.data || res.data;
    },
  });
};

export const useTeamLeaveRequests = (managerId?: string) => {
  return useQuery({
    queryKey: ['teamLeaveRequests', managerId],
    queryFn: async () => {
      const res = await client.get('/api/v1/hrms/leave/requests/', {
        params: managerId ? { manager_id: managerId } : undefined
      });
      return res.data;
    },
    enabled: !!managerId,
  });
};

export const useApplyLeave = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<LeaveRequest>) => {
      const res = await client.post('/api/v1/hrms/leave/requests/', data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      queryClient.invalidateQueries({ queryKey: ['leaveBalances'] });
    },
  });
};

export const useApproveLeave = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, managerId, comments }: { id: string, managerId: string, comments: string }) => {
      const res = await client.post(`/api/v1/hrms/leave/requests/${id}/approve/`, {
        manager_employee_id: managerId,
        comments
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      queryClient.invalidateQueries({ queryKey: ['leaveBalances'] });
    },
  });
};

export const useLeaveTypes = () => {
  return useQuery({
    queryKey: ['leaveTypes'],
    queryFn: async () => {
      const res = await client.get('/api/v1/hrms/leave/types/');
      return res.data?.data?.results ?? res.data?.data ?? res.data ?? [];
    },
  });
};

export const useCancelLeave = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await client.post(`/api/v1/hrms/leave/requests/${id}/cancel/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      queryClient.invalidateQueries({ queryKey: ['leaveBalances'] });
    },
  });
};

export const useRejectLeave = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, managerId, comments }: { id: string, managerId: string, comments: string }) => {
      const res = await client.post(`/api/v1/hrms/leave/requests/${id}/reject/`, {
        manager_employee_id: managerId,
        comments
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      queryClient.invalidateQueries({ queryKey: ['leaveBalances'] });
    },
  });
};
