// yss_orbit\frontend\src\modules\notification\components\notificationCard.tsx
import React from 'react';
import { Notification } from '../types/notificationTypes';
import { NotificationItem } from './NotificationItem';

export const NotificationCard: React.FC<{ notification: Notification }> = ({ notification }) => {
  return <NotificationItem notification={notification} />;
};
