import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FolderGit2, Save, ArrowLeft, Loader2, Info, Eye, Type, AlignLeft, RefreshCw, ToggleRight, Calendar, User, MapPin
} from 'lucide-react';

import { pqmService } from '../../api/pqmService';
import type { PQMProject } from '../../types';
import { useUsers } from '@/features/iam/users/hooks/useUsers';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionCard } from '@/components/platform/SectionCard';

function generateProjectCode(name: string): string {
  if (!name) return 'PRJ-';
  const clean = name.replace(/[^a-zA-Z0-9\s-]/g, '').trim().toUpperCase();
  const words = clean.split(/\s+/).filter(Boolean);
  let suffix = '';
  if (words.length === 1) {
    suffix = words[0]?.slice(0, 5) || '';
  } else if (words.length === 2) {
    suffix = (words[0]?.slice(0, 3) || '') + (words[1]?.slice(0, 2) || '');
  } else if (words.length > 2) {
    suffix = words.map(w => w?.[0] || '').join('').slice(0, 5);
  }
  return `PRJ-${suffix}`;
}

const createProjectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  code: z.string().min(2).max(20).regex(/^[A-Z0-9_-]+$/, "Uppercase letters, numbers, hyphens, underscores only"),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  capacity: z.string().max(50).optional().nullable(),
  project_start_date: z.string().optional().nullable(),
  expected_project_end_date: z.string().optional().nullable(),
  project_head_id: z.string().optional().nullable(),
  quality_head_id: z.string().optional().nullable(),
  construction_incharge_id: z.string().optional().nullable(),
  quality_incharge_id: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
  reason: z.string().max(200, "Reason cannot exceed 200 characters").optional(),
});

type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

