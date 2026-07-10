// src/features/roles/components/RoleTemplateForm.tsx
// Form for creating or editing a Role Template (identity fields only).
// Module dropdown is sourced from RbacSubModule taxonomy (not permission modules).
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Settings, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

import type { RoleTemplate } from '../types/roleTypes';
import {
  useCreateRoleTemplate,
  useUpdateRoleTemplate,
  useSubModules,
} from '../hooks/useRoles';

const templateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional().default(''),
  module_code: z.string().min(1, 'Module is required'),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface RoleTemplateFormProps {
  template: RoleTemplate | null;
  onCancel: () => void;
  defaultModuleCode?: string;
}

export function RoleTemplateForm({ template, onCancel, defaultModuleCode }: RoleTemplateFormProps) {
  const isEditing = !!template;

  const createMutation = useCreateRoleTemplate();
  const updateMutation = useUpdateRoleTemplate();

  // BUG-RT-07: Source module dropdown from RBAC Sub-Modules (the correct taxonomy)
  // NOT from permission module strings (getPermissionModules). Sub-modules have
  // human-readable titles (e.g. "Payroll") instead of raw codes (e.g. "payroll").
  const { data: subModules = [], isLoading: isLoadingModules } = useSubModules(
    undefined, // no parent filter — show all sub-modules
    false,     // active only
    false,     // exclude archived
  );

  // If a defaultModuleCode is set (user drilled down into a sub-module),
  // lock the dropdown to that value only.
  const availableModules = defaultModuleCode
    ? subModules.filter((s) => s.code === defaultModuleCode)
    : subModules;

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: '',
      description: '',
      module_code: defaultModuleCode ?? '',
    },
  });

  useEffect(() => {
    reset({
      name: template?.name ?? '',
      description: template?.description ?? '',
      module_code: template?.module_code ?? defaultModuleCode ?? '',
    });
  }, [template, defaultModuleCode, reset]);

  const onSubmit = (data: TemplateFormData) => {
    if (isEditing && template) {
      updateMutation.mutate(
        { id: template.id, payload: data },
        {
          onSuccess: () => {
            toast.success('Template updated successfully.');
            onCancel();
          },
        },
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast.success('Template created successfully.');
          onCancel();
        },
      });
    }
  };

  return (
    <div className="flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-4 bg-gray-50/50 dark:bg-gray-800/20">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings className="h-5 w-5 text-indigo-500" />
            {isEditing ? `Edit Role Template: ${template.name}` : 'Create Role Template'}
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Define the identity of this role template. Use the &quot;Manage Permissions&quot; action to configure its permission set.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Body */}
      <div className="p-6">
        <form id="template-identity-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Role Name */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Role Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register('name')}
                placeholder="e.g. Payroll Administrator"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            {/* Module — sourced from RbacSubModule.title (BUG-RT-07 fix) */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Module <span className="text-red-500">*</span>
              </label>
              <select
                {...register('module_code')}
                disabled={!!defaultModuleCode || isLoadingModules}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="" disabled>
                  {isLoadingModules ? 'Loading modules…' : 'Select a module…'}
                </option>
                {availableModules.map((sub) => (
                  // value = sub.code (stored in DB), label = sub.title (human-readable)
                  <option key={sub.id} value={sub.code}>
                    {sub.title}
                  </option>
                ))}
              </select>
              {errors.module_code && <p className="text-xs text-red-500 mt-1">{errors.module_code.message}</p>}
            </div>

            {/* Description */}
            <div className="md:col-span-2 space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="What is this role template for? What responsibilities does it cover?"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none"
              />
            </div>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-4 bg-gray-50/50 dark:bg-gray-800/20 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          Cancel
        </button>
        <button
          type="submit"
          form="template-identity-form"
          disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-70"
        >
          {(isSubmitting || createMutation.isPending || updateMutation.isPending) ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isEditing ? 'Save Changes' : 'Create Role Template'}
        </button>
      </div>
    </div>
  );
}
