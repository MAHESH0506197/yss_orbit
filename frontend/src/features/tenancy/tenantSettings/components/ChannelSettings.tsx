// yss_orbit\frontend\src\modules\tenantSettings\components\ChannelSettings.tsx
import React from 'react';
import { BellRing, Mail, MessageSquare, Smartphone } from 'lucide-react';

export const ChannelSettings: React.FC<{ settings: any, onChange: (settings: any) => void }> = ({ settings, onChange }) => {
  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-gray-900/50">
        <h3 className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
          <BellRing className="h-5 w-5 text-indigo-500" />
          Communication Channels
        </h3>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        <label className="flex cursor-pointer items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/50 group">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">Email Notifications</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Receive alerts directly to your inbox</div>
            </div>
          </div>
          <div className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full">
            <input type="checkbox" className="peer sr-only" checked={settings?.emailEnabled || false} onChange={e => onChange({ ...settings, emailEnabled: e.target.checked })} />
            <div className="h-6 w-11 rounded-full bg-gray-200 transition-colors peer-checked:bg-indigo-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 peer-focus:ring-offset-2 dark:bg-gray-700 dark:peer-focus:ring-offset-gray-950" />
            <div className="absolute left-[2px] top-[2px] h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
          </div>
        </label>
        
        <label className="flex cursor-pointer items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/50 group">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">SMS Notifications</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Critical alerts sent via text message</div>
            </div>
          </div>
          <div className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full">
            <input type="checkbox" className="peer sr-only" checked={settings?.smsEnabled || false} onChange={e => onChange({ ...settings, smsEnabled: e.target.checked })} />
            <div className="h-6 w-11 rounded-full bg-gray-200 transition-colors peer-checked:bg-indigo-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 peer-focus:ring-offset-2 dark:bg-gray-700 dark:peer-focus:ring-offset-gray-950" />
            <div className="absolute left-[2px] top-[2px] h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
          </div>
        </label>
        
        <label className="flex cursor-pointer items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/50 group">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-900/30 dark:text-fuchsia-400">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">Push Notifications</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">In-app and browser push alerts</div>
            </div>
          </div>
          <div className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full">
            <input type="checkbox" className="peer sr-only" checked={settings?.pushEnabled || false} onChange={e => onChange({ ...settings, pushEnabled: e.target.checked })} />
            <div className="h-6 w-11 rounded-full bg-gray-200 transition-colors peer-checked:bg-indigo-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 peer-focus:ring-offset-2 dark:bg-gray-700 dark:peer-focus:ring-offset-gray-950" />
            <div className="absolute left-[2px] top-[2px] h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
          </div>
        </label>
      </div>
    </div>
  );
};
