import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '@/api/client';
import { useAuthStore } from '@/store/authStore';

export const useDepartments = () => {
  const { t } = useTranslation();
  const selectedBusinessUnitId = useAuthStore(state => state.selectedBusinessUnitId);

  return useQuery({
    queryKey: ['departments', selectedBusinessUnitId],
    queryFn: async () => {
      if (!selectedBusinessUnitId) return { data: [] };
      const response = await client.get('/api/v1/hrms/departments/');
      return response.data;
    },
    enabled: !!selectedBusinessUnitId,
  });
};

export const useDesignations = () => {
  const selectedBusinessUnitId = useAuthStore(state => state.selectedBusinessUnitId);

  return useQuery({
    queryKey: ['designations', selectedBusinessUnitId],
    queryFn: async () => {
      if (!selectedBusinessUnitId) return { data: [] };
      const response = await client.get('/api/v1/hrms/designations/');
      return response.data;
    },
    enabled: !!selectedBusinessUnitId,
  });
};

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();
  const selectedBusinessUnitId = useAuthStore(state => state.selectedBusinessUnitId);

  return useMutation({
    mutationFn: async (data: { name: string }) => {
      const response = await client.post('/api/v1/hrms/departments/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments', selectedBusinessUnitId] });
    },
  });
};

export const useCreateDesignation = () => {
  const queryClient = useQueryClient();
  const selectedBusinessUnitId = useAuthStore(state => state.selectedBusinessUnitId);

  return useMutation({
    mutationFn: async (data: { name: string, department?: string }) => {
      const response = await client.post('/api/v1/hrms/designations/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designations', selectedBusinessUnitId] });
    },
  });
};
