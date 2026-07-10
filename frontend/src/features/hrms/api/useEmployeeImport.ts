import { useTranslation } from 'react-i18next';
import { apiClient as axios } from '@/api/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export const useEmployeeImport = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const downloadTemplate = async () => {
    try {
      const response = await axios.get('/hrms/employees/import/template/', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Employee_Import_Template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      toast.error('Failed to download template.');
    }
  };

  const uploadFile = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await axios.post('/hrms/employees/import/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data.session_id as string;
    },
    onError: () => toast.error('Failed to upload file.'),
  });

  const validateSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { data } = await axios.post(`/hrms/employees/import/validate/${sessionId}/`);
      return data;
    },
    onError: () => toast.error('Validation failed to execute.'),
  });

  const executeSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { data } = await axios.post(`/hrms/employees/import/execute/${sessionId}/`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const downloadErrors = async (sessionId: string) => {
    try {
      const response = await axios.get(`/hrms/employees/import/errors/${sessionId}/`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Employee_Import_Errors.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      toast.error('Failed to download error report.');
    }
  };

  return {
    downloadTemplate,
    uploadFile,
    validateSession,
    executeSession,
    downloadErrors,
  };
};

export const useImportHistory = () => {
  return useQuery({
    queryKey: ['employee-imports'],
    queryFn: async () => {
      const { data } = await axios.get('/hrms/employees/import/history/');
      return data;
    },
  });
};
