// yss_orbit\frontend\src\modules\notification\components\NotificationItem.tsx
import React from 'react';
import { Notification } from '../types/notificationTypes';
import { formatIST } from '@/utils/date';

export const NotificationItem: React.FC<{ notification: Notification, onRead?: (id: any) => void }> = ({ notification, onRead }) => {
  return (
    <div className={`p-4 border-b border-gray-100 ${notification.isRead ? 'bg-white' : 'bg-blue-50'} flex justify-between items-start`}>
      <div>
        <h4 className={`text-sm ${notification.isRead ? 'font-medium text-gray-800' : 'font-bold text-gray-900'}`}>{notification.title}</h4>
        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
        
        <span className="text-xs text-gray-500 mt-2 block">{formatIST(new Date(notification.createdAt as any), 'PP pp')}</span>
      </div>
      {!notification.isRead && onRead && (
        
        <button onClick={() => onRead(notification.id)} className="text-xs text-[var(--primary-color)] hover:underline">
          Mark as read
        </button>
      )}
    </div>
  );
};
