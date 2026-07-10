// yss_orbit\frontend\src\modules\payroll\api\payrollApi.ts
import api from '@/api/apiConfig';

export interface PayrollDto {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export const payrollApi = {
  getAll: async (): Promise<PayrollDto[]> => {
    const response = await api.get(`/api/v1/payroll`);
    return response.data;
  },
  
  getById: async (id: string): Promise<PayrollDto> => {
    const response = await api.get(`/api/v1/payroll/${id}`);
    return response.data;
  },
  
  create: async (data: Partial<PayrollDto>): Promise<PayrollDto> => {
    const response = await api.post(`/api/v1/payroll`, data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<PayrollDto>): Promise<PayrollDto> => {
    const response = await api.put(`/api/v1/payroll/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/payroll/${id}`);
  }
};
