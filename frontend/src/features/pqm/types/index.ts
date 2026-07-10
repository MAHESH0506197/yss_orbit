// yss_orbit\frontend\src\features\pqm\types\index.ts

// NC Status lifecycle
export type NCStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Approved'
  | 'Rejected'
  | 'Assigned'
  | 'In Progress'
  | 'Rectified'
  | 'Verification Pending'
  | 'Approved for Closure'
  | 'Rework'
  | 'Closed'
  | 'Reopened'
  | 'Merged';

export type Priority = string;
export type Severity = string;
export type ReferenceType = string;

export interface PQMDropdownOption {
  id: string;
  name: string;
  field_type: 'PRIORITY' | 'SEVERITY' | 'REFERENCE_TYPE' | 'AREA' | 'CATEGORY' | 'SUB_CATEGORY';
  system_mapping: string | null;
  is_active: boolean;
  display_order: number;
}

export type BackchargeStatus =
  | 'Not Applicable'
  | 'Proposed'
  | 'Contractor Disputed'
  | 'Agreed'
  | 'Deducted';
export type AttachmentStage = 'before' | 'after' | 'document' | 'drawing' | 'report';
export type ApprovalDecision = 'Pending' | 'Approved' | 'Rejected' | 'Rework';
export type ApprovalStage = 'review' | 'verification';

export interface PQMProject {
  id: string;
  organization_id: string;
  business_unit_id: string;
  name: string;
  code: string;
  description: string;
  location: string;
  project_start_date: string | null;
  expected_project_end_date: string | null;
  capacity: string;
  construction_incharge_id: string | null;
  quality_incharge_id: string | null;
  project_head_id: string | null;
  quality_head_id: string | null;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface PQMSite {
  id: string;
  project: string; // FK ID
  name: string;
  code: string;
  location: string;
  is_active: boolean;
}

export interface PQMContractor {
  id: string;
  name: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  is_active: boolean;
}

export interface PQMAttachment {
  id: string;
  nc: string;
  uploaded_by_id: string;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  attachment_stage: AttachmentStage;
  version: number;
  photo_gps_lat?: number | null;
  photo_gps_lng?: number | null;
  photo_captured_at?: string | null;
  gps_within_geofence?: boolean | null;
  description: string;
  signed_url?: string;
  created_at: string;
}

export interface PQMApprovalStep {
  id: string;
  stage: ApprovalStage;
  sequence_order: number;
  approver_id: string;
  decision: ApprovalDecision;
  comments: string;
  decided_at: string | null;
}

export interface PQMStatusHistoryEntry {
  id: string;
  event_type: string;
  from_status: string;
  to_status: string;
  actor_id: string;
  reason: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface PQMComment {
  id: string;
  author_id: string;
  body: string;
  is_internal: boolean;
  parent: string | null;
  created_at: string;
  updated_at: string;
}

export interface NonConformance {
  id: string;
  nc_number: string;
  organization_id: string;
  business_unit_id: string;
  title: string;
  description: string;
  status: NCStatus;
  priority: Priority;
  severity: Severity;
  is_safety_critical: boolean;
  project: string;
  category: string | null;
  sub_category: string | null;
  contractor: string | null;
  location_description: string;
  reference_type: ReferenceType | '';
  reference_description: string;

  raised_by_id: string;
  assigned_to_id: string | null;
  raised_date: string;
  target_closure_date: string | null;
  original_target_closure_date: string | null;
  actual_closure_date: string | null;
  root_cause_description: string;
  root_cause_category: string;
  corrective_action: string;
  preventive_action: string;
  current_approval_level: number;
  approval_levels_required: number;
  reopen_count: number;
  backcharge_amount: number | null;
  backcharge_status: BackchargeStatus;
  is_migrated: boolean;
  legacy_reference: string;
  created_at: string;
  updated_at: string;
  // nested
  attachments?: PQMAttachment[];
  approval_steps?: PQMApprovalStep[];
  comments?: PQMComment[];
  status_history?: PQMStatusHistoryEntry[];
}

export interface NCListItem
  extends Pick<
    NonConformance,
    | 'id'
    | 'nc_number'
    | 'title'
    | 'status'
    | 'priority'
    | 'severity'
    | 'is_safety_critical'
    | 'project'
    | 'assigned_to_id'

    | 'raised_date'
    | 'target_closure_date'
    | 'actual_closure_date'
    | 'raised_by_id'
    | 'category'
    | 'contractor'
    | 'created_at'
  > {}

export interface NCFilters {
  status?: NCStatus | '';
  priority?: Priority | '';
  severity?: Severity | '';
  is_safety_critical?: boolean;
  project?: string;
  assigned_to_id?: string;

  raised_by_id?: string;
  search?: string;
  page?: number;
  page_size?: number;
  ordering?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface DashboardKPI {
  total_ncs: number;
  open_ncs: number;
  closed_ncs: number;
  overdue_ncs: number;
  critical_ncs: number;
  high_priority_ncs: number;
  safety_critical_open: number;
  avg_closure_days: number;
  sla_compliance_pct: number;
  reopen_rate_pct: number;
}

export interface PQMExtensionRequest {
  id: string;
  nc: string;
  requested_by_id: string;
  original_target_date: string;
  requested_date: string;
  reason: string;
  decision: ApprovalDecision;
  decided_by_id: string | null;
  decided_at: string | null;
  decision_comments: string;
  created_at: string;
}
