// yss_orbit/frontend/src/features/pqm/pages/NCEditPage.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Edit, Save, ArrowLeft, Loader2, Info, 
  Type, AlignLeft, Tag, AlertTriangle, CheckSquare, Search, MapPin, Calendar, FileText, Users
} from 'lucide-react';
import { useAuthStore } from "@/store/authStore";

import { usePqmStore } from "../store/usePqmStore";
import { pqmService } from "../api/pqmService";
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionCard } from '@/components/platform/SectionCard';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { AttachmentGallery } from '../components/AttachmentGallery';
import { PQMAttachment } from '../types';
import toast from 'react-hot-toast';

const editNCSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(500),
  description: z.string().min(2, "Description is required"),
  
  category: z.string().optional().nullable(),
  sub_category: z.string().optional().nullable(),
  contractor: z.string().optional().nullable(),
  
  priority: z.string().min(1, "Priority is required"),
  severity: z.string().min(1, "Severity is required"),
  is_safety_critical: z.boolean().default(false),
  
  location_details: z.string().min(1, "Location is required"),
  block: z.string().optional(),
  zone: z.string().optional(),
  
  location_description: z.string().optional().nullable().or(z.literal('')),
  
  site_quality_incharge_id: z.string().optional().nullable(),
  project_incharge_id: z.string().optional().nullable(),
  assigned_to_id: z.string().optional().nullable(),
  target_closure_date: z.string().optional().nullable(),
  
  reference_type: z.string().optional().nullable().or(z.literal('')),
  raised_date: z.string().min(1, "Date is required"),
  
  root_cause_description: z.string().optional().nullable(),
  root_cause_category: z.string().optional().nullable(),
  corrective_action: z.string().optional().nullable(),
  preventive_action: z.string().optional().nullable(),
});

type EditNCFormValues = z.infer<typeof editNCSchema>;

