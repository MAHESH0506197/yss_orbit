import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Edit, Save, ArrowLeft, Loader2, Info, 
  Type, AlignLeft, Tag, AlertTriangle, CheckSquare, Search, MapPin, Calendar, FileText
} from 'lucide-react';

import { usePqmStore } from "../store/usePqmStore";
import { pqmService } from "../api/pqmService";
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionCard } from '@/components/platform/SectionCard';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { AttachmentGallery } from '../components/AttachmentGallery';
import { PQMAttachment } from '../types';



const editNCSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(500),
  description: z.string().min(2, "Description is required"),
  priority: z.string().min(1, "Priority is required"),
  severity: z.string().min(1, "Severity is required"),
  is_safety_critical: z.boolean().default(false),
  location_description: z.string().optional().nullable().or(z.literal('')),
  reference_type: z.string().optional().nullable().or(z.literal('')),
  reference_description: z.string().optional().nullable(),
  raised_date: z.string().min(1, "Date is required"),
  category: z.string().optional().nullable(),
  sub_category: z.string().optional().nullable(),
  root_cause_description: z.string().optional().nullable(),
  root_cause_category: z.string().optional().nullable(),
  corrective_action: z.string().optional().nullable(),
  preventive_action: z.string().optional().nullable(),
});


type EditNCFormValues = z.infer<typeof editNCSchema>;

export default function NCEditPage() {
  const { id, projectId } = useParams<{ id: string, projectId: string }>();
  const navigate = useNavigate();
  const { selectedNc, fetchNcDetail, priorities, severities, referenceTypes, areas, categories, subCategories, fetchDropdownConfig } = usePqmStore();

  const [submitting, setSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<PQMAttachment[]>([]);
  const backUrl = projectId ? `/pqm/nc-management/${projectId}/nc/${id}` : `/pqm/nc-management/nc/${id}`;

  const { register, handleSubmit, watch, formState: { errors, isDirty }, reset } = useForm<EditNCFormValues>({
    resolver: zodResolver(editNCSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "",
      severity: "",
      is_safety_critical: false,
      location_description: "",
      reference_type: "",
      reference_description: "",
      raised_date: new Date().toISOString().split('T')[0],
      category: "",
      sub_category: "",
      root_cause_description: "",
      root_cause_category: "",
      corrective_action: "",
      preventive_action: "",
    },
    mode: 'onChange',
  });

  const selectedCategory = watch('category');
  const filteredSubCategories = selectedCategory 
    ? subCategories.filter(sc => sc.system_mapping === selectedCategory)
    : [];

  useEffect(() => {
    if (id) {
      fetchNcDetail(id);
      pqmService.listAttachments(id).then(setAttachments).catch(() => {});
    }
    fetchDropdownConfig();
  }, [id, fetchNcDetail]);

  useEffect(() => {
    if (selectedNc) {
      reset({
        title: selectedNc.title ?? "",
        description: selectedNc.description ?? "",
        priority: (selectedNc.priority as any) ?? "",
        severity: (selectedNc.severity as any) ?? "",
        is_safety_critical: selectedNc.is_safety_critical ?? false,
        location_description: selectedNc.location_description ?? "",
        reference_type: (selectedNc.reference_type as any) ?? "",
        reference_description: selectedNc.reference_description ?? "",
        raised_date: selectedNc.raised_date ?? new Date().toISOString().split('T')[0],
        category: (selectedNc.category as any) ?? "",
        sub_category: (selectedNc.sub_category as any) ?? "",
        root_cause_description: selectedNc.root_cause_description ?? "",
        root_cause_category: selectedNc.root_cause_category ?? "",
        corrective_action: selectedNc.corrective_action ?? "",
        preventive_action: selectedNc.preventive_action ?? "",
      });
    }
  }, [selectedNc, reset]);

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
        handleSubmit(onSubmit)();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirty, handleSubmit]);

  const onSubmit = async (data: EditNCFormValues) => {
    if (!id) return;
    setSubmitting(true);
    try {
      await pqmService.updateNC(id, data as any);
      navigate(backUrl);
    } catch (err: any) {
      // Error handling via toast/interceptors
    } finally {
      setSubmitting(false);
    }
  };

  if (!selectedNc) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-4 lg:p-8 animate-fadeInUp">
      <div className="mb-6 lg:mb-8">
        <PageHeader
          title={`Edit NC — ${selectedNc.nc_number || '...'}`}
          icon={Edit}
          breadcrumbs={[
            { label: 'PQM' },
            { label: 'Non-Conformances', href: projectId ? `/pqm/nc-management/${projectId}/nc` : '/pqm/nc-management/nc' },
            { label: selectedNc.nc_number || 'Details', href: backUrl },
            { label: 'Edit' },
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
              <div className="sm:col-span-2">
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

          <SectionCard title="Corrective Actions" icon={CheckSquare} iconColor="text-emerald-500" animDelay="delay-200">
            <div className="grid gap-5 sm:grid-cols-1">
              <div>
                <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">
                  Root Cause Description
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 top-3 pl-3.5">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <textarea
                    {...register('root_cause_description')}
                    rows={3}
                    className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 focus:border-violet-500 bg-gray-50/50 dark:bg-gray-800/50 py-3 pl-10 pr-4 text-sm text-gray-900 dark:text-white focus:ring-violet-500 transition-all resize-none"
                    placeholder="Describe the root cause..."
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">
                  Corrective Action
                </label>
                <textarea
                  {...register('corrective_action')}
                  rows={3}
                  className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 focus:border-violet-500 bg-gray-50/50 dark:bg-gray-800/50 py-3 px-4 text-sm text-gray-900 dark:text-white focus:ring-violet-500 transition-all resize-none"
                  placeholder="Action to correct the non-conformance..."
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">
                  Preventive Action
                </label>
                <textarea
                  {...register('preventive_action')}
                  rows={3}
                  className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 focus:border-violet-500 bg-gray-50/50 dark:bg-gray-800/50 py-3 px-4 text-sm text-gray-900 dark:text-white focus:ring-violet-500 transition-all resize-none"
                  placeholder="Action to prevent recurrence..."
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Attachments" icon={FileText} iconColor="text-pink-500" animDelay="delay-250">
            <div className="p-4 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
              <AttachmentGallery 
                attachments={attachments}
                onUpload={async () => {
                  if (id) {
                    const updated = await pqmService.listAttachments(id);
                    setAttachments(updated);
                  }
                }}
              />
            </div>
          </SectionCard>

        </div>

        {/* ── Right: Save panel ──────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 p-4 shadow-sm space-y-3 sticky top-24">
            
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/40 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
            >
              {submitting
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                : <><Save className="h-4 w-4" /> Save Changes</>
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
