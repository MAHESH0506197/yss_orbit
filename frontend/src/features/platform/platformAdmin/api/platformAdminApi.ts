// yss_orbit\frontend\src\modules\platformAdmin\api\platformAdminApi.ts
import api from '@/api/apiConfig';

export interface PlatformadminDto {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export const platformAdminApi = {
  getAll: async (): Promise<PlatformadminDto[]> => {
    const response = await api.get(`/platformAdmin`);
    return response.data;
  },
  
  getById: async (id: string): Promise<PlatformadminDto> => {
    const response = await api.get(`/platformAdmin/${id}`);
    return response.data;
  },
  
  create: async (data: Partial<PlatformadminDto>): Promise<PlatformadminDto> => {
    const response = await api.post(`/platformAdmin`, data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<PlatformadminDto>): Promise<PlatformadminDto> => {
    const response = await api.put(`/platformAdmin/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/platformAdmin/${id}`);
  }
};