export default function NCEditPage() {
  const { id, projectId } = useParams<{ id: string, projectId: string }>();
  const navigate = useNavigate();
  const { selectedNc, fetchNcDetail, contractors, priorities, severities, referenceTypes, areas, categories, subCategories, fetchDropdownConfig, fetchConfig } = usePqmStore();

  const { firstName, lastName, username, userId, isSuperAdmin } = useAuthStore();
  const fullName = `${firstName || ''} ${lastName || ''}`.trim();
  const currentUserName = fullName ? fullName : (isSuperAdmin ? username : 'Unknown User');

  const [submitting, setSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<PQMAttachment[]>([]);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);

  const backUrl = projectId ? `/pqm/nc-management/${projectId}/nc/${id}` : `/pqm/nc-management/nc/${id}`;

  const { register, handleSubmit, watch, formState: { errors, isDirty }, reset } = useForm<EditNCFormValues>({
    resolver: zodResolver(editNCSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "",
      severity: "",
      is_safety_critical: false,
      
      category: "",
      sub_category: "",
      contractor: "",
      
      location_details: "",
      block: "",
      zone: "",
      location_description: "",
      
      site_quality_incharge_id: "",
      project_incharge_id: "",
      assigned_to_id: "",
      target_closure_date: "",
      
      reference_type: "",
      reference_description: "",
      raised_date: new Date().toISOString().split('T')[0],
      
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
    fetchConfig();
    fetchDropdownConfig();
  }, []);

  useEffect(() => {
    if (id) {
      fetchNcDetail(id);
      pqmService.listAttachments(id).then(setAttachments).catch(() => {
        toast.error("Failed to load attachments.");
      });
    }
  }, [id, fetchNcDetail]);

  useEffect(() => {
    if (selectedNc?.project) {
      const projectId = typeof selectedNc.project === 'object' ? (selectedNc.project as any).id : selectedNc.project;
      pqmService.listProjectMembers(projectId).then(members => {
        setProjectMembers(members);
      }).catch(err => console.error("Error fetching project members:", err));
    }
  }, [selectedNc?.project]);

  useEffect(() => {
    if (selectedNc) {
      reset({
        title: selectedNc.title ?? "",
        description: selectedNc.description ?? "",
        priority: (selectedNc.priority as any)?.id ?? (selectedNc.priority as any) ?? "",
        severity: (selectedNc.severity as any)?.id ?? (selectedNc.severity as any) ?? "",
        is_safety_critical: selectedNc.is_safety_critical ?? false,
        
        category: (selectedNc.category as any) ?? "",
        sub_category: (selectedNc.sub_category as any) ?? "",
        contractor: (selectedNc.contractor as any)?.id ?? (selectedNc.contractor as any) ?? "",
        
        location_details: selectedNc.location_details ?? "",
        block: selectedNc.block ?? "",
        zone: selectedNc.zone ?? "",
        location_description: selectedNc.location_description ? (typeof selectedNc.location_description === 'object' ? (selectedNc.location_description as any).id : selectedNc.location_description) : "",
        
        site_quality_incharge_id: selectedNc.site_quality_incharge_id ?? "",
        project_incharge_id: selectedNc.project_incharge_id ?? "",
        assigned_to_id: selectedNc.assigned_to_id ?? "",
        target_closure_date: selectedNc.target_closure_date ?? "",
        
        reference_type: (selectedNc.reference_type as any)?.id ?? (selectedNc.reference_type as any) ?? "",
        reference_description: (selectedNc as any).reference_description ?? "",
        raised_date: selectedNc.raised_date ?? new Date().toISOString().split('T')[0],
        
        root_cause_description: selectedNc.root_cause_description ?? "",
        root_cause_category: selectedNc.root_cause_category ?? "",
        corrective_action: selectedNc.corrective_action ?? "",
        preventive_action: selectedNc.preventive_action ?? "",
      });
    }
  }, [selectedNc, reset]);

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
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirty, handleSubmit]);

  const onSubmit = async (data: EditNCFormValues) => {
    if (!id) return;
    setSubmitting(true);
    try {
      await pqmService.updateNC(id, data as any);
      toast.success("NC updated.");
      navigate(backUrl);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Failed to save changes. Please check the form and try again."
      );
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

  const isProgressEditable = selectedNc.status !== 'Draft' && selectedNc.status !== 'Rejected';

  return (
    <div className="mx-auto max-w-[1400px] p-4 lg:p-8 animate-fadeInUp relative">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-[800px] overflow-hidden -z-10 pointer-events-none opacity-50 dark:opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-400/30 blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-fuchsia-400/20 blur-[120px]" />
      </div>
      <div className="mb-6 lg:mb-8">
        <PageHeader
          title="Edit Non-Conformance"
          icon={Edit}
          breadcrumbs={[
            { label: 'PQM' },
            { label: 'Non-Conformances', href: backUrl },
            { label: 'Edit NC' },
          ]}
        />
      </div>

      <div className="flex flex-col gap-6 lg:gap-8 items-start">
        <div className="w-full space-y-6 lg:space-y-8">
          
          <SectionCard collapsible defaultExpanded={true} title="Identification" icon={Info} iconColor="text-blue-500" animDelay="delay-50">
            <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 md:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-3 block text-[13px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  NC ID
                </label>
                <input
                  type="text"
                  disabled
                  value={selectedNc.nc_number || "Draft"}
                  className="block w-full rounded-xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-slate-800/50 py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="mb-3 block text-[13px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Inspection Date / Raised Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    {...register('raised_date')}
                    type="date"
                    className={`block w-full rounded-xl border ${errors.raised_date ? 'border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10' : 'border-gray-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500/50 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10'} bg-white/50 dark:bg-slate-900/50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 dark:text-white shadow-sm transition-all duration-300`}
                  />
                </div>
                {errors.raised_date && <p className="mt-1.5 text-[11px] text-rose-500">{errors.raised_date.message}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="mb-3 block text-[13px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Raised By
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Users className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    disabled
                    value={selectedNc.raised_by_id === userId ? currentUserName : (selectedNc.raised_by_id || '—')}
                    className="block w-full rounded-xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-slate-800/50 py-3 pl-10 pr-4 text-sm font-medium text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>
              
              <div className="sm:col-span-2">
                <label className="mb-3 block text-[13px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  NC Title <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Type className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    {...register('title')}
                    type="text"
                    className={`block w-full rounded-xl border ${errors.title ? 'border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10' : 'border-gray-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500/50 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10'} bg-white/50 dark:bg-slate-900/50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 dark:text-white shadow-sm transition-all duration-300`}
                    placeholder="Short, descriptive title"
                  />
                </div>
                {errors.title && <p className="mt-1.5 text-[11px] text-rose-500">{errors.title.message}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="mb-3 block text-[13px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  NC Description <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 top-3 pl-3.5">
                    <AlignLeft className="h-4 w-4 text-gray-400" />
                  </div>
                  <textarea
                    {...register('description')}
                    rows={4}
                    className={`block w-full rounded-xl border ${errors.description ? 'border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10' : 'border-gray-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500/50 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10'} bg-white/50 dark:bg-slate-900/50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 dark:text-white shadow-sm transition-all duration-300 resize-none`}
                    placeholder="Detailed description..."
                  />
                </div>
                {errors.description && <p className="mt-1.5 text-[11px] text-rose-500">{errors.description.message}</p>}
              </div>
            </div>
          </SectionCard>

          <SectionCard collapsible defaultExpanded={true} title="Classification" icon={Tag} iconColor="text-violet-500" animDelay="delay-100">
            <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 md:grid-cols-2">
              <div>
                <label className="mb-3 block text-[13px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Category</label>
                <select
                  {...register('category')}
                  className="block w-full rounded-xl border border-gray-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500/50 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 bg-white/50 dark:bg-slate-900/50 py-3 px-4 text-sm font-medium text-slate-900 dark:text-white shadow-sm transition-all duration-300"
                >
                  <option value="">— Select Category —</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-3 block text-[13px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Sub-Category</label>
                <select
                  {...register('sub_category')}
                  className="block w-full rounded-xl border border-gray-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500/50 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 bg-white/50 dark:bg-slate-900/50 py-3 px-4 text-sm font-medium text-slate-900 dark:text-white shadow-sm transition-all duration-300"
                >
                  <option value="">— Select Sub-Category —</option>
                  {filteredSubCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-3 block text-[13px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Priority <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register('priority')}
                  className="block w-full rounded-xl border border-gray-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500/50 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 bg-white/50 dark:bg-slate-900/50 py-3 px-4 text-sm font-medium text-slate-900 dark:text-white shadow-sm transition-all duration-300"
                >
                  <option value="">— Select Priority —</option>
                  {priorities.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
                {errors.priority && <p className="mt-1.5 text-[11px] text-rose-500">{errors.priority.message}</p>}
              </div>

              <div>
                <label className="mb-3 block text-[13px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Severity <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register('severity')}
                  className="block w-full rounded-xl border border-gray-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500/50 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 bg-white/50 dark:bg-slate-900/50 py-3 px-4 text-sm font-medium text-slate-900 dark:text-white shadow-sm transition-all duration-300"
                >
                  <option value="">— Select Severity —</option>
                  {severities.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
                {errors.severity && <p className="mt-1.5 text-[11px] text-rose-500">{errors.severity.message}</p>}
              </div>

              <div className="flex items-end pb-1">
                <label className="flex items-center gap-3 p-3 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
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
                      Safety Critical
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </SectionCard>

          <SectionCard collapsible defaultExpanded={true} title="Location & Reference" icon={MapPin} iconColor="text-emerald-500" animDelay="delay-150">
            <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 md:grid-cols-2">
              <div>
                <label className="mb-3 block text-[13px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Location <span className="text-rose-500">*</span>
                </label>
                <input
                  {...register('location_details')}
                  type="text"
                  placeholder="e.g. String 14, Block B"
                  className="block w-full rounded-xl border border-gray-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500/50 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 bg-white/50 dark:bg-slate-900/50 py-3 px-4 text-sm font-medium text-slate-900 dark:text-white shadow-sm transition-all duration-300"
                />
                {errors.location_details && <p className="mt-1.5 text-[11px] text-rose-500">{errors.location_details.message}</p>}
              </div>

              <div>
                <label className="mb-3 block text-[13px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Area</label>
                <select
                  {...register('location_description')}
                  className="block w-full rounded-xl border border-gray-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500/50 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 bg-white/50 dark:bg-slate-900/50 py-3 px-4 text-sm font-medium text-slate-900 dark:text-white shadow-sm transition-all duration-300"
                >
                  <option value="">— Select Area —</option>
                  {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-3 block text-[13px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Block</label>
                <input
                  {...register('block')}
                  type="text"
                  className="block w-full rounded-xl border border-gray-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500/50 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 bg-white/50 dark:bg-slate-900/50 py-3 px-4 text-sm font-medium text-slate-900 dark:text-white shadow-sm transition-all duration-300"
                />
              </div>

              <div>
                <label className="mb-3 block text-[13px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Zone</label>
                <input
                  {...register('zone')}
                  type="text"
                  className="block w-full rounded-xl border border-gray-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500/50 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 bg-white/50 dark:bg-slate-900/50 py-3 px-4 text-sm font-medium text-slate-900 dark:text-white shadow-sm transition-all duration-300"
                />
              </div>

              <div>
                <div className="flex items-center mb-1.5">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Reference Type</label>
                </div>
                <select
                  {...register('reference_type')}
                  className="block w-full rounded-xl border border-gray-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500/50 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 bg-white/50 dark:bg-slate-900/50 py-3 px-4 text-sm font-medium text-slate-900 dark:text-white shadow-sm transition-all duration-300"
                >
                  <option value="">— Select —</option>
                  {referenceTypes.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>

              <div className="sm:col-span-1">
                <label className="mb-3 block text-[13px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Reference Details</label>
                <input
                  {...register('reference_description')}
                  type="text"
                  className="block w-full rounded-xl border border-gray-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500/50 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 bg-white/50 dark:bg-slate-900/50 py-3 px-4 text-sm font-medium text-slate-900 dark:text-white shadow-sm transition-all duration-300"
                  placeholder="Doc #, Drawing #, etc."
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard collapsible defaultExpanded={true} title="Responsibility & Timeline" icon={Users} iconColor="text-amber-500" animDelay="delay-200">
            <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 md:grid-cols-2">
              <div>
                <label className="mb-3 block text-[13px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Responsible Contractor</label>
                <select
                  {...register('contractor')}
                  className="block w-full rounded-xl border border-gray-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500/50 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 bg-white/50 dark:bg-slate-900/50 py-3 px-4 text-sm font-medium text-slate-900 dark:text-white shadow-sm transition-all duration-300"
                >
                  <option value="">— Select Contractor —</option>
                  {contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-3 block text-[13px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Site Quality Incharge</label>
                <select
                  {...register('site_quality_incharge_id')}
                  className="block w-full rounded-xl border border-gray-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500/50 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 bg-white/50 dark:bg-slate-900/50 py-3 px-4 text-sm font-medium text-slate-900 dark:text-white shadow-sm transition-all duration-300"
                >
                  <option value="">— Select User —</option>
                  {projectMembers.map(u => (
                    <option key={u.user?.id || u.id} value={u.user?.id || u.id}>
                      {u.user?.first_name || u.first_name} {u.user?.last_name || u.last_name} {u.role ? `(${u.role.name})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-3 block text-[13px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Project Incharge</label>
                <select
                  {...register('project_incharge_id')}
                  className="block w-full rounded-xl border border-gray-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500/50 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 bg-white/50 dark:bg-slate-900/50 py-3 px-4 text-sm font-medium text-slate-900 dark:text-white shadow-sm transition-all duration-300"
                >
                  <option value="">— Select User —</option>
                  {projectMembers.map(u => (
                    <option key={u.user?.id || u.id} value={u.user?.id || u.id}>
                      {u.user?.first_name || u.first_name} {u.user?.last_name || u.last_name} {u.role ? `(${u.role.name})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-3 block text-[13px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Assigned To (Responsible Engineer)</label>
                <select
                  {...register('assigned_to_id')}
                  className="block w-full rounded-xl border border-gray-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500/50 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 bg-white/50 dark:bg-slate-900/50 py-3 px-4 text-sm font-medium text-slate-900 dark:text-white shadow-sm transition-all duration-300"
                >
                  <option value="">— Select User —</option>
                  {projectMembers.map(u => (
                    <option key={u.user?.id || u.id} value={u.user?.id || u.id}>
                      {u.user?.first_name || u.first_name} {u.user?.last_name || u.last_name} {u.role ? `(${u.role.name})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-3 block text-[13px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Target Closure Date
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    {...register('target_closure_date')}
                    type="date"
                    className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 focus:border-violet-500 bg-gray-50/50 dark:bg-gray-800/50 py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-white transition-all"
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          {isProgressEditable && (
            <SectionCard collapsible defaultExpanded={true} title="Investigation & CAPA" icon={CheckSquare} iconColor="text-emerald-500" animDelay="delay-200">
              <div className="grid gap-y-7 sm:grid-cols-1">
                
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-3 block text-[13px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Root Cause Category
                    </label>
                    <select
                      {...register('root_cause_category')}
                      className="block w-full rounded-xl border border-gray-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500/50 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 bg-white/50 dark:bg-slate-900/50 py-3 px-4 text-sm font-medium text-slate-900 dark:text-white shadow-sm transition-all duration-300"
                    >
                      <option value="">— Select Category —</option>
                      <option value="Design / Engineering">Design / Engineering</option>
                      <option value="Material / Equipment">Material / Equipment</option>
                      <option value="Workmanship / Execution">Workmanship / Execution</option>
                      <option value="Process / Procedure">Process / Procedure</option>
                      <option value="Environment / Weather">Environment / Weather</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-3 block text-[13px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Root Cause Description
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 top-3 pl-3.5">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <textarea
                      {...register('root_cause_description')}
                      rows={3}
                      className="block w-full rounded-xl border border-gray-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500/50 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 bg-white/50 dark:bg-slate-900/50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 dark:text-white shadow-sm transition-all duration-300 resize-none"
                      placeholder="Detailed explanation of the root cause..."
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-3 block text-[13px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Corrective Action
                  </label>
                  <textarea
                    {...register('corrective_action')}
                    rows={3}
                    className="block w-full rounded-xl border border-gray-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500/50 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 bg-white/50 dark:bg-slate-900/50 py-3 px-4 text-sm font-medium text-slate-900 dark:text-white shadow-sm transition-all duration-300 resize-none"
                    placeholder="Action taken to correct the non-conformance..."
                  />
                </div>

                <div>
                  <label className="mb-3 block text-[13px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Preventive Action
                  </label>
                  <textarea
                    {...register('preventive_action')}
                    rows={3}
                    className="block w-full rounded-xl border border-gray-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500/50 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 bg-white/50 dark:bg-slate-900/50 py-3 px-4 text-sm font-medium text-slate-900 dark:text-white shadow-sm transition-all duration-300 resize-none"
                    placeholder="Action taken to prevent recurrence..."
                  />
                </div>
              </div>
            </SectionCard>
          )}

          <SectionCard collapsible defaultExpanded={true} title="Attachments" icon={FileText} iconColor="text-pink-500" animDelay="delay-250">
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

          {/* ── Bottom: Save panel ──────────────────────── */}
          <div className="w-full rounded-[20px] border border-white/60 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] flex flex-col sm:flex-row items-center justify-end gap-4 transition-all duration-500 mt-6 lg:mt-8">
            {isDirty && (
              <p className="text-[13px] text-amber-600 dark:text-amber-400 font-medium mr-auto flex-1">
                You have unsaved changes
              </p>
            )}

            <button
              type="button"
              onClick={() => navigate(backUrl)}
              className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-all duration-300 sm:w-auto w-full"
            >
              <ArrowLeft className="h-4 w-4" /> Cancel
            </button>
            
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/40 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 sm:w-auto w-full"
            >
              {submitting
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                : <><Save className="h-4 w-4" /> Save Changes</>
              }
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}