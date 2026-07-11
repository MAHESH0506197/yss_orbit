// yss_orbit/frontend/src/features/pqm/pages/NCCreatePage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Edit, Save, ArrowLeft, Loader2, Info, ClipboardList, Building2,
  Type, AlignLeft, Tag, AlertTriangle, CheckSquare, Search, MapPin, Calendar, FileText, Users, Upload, X, Image
} from 'lucide-react';

import { usePqmStore } from "../store/usePqmStore";
import { pqmService } from "../api/pqmService";
import { useAuthStore } from "@/store/authStore";
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionCard } from '@/components/platform/SectionCard';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import toast from 'react-hot-toast';

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
  
  location_details: z.string().min(1, "Location is required"),
  block: z.string().optional(),
  zone: z.string().optional(),
  
  location_description: z.string().optional().nullable().or(z.literal('')),
  
  site_quality_incharge_id: z.string().optional().nullable(),
  project_incharge_id: z.string().optional().nullable(),
  assigned_to_id: z.string().optional().nullable(),
  target_closure_date: z.string().optional().nullable(),
  
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
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { firstName, lastName, username, isSuperAdmin } = useAuthStore();
  const fullName = `${firstName || ''} ${lastName || ''}`.trim();
  const raisedByName = fullName ? fullName : (isSuperAdmin ? username : 'Unknown User');

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
    },
    mode: 'onChange',
  });

  const selectedCategory = watch('category');
  const selectedProject = watch('project');

  const filteredSubCategories = selectedCategory 
    ? subCategories.filter(sc => sc.system_mapping === selectedCategory)
    : [];

  useEffect(() => {
    fetchConfig();
    fetchDropdownConfig();
  }, []);

  useEffect(() => {
    if (projectId && projects.length > 0) {
      setValue("project", projectId, { shouldValidate: true, shouldDirty: true });
    }
  }, [projectId, projects, setValue]);

  useEffect(() => {
    if (selectedProject) {
      pqmService.listProjectMembers(selectedProject).then(members => {
        setProjectMembers(members);
      }).catch(err => console.error("Error fetching project members:", err));
    } else {
      setProjectMembers([]);
    }
  }, [selectedProject]);

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
        handleSubmit((data) => onSubmit(data, true))();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirty, navigate, handleSubmit]);

  const onSubmit = async (data: CreateNCFormValues, asDraft: boolean) => {
    if (!asDraft && selectedFiles.length === 0) {
      setUploadError("At least 1 before-photo is required to submit.");
      return;
    }
    setUploadError(null);

    if (asDraft) setSubmittingAsDraft(true);
    else setSubmittingAndSubmit(true);

    try {
      const payload = {
        ...data,
        category: data.category || null,
        sub_category: data.sub_category || null,
        contractor: data.contractor || null,
        site_quality_incharge_id: data.site_quality_incharge_id || null,
        project_incharge_id: data.project_incharge_id || null,
        assigned_to_id: data.assigned_to_id || null,
        target_closure_date: data.target_closure_date || null,
      };

      const nc = await pqmService.createNC(payload as any);

      // Upload photos sequentially — collect failures instead of only logging them,
      // since a before-photo that silently failed to upload will later block
      // Request Closure with no explanation of why the "1 photo attached" count is wrong.
      const failedUploads: string[] = [];
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("attachment_stage", "before");
        formData.append("file_name", file.name);
        formData.append("file_size_bytes", file.size.toString());
        formData.append("mime_type", file.type);
        try {
          await pqmService.uploadAttachment(nc.id, formData);
        } catch (uploadErr) {
          failedUploads.push(file.name);
        }
      }
      if (failedUploads.length > 0) {
        toast.error(`${failedUploads.length} photo(s) failed to upload: ${failedUploads.join(', ')}. You can retry from the NC detail page.`);
      }

      if (!asDraft) {
        await pqmService.submitNC(nc.id);
        toast.success(`NC ${nc.nc_number || ''} submitted for review.`);
      } else {
        toast.success(`NC ${nc.nc_number || ''} saved as draft.`);
      }
      navigate(projectId ? `/pqm/nc-management/${projectId}/nc/${nc.id}` : `/pqm/nc-management/nc/${nc.id}`);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        (asDraft ? "Failed to save draft. Please check the form and try again." : "Failed to submit NC. Please check the form and try again.")
      );
    } finally {
      setSubmittingAsDraft(false);
      setSubmittingAndSubmit(false);
    }
  };

  const isBusy = submittingAsDraft || submittingAndSubmit;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (selectedFiles.length + newFiles.length > 5) {
        setUploadError("Maximum 5 photos allowed per NC.");
        return;
      }
      setUploadError(null);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setUploadError(null);
  };

  return (
    <div className="mx-auto max-w-[1400px] p-4 lg:p-8 animate-fadeInUp relative">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-[800px] overflow-hidden -z-10 pointer-events-none opacity-50 dark:opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-400/30 blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-fuchsia-400/20 blur-[120px]" />
      </div>
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

      <div className="flex flex-col gap-6 lg:gap-8 items-start">
        <div className="w-full space-y-6 lg:space-y-8">
          
          {/* Section 1: Identification */}
          <SectionCard collapsible defaultExpanded={true} title="Identification" icon={Info} iconColor="text-blue-500" animDelay="delay-50">
            <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 md:grid-cols-2">
              <div>
                <label className="mb-3 block text-[13px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Project <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register('project')}
                  disabled={!!projectId}
                  className={`block w-full rounded-xl border ${errors.project ? 'border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10' : 'border-gray-200 dark:border-white/10 hover:border-violet-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10'} ${!!projectId ? 'bg-gray-100 dark:bg-slate-800 cursor-not-allowed text-slate-500' : 'bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white shadow-sm'} py-3 px-4 text-sm font-medium transition-all duration-300`}
                >
                  <option value="">— Select Project —</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {errors.project && <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-rose-500"><Info className="h-3 w-3" />{errors.project.message}</p>}
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
                {errors.raised_date && <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-rose-500"><Info className="h-3 w-3" />{errors.raised_date.message}</p>}
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
                    value={raisedByName}
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
                {errors.title && <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-rose-500"><Info className="h-3 w-3" />{errors.title.message}</p>}
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
                    placeholder="Detailed description of the non-conformance..."
                  />
                </div>
                {errors.description && <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-rose-500"><Info className="h-3 w-3" />{errors.description.message}</p>}
              </div>
            </div>
          </SectionCard>

          {/* Section 2: Location & Reference */}
          <SectionCard collapsible defaultExpanded={true} title="Location & Reference" icon={MapPin} iconColor="text-emerald-500" animDelay="delay-100">
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

          {/* Section 3: Classification */}
          <SectionCard collapsible defaultExpanded={true} title="Classification" icon={Tag} iconColor="text-violet-500" animDelay="delay-150">
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

          {/* Section 4: Responsibility & Timeline */}
          <SectionCard collapsible defaultExpanded={true} title="Personnel" icon={Users} iconColor="text-orange-500" animDelay="delay-200">
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

          <SectionCard collapsible defaultExpanded={true} title="Evidence" icon={FileText} iconColor="text-pink-500" animDelay="delay-300">
            <div className="mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">At least one before-photo is required to submit — this is what makes the NC audit-defensible</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <p className="mb-1.5 text-sm font-bold text-gray-700 dark:text-gray-300">
                  Before photos <span className="text-rose-500">* min. 1 required</span>
                </p>
                <div className="relative rounded-2xl border-2 border-dashed border-violet-300/50 dark:border-white/10 bg-violet-50/30 dark:bg-slate-900/50 hover:bg-violet-50 dark:hover:bg-slate-800 transition-all duration-300 group">
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                  />
                  <div className="p-10 flex flex-col items-center justify-center text-center">
                    <div className="h-14 w-14 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Upload className="h-6 w-6 text-violet-500" />
                    </div>
                    <p className="text-[15px] font-extrabold text-slate-800 dark:text-slate-200">Drop photos here or click to upload</p>
                    <p className="mt-1.5 text-[13px] text-slate-500 dark:text-slate-400 font-medium">JPG/PNG · GPS & timestamp captured automatically</p>
                  </div>
                </div>

                {uploadError && (
                  <p className="mt-2 text-sm font-semibold text-rose-500 flex items-center gap-1">
                    <AlertTriangle size={14} /> {uploadError}
                  </p>
                )}

                {selectedFiles.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {selectedFiles.map((f, i) => (
                      <div key={i} className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 flex flex-col gap-1 items-center justify-center">
                        <Image className="h-6 w-6 text-violet-500" />
                        <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 truncate w-full text-center" title={f.name}>
                          {f.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <p className={`mt-3 text-xs font-semibold ${selectedFiles.length === 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                  • {selectedFiles.length} of 1 required before-photos attached
                </p>
              </div>
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
              onClick={handleSubmit((data) => onSubmit(data, true))}
              disabled={isBusy}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 px-5 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 hover:border-slate-300 dark:hover:bg-slate-800 dark:hover:border-white/20 shadow-sm transition-all duration-300 sm:w-auto w-full"
            >
              {submittingAsDraft
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                : "Save as Draft"
              }
            </button>
            
            <button
              type="button"
              onClick={handleSubmit((data) => onSubmit(data, false))}
              disabled={isBusy}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/40 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 sm:w-auto w-full"
            >
              {submittingAndSubmit
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                : <><Save className="h-4 w-4" /> Save & Submit</>
              }
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}