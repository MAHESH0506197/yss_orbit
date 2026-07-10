import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import api from '@/api/client';
import { Lock, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export function ChangePasswordForm() {
  const { t } = useTranslation();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm({
    defaultValues: {
      old_password: '',
      new_password: '',
      confirm_password: ''
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/auth/password/change/', data);
      return res.data;
    },
    onSuccess: () => {
      reset();
      toast.success(t('password.update') + ' ' + t('profile.saving'), {
        duration: 4000,
        position: 'top-right',
      });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to change password. Please check your current password.';
      toast.error(msg, {
        duration: 5000,
        position: 'top-right',
      });
    }
  });

  const onSubmit = (data: any) => {
    if (data.new_password !== data.confirm_password) {
      toast.error("New passwords do not match.", { position: 'top-right' });
      return;
    }
    mutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Lock size={20} className="text-primary" /> {t('password.title')}
        </h3>
        <p className="text-sm text-gray-500">{t('password.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('password.current')}</label>
            <input
              type="password"
              {...register('old_password')}
              className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary dark:text-white outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('password.new')}</label>
            <input
              type="password"
              {...register('new_password')}
              className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary dark:text-white outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('password.confirm')}</label>
            <input
              type="password"
              {...register('confirm_password')}
              className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary dark:text-white outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <div className="mt-8">
            <button
              type="submit"
              disabled={!isDirty || isSubmitting || mutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 dark:bg-white px-6 py-2.5 text-sm font-semibold text-white dark:text-gray-900 shadow-md hover:bg-gray-800 dark:hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {(isSubmitting || mutation.isPending) ? (
                <span className="flex items-center gap-2"><Clock size={16} className="animate-spin" /> {t('password.updating')}</span>
              ) : (
                <span className="flex items-center gap-2"><CheckCircle size={16} /> {t('password.update')}</span>
              )}
            </button>
          </div>
        </form>
    </div>
  );
}
