import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { useTenantContext } from '@/store/context/TenantContext';
import { User, Mail, Clock, ShieldCheck, Calendar, Save } from 'lucide-react';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { formatIST } from '@/utils/date';

interface Assignment {
  business_unit_name: string;
  domain: string;
  organization_name: string;
}

interface ProfileData {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  timezone: string;
  language: string;
  is_active: boolean;
  is_email_verified: boolean;
  mfa_enabled: boolean;
  created_at: string;
  last_login_at: string;
  last_login_ip: string;
  avatar?: string;
  assignments: Assignment[];
}

interface ProfileFormData {
  first_name: string;
  last_name: string;
  username: string;
  mfa_enabled: boolean;
  timezone: string;
  language: string;
}

export function ProfileForm() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { businessUnit } = useTenantContext();

  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ['profile', 'me'],
    queryFn: async () => {
      const res = await api.get('/api/v1/profile/me/');
      return res.data;
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const res = await api.patch('/api/v1/profile/me/', data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      useAuthStore.setState({ 
        firstName: data.first_name, 
        lastName: data.last_name,
        timezone: data.timezone,
        language: data.language
      });
      toast.success(t('profile.saving', 'Profile updated successfully!'), {
        duration: 4000,
        position: 'top-right',
      });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Failed to update profile. Please check the inputs.';
      toast.error(msg, {
        duration: 5000,
        position: 'top-right',
      });
    }
  });

  const { register, control, handleSubmit, reset, formState: { isSubmitting, isDirty } } = useForm<ProfileFormData>({
    defaultValues: {
      first_name: '',
      last_name: '',
      username: '',
      mfa_enabled: false,
      timezone: 'UTC',
      language: 'en'
    }
  });

  useEffect(() => {
    if (profile) {
      reset({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        username: profile.username || '',
        mfa_enabled: profile.mfa_enabled || false,
        timezone: profile.timezone || 'UTC',
        language: profile.language || 'en'
      });
    }
  }, [profile, reset]);

  const onSubmit = (data: ProfileFormData) => {
    mutation.mutate(data);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading profile...</div>;
  if (!profile) return <div className="p-8 text-center text-red-500">Failed to load profile.</div>;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="w-full space-y-6"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Editable Fields */}
        <motion.div variants={itemVariants} className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm p-6 sm:p-8 hover:shadow-md transition-shadow">
          <div className="mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('profile.personal_info')}</h3>
            <p className="text-sm text-gray-500">{t('profile.personal_info_desc')}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1"><User size={14}/> {t('profile.username')}</label>
              <input
                {...register('username')}
                className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary dark:text-white outline-none transition-all font-mono"
                placeholder="Enter username"
              />
            </div>
            
            <div className="space-y-2 flex flex-col justify-end">
              <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1"><ShieldCheck size={14} className="text-primary"/> {t('profile.mfa')}</h4>
                  <p className="text-xs text-gray-500">{t('profile.mfa_desc')}</p>
                </div>
                <Controller
                  name="mfa_enabled"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={value}
                      onClick={() => onChange(!value)}
                      className={cn(
                        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                        value ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"
                      )}
                    >
                      <span className="sr-only">Toggle MFA</span>
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                          value ? "translate-x-5" : "translate-x-0"
                        )}
                      />
                    </button>
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('profile.first_name')}</label>
              <input
                {...register('first_name')}
                className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary dark:text-white outline-none transition-all"
                placeholder="Enter first name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('profile.last_name')}</label>
              <input
                {...register('last_name')}
                className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary dark:text-white outline-none transition-all"
                placeholder="Enter last name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('profile.timezone')}</label>
              <select
                {...register('timezone')}
                className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary dark:text-white outline-none transition-all"
              >
                <option value="UTC">UTC</option>
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('profile.language')}</label>
              <select
                {...register('language')}
                className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary dark:text-white outline-none transition-all"
              >
                <option value="en">English (US)</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="te">Telugu (తెలుగు)</option>
                <option value="hi">Hindi (हिंदी)</option>
              </select>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={!isDirty || isSubmitting || mutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {(isSubmitting || mutation.isPending) ? (
                <span className="flex items-center gap-2"><Clock size={16} className="animate-spin" /> {t('profile.saving')}</span>
              ) : (
                <span className="flex items-center gap-2"><Save size={16} /> {t('profile.save')}</span>
              )}
            </button>
          </div>
        </motion.div>

        {/* Read-Only / Locked Fields */}
        <motion.div variants={itemVariants} className="rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 shadow-sm p-6 sm:p-8 hover:shadow-md transition-shadow">
          <div className="mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <ShieldCheck size={20} className="text-gray-400" /> {t('profile.system_metadata')}
            </h3>
            <p className="text-sm text-gray-500">{t('profile.system_metadata_desc')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-80">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5"><Mail size={12}/> {t('profile.email')}</label>
              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-100 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-400 cursor-not-allowed">
                <span>{profile.email}</span>
                {profile.is_email_verified && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">Verified</span>}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5"><Calendar size={12}/> {t('profile.member_since')}</label>
              <div className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-400 cursor-not-allowed">
                {formatIST(profile.created_at, 'MMM dd, yyyy')}
              </div>
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5"><Clock size={12}/> {t('profile.last_login')}</label>
              <div className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-400 cursor-not-allowed flex items-center gap-2">
                <span>{profile.last_login_at ? formatIST(profile.last_login_at) : t('profile.never')}</span>
                {profile.last_login_ip && <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-full">{profile.last_login_ip}</span>}
              </div>
            </div>
          </div>
        </motion.div>

      </form>
    </motion.div>
  );
}
