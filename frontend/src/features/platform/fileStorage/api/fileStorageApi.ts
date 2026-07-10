// yss_orbit\frontend\src\modules\fileStorage\api\fileStorageApi.ts
import api from '@/api/apiConfig';

export interface FilestorageDto {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export const fileStorageApi = {
  getAll: async (): Promise<FilestorageDto[]> => {
    const response = await api.get(`/fileStorage`);
    return response.data;
  },
  
  getById: async (id: string): Promise<FilestorageDto> => {
    const response = await api.get(`/fileStorage/${id}`);
    return response.data;
  },
  
  create: async (data: Partial<FilestorageDto>): Promise<FilestorageDto> => {
    const response = await api.post(`/fileStorage`, data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<FilestorageDto>): Promise<FilestorageDto> => {
    const response = await api.put(`/fileStorage/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/fileStorage/${id}`);
  }
};
