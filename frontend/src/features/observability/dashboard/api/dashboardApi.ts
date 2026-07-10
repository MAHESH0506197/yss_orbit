// yss_orbit\frontend\src\modules\dashboard\api\dashboardApi.ts
import api from '@/api/apiConfig';

export interface DashboardDto {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export const dashboardApi = {
  getAll: async (): Promise<DashboardDto[]> => {
    const response = await api.get(`/dashboard`);
    return response.data;
  },
  
  getById: async (id: string): Promise<DashboardDto> => {
    const response = await api.get(`/dashboard/${id}`);
    return response.data;
  },
  
  create: async (data: Partial<DashboardDto>): Promise<DashboardDto> => {
    const response = await api.post(`/dashboard`, data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<DashboardDto>): Promise<DashboardDto> => {
    const response = await api.put(`/dashboard/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/dashboard/${id}`);
  }
};
