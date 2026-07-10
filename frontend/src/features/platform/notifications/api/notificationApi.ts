// yss_orbit\frontend\src\modules\notification\api\notificationApi.ts
import api from '@/api/apiConfig';

export interface NotificationDto {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export const notificationApi = {
  getAll: async (): Promise<NotificationDto[]> => {
    // TODO(PROJ-001): Re-enable once the backend Notification module is built.
    // const response = await api.get(`/api/v1/notifications`);
    // return response.data;
    return [];
  },
  
  getById: async (id: string): Promise<NotificationDto> => {
    const response = await api.get(`/api/v1/notification/${id}`);
    return response.data;
  },
  
  create: async (data: Partial<NotificationDto>): Promise<NotificationDto> => {
    const response = await api.post(`/api/v1/notification`, data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<NotificationDto>): Promise<NotificationDto> => {
    const response = await api.put(`/api/v1/notification/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/notification/${id}`);
  }
};
