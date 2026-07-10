import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Shield, AlertCircle, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

import { Role, RbacSubModule, RbacModule } from '../types/roleTypes';
import { useCreateRole, useUpdateRole, useSubModules, useRoleTemplates, useApplyRoleTemplate, useRoles, useModules } from '../hooks/useRoles';
import { useBusinessUnits } from '@/features/organization/businessUnit/hooks/useBusinessUnits';
import { CheckCircle2, Copy, FileText, PlusCircle } from 'lucide-react';

const roleIdentitySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional().default(''),
  department_name: z.string().optional(),
  business_unit_id: z.string().min(1, 'Business Unit is required'),
  module_code: z.string().min(1, 'Module is required'),
  is_default: z.boolean().default(false),
});

type RoleIdentityFormData = z.infer<typeof roleIdentitySchema>;

interface RoleIdentityFormProps {
  role: Role | null;
  onCancel: () => void;
  defaultBusinessUnitId?: string;
  onRoleCreated?: (role: Role) => void;
}

export function RoleIdentityForm({ role, onCancel, defaultBusinessUnitId, onRoleCreated }: RoleIdentityFormProps) {
  const isEditing = !!role;
  const isSystemRole = role?.role_type === 'SYSTEM';

  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole();
  const { data: buData, isLoading: isLoadingBUs } = useBusinessUnits({ is_active: true });
  const businessUnits = buData?.results || [];

  // 1. Fetch parent modules
  const { data: parentModules = [], isLoading: isLoadingParentModules } = useModules(false, false);
  const [selectedParentModuleCode, setSelectedParentModuleCode] = React.useState<string>('');

  // 2. Fetch all submodules once, then filter locally
  const { data: allSubModules = [], isLoading: isLoadingModules } = useSubModules(
    undefined,
    false,     // active only
    false,     // exclude archived
  );

  const subModules = React.useMemo(() => {
    if (!selectedParentModuleCode) return [];
    return allSubModules.filter((s: RbacSubModule) => s.parent_module_code === selectedParentModuleCode);
  }, [allSubModules, selectedParentModuleCode]);

  useEffect(() => {
    if (role?.module_code && allSubModules.length > 0 && !selectedParentModuleCode) {
      const currentSub = allSubModules.find((s: RbacSubModule) => s.code === role.module_code);
      if (currentSub && currentSub.parent_module_code) {
        setSelectedParentModuleCode(currentSub.parent_module_code);
      }
    }
  }, [role, allSubModules, selectedParentModuleCode]);

  type CreationMethod = 'scratch' | 'template' | 'clone';
  const [creationMethod, setCreationMethod] = React.useState<CreationMethod>(isEditing ? 'scratch' : 'template');
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string>('');
  const [selectedCloneRoleId, setSelectedCloneRoleId] = React.useState<string>('');

  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors, isSubmitting } } = useForm<RoleIdentityFormData>({
    resolver: zodResolver(roleIdentitySchema),
    defaultValues: {
      name: '',
      description: '',
      department_name: '',
      business_unit_id: '',
      module_code: '',
      is_default: false,
    }
  });

  const selectedModuleCode = watch('module_code');
  const selectedBusinessUnitId = watch('business_unit_id');

  const { data: templates } = useRoleTemplates(selectedModuleCode || undefined, 'active');
  const { data: rolesResponse } = useRoles({ 
    business_unit_id: selectedBusinessUnitId || undefined, 
    is_deleted: false 
  });

  const rolesToClone = React.useMemo(() => {
    if (!rolesResponse?.results || !selectedModuleCode) return [];
    return rolesResponse.results.filter(r => r.module_code === selectedModuleCode && r.id !== role?.id && r.role_type !== 'SYSTEM');
  }, [rolesResponse, selectedModuleCode, role?.id]);

  const applyTemplateMutation = useApplyRoleTemplate();

  useEffect(() => {
    if (creationMethod === 'template' && selectedTemplateId && templates) {
      const template = templates.find((t: any) => t.id === selectedTemplateId);
      if (template) {
        setValue('name', template.name);
        setValue('description', template.description || '');
      }
    } else if (creationMethod === 'clone' && selectedCloneRoleId && rolesToClone) {
      const cloneRole = rolesToClone.find(r => r.id === selectedCloneRoleId);
      if (cloneRole) {
        setValue('name', `${cloneRole.name} (Copy)`);
        setValue('description', cloneRole.description || '');
      }
    } else if (!isEditing && !selectedTemplateId && !selectedCloneRoleId) {
      setValue('name', '');
      setValue('description', '');
    }
  }, [creationMethod, selectedTemplateId, selectedCloneRoleId, templates, rolesToClone, isEditing, setValue]);

  useEffect(() => {
    reset({
      name: role?.name || '',
      description: role?.description || '',
      business_unit_id: role?.business_unit_id || defaultBusinessUnitId || '',
      module_code: role?.module_code || '',
      is_default: role?.is_default || false,
    });
  }, [role, defaultBusinessUnitId, reset]);

  const onSubmit = (data: RoleIdentityFormData) => {
    if (!isEditing) {
      if (creationMethod === 'template' && !selectedTemplateId) {
        toast.error('Please select a Role Template to proceed, or change the creation method.');
        return;
      }
      if (creationMethod === 'clone' && !selectedCloneRoleId) {
        toast.error('Please select an existing role to clone, or change the creation method.');
        return;
      }
    }

    if (isEditing && role) {
      updateMutation.mutate(
        { id: role.id, payload: data },
        { 
          onSuccess: () => {
            toast.success('Role updated successfully');
            onCancel();
          }
        }
      );
    } else {
      if (creationMethod === 'template' && selectedTemplateId) {
        applyTemplateMutation.mutate(
          {
            templateId: selectedTemplateId,
            payload: {
              business_unit_id: data.business_unit_id,
              name: data.name,
              description: data.description,
              department_name: data.department_name,
              module_code: data.module_code,
              is_default: data.is_default,
            }
          },
          {
            onSuccess: (newRole) => {
              toast.success(`Role created from template '${(newRole as any).source_template_name || newRole.name}'.`);
              onCancel();
              if (onRoleCreated) onRoleCreated(newRole);
            }
          }
        );
      } else if (creationMethod === 'clone' && selectedCloneRoleId) {
        const cloneRole = rolesToClone.find(r => r.id === selectedCloneRoleId);
        createMutation.mutate(
          { ...data, permissions: cloneRole?.permissions || [] } as any,
          {
            onSuccess: (newRole) => {
              toast.success('Role cloned successfully.');
              onCancel();
              if (onRoleCreated) onRoleCreated(newRole);
            }
          }
        );
      } else {
        createMutation.mutate(
          { ...data, permissions: [] } as any,
          {
            onSuccess: (newRole) => {
              toast.success('Empty role created successfully.');
              onCancel();
              if (onRoleCreated) onRoleCreated(newRole);
            }
          }
        );
      }
    }
  };

  if (isLoadingBUs || isLoadingModules) {
    return <div className="p-10 text-center text-gray-500 animate-pulse">Loading role details...</div>;
  }

  return (
    <div className="flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-4 bg-gray-50/50 dark:bg-gray-800/20">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-500" />
            {isEditing ? `Edit Role: ${role.name}` : 'Create New Role'}
          </h2>
          {isSystemRole && (
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              System roles are read-only.
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        <form id="role-identity-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {!isEditing && (
              <div className="md:col-span-2 space-y-3 mb-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Creation Method
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div 
                    onClick={() => setCreationMethod('template')}
                    className={`relative flex flex-col p-4 cursor-pointer rounded-xl border-2 transition-all ${creationMethod === 'template' ? 'border-indigo-600 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-900/20 shadow-sm' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600'}`}
                  >
                    {creationMethod === 'template' && <CheckCircle2 className="absolute top-3 right-3 w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
                    <FileText className={`w-6 h-6 mb-3 ${creationMethod === 'template' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} />
                    <h3 className={`font-semibold text-sm ${creationMethod === 'template' ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-900 dark:text-white'}`}>Use Role Template</h3>
                    <p className={`text-xs mt-1 leading-relaxed ${creationMethod === 'template' ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-500'}`}>Start with a predefined set of permissions (Recommended).</p>
                  </div>
                  
                  <div 
                    onClick={() => setCreationMethod('clone')}
                    className={`relative flex flex-col p-4 cursor-pointer rounded-xl border-2 transition-all ${creationMethod === 'clone' ? 'border-indigo-600 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-900/20 shadow-sm' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600'}`}
                  >
                    {creationMethod === 'clone' && <CheckCircle2 className="absolute top-3 right-3 w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
                    <Copy className={`w-6 h-6 mb-3 ${creationMethod === 'clone' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} />
                    <h3 className={`font-semibold text-sm ${creationMethod === 'clone' ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-900 dark:text-white'}`}>Clone Existing Role</h3>
                    <p className={`text-xs mt-1 leading-relaxed ${creationMethod === 'clone' ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-500'}`}>Duplicate an existing role in the same Business Unit.</p>
                  </div>

                  <div 
                    onClick={() => setCreationMethod('scratch')}
                    className={`relative flex flex-col p-4 cursor-pointer rounded-xl border-2 transition-all ${creationMethod === 'scratch' ? 'border-indigo-600 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-900/20 shadow-sm' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600'}`}
                  >
                    {creationMethod === 'scratch' && <CheckCircle2 className="absolute top-3 right-3 w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
                    <PlusCircle className={`w-6 h-6 mb-3 ${creationMethod === 'scratch' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} />
                    <h3 className={`font-semibold text-sm ${creationMethod === 'scratch' ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-900 dark:text-white'}`}>Start from Scratch</h3>
                    <p className={`text-xs mt-1 leading-relaxed ${creationMethod === 'scratch' ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-500'}`}>Create an empty role and assign permissions manually.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Business Unit <span className="text-red-500">*</span>
              </label>
              <select
                {...register('business_unit_id')}
                disabled={isSystemRole || isEditing}
                tabIndex={!!defaultBusinessUnitId ? -1 : 0}
                className={`w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 disabled:bg-gray-50 dark:disabled:bg-gray-800 ${!!defaultBusinessUnitId ? 'pointer-events-none opacity-60 bg-gray-50 dark:bg-gray-800' : ''}`}
              >
                <option value="" disabled>Select a Business Unit...</option>
                {businessUnits.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              {errors.business_unit_id && <p className="text-xs text-red-500">{errors.business_unit_id.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Module <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedParentModuleCode}
                onChange={(e) => {
                  setSelectedParentModuleCode(e.target.value);
                  setValue('module_code', ''); // Reset sub-module when parent changes
                }}
                disabled={isSystemRole || isEditing}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 disabled:bg-gray-50 dark:disabled:bg-gray-800"
              >
                <option value="">Select a Module...</option>
                {parentModules.map((mod: RbacModule) => (
                  <option key={mod.code} value={mod.code}>{mod.title}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Sub-Module <span className="text-red-500">*</span>
              </label>
              <select
                {...register('module_code')}
                disabled={isSystemRole || isEditing || !selectedParentModuleCode}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 disabled:bg-gray-50 dark:disabled:bg-gray-800"
              >
                <option value="" disabled>{selectedParentModuleCode ? "Select a Sub-Module..." : "Select a Module first"}</option>
                {subModules.map((sub: RbacSubModule) => (
                  <option key={sub.id} value={sub.code}>{sub.title}</option>
                ))}
              </select>
              {errors.module_code && <p className="text-xs text-red-500">{errors.module_code.message}</p>}
            </div>

            {!isEditing && creationMethod === 'template' && (
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Role Template <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  disabled={!selectedModuleCode}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 disabled:bg-gray-50 dark:disabled:bg-gray-800"
                >
                  <option value="">{selectedModuleCode ? "-- Select a Role Template --" : "Select a module first"}</option>
                  {templates?.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                {selectedTemplateId && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                    <Shield className="w-3.5 h-3.5" />
                    Permissions will be automatically copied from this template.
                  </div>
                )}
              </div>
            )}

            {!isEditing && creationMethod === 'clone' && (
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Select Role to Clone <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedCloneRoleId}
                  onChange={(e) => setSelectedCloneRoleId(e.target.value)}
                  disabled={!selectedModuleCode || !selectedBusinessUnitId}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 disabled:bg-gray-50 dark:disabled:bg-gray-800"
                >
                  <option value="">{(!selectedModuleCode || !selectedBusinessUnitId) ? "Select Business Unit and Module first" : "-- Select a Role --"}</option>
                  {rolesToClone?.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
                {rolesToClone && rolesToClone.length === 0 && selectedModuleCode && selectedBusinessUnitId && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">No roles found in this module to clone.</p>
                )}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Role Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register('name')}
                disabled={isSystemRole}
                placeholder="e.g. Area Manager"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 disabled:bg-gray-50 dark:disabled:bg-gray-800"
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Department <span className="text-xs font-normal text-gray-500">(Optional)</span>
              </label>
              <input
                {...register('department_name')}
                disabled={isSystemRole}
                placeholder="e.g. Operations, HR, IT"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 disabled:bg-gray-50 dark:disabled:bg-gray-800"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                {...register('description')}
                disabled={isSystemRole}
                rows={2}
                placeholder="What does this role do?"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 disabled:bg-gray-50 dark:disabled:bg-gray-800"
              />
            </div>

            {!isSystemRole && (
              <div className="md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <Controller
                    name="is_default"
                    control={control}
                    render={({ field }) => (
                      <div className="relative inline-flex h-5 w-9 cursor-pointer items-center">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={field.value}
                          onChange={field.onChange}
                          disabled={isSystemRole}
                        />
                        <div className="h-5 w-9 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500/30 dark:bg-gray-700 dark:after:border-gray-600"></div>
                      </div>
                    )}
                  />
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">Default Role</div>
                    <div className="text-xs text-gray-500">Automatically assign to new users in this business unit.</div>
                  </div>
                </label>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Footer */}
      {!isSystemRole && (
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
            form="role-identity-form"
            disabled={isSubmitting || applyTemplateMutation.isPending}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-70"
          >
            {(isSubmitting || applyTemplateMutation.isPending) ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isEditing ? 'Save Changes' : 'Save Role'}
          </button>
        </div>
      )}
    </div>
  );
}
