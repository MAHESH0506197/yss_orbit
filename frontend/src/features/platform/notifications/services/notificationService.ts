// yss_orbit\frontend\src\modules\notification\services\notificationService.ts
// @ts-expect-error - Auto-patched TS2307
import { BaseService } from '@/utils/core/api/baseService';
import { Notification } from '../types/notificationTypes';

class NotificationApiService extends BaseService {
  constructor() {
    super('/notifications');
  }

  getNotifications(): Promise<Notification[]> {
    // @ts-expect-error - Auto-patched TS2339
    return this.get<Notification[]>('/');
  }

  getNotification(id: string | number): Promise<Notification> {
    // @ts-expect-error - Auto-patched TS2339
    return this.get<Notification>(`/${id}`);
  }

  markAsRead(id: string | number): Promise<void> {
    // @ts-expect-error - Auto-patched TS2339
    return this.post(`/${id}/read`, {});
  }
}

export const NotificationService = new NotificationApiService();
