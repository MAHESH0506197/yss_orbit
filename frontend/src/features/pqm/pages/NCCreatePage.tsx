import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  ClipboardList, Save, ArrowLeft, Loader2, Info, 
  Type, AlignLeft, Building2, Tag, AlertTriangle, FileText, Calendar, MapPin
} from 'lucide-react';

import { usePqmStore } from "../store/usePqmStore";
import { pqmService } from "../api/pqmService";
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionCard } from '@/components/platform/SectionCard';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { AttachmentGallery } from '../components/AttachmentGallery';



const createNCSchema = z.object({
  title: z.string().min(2, "NC Name must be at least 2 characters").max(500),
  description: z.string().min(2, "NC Description is required"),
  project: z.string().min(1, "Project is required"),
  category: z.string().optional().nullable(),
  sub_category: z.string().optional().nullable(),
  contractor: z.string().optional().nullable(),
  priority: z.string().min(1, "Priority is required"),
  severity: z.string().min(1, "Severity is required"),
  is_safety_critical: z.boolean().default(false),
  location_description: z.string().optional().nullable().or(z.literal('')),
  reference_type: z.string().optional().nullable().or(z.literal('')),
  reference_description: z.string().optional(),
  raised_date: z.string().min(1, "Date is required"),
});

type CreateNCFormValues = z.infer<typeof createNCSchema>;


