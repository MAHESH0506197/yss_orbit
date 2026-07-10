// yss_orbit\frontend\src\modules\notification\pages\NotificationPreferencePage.tsx
import React, { useState } from 'react';
import { ChannelSelector } from './components/ChannelSelector';

export const NotificationPreferencePage: React.FC = () => {
  const [emailSelected, setEmailSelected] = useState<string[]>(['Email']);
  const [pushSelected, setPushSelected] = useState<string[]>(['Push']);

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Notification Preferences</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">System Alerts</h2>
          <ChannelSelector channels={['Email', 'Push', 'SMS']} selected={emailSelected} onChange={setEmailSelected} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Marketing Updates</h2>
          <ChannelSelector channels={['Email', 'Push', 'SMS']} selected={pushSelected} onChange={setPushSelected} />
        </div>
      </div>
    </div>
  );
};
