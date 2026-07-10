// yss_orbit\frontend\src\modules\notification\components\NotificationList.tsx
import React from 'react';
import { NotificationItem } from './NotificationItem';
import { Notification } from '../types/notificationTypes';

export const NotificationList: React.FC<{ notifications: Notification[], onMarkRead: (id: any) => void }> = ({ notifications, onMarkRead }) => {
  if (notifications.length === 0) {
    return <div className="p-4 text-center text-gray-500">No new notifications.</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-100">
      {notifications.map(n => (
        
        <NotificationItem key={n.id} notification={n} onRead={onMarkRead} />
      ))}
    </div>
  );
};