export default function NCCreatePage() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { projects, sites, categories, subCategories, contractors, fetchConfig, priorities, severities, referenceTypes, areas, fetchDropdownConfig } = usePqmStore();

  const [submittingAsDraft, setSubmittingAsDraft] = useState(false);
  const [submittingAndSubmit, setSubmittingAndSubmit] = useState(false);

  const backUrl = projectId ? `/pqm/nc-management/${projectId}/nc` : '/pqm/nc-management/nc';

  const { register, handleSubmit, formState: { errors, isDirty }, watch, setValue } = useForm<CreateNCFormValues>({
    resolver: zodResolver(createNCSchema),
    defaultValues: {
      title: "",
      description: "",
      project: projectId || "",
      category: "",
      sub_category: "",
      contractor: "",
      priority: "",
      severity: "",
      is_safety_critical: false,
      location_description: "",
      reference_type: "",
      reference_description: "",
      raised_date: new Date().toISOString().split('T')[0],
    },

    mode: 'onChange',
  });

  const selectedCategory = watch('category');
  const filteredSubCategories = selectedCategory 
    ? subCategories.filter(sc => sc.system_mapping === selectedCategory)
    : [];

  useEffect(() => {
    fetchConfig();
    fetchDropdownConfig();
  }, []);

  useEffect(() => {
    if (projectId) setValue("project", projectId);
  }, [projectId, setValue]);

  // Prevent accidental navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) e.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Handle Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSubmit((data) => onSubmit(data, true))();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirty, navigate, handleSubmit]);

  const onSubmit = async (data: CreateNCFormValues, asDraft: boolean) => {
    if (asDraft) setSubmittingAsDraft(true);
    else setSubmittingAndSubmit(true);

    try {
      // API expects empty strings instead of empty UUIDs for optional relations
      const payload = {
        ...data,
        category: data.category || null,
        sub_category: data.sub_category || null,
        contractor: data.contractor || null,
      };

      const nc = await pqmService.createNC(payload as any);
      if (!asDraft) {
        await pqmService.submitNC(nc.id);
      }
      navigate(projectId ? `/pqm/nc-management/${projectId}/nc/${nc.id}` : `/pqm/nc-management/nc/${nc.id}`);
    } catch (err: any) {
      // Backend error handling if required, usually handled by interceptors/toast
    } finally {
      setSubmittingAsDraft(false);
      setSubmittingAndSubmit(false);
    }
  };


  const isBusy = submittingAsDraft || submittingAndSubmit;

  return (
    <div className="mx-auto max-w-6xl p-4 lg:p-8 animate-fadeInUp">
      <div className="mb-6 lg:mb-8">
        <PageHeader
          title="Raise Non-Conformance"
          icon={ClipboardList}
          breadcrumbs={[
            { label: 'PQM' },
            { label: 'Non-Conformances', href: backUrl },
            { label: 'Raise NC' },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 items-start">
        
        {/* ── Left: Form inputs ─────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-6 lg:space-y-8">
          
          <SectionCard title="Basic Information" icon={Info} iconColor="text-blue-500" animDelay="delay-50">
            <div className="grid gap-5 sm:grid-cols-1">
              <div>
                <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">
                  NC ID
                </label>
                <input
                  type="text"
                  disabled
                  value="Auto-generated on save"
                  className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/80 py-2.5 px-4 text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
                <p className="mt-1 text-[11px] text-gray-500">ID will be generated automatically based on the project code.</p>
              </div>

              <div>

                <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">
                  NC Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Type className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    {...register('title')}
                    type="text"
                    className={`block w-full rounded-xl border ${errors.title ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500' : 'border-gray-200 dark:border-gray-700 focus:border-violet-500 focus:ring-violet-500'} bg-gray-50/50 dark:bg-gray-800/50 py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-white transition-all`}
                    placeholder="Short, descriptive title"
                  />
                </div>
                {errors.title && <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-rose-500"><Info className="h-3 w-3" />{errors.title.message}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">
                  NC Description <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 top-3 pl-3.5">
                    <AlignLeft className="h-4 w-4 text-gray-400" />
                  </div>
                  <textarea
                    {...register('description')}
                    rows={4}
                    className={`block w-full rounded-xl border ${errors.description ? 'border-rose-300 focus:border-rose-500' : 'border-gray-200 dark:border-gray-700 focus:border-violet-500'} bg-gray-50/50 dark:bg-gray-800/50 py-3 pl-10 pr-4 text-sm text-gray-900 dark:text-white focus:ring-violet-500 transition-all resize-none`}
                    placeholder="Detailed description of the non-conformance..."
                  />
                </div>
                {errors.description && <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-rose-500"><Info className="h-3 w-3" />{errors.description.message}</p>}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Location Information" icon={MapPin} iconColor="text-emerald-500" animDelay="delay-100">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">
                  Project <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register('project')}
                  disabled={!!projectId}
                  className={`block w-full rounded-xl border ${errors.project ? 'border-rose-300 focus:border-rose-500' : 'border-gray-200 dark:border-gray-700 focus:border-violet-500'} ${!!projectId ? 'bg-gray-100 dark:bg-gray-800/80 cursor-not-allowed text-gray-500' : 'bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white'} py-2.5 px-4 text-sm transition-all`}
                >
                  <option value="">— Select Project —</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {errors.project && <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-rose-500"><Info className="h-3 w-3" />{errors.project.message}</p>}
              </div>

              <div>
                <div className="flex items-center mb-1.5">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Area of NC Raised</label>
                  <InfoTooltip content="The physical location — where on the site the non-conformance occurred." />
                </div>
                <select
                  {...register('location_description')}
                  className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 focus:border-violet-500 focus:ring-violet-500 bg-gray-50/50 dark:bg-gray-800/50 py-2.5 px-4 text-sm text-gray-900 dark:text-white transition-all"
                >
                  <option value="">— Select Area —</option>
                  {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              <div>
                <div className="flex items-center mb-1.5">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Reference Type</label>
                  <InfoTooltip content="Categorizes the origin document, drawing, or standard violated." />
                </div>
                <select
                  {...register('reference_type')}
                  className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 focus:border-violet-500 bg-gray-50/50 dark:bg-gray-800/50 py-2.5 px-4 text-sm text-gray-900 dark:text-white"
                >
                  <option value="">— Select —</option>
                  {referenceTypes.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">Reference Details</label>
                <input
                  {...register('reference_description')}
                  type="text"
                  className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 focus:border-violet-500 bg-gray-50/50 dark:bg-gray-800/50 py-2.5 px-4 text-sm text-gray-900 dark:text-white"
                  placeholder="Doc #, Drawing #, etc."
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Classification" icon={Tag} iconColor="text-violet-500" animDelay="delay-150">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <div className="flex items-center mb-1.5">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Priority</label>
                  <InfoTooltip content="Priority determines how quickly the NC needs to be addressed (SLA)." />
                </div>
                <select
                  {...register('priority')}
                  className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 focus:border-violet-500 bg-gray-50/50 dark:bg-gray-800/50 py-2.5 px-4 text-sm text-gray-900 dark:text-white transition-all"
                >
                  <option value="">— Select Priority —</option>
                  {priorities.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div>
                <div className="flex items-center mb-1.5">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Severity</label>
                  <InfoTooltip content="Severity determines the impact of the non-conformance on the project quality or cost." />
                </div>
                <select
                  {...register('severity')}
                  className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 focus:border-violet-500 bg-gray-50/50 dark:bg-gray-800/50 py-2.5 px-4 text-sm text-gray-900 dark:text-white transition-all"
                >
                  <option value="">— Select Severity —</option>
                  {severities.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>

              <div>
                <div className="flex items-center mb-1.5">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Category</label>
                  <InfoTooltip content="The discipline or type of work — what kind of issue it is." />
                </div>
                <select
                  {...register('category')}
                  className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 focus:border-violet-500 bg-gray-50/50 dark:bg-gray-800/50 py-2.5 px-4 text-sm text-gray-900 dark:text-white transition-all"
                >
                  <option value="">— Select Category —</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <div className="flex items-center mb-1.5">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Sub-Category</label>
                  <InfoTooltip content="A more specific breakdown of the category." />
                </div>
                <select
                  {...register('sub_category')}
                  className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 focus:border-violet-500 bg-gray-50/50 dark:bg-gray-800/50 py-2.5 px-4 text-sm text-gray-900 dark:text-white transition-all"
                >
                  <option value="">— Select Sub-Category —</option>
                  {filteredSubCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">Contractor</label>
                <select
                  {...register('contractor')}
                  className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 focus:border-violet-500 bg-gray-50/50 dark:bg-gray-800/50 py-2.5 px-4 text-sm text-gray-900 dark:text-white transition-all"
                >
                  <option value="">— None —</option>
                  {contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">
                  Raised Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    {...register('raised_date')}
                    type="date"
                    className={`block w-full rounded-xl border ${errors.raised_date ? 'border-rose-300 focus:border-rose-500' : 'border-gray-200 dark:border-gray-700 focus:border-violet-500'} bg-gray-50/50 dark:bg-gray-800/50 py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-white transition-all`}
                  />
                </div>
                {errors.raised_date && <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-rose-500"><Info className="h-3 w-3" />{errors.raised_date.message}</p>}
                <p className="mt-1 text-[11px] text-gray-500">Backdating requires approval.</p>
              </div>

              <div className="sm:col-span-2 pt-2">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex h-5 items-center">
                    <input
                      {...register('is_safety_critical')}
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-600 cursor-pointer"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4" />
                      Mark as Safety Critical
                    </span>
                    <span className="text-xs text-gray-500">Requires 24-hour SLA resolution.</span>
                  </div>
                </label>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Attachments" icon={FileText} iconColor="text-pink-500" animDelay="delay-200">
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 flex flex-col items-center justify-center text-center">
              <FileText className="h-8 w-8 text-gray-400 mb-2" />
              <p className="font-semibold text-gray-900 dark:text-white">Save as Draft to add attachments.</p>
              <p className="mt-1">Once saved, you can add photos and documents before submitting.</p>
            </div>
          </SectionCard>

        </div>

        {/* ── Right: Save panel ──────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 p-4 shadow-sm space-y-3 sticky top-24">
            
            <button
              type="button"
              onClick={handleSubmit((data) => onSubmit(data, false))}
              disabled={isBusy}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/40 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
            >
              {submittingAndSubmit
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                : <><Save className="h-4 w-4" /> Save & Submit</>
              }
            </button>

            <button
              type="button"
              onClick={handleSubmit((data) => onSubmit(data, true))}
              disabled={isBusy}
              className="flex items-center justify-center gap-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
            >
              {submittingAsDraft
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                : "Save as Draft"
              }
            </button>

            <button
              type="button"
              onClick={() => navigate(backUrl)}
              className="flex items-center justify-center gap-2 w-full rounded-xl px-5 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all"
            >
              <ArrowLeft className="h-4 w-4" /> Cancel
            </button>
            
            {isDirty && (
              <p className="text-center text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                You have unsaved changes
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

