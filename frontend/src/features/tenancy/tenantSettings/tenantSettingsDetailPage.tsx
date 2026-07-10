// yss_orbit\frontend\src\modules\tenantSettings\pages\tenantSettingsDetailPage.tsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SettingsForm } from '@/features/tenancy/tenantSettings/components/SettingsForm';
import { ChannelSettings } from '@/features/tenancy/tenantSettings/components/ChannelSettings';
import { ArrowLeft, Settings2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const TenantSettingsDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const handleSave = (data: any) => {
    console.log('Saved settings:', data);
    toast.success('Settings saved successfully');
  };

  const handleChannelSave = (data: any) => {
    console.log('Saved channel settings:', data);
    toast.success('Channel preferences updated');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="space-y-1">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </button>
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-600 shadow-lg shadow-indigo-500/30">
              <Settings2 className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white capitalize">
              {id?.replace('-', ' ')} Settings
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl pl-[62px]">
            Configure and manage specific settings for this organization tenant.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <SettingsForm onSubmit={handleSave} />
        </div>
        
        <ChannelSettings settings={{}} onChange={handleChannelSave} />
      </div>
    </div>
  );
};
