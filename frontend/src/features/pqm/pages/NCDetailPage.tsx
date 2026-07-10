// yss_orbit/frontend/src/features/pqm/pages/NCDetailPage.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePqmStore } from "../store/usePqmStore";
import { NCStatusBadge } from "../components/NCStatusBadge";
import { NCPriorityTag } from "../components/NCPriorityTag";
import { SLACountdown } from "../components/SLACountdown";
import { NCApprovalChainWidget } from "../components/NCApprovalChainWidget";
import { NCTimeline } from "../components/NCTimeline";
import { AttachmentGallery } from "../components/AttachmentGallery";
import { DuplicateWarningBanner } from "../components/DuplicateWarningBanner";
import { ReopenDialog } from "../components/ReopenDialog";
import { ReassignDialog } from "../components/ReassignDialog";
import { pqmService } from "../api/pqmService";
import { useAuthStore } from "@/store/authStore";
import type { PQMComment, PQMAttachment } from "../types";
import { formatIST } from '@/utils/date';

import { PageHeader } from '@/components/ui/PageHeader';
import { SectionCard } from '@/components/platform/SectionCard';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { 
  ClipboardList, Send, Play, CheckSquare, RotateCcw, 
  UserPlus, Edit2, Info, MapPin, Tag, Target, FileText, 
  Paperclip, Activity, MessageSquare, AlertTriangle, Building2, Calendar
} from 'lucide-react';

type Tab = "details" | "attachments" | "timeline" | "comments";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'details', label: 'Details', icon: FileText },
  { id: 'attachments', label: 'Attachments', icon: Paperclip },
  { id: 'timeline', label: 'Timeline', icon: Activity },
  { id: 'comments', label: 'Comments', icon: MessageSquare },
];

