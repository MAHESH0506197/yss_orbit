// yss_orbit\frontend\src\modules\branding\api\brandingApi.ts
import api from '@/api/apiConfig';

export interface BrandingDto {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export const brandingApi = {
  getAll: async (): Promise<BrandingDto[]> => {
    const response = await api.get(`/branding/`);
    return response.data;
  },
  
  getById: async (id: string): Promise<BrandingDto> => {
    const response = await api.get(`/branding/${id}/`);
    return response.data;
  },
  
  create: async (data: Partial<BrandingDto>): Promise<BrandingDto> => {
    const response = await api.post(`/branding/`, data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<BrandingDto>): Promise<BrandingDto> => {
    const response = await api.put(`/branding/${id}/`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/branding/${id}/`);
  }
};

export const fetchPublicTenantConfig = async () => {
  const response = await api.get(`/api/tenant-config/`);
  return response.data;
};
