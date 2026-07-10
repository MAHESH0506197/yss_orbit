import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, User, ShieldAlert, Globe, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';

import { useCreateUser, useUpdateUser } from '../hooks/useUserMutations';
import { useAuthStore } from '@/store/authStore';
import type { User as UserType, UserCreatePayload } from '../types/userTypes';

const userSchema = z.object({
  username: z.string().min(4, 'Username must be at least 4 characters').regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]+$/, 'Username must contain an uppercase letter, lowercase letter, number, and special character'),
  email: z.string().email('Invalid email format'),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone_number: z.string().optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
  is_active: z.boolean().optional(),
  is_super_admin: z.boolean().optional(),
  password: z.string().optional(),
  reason: z.string().optional(),
});

type UserFormData = z.infer<typeof userSchema>;
type Tab = 'identity' | 'security' | 'preferences';

export function UserFormModal({ isOpen, onClose, userToEdit }: { isOpen: boolean; onClose: () => void; userToEdit?: UserType | null }) {
  const isEditing = !!userToEdit;
  const [activeTab, setActiveTab] = useState<Tab>('identity');
  
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: '', email: '', first_name: '', last_name: '', phone_number: '',
      timezone: 'Asia/Kolkata', language: 'en', is_active: true, is_super_admin: false,
    }
  });

  const isActive = watch('is_active');
  const isSuperAdmin = watch('is_super_admin');

  useEffect(() => {
    if (isOpen) {
      if (userToEdit) {
        reset({
          username: userToEdit.username || '',
          email: userToEdit.email || '',
          first_name: userToEdit.first_name || '',
          last_name: userToEdit.last_name || '',
          phone_number: userToEdit.phone_number || '',
          timezone: userToEdit.timezone || 'Asia/Kolkata',
          language: userToEdit.language || 'en',
          is_active: userToEdit.is_active ?? true,
          is_super_admin: userToEdit.is_super_admin ?? false,
        });
      } else {
        reset({
          username: '', email: '', password: '', first_name: '', last_name: '', phone_number: '',
          timezone: 'Asia/Kolkata', language: 'en', is_active: true, is_super_admin: false,
        });
      }
      setActiveTab('identity');
    }
  }, [isOpen, userToEdit, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: UserFormData) => {
    try {
      if (isEditing && userToEdit) {
        await updateMutation.mutateAsync({ id: userToEdit.id, payload: data as any });
        
        if (useAuthStore.getState().userId === userToEdit.id) {
          useAuthStore.setState({
            firstName: data.first_name,
            lastName: data.last_name,
            email: data.email,
          });
        }
        
        toast.success('User updated successfully');
      } else {
        if (!data.password) {
          toast.error('Password is required for new users.');
          return;
        }
        await createMutation.mutateAsync({ ...data, password: data.password } as unknown as UserCreatePayload);
        toast.success('User created successfully');
      }
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'An error occurred while saving the user.');
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || isSubmitting;

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'identity', label: 'Identity', icon: User },
    { key: 'security', label: 'Security & Roles', icon: ShieldAlert },
    { key: 'preferences', label: 'Preferences', icon: Globe },
  ];

  const inputCls = (err: boolean) =>
    `w-full rounded-xl border ${
      err
        ? 'border-red-300 bg-red-50 text-red-900 dark:bg-red-900/20 dark:border-red-500/50 dark:text-red-300 focus:border-red-500 focus:ring-red-500'
        : 'border-gray-200 bg-gray-50/50 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-800 dark:bg-gray-900/50'
    } px-4 py-2.5 text-sm transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-offset-0`;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[100] bg-gray-900/40 backdrop-blur-sm transition-all" onClick={onClose} />
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <div className="pointer-events-auto flex w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-5 dark:border-gray-800 dark:bg-gray-900">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                {isEditing ? 'Edit User Profile' : 'Create New User'}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {isEditing ? 'Update access and identity details.' : 'Create a new user account on the platform.'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex px-6 border-b border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900/50 overflow-x-auto custom-scrollbar">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 whitespace-nowrap px-4 py-3.5 text-sm font-bold border-b-2 transition-all ${
                    active
                      ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 max-h-[60vh] custom-scrollbar">
            <form id="user-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Identity Tab */}
              <div className={activeTab === 'identity' ? 'block' : 'hidden'}>
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">First Name</label>
                      <input {...register('first_name')} type="text" placeholder="John" className={inputCls(false)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Last Name</label>
                      <input {...register('last_name')} type="text" placeholder="Doe" className={inputCls(false)} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Username <span className="text-rose-500">*</span></label>
                    <input {...register('username')} type="text" placeholder="e.g. jdoe123!" className={inputCls(!!errors.username)} />
                    {errors.username ? <p className="text-xs font-medium text-rose-500 mt-1">{errors.username.message}</p> : <p className="text-xs text-gray-500">Requires upper, lower, number, and special character.</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Email Address <span className="text-rose-500">*</span></label>
                    <input {...register('email')} type="email" placeholder="john@example.com" className={inputCls(!!errors.email)} />
                    {errors.email && <p className="text-xs font-medium text-rose-500 mt-1">{errors.email.message}</p>}
                  </div>

                  {!isEditing && (
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Password <span className="text-rose-500">*</span></label>
                      <input {...register('password')} type="password" placeholder="Enter secure password" className={inputCls(!!errors.password)} />
                      {errors.password ? <p className="text-xs font-medium text-rose-500 mt-1">{errors.password.message}</p> : <p className="text-xs text-gray-500">Provide an initial password for the user.</p>}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Phone Number</label>
                    <input {...register('phone_number')} type="text" placeholder="+1 (555) 000-0000" className={inputCls(false)} />
                  </div>
                </div>
              </div>

              {/* Security Tab */}
              <div className={activeTab === 'security' ? 'block' : 'hidden'}>
                <div className="space-y-4">
                  {/* Account Status Toggle */}
                  <label className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-indigo-300 dark:border-gray-800 dark:bg-gray-900/50 dark:hover:border-indigo-500/50">
                    <div className="flex-1 pr-4">
                      <div className="font-bold text-gray-900 dark:text-white">Is Active (is_active)</div>
                      <div className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{isActive ? 'True: User can log in.' : 'False: User is temporarily suspended.'}</div>
                    </div>
                    <div className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${isActive ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
                      <span className="sr-only">Toggle active status</span>
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                    {/* Hidden input to sync with react-hook-form */}
                    <input type="checkbox" className="hidden" {...register('is_active')} />
                  </label>

                  {/* Super Admin Toggle */}
                    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm transition-all hover:border-amber-300 dark:border-amber-900/50 dark:bg-amber-900/10 dark:hover:border-amber-700/50">
                      <div className="flex-1 pr-4">
                        <div className="font-bold text-amber-900 dark:text-amber-100">Super Admin (is_super_admin)</div>
                        <div className="mt-0.5 text-sm text-amber-700/80 dark:text-amber-400/80">True: Grants unrestricted platform control. Use with caution.</div>
                      </div>
                      <div className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${isSuperAdmin ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
                        <span className="sr-only">Toggle super admin</span>
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isSuperAdmin ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                      <input type="checkbox" className="hidden" {...register('is_super_admin')} />
                    </label>

                    <div className="space-y-1.5 pt-2">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Reason for Action <span className="text-gray-400 font-normal">(Optional)</span></label>
                      <input {...register('reason')} type="text" placeholder="e.g. Requested by HR" className={inputCls(false)} />
                      <p className="text-xs text-gray-500">Provide a reason for creating or modifying this user for audit purposes.</p>
                    </div>
                  </div>
              </div>

              {/* Preferences Tab */}
              <div className={activeTab === 'preferences' ? 'block' : 'hidden'}>
                <div className="space-y-5">
                  
                  
                  
                </div>
              </div>

            </form>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-gray-900/50 flex justify-end gap-3 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="user-form"
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create User'}
            </button>
          </div>

        </div>
      </div>
    </>,
    document.body
  );
}
