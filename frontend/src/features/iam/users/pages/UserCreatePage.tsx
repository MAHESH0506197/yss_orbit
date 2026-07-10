import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import {
  User, ShieldAlert, Save, ArrowLeft, Loader2, Info, Eye, Type, Globe, Mail, Phone, Lock, Hash, UserPlus, MessageSquare
} from 'lucide-react';

import { useCreateUser } from '@/features/iam/users/hooks/useUserMutations';
import { userCreateSchema, UserCreatePayload } from '@/features/iam/users/types/userTypes';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionCard } from '@/components/platform/SectionCard';

// ── Miniature Live Preview Component ─────────────────────────────────────────
const PreviewCard: React.FC<{
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  isActive: boolean;
  isSuperAdmin: boolean;
}> = ({ firstName, lastName, username, email, isActive, isSuperAdmin }) => {
  const displayName = firstName || lastName ? `${firstName || ''} ${lastName || ''}`.trim() : (username || 'New User');
  const initial = (firstName || username || '?').charAt(0).toUpperCase();

  const colors: [string, string][] = [
    ['#6366f1', '#8b5cf6'], ['#0ea5e9', '#6366f1'], ['#10b981', '#0ea5e9'],
    ['#f59e0b', '#ef4444'], ['#ec4899', '#8b5cf6'],
  ];
  const [c1, c2] = colors[displayName.charCodeAt(0) % colors.length]!;

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${isActive ? 'border-violet-200 dark:border-violet-800' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-900 p-5 shadow-sm transition-all duration-300`}>
      {/* Decorative gradient blob */}
      <div className={`absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl opacity-20 transition-colors ${isActive ? 'bg-fuchsia-500' : 'bg-gray-400'}`} />

      <div className="relative z-10 flex items-start gap-4">
        {/* Avatar */}
        <div 
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-sm text-white font-black text-xl select-none"
          style={{ background: `linear-gradient(135deg, ${c1}, ${c2})`, boxShadow: `0 4px 12px ${c1}55` }}
        >
          {initial}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <h4 className={`truncate font-bold text-base ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
              {displayName}
            </h4>
            <div className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-400' : 'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}>
              {isActive ? 'Active' : 'Inactive'}
            </div>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <code className="rounded border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-1.5 py-0.5 text-[10px] font-bold text-gray-500 tracking-widest">
              @{username || 'USERNAME'}
            </code>
            {isSuperAdmin && (
               <span className="inline-flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:border-rose-800 dark:bg-rose-500/10 dark:text-rose-400">
                 <ShieldAlert className="h-3 w-3" /> Super Admin
               </span>
            )}
          </div>
          <p className="mt-2 truncate text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            {email || 'user@example.com'}
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────
export const UserCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const createMutation = useCreateUser();

  const [showExitPrompt, setShowExitPrompt] = useState(false);
  const backUrl = '/platform/user-management';

  const { register, handleSubmit, formState: { errors, isDirty, isSubmitting }, watch, control } = useForm<UserCreatePayload>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      phone_number: '',
      language: 'en',
      timezone: 'Asia/Kolkata',
      is_active: true,
      is_super_admin: false,
    },
    mode: 'onChange',
  });

  const firstNameWatch = watch('first_name') || '';
  const lastNameWatch = watch('last_name') || '';
  const usernameWatch = watch('username') || '';
  const emailWatch = watch('email') || '';
  const isActiveWatch = watch('is_active');
  const isSuperAdminWatch = watch('is_super_admin');

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) e.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSubmit(onSubmit)();
      }
      if (e.key === 'Escape') {
        if (isDirty) setShowExitPrompt(true);
        else navigate(backUrl);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirty, navigate, handleSubmit]);

  const onSubmit = async (data: UserCreatePayload) => {
    try {
      if (!data.password) {
        toast.error('Password is required for new users.');
        return;
      }
      await createMutation.mutateAsync(data);
      toast.success('User created successfully');
      navigate(backUrl);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'An error occurred while saving the user.');
    }
  };

  const isBusy = isSubmitting || createMutation.isPending;

  return (
    <>
      {showExitPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-2xl border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Discard changes?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              You have unsaved changes. Are you sure you want to leave this page? Your changes will be lost.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setShowExitPrompt(false)} className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Cancel
              </button>
              <button onClick={() => navigate(backUrl)} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-rose-500 transition-colors">
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex h-full flex-col bg-gray-50/50 dark:bg-[#0a0a0a] animate-fadeInUp">
        <PageHeader
          icon={UserPlus}
          title="Create User"
          breadcrumbs={[
            { label: 'IAM', href: '/platform/user-management' },
            { label: 'Users', href: backUrl },
            { label: 'Create User' }
          ]}
          actions={
            <div className="flex items-center gap-3">
              <button
                onClick={() => isDirty ? setShowExitPrompt(true) : navigate(backUrl)}
                className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                type="button"
              >
                <ArrowLeft className="h-4 w-4" /> Cancel <kbd className="hidden sm:inline-block ml-1 font-sans text-xs text-gray-400">esc</kbd>
              </button>
              <button
                onClick={handleSubmit(onSubmit)}
                disabled={isBusy}
                className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-violet-500 hover:shadow disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                type="button"
              >
                {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save User
              </button>
            </div>
          }
        />

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* LEFT COLUMN - FORM */}
              <div className="xl:col-span-2 space-y-6">
                
                <SectionCard title="Identity Details" icon={User} iconColor="text-violet-500" animDelay="delay-50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">First Name</label>
                      <div className="relative">
                        <Type className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                        <input {...register('first_name')} autoComplete="off" className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 py-2.5 pl-10 pr-4 text-sm focus:border-violet-500 focus:ring-violet-500 dark:text-white transition-all" placeholder="John" />
                      </div>
                      {errors.first_name && <p className="mt-1 text-xs text-rose-500">{errors.first_name.message}</p>}
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">Last Name</label>
                      <div className="relative">
                        <Type className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                        <input {...register('last_name')} autoComplete="off" className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 py-2.5 pl-10 pr-4 text-sm focus:border-violet-500 focus:ring-violet-500 dark:text-white transition-all" placeholder="Doe" />
                      </div>
                      {errors.last_name && <p className="mt-1 text-xs text-rose-500">{errors.last_name.message}</p>}
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">Username *</label>
                      <div className="relative">
                        <Hash className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                        <input {...register('username')} autoComplete="off" className={`block w-full rounded-xl border ${errors.username ? 'border-rose-500 ring-rose-500' : 'border-gray-200 dark:border-gray-700 focus:border-violet-500 focus:ring-violet-500'} bg-gray-50/50 dark:bg-gray-800/50 py-2.5 pl-10 pr-4 text-sm dark:text-white transition-all`} placeholder="john.doe" />
                      </div>
                      {errors.username && <p className="mt-1 text-xs text-rose-500">{errors.username.message}</p>}
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">Email Address *</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                        <input {...register('email')} type="email" autoComplete="off" className={`block w-full rounded-xl border ${errors.email ? 'border-rose-500 ring-rose-500' : 'border-gray-200 dark:border-gray-700 focus:border-violet-500 focus:ring-violet-500'} bg-gray-50/50 dark:bg-gray-800/50 py-2.5 pl-10 pr-4 text-sm dark:text-white transition-all`} placeholder="john.doe@example.com" />
                      </div>
                      {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>}
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                        <input {...register('phone_number')} type="tel" autoComplete="off" className={`block w-full rounded-xl border ${errors.phone_number ? 'border-rose-500 ring-rose-500' : 'border-gray-200 dark:border-gray-700 focus:border-violet-500 focus:ring-violet-500'} bg-gray-50/50 dark:bg-gray-800/50 py-2.5 pl-10 pr-4 text-sm dark:text-white transition-all`} placeholder="+1 234 567 8900" />
                      </div>
                      {errors.phone_number && <p className="mt-1 text-xs text-rose-500">{errors.phone_number.message}</p>}
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Security & Access" icon={ShieldAlert} iconColor="text-rose-500" animDelay="delay-100">
                  <div className="space-y-6">
                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">Temporary Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                        <input {...register('password')} type="password" autoComplete="new-password" className={`block w-full rounded-xl border ${errors.password ? 'border-rose-500 ring-rose-500' : 'border-gray-200 dark:border-gray-700 focus:border-violet-500 focus:ring-violet-500'} bg-gray-50/50 dark:bg-gray-800/50 py-2.5 pl-10 pr-4 text-sm dark:text-white transition-all`} placeholder="Min 8 characters" />
                      </div>
                      {errors.password && <p className="mt-1 text-xs text-rose-500">{errors.password.message}</p>}
                    </div>

                    <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 p-4">
                      <Controller
                        name="is_active"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-bold text-gray-900 dark:text-white">Active Status</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">If inactive, the user cannot log into the platform.</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => onChange(!value)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                          </div>
                        )}
                      />
                    </div>

                    <div className="rounded-xl border border-rose-100 dark:border-rose-900/30 bg-rose-50/50 dark:bg-rose-900/10 p-4">
                      <Controller
                        name="is_super_admin"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-bold text-rose-900 dark:text-rose-100 flex items-center gap-2">
                                <ShieldAlert className="h-4 w-4" /> Super Admin Access
                              </h4>
                              <p className="text-sm text-rose-700/70 dark:text-rose-200/60 mt-1">Grants unrestricted access across all modules and tenants. Use with extreme caution.</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => onChange(!value)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-rose-600' : 'bg-rose-200 dark:bg-rose-950'}`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                          </div>
                        )}
                      />
                    </div>
                  </div>
                </SectionCard>



                <SectionCard title="Audit Information" icon={MessageSquare} iconColor="text-indigo-500" animDelay="delay-200">
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">
                        Reason for Creation
                        <span className="ml-1 text-xs font-normal text-gray-500">(Optional)</span>
                      </label>
                      <div className="relative">
                        <textarea
                          {...register('reason')}
                          rows={2}
                          placeholder="e.g. New employee onboarding, External contractor"
                          className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-2.5 px-4 text-sm focus:border-violet-500 focus:ring-violet-500 dark:text-white transition-all placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>

              {/* RIGHT COLUMN - PREVIEW */}
              <div className="xl:col-span-1 space-y-6">
                <div className="sticky top-24 animate-fadeInUp delay-200">
                  <div className="mb-3 flex items-center justify-between px-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                      <Eye className="h-3.5 w-3.5" /> Live Preview
                    </h3>
                  </div>
                  <PreviewCard 
                    firstName={firstNameWatch} 
                    lastName={lastNameWatch} 
                    username={usernameWatch} 
                    email={emailWatch} 
                    isActive={isActiveWatch} 
                    isSuperAdmin={isSuperAdminWatch} 
                  />
                  
                  <div className="mt-6 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 p-5">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-indigo-900 dark:text-indigo-300 mb-2">
                      <Info className="h-4 w-4" /> About User Management
                    </h4>
                    <p className="text-xs text-indigo-700/80 dark:text-indigo-200/70 leading-relaxed">
                      Users require a temporary password upon creation. They will be prompted to reset it on first login. 
                      Roles and Business Unit Access are assigned separately after the user is created from the User Details page.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="border-t border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between animate-fadeInUp z-40">
          <p className="text-sm text-gray-500 font-medium">Please review all details before saving.</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => isDirty ? setShowExitPrompt(true) : navigate(backUrl)}
              className="px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={isBusy}
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/30 hover:bg-violet-500 hover:shadow-xl hover:shadow-violet-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
              type="button"
            >
              {isBusy ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Save className="h-4.5 w-4.5" />}
              Create User
            </button>
          </div>
        </div>

      </div>
    </>
  );
};

export default UserCreatePage;