export default function NCDetailPage() {
  const { id, projectId } = useParams<{ id: string, projectId: string }>();
  const navigate = useNavigate();
  const currentUserId = useAuthStore((s) => s.userId) ?? undefined;

  const {
    selectedNc,
    ncDetailLoading,
    duplicateWarning,
    fetchNcDetail,
    clearSelectedNc,
    checkDuplicates,
    submitNc,
    startWork,
    requestClosure,
    reopenNc,
    assignNc,
    reopenDialogOpen,
    setReopenDialogOpen,
    reassignDialogOpen,
    setReassignDialogOpen,
  } = usePqmStore();

  const [activeTab, setActiveTab] = useState<Tab>("details");
  const [actionLoading, setActionLoading] = useState(false);
  const [comments, setComments] = useState<PQMComment[]>([]);
  const [attachments, setAttachments] = useState<PQMAttachment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentInternal, setCommentInternal] = useState(true);

  useEffect(() => {
    if (id) {
      fetchNcDetail(id);
      checkDuplicates(id);
    }
    return () => clearSelectedNc();
  }, [id, fetchNcDetail, checkDuplicates, clearSelectedNc]);

  // Load tab-specific data from real API
  useEffect(() => {
    if (!id) return;
    if (activeTab === "comments") {
      pqmService.listComments(id).then(setComments).catch(() => {});
    }
    if (activeTab === "attachments") {
      pqmService.listAttachments(id).then(setAttachments).catch(() => {});
    }
  }, [id, activeTab]);

  const handleAction = async (action: () => Promise<any>) => {
    setActionLoading(true);
    try { 
      await action(); 
      if (id) await fetchNcDetail(id); 
    } finally { 
      setActionLoading(false); 
    }
  };

  const postComment = async () => {
    if (!id || !newComment.trim()) return;
    await pqmService.addComment(id, newComment.trim(), commentInternal);
    setNewComment("");
    const updated = await pqmService.listComments(id);
    setComments(updated);
  };

  const handleReopen = async (reason: string) => {
    if (!id) return;
    await handleAction(() => reopenNc(id, reason));
    setReopenDialogOpen(false);
  };

  const handleReassign = async (newAssigneeId: string, reason: string) => {
    if (!id) return;
    await handleAction(() => assignNc(id, newAssigneeId));
    setReassignDialogOpen(false);
  };

  if (ncDetailLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-gray-500">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
          <p className="text-sm font-medium">Loading NC details...</p>
        </div>
      </div>
    );
  }

  if (!selectedNc) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <ClipboardList className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">NC Not Found</h2>
          <p className="mt-2 text-sm text-gray-500">The requested Non-Conformance could not be found.</p>
          <button
            onClick={() => navigate(projectId ? `/pqm/nc-management/${projectId}/nc` : "/pqm/nc-management/nc")}
            className="mt-6 rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-700"
          >
            Return to List
          </button>
        </div>
      </div>
    );
  }

  const nc = selectedNc;
  const isTerminal = ["Closed", "Merged", "Rejected"].includes(nc.status);
  const canSubmit = nc.status === "Draft";
  const canStartWork = nc.status === "Assigned";
  const canRequestClosure = nc.status === "In Progress" || nc.status === "Rectified";
  const canReopen = nc.status === "Closed";

  const headerActions = (
    <div className="flex flex-wrap items-center gap-3">
      {canSubmit && (
        <button
          onClick={() => handleAction(() => submitNc(nc.id))}
          disabled={actionLoading}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-violet-700 disabled:opacity-50 transition-all"
        >
          <Send className="h-4 w-4" /> Submit
        </button>
      )}
      {canStartWork && (
        <button
          onClick={() => handleAction(() => startWork(nc.id))}
          disabled={actionLoading}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-all"
        >
          <Play className="h-4 w-4" /> Start Work
        </button>
      )}
      {canRequestClosure && (
        <button
          onClick={() => handleAction(() => requestClosure(nc.id))}
          disabled={actionLoading}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-all"
        >
          <CheckSquare className="h-4 w-4" /> Request Closure
        </button>
      )}
      {canReopen && (
        <button
          onClick={() => setReopenDialogOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-amber-700 transition-all"
        >
          <RotateCcw className="h-4 w-4" /> Reopen
        </button>
      )}
      {!isTerminal && (
        <button
          onClick={() => setReassignDialogOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-all"
        >
          <UserPlus className="h-4 w-4" /> Reassign
        </button>
      )}
      {!isTerminal && (
        <button
          onClick={() => navigate(projectId ? `/pqm/nc-management/${projectId}/nc/${nc.id}/edit` : `/pqm/nc-management/nc/${nc.id}/edit`)}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-all"
        >
          <Edit2 className="h-4 w-4" /> Edit
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl p-4 lg:p-8 animate-fadeInUp pb-24">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <PageHeader
          icon={FileText}
          title={nc.title}
          subtitle={nc.nc_number}
          iconGradient="from-blue-500 to-indigo-600"
          breadcrumbs={[
            { label: 'Quality', href: '/platform/pqm' },
            { label: 'Non-Conformances', href: projectId ? `/pqm/nc-management/${projectId}/nc` : '/pqm/nc-management/nc' },
            { label: nc.nc_number }
          ]}
          actions={
            <div className="flex gap-2 print:hidden">
              <button
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                 Export
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                 Print Report
              </button>
            </div>
          }
        />
        <div className="mt-4 flex flex-wrap items-center gap-3 pl-16">
          <NCStatusBadge status={nc.status} />
          <span className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            {nc.severity.toUpperCase()}
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700">
            <Calendar className="h-3.5 w-3.5 text-gray-400" />
            Due: {nc.target_closure_date ? new Date(nc.target_closure_date).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      </div>

      {/* Duplicate Warning */}
      {duplicateWarning.length > 0 && (
        <div className="mb-6">
          <DuplicateWarningBanner
            duplicates={duplicateWarning}
            onViewDuplicate={(dupId) => navigate(projectId ? `/pqm/nc-management/${projectId}/nc/${dupId}` : `/pqm/nc-management/nc/${dupId}`)}
          />
        </div>
      )}

      {/* SLA Countdown */}
      {nc.target_closure_date && !isTerminal && (
        <div className="mb-6">
          <SLACountdown
            targetClosureDate={nc.target_closure_date}
            isSafetyCritical={nc.is_safety_critical}
            actualClosureDate={nc.actual_closure_date}
          />
        </div>
      )}

      {/* Approval Chain */}
      {nc.approval_steps && nc.approval_steps.length > 0 && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700/50 dark:bg-gray-900">
          <NCApprovalChainWidget
            steps={nc.approval_steps}
            currentUserId={currentUserId}
          />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
        
        {/* Left Col: Navigation Tabs */}
        <div className="lg:col-span-1 print:hidden">
          <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm dark:border-gray-700/50 dark:bg-gray-900 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-white"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? "text-violet-600 dark:text-violet-400" : "text-gray-400"}`} />
                  {tab.label}
                  {tab.id === 'attachments' && attachments.length > 0 && (
                    <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${isActive ? 'bg-violet-200 text-violet-800 dark:bg-violet-500/30 dark:text-violet-200' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                      {attachments.length}
                    </span>
                  )}
                  {tab.id === 'comments' && comments.length > 0 && (
                    <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${isActive ? 'bg-violet-200 text-violet-800 dark:bg-violet-500/30 dark:text-violet-200' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                      {comments.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Col: Tab Panels */}
        <div className="lg:col-span-3">
          {activeTab === "details" && (
            <div className="space-y-6">
              
              <SectionCard title="Basic Information" icon={Info} iconColor="text-blue-500" animDelay="delay-50">
                <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <DetailField label="NC Description" value={nc.description} wide />
                  </div>
                  <DetailField label="Raised By" value={nc.raised_by_id} />
                  <DetailField label="Assigned To" value={nc.assigned_to_id ?? "—"} />
                  <DetailField label="Raised Date" value={nc.raised_date} />
                  <DetailField label="Target Closure" value={nc.target_closure_date ?? "—"} />
                  <DetailField label="Actual Closure" value={nc.actual_closure_date ?? "—"} />
                  <DetailField label="Reopen Count" value={String(nc.reopen_count)} />
                </div>
              </SectionCard>

              <SectionCard title="Location & Reference" icon={MapPin} iconColor="text-emerald-500" animDelay="delay-100">
                <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  <DetailField label="Project" value={nc.project} />
                  <DetailField label="Location / Area" value={nc.location_description} tooltip="The physical location — where on the site the non-conformance occurred." />
                  <DetailField label="Reference Type" value={nc.reference_type} tooltip="Categorizes the origin document, drawing, or standard violated." />
                  <DetailField label="Reference Details" value={nc.reference_description} wide className="sm:col-span-2" />
                </div>
              </SectionCard>

              <SectionCard title="Classification" icon={Tag} iconColor="text-violet-500" animDelay="delay-150">
                <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  <DetailField label="Category" value={nc.category} tooltip="The discipline or type of work — what kind of issue it is." />
                  <DetailField label="Sub-Category" value={nc.sub_category} tooltip="A more specific breakdown of the category." />
                  <DetailField label="Contractor" value={nc.contractor} />
                  <DetailField label="Severity" value={nc.severity} tooltip="Severity determines the impact of the non-conformance on the project quality or cost." />
                </div>
              </SectionCard>

              {(nc.root_cause_description || nc.corrective_action || nc.preventive_action) && (
                <SectionCard title="Resolution" icon={Target} iconColor="text-amber-500" animDelay="delay-200">
                  <div className="grid gap-y-6 sm:grid-cols-1">
                    {nc.root_cause_description && (
                      <DetailField label="Root Cause" value={nc.root_cause_description} wide />
                    )}
                    {nc.corrective_action && (
                      <DetailField label="Corrective Action" value={nc.corrective_action} wide />
                    )}
                    {nc.preventive_action && (
                      <DetailField label="Preventive Action" value={nc.preventive_action} wide />
                    )}
                  </div>
                </SectionCard>
              )}
            </div>
          )}

          {activeTab === "attachments" && (
            <div className="animate-fadeInUp">
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
          )}

          {activeTab === "timeline" && (
            <div className="animate-fadeInUp overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700/50 dark:bg-gray-900">
              <NCTimeline
                statusHistory={nc.status_history ?? []}
                approvalSteps={nc.approval_steps ?? []}
                comments={comments}
              />
            </div>
          )}

          {activeTab === "comments" && (
            <div className="animate-fadeInUp space-y-6">
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700/50 dark:bg-gray-900">
                <textarea
                  className="block w-full resize-none rounded-xl border border-gray-200 bg-gray-50/50 p-3 text-sm text-gray-900 placeholder-gray-500 focus:border-violet-500 focus:ring-violet-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white dark:placeholder-gray-400"
                  placeholder="Add a comment…"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  rows={3}
                />
                <div className="mt-3 flex items-center justify-between">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-violet-600 focus:ring-violet-600 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-900"
                      checked={commentInternal}
                      onChange={e => setCommentInternal(e.target.checked)}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Internal only</span>
                  </label>
                  <button
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-violet-700 disabled:opacity-50 transition-all"
                    onClick={postComment}
                    disabled={!newComment.trim()}
                  >
                    Post Comment
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center dark:border-gray-700/50">
                    <MessageSquare className="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No comments yet</p>
                  </div>
                ) : (
                  comments.map(c => (
                    <div key={c.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="font-bold text-gray-900 dark:text-white">{c.author_id}</span>
                        <span className="text-xs font-medium text-gray-500">{formatIST(new Date(c.created_at), 'PP pp')}</span>
                        {c.is_internal && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                            Internal
                          </span>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{c.body}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <ReopenDialog
        ncNumber={nc.nc_number}
        isOpen={reopenDialogOpen}
        isSubmitting={actionLoading}
        onConfirm={handleReopen}
        onClose={() => setReopenDialogOpen(false)}
      />
      <ReassignDialog
        ncNumber={nc.nc_number}
        isOpen={reassignDialogOpen}
        isSubmitting={actionLoading}
        onConfirm={handleReassign}
        onClose={() => setReassignDialogOpen(false)}
      />
    </div>
  );
}

function DetailField({
  label,
  value,
  wide,
  className = "",
}: {
  label: string;
  value: any;
  wide?: boolean;
  className?: string;
  tooltip?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span className="flex items-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label}
        {tooltip && <InfoTooltip content={tooltip} />}
      </span>
      <span className={`text-sm font-medium text-gray-900 dark:text-white ${wide ? 'whitespace-pre-wrap' : 'truncate'}`}>
        {value || "—"}
      </span>
    </div>
  );
}
