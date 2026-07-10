import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Employee, EmployeeFormValues } from '../types/employeeTypes';
import toast from 'react-hot-toast';

export const useEmployeeMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (payload: Partial<EmployeeFormValues>) => {
      const { data } = await apiClient.post<{ data: Employee }>('/api/v1/hrms/employees/', payload);
      return data?.data ?? (data as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<EmployeeFormValues> }) => {
      const { data } = await apiClient.patch<{ data: Employee }>(`/api/v1/hrms/employees/${id}/`, payload);
      return data?.data ?? (data as any);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/v1/hrms/employees/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ id, file, docType }: { id: string; file: File; docType: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', docType);
      const { data } = await apiClient.post(`/api/v1/hrms/employees/${id}/documents/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['employee', id, 'documents'] });
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append('photo', file);
      const { data } = await apiClient.post<{ data: { photo_url: string } }>(`/api/v1/hrms/employees/${id}/photo/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data?.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
    },
  });

  return {
    createEmployee: createMutation.mutateAsync,
    updateEmployee: updateMutation.mutateAsync,
    deactivateEmployee: deactivateMutation.mutateAsync,
    uploadDocument: uploadDocumentMutation.mutateAsync,
    uploadPhoto: uploadPhotoMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeactivating: deactivateMutation.isPending,
    isUploadingDoc: uploadDocumentMutation.isPending,
    isUploadingPhoto: uploadPhotoMutation.isPending,
  };
};
