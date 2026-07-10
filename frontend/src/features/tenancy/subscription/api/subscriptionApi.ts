// yss_orbit\frontend\src\modules\subscription\api\subscriptionApi.ts
import api from '@/api/apiConfig';

export interface SubscriptionDto {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export const subscriptionApi = {
  getAll: async (): Promise<SubscriptionDto[]> => {
    const response = await api.get(`/subscription`);
    return response.data;
  },
  
  getById: async (id: string): Promise<SubscriptionDto> => {
    const response = await api.get(`/subscription/${id}`);
    return response.data;
  },
  
  create: async (data: Partial<SubscriptionDto>): Promise<SubscriptionDto> => {
    const response = await api.post(`/subscription`, data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<SubscriptionDto>): Promise<SubscriptionDto> => {
    const response = await api.put(`/subscription/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/subscription/${id}`);
  }
};
