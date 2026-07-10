import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { ImageCropModal } from './components/ImageCropModal';
import { ProfileForm } from './components/ProfileForm';
import { ChangePasswordForm } from './components/ChangePasswordForm';
import { UserProfileHeader } from '@/features/iam/users/components/UserProfileHeader';
import { useTranslation } from 'react-i18next';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Globe, ShieldAlert, ShieldCheck, Activity, Smartphone, Monitor, Loader2 } from 'lucide-react';
import { useSessions } from './hooks/useSessions';
import { formatDistanceToNow, parseISO } from 'date-fns';

const parseUserAgent = (ua: string) => {
  if (!ua) return 'Unknown Device';
  let browser = 'Unknown Browser';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';

  let os = 'Unknown OS';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return `${browser} on ${os}`;
};

export default function ProfilePage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'security' | 'access' | 'activity'>('overview');
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  
  const { sessions, isLoading: isLoadingSessions, revokeSession, isRevoking } = useSessions();

  const { data: profile, isLoading } = useQuery<any>({
    queryKey: ['profile', 'me'],
    queryFn: async () => {
      const res = await api.get('/profile/me/');
      return res.data;
    }
  });

  if (isLoading) return <LoadingScreen />;
  if (!profile) return null;

  // Derive stats
  const buCount = profile.assignments?.length || 0;
  
  // Calculate unique roles from actual assignment data
  const rolesCount = profile.is_super_admin 
    ? 1 
    : new Set(profile.assignments?.map((a: any) => a.role_name).filter(Boolean)).size;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File exceeds 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImageSrc(reader.result as string);
      setCropModalOpen(true);
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleCropApply = async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);

    const loadingToast = toast.loading('Uploading avatar...');
    try {
      const res = await api.put('/profile/me/avatar/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      useAuthStore.setState({ avatar: res.data.avatar });
      toast.success('Avatar updated successfully!', { id: loadingToast });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload avatar', { id: loadingToast });
    }
  };

  const handleAvatarDelete = async () => {
    const loadingToast = toast.loading('Removing avatar...');
    try {
      await api.delete('/profile/me/avatar/');
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      useAuthStore.setState({ avatar: null });
      toast.success('Avatar removed.', { id: loadingToast });
    } catch (err: any) {
      toast.error('Failed to remove avatar', { id: loadingToast });
    }
  };

  return (
    <div className="w-full bg-gray-50/50 dark:bg-gray-950/50 min-h-screen">
      <ImageCropModal
        isOpen={cropModalOpen}
        imageSrc={selectedImageSrc}
        onClose={() => {
          setCropModalOpen(false);
          setSelectedImageSrc(null);
        }}
        onApply={handleCropApply}
      />
      <div className="p-6 max-w-7xl mx-auto w-full">
        <UserProfileHeader 
          user={profile}
          stats={{ buCount, rolesCount }}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as any)}
          isReadOnly={true}
          onAvatarUpload={handleAvatarUpload}
          onAvatarDelete={handleAvatarDelete}
          tabs={[
            { id: 'overview', label: 'Overview', icon: Globe },
            { id: 'security', label: 'Security', icon: ShieldAlert },
            { id: 'access', label: 'My Access', icon: ShieldCheck },
            { id: 'activity', label: 'Activity', icon: Activity }
          ]}
        />

        <div className="mt-6">
          {activeTab === 'overview' && (
            <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm p-6">
               <ProfileForm />
            </div>
          )}
          
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm p-6">
                 <ChangePasswordForm />
              </div>
              
              <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm p-6">
                <div className="mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <ShieldAlert size={20} className="text-primary" /> Active Sessions
                  </h3>
                  <p className="text-sm text-gray-500">Manage your active sessions across all devices.</p>
                </div>
                
                {isLoadingSessions ? (
                  <div className="flex justify-center p-8 text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sessions?.map((session) => {
                      const deviceStr = session.device_info || parseUserAgent(session.user_agent);
                      const isMobile = deviceStr.includes('Android') || deviceStr.includes('iOS');
                      const DeviceIcon = isMobile ? Smartphone : Monitor;

                      return (
                        <div 
                          key={session.id} 
                          className={`flex items-center justify-between p-4 border rounded-xl transition-colors ${
                            session.is_current 
                              ? 'border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-900/10' 
                              : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-700'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center shadow-sm ${
                              session.is_current ? 'bg-white dark:bg-gray-800 text-indigo-600' : 'bg-white dark:bg-gray-800 text-gray-500'
                            }`}>
                              <DeviceIcon className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                {deviceStr}
                                {session.ip_address && (
                                  <span className="text-xs font-normal text-gray-400 dark:text-gray-500">({session.ip_address})</span>
                                )}
                              </div>
                              <div className="mt-0.5">
                                {session.is_current ? (
                                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Current Session • Active now</div>
                                ) : (
                                  <div className="text-xs text-gray-500">
                                    Last active: {session.last_active_at ? formatDistanceToNow(parseISO(session.last_active_at), { addSuffix: true }) : 'Unknown'}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          {!session.is_current && (
                            <button 
                              onClick={() => revokeSession(session.id)}
                              disabled={isRevoking}
                              className="text-sm text-rose-600 hover:text-rose-700 font-medium px-3 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors disabled:opacity-50"
                            >
                              Sign Out
                            </button>
                          )}
                        </div>
                      );
                    })}
                    
                    {sessions?.length === 0 && (
                      <div className="text-center p-8 text-gray-500">
                        No active sessions found.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'access' && (
            <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm p-6">
               <h3 className="text-lg font-bold mb-4">My Access</h3>
               <p className="text-sm text-gray-500 mb-6">A read-only view of your current assignments.</p>
               {profile.assignments?.length > 0 ? (
                 <div className="space-y-4">
                   {profile.assignments.map((assignment: any, i: number) => (
                     <div key={i} className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-800/50">
                       <div className="flex items-center gap-3">
                         <ShieldCheck className="h-5 w-5 text-indigo-500" />
                         <div>
                           <div className="font-semibold text-sm">{assignment.business_unit_name}</div>
                           <div className="text-xs text-gray-500">{assignment.organization_name}</div>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-8 text-gray-500">No active assignments.</div>
               )}
            </div>
          )}

          {activeTab === 'activity' && (
             <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm p-6">
               <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
               <div className="text-center py-8 text-gray-500">No recent activity found.</div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