const PreviewCard: React.FC<{
  name: string;
  code: string;
  description: string;
  capacity: string;
  location: string;
  isActive: boolean;
}> = ({ name, code, description, capacity, location, isActive }) => {
  return (
    <div className={`relative overflow-hidden rounded-2xl border ${isActive ? 'border-violet-200 dark:border-violet-800' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-900 p-5 shadow-sm transition-all duration-300`}>
      <div className={`absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl opacity-20 transition-colors ${isActive ? 'bg-fuchsia-500' : 'bg-gray-400'}`} />

      <div className="relative z-10 flex items-start gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border shadow-sm ${isActive ? 'border-violet-100 bg-violet-50 text-violet-600 dark:border-violet-900/50 dark:bg-violet-900/20 dark:text-violet-400' : 'border-gray-100 bg-gray-50 text-gray-500 dark:border-gray-800 dark:bg-gray-800/50'}`}>
          <FolderGit2 className="h-6 w-6 opacity-80" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <h4 className={`truncate font-bold text-base ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
              {name || 'Project Name'}
            </h4>
            <div className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-400' : 'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}>
              {isActive ? 'Active' : 'Inactive'}
            </div>
          </div>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <code className="rounded border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-1.5 py-0.5 text-[10px] font-bold text-gray-500 tracking-widest">
              {code || 'CODE'}
            </code>
            {capacity && (
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 border-l border-gray-200 dark:border-gray-700 pl-2">
                {capacity}
              </span>
            )}
            {location && (
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 border-l border-gray-200 dark:border-gray-700 pl-2 flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {location}
              </span>
            )}
          </div>
          <p className="mt-2 line-clamp-2 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            {description || 'Description will appear here...'}
          </p>
        </div>
      </div>
    </div>
  );
};

export const ProjectCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showExitPrompt, setShowExitPrompt] = useState(false);
  const backUrl = '/pqm/projects';

  const { data: usersData } = useUsers({ is_active: true, page_size: 1000 });
  const users = useMemo(() => usersData?.results || [], [usersData]);

  const createMutation = useMutation({
    mutationFn: (data: CreateProjectFormValues) => pqmService.createProject(data as Partial<PQMProject>),
    onSuccess: () => {
      toast.success('Project created successfully!');
      queryClient.invalidateQueries({ queryKey: ['pqm-projects'] });
      navigate(backUrl);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Failed to create project.');
    }
  });

  const { register, handleSubmit, formState: { errors, isDirty }, watch, setValue } = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      location: '',
      capacity: '',
      project_start_date: '',
      expected_project_end_date: '',
      project_head_id: '',
      quality_head_id: '',
      construction_incharge_id: '',
      quality_incharge_id: '',
      is_active: true,
      reason: '',
    },
    mode: 'onChange',
  });

  const nameWatch = watch('name');
  const codeWatch = watch('code');
  const descWatch = watch('description');
  const locationWatch = watch('location');
  const capacityWatch = watch('capacity');
  const isActiveWatch = watch('is_active');

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

  const handleGenerateCode = () => {
    if (nameWatch) {
      const generated = generateProjectCode(nameWatch);
      setValue('code', generated, { shouldValidate: true, shouldDirty: true });
    }
  };

  const onSubmit = async (data: CreateProjectFormValues) => {
    const payload: any = { ...data };
    if (!payload.project_start_date) payload.project_start_date = null;
    if (!payload.expected_project_end_date) payload.expected_project_end_date = null;
    if (!payload.project_head_id) payload.project_head_id = null;
    if (!payload.quality_head_id) payload.quality_head_id = null;
    if (!payload.construction_incharge_id) payload.construction_incharge_id = null;
    if (!payload.quality_incharge_id) payload.quality_incharge_id = null;
    await createMutation.mutateAsync(payload);
  };

  const isBusy = createMutation.isPending;

  return (
    <>
      {showExitPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-2xl border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Discard changes?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              You have unsaved changes. Are you sure you want to leave this page? Your changes will be lost.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowExitPrompt(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Keep editing
              </button>
              <button onClick={() => navigate(backUrl)} className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-500/20 transition-all">
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl p-4 lg:p-8 animate-fadeInUp">
        <div className="mb-6 lg:mb-8">
          <PageHeader
            title="Create Project"
            icon={FolderGit2}
            breadcrumbs={[
              { label: 'PQM' },
              { label: 'Projects', href: backUrl },
              { label: 'New Project' },
            ]}
          />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 lg:space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 items-start">
            
            <div className="lg:col-span-3 space-y-6 lg:space-y-8">
              
              <SectionCard title="Basic Information" icon={Info} iconColor="text-blue-500" animDelay="delay-50">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">
                      Project Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                        <Type className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        {...register('name')}
                        type="text"
                        autoComplete="off"
                        className={`block w-full rounded-xl border ${errors.name ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500' : 'border-gray-200 dark:border-gray-700 focus:border-violet-500 focus:ring-violet-500'} bg-gray-50/50 dark:bg-gray-800/50 py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-white transition-all`}
                        placeholder="e.g. Phase 1 Expansion"
                      />
                    </div>
                    {errors.name && <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-rose-500"><Info className="h-3 w-3" />{errors.name.message}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1.5 flex items-center justify-between text-sm font-bold text-gray-700 dark:text-gray-300">
                      <span>Unique Code <span className="text-rose-500">*</span></span>
                      <button
                        type="button"
                        onClick={handleGenerateCode}
                        className="group flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2.5 py-1 text-[11px] font-semibold text-gray-600 dark:text-gray-400 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:hover:border-violet-800 dark:hover:bg-violet-900/30 dark:hover:text-violet-400 transition-all"
                      >
                        <RefreshCw className="h-3 w-3 group-hover:rotate-180 transition-transform duration-500" />
                        Auto-Generate
                      </button>
                    </label>
                    <div className="relative">
                      <input
                        {...register('code')}
                        type="text"
                        autoComplete="off"
                        className={`block w-full rounded-xl border ${errors.code ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500' : 'border-gray-200 dark:border-gray-700 focus:border-violet-500 focus:ring-violet-500'} bg-gray-50/50 dark:bg-gray-800/50 py-2.5 px-4 font-mono text-sm uppercase text-gray-900 dark:text-white transition-all`}
                        placeholder="e.g. PRJ-PHS1"
                      />
                    </div>
                    {errors.code && <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-rose-500"><Info className="h-3 w-3" />{errors.code.message}</p>}
                  </div>

                  <div className="sm:col-span-1">
                    <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">
                      Location
                    </label>
                    <input
                      {...register('location')}
                      type="text"
                      className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 py-2.5 px-4 text-sm text-gray-900 dark:text-white focus:border-violet-500 focus:ring-violet-500 transition-all"
                      placeholder="e.g. New York, NY"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">
                      Capacity
                    </label>
                    <input
                      {...register('capacity')}
                      type="text"
                      className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 py-2.5 px-4 text-sm text-gray-900 dark:text-white focus:border-violet-500 focus:ring-violet-500 transition-all"
                      placeholder="e.g. 500 MW"
                    />
                  </div>
                </div>

                <div className="mt-5">
                  <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 top-3 pl-3.5">
                      <AlignLeft className="h-4 w-4 text-gray-400" />
                    </div>
                    <textarea
                      {...register('description')}
                      rows={4}
                      className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 py-3 pl-10 pr-4 text-sm text-gray-900 dark:text-white focus:border-violet-500 focus:ring-violet-500 transition-all resize-none"
                      placeholder="Briefly describe the purpose of this project..."
                    />
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Timeline" icon={Calendar} iconColor="text-amber-500" animDelay="delay-100">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">
                      Start Date
                    </label>
                    <input
                      {...register('project_start_date')}
                      type="date"
                      className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 py-2.5 px-4 text-sm text-gray-900 dark:text-white focus:border-violet-500 focus:ring-violet-500 transition-all"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">
                      Expected End Date
                    </label>
                    <input
                      {...register('expected_project_end_date')}
                      type="date"
                      className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 py-2.5 px-4 text-sm text-gray-900 dark:text-white focus:border-violet-500 focus:ring-violet-500 transition-all"
                    />
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Key Personnel" icon={User} iconColor="text-emerald-500" animDelay="delay-150">
                <div className="grid gap-5 sm:grid-cols-2">
                  {[
                    { key: 'project_head_id', label: 'Project Head' },
                    { key: 'quality_head_id', label: 'Quality Head' },
                    { key: 'construction_incharge_id', label: 'Construction Incharge' },
                    { key: 'quality_incharge_id', label: 'Quality Incharge' }
                  ].map((field) => (
                    <div className="sm:col-span-1" key={field.key}>
                      <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">
                        {field.label}
                      </label>
                      <select
                        {...register(field.key as any)}
                        className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 py-2.5 px-4 text-sm text-gray-900 dark:text-white focus:border-violet-500 focus:ring-violet-500 transition-all"
                      >
                        <option value="">-- Unassigned --</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.first_name} {u.last_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Active Status" icon={ToggleRight} iconColor="text-fuchsia-500" animDelay="delay-200">
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="is_active_create" className="text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                      Active Status
                    </label>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      Whether this project is currently active and ongoing.
                    </p>
                  </div>
                  <div className="relative ml-4 shrink-0">
                    <input
                      type="checkbox"
                      id="is_active_create"
                      checked={isActiveWatch}
                      onChange={e => setValue('is_active', e.target.checked, { shouldDirty: true })}
                      className="peer sr-only"
                    />
                    <label
                      htmlFor="is_active_create"
                      className={`relative flex h-7 w-13 cursor-pointer items-center rounded-full transition-colors duration-200 peer-checked:bg-gradient-to-r peer-checked:from-violet-600 peer-checked:to-fuchsia-600 ${isActiveWatch ? '' : 'bg-gray-200 dark:bg-gray-700'}`}
                      style={{ width: 52, height: 28 }}
                    >
                      <span className={`absolute h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 left-1 ${isActiveWatch ? 'translate-x-6' : 'translate-x-0'}`} />
                    </label>
                  </div>
                </div>
              </SectionCard>
              
              <SectionCard title="Audit Context" icon={FolderGit2} iconColor="text-indigo-500" animDelay="delay-300">
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">
                    Reason for Creation (Optional)
                  </label>
                  <input
                    {...register('reason')}
                    type="text"
                    placeholder="e.g., Initial setup for new contract..."
                    className={`block w-full rounded-xl border ${errors.reason ? 'border-rose-300 focus:border-rose-500' : 'border-gray-200 dark:border-gray-700 focus:border-violet-500'} bg-gray-50/50 dark:bg-gray-800/50 py-2.5 px-4 text-sm text-gray-900 dark:text-white transition-all`}
                  />
                  {errors.reason && <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-rose-500"><Info className="h-3 w-3" />{errors.reason.message}</p>}
                </div>
              </SectionCard>

            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700/50 overflow-hidden shadow-sm">
                <div className="border-b border-gray-100 dark:border-gray-800 px-4 py-3 bg-gray-50/80 dark:bg-gray-800/40">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center gap-2">
                    <Eye className="h-3.5 w-3.5" /> Live Preview
                  </h3>
                </div>
                <div className="p-4">
                  <PreviewCard
                    name={nameWatch}
                    code={codeWatch}
                    description={descWatch ?? ''}
                    capacity={capacityWatch ?? ''}
                    location={locationWatch ?? ''}
                    isActive={isActiveWatch}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 p-4 shadow-sm space-y-3">
                <button
                  type="submit"
                  disabled={isBusy}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/40 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                >
                  {isBusy
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>
                    : <><Save className="h-4 w-4" /> Create Project</>
                  }
                </button>
                <button type="button" onClick={() => navigate(backUrl)}
                  className="flex items-center justify-center gap-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                  <ArrowLeft className="h-4 w-4" /> Cancel
                </button>
                {isDirty && (
                  <p className="text-center text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    You have unsaved changes
                  </p>
                )}
              </div>

              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 p-3 space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Keyboard</p>
                {[
                  { key: '⌘S', label: 'Create project' },
                  { key: 'Esc', label: 'Back' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
                    <kbd className="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-1.5 py-0.5 font-mono text-[10px] font-bold text-gray-500 shadow-sm">{key}</kbd>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default ProjectCreatePage;
