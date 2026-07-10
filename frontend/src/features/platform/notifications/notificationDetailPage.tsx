// yss_orbit\frontend\src\modules\notification\pages\notificationDetailPage.tsx
import React from 'react';
import { useParams } from 'react-router-dom';

export const NotificationDetailPage: React.FC = () => {
  const { id } = useParams();

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Notification Detail: {id}</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <p>Full view of a specific notification and its context.</p>
      </div>
    </div>
  );
};
