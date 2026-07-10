// yss_orbit\frontend\src\core\notifications\toastManager.ts
import { useNotificationStore } from './notificationStore';

export const toastManager = {
  success: (message: string) => {
    useNotificationStore.getState().addNotification({ type: 'success', message });
  },
  error: (message: string) => {
    useNotificationStore.getState().addNotification({ type: 'error', message });
  },
  info: (message: string) => {
    useNotificationStore.getState().addNotification({ type: 'info', message });
  },
  warning: (message: string) => {
    useNotificationStore.getState().addNotification({ type: 'warning', message });
  }
};
