// yss_orbit\frontend\src\modules\notification\state\notificationSlice.ts
import { StateCreator } from 'zustand';
import { Notification } from '../types/notificationTypes';

export interface NotificationSlice {
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
  unreadCount: number;
  setUnreadCount: (count: number) => void;
}

export const createNotificationSlice: StateCreator<NotificationSlice> = (set) => ({
  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
  unreadCount: 0,
  setUnreadCount: (unreadCount) => set({ unreadCount }),
});
