import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient as client } from "@/api/client";

export const usePayrollRuns = () => {
  const { t } = useTranslation();
  return useQuery({
    queryKey: ['payrollRuns'],
    queryFn: async () => {
      const res = await client.get('/api/v1/payroll/runs/');
      return res.data?.data?.results || res.data?.data || res.data;
    },
  });
};

export const useGeneratePayroll = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ month, year }: { month: number, year: number }) => {
      const res = await client.post('/api/v1/payroll/runs/generate/', { month, year });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
      queryClient.invalidateQueries({ queryKey: ['payslips'] });
    },
  });
};

export const usePayslips = (runId?: string, myPayslips?: boolean) => {
  return useQuery({
    queryKey: ['payslips', runId, myPayslips],
    queryFn: async () => {
      const params: any = {};
      if (runId) params.run_id = runId;
      if (myPayslips) params.my_payslips = true;
      const res = await client.get('/api/v1/payroll/payslips/', { params });
      return res.data?.data?.results || res.data?.data || res.data;
    },
  });
};

export const useSalaryComponents = () => {
  return useQuery({
    queryKey: ['salaryComponents'],
    queryFn: async () => {
      const res = await client.get('/api/v1/payroll/components/');
      return res.data?.data?.results || res.data?.data || res.data;
    },
  });
};

export const useCreateSalaryComponent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await client.post('/api/v1/payroll/components/', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaryComponents'] });
    },
  });
};

export const useSalaryStructures = () => {
  return useQuery({
    queryKey: ['salaryStructures'],
    queryFn: async () => {
      const res = await client.get('/api/v1/payroll/structures/');
      return res.data?.data?.results || res.data?.data || res.data;
    },
  });
};

export const useCreateSalaryStructure = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await client.post('/api/v1/payroll/structures/', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaryStructures'] });
    },
  });
};

export const downloadPayslip = async (payslipId: string) => {
  const response = await client.get(`/api/v1/payroll/payslips/${payslipId}/download/`, {
    responseType: 'blob'
  });
  return response.data;
};
