// yss_orbit\frontend\src\features\pqm\api\pqmService.ts
import { apiClient } from '@/api/client';
import {
  NonConformance,
  NCListItem,
  NCFilters,
  PaginatedResponse,
  PQMProject,
  PQMSite,
  PQMContractor,
  DashboardKPI,
  PQMExtensionRequest,
  PQMAttachment,
  PQMComment,
  PQMStatusHistoryEntry,
  PQMDropdownOption,
} from '../types';

class PqmService {
  // ── NC CRUD ────────────────────────────────────────────────────────────────
  async listNCs(filters: NCFilters): Promise<PaginatedResponse<NCListItem>> {
    const response = await apiClient.get('/pqm/nc/', { params: filters });
    return response.data.data;
  }

  async getNC(id: string): Promise<NonConformance> {
    const response = await apiClient.get(`/pqm/nc/${id}/`);
    return response.data.data;
  }

  async createNC(data: Partial<NonConformance>): Promise<NonConformance> {
    const response = await apiClient.post('/pqm/nc/', data);
    return response.data.data;
  }

  async updateNC(id: string, data: Partial<NonConformance>): Promise<NonConformance> {
    const response = await apiClient.patch(`/pqm/nc/${id}/`, data);
    return response.data.data;
  }

  // ── NC Actions ─────────────────────────────────────────────────────────────
  async submitNC(id: string): Promise<NonConformance> {
    const response = await apiClient.post(`/pqm/nc/${id}/submit/`);
    return response.data.data;
  }

  async reviewDecision(id: string, decision: string, comments: string): Promise<NonConformance> {
    const response = await apiClient.post(`/pqm/nc/${id}/review-decision/`, { decision, comments });
    return response.data.data;
  }

  async assignNC(id: string, assignee_id: string): Promise<NonConformance> {
    const response = await apiClient.post(`/pqm/nc/${id}/assign/`, { assigned_to_id: assignee_id });
    return response.data.data;
  }

  async startWork(id: string): Promise<NonConformance> {
    const response = await apiClient.post(`/pqm/nc/${id}/start-work/`);
    return response.data.data;
  }

  async requestClosure(id: string): Promise<NonConformance> {
    const response = await apiClient.post(`/pqm/nc/${id}/request-closure/`);
    return response.data.data;
  }

  async verificationDecision(
    id: string,
    level: number,
    decision: string,
    comments: string,
  ): Promise<NonConformance> {
    const response = await apiClient.post(`/pqm/nc/${id}/verification-decision/`, {
      level,
      decision,
      comments,
    });
    return response.data.data;
  }

  async reopenNC(id: string, reason: string): Promise<NonConformance> {
    const response = await apiClient.post(`/pqm/nc/${id}/reopen/`, { reason });
    return response.data.data;
  }

  async reassignNC(
    id: string,
    new_assignee_id: string,
    reason: string,
  ): Promise<NonConformance> {
    const response = await apiClient.post(`/pqm/nc/${id}/reassign/`, { new_assignee_id, reason });
    return response.data.data;
  }

  async mergeNC(id: string, target_nc_id: string): Promise<NonConformance> {
    const response = await apiClient.post(`/pqm/nc/${id}/merge/`, { target_nc_id });
    return response.data.data;
  }

  async checkDuplicates(id: string): Promise<NCListItem[]> {
    const response = await apiClient.get(`/pqm/nc/${id}/duplicate-check/`);
    return response.data.data;
  }

  // ── Attachments ────────────────────────────────────────────────────────────
  async listAttachments(ncId: string): Promise<PQMAttachment[]> {
    const response = await apiClient.get(`/pqm/nc/${ncId}/attachments/`);
    return response.data.data;
  }

  async uploadAttachment(ncId: string, formData: FormData): Promise<PQMAttachment> {
    const response = await apiClient.post(`/pqm/nc/${ncId}/attachments/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  }

  // ── Comments ───────────────────────────────────────────────────────────────
  async listComments(ncId: string): Promise<PQMComment[]> {
    const response = await apiClient.get(`/pqm/nc/${ncId}/comments/`);
    return response.data.data;
  }

  async addComment(ncId: string, body: string, is_internal = true): Promise<PQMComment> {
    const response = await apiClient.post(`/pqm/nc/${ncId}/comments/`, { body, is_internal });
    return response.data.data;
  }

  // ── History ────────────────────────────────────────────────────────────────
  async getHistory(ncId: string): Promise<PQMStatusHistoryEntry[]> {
    const response = await apiClient.get(`/pqm/nc/${ncId}/history/`);
    return response.data.data;
  }

  // ── Extension ──────────────────────────────────────────────────────────────
  async requestExtension(
    ncId: string,
    data: { requested_date: string; reason: string },
  ): Promise<PQMExtensionRequest> {
    const response = await apiClient.post(`/pqm/nc/${ncId}/extension-request/`, data);
    return response.data.data;
  }

  async decideExtension(
    ncId: string,
    data: { decision: string; decision_comments: string },
  ): Promise<PQMExtensionRequest> {
    const response = await apiClient.post(`/pqm/nc/${ncId}/extension-decision/`, data);
    return response.data.data;
  }



  // ── Config: Dropdown Options ───────────────────────────────────────────────
  async listDropdownOptions(fieldType?: string): Promise<PQMDropdownOption[]> {
    const params = fieldType ? { field_type: fieldType } : {};
    const response = await apiClient.get('/pqm/settings/dropdowns/', { params });
    return response.data.data;
  }

  async createDropdownOption(data: Partial<PQMDropdownOption>): Promise<PQMDropdownOption> {
    const response = await apiClient.post('/pqm/settings/dropdowns/', data);
    return response.data.data;
  }

  async updateDropdownOption(id: string, data: Partial<PQMDropdownOption>): Promise<PQMDropdownOption> {
    const response = await apiClient.patch(`/pqm/settings/dropdowns/${id}/`, data);
    return response.data.data;
  }

  async deleteDropdownOption(id: string): Promise<void> {
    await apiClient.delete(`/pqm/settings/dropdowns/${id}/`);
  }

  // ── Config: Contractors ────────────────────────────────────────────────────
  async listContractors(): Promise<PQMContractor[]> {
    const response = await apiClient.get('/pqm/config/contractors/');
    return response.data.data;
  }

  async createContractor(data: Partial<PQMContractor>): Promise<PQMContractor> {
    const response = await apiClient.post('/pqm/config/contractors/', data);
    return response.data.data;
  }

  async updateContractor(id: string, data: Partial<PQMContractor>): Promise<PQMContractor> {
    const response = await apiClient.patch(`/pqm/config/contractors/${id}/`, data);
    return response.data.data;
  }

  async deleteContractor(id: string): Promise<void> {
    await apiClient.delete(`/pqm/config/contractors/${id}/`);
  }

  // ── Projects & Sites ───────────────────────────────────────────────────────
  async listProjects(params?: any): Promise<{ results: PQMProject[], meta: any }> {
    const response = await apiClient.get('/pqm/projects/', { params });
    // If backend uses standard envelope, response.data.data has {results, meta}
    // If we're fallback, wrap it.
    const payload = response.data.data;
    if (Array.isArray(payload)) {
      return { results: payload, meta: { total: payload.length, page: 1, page_size: 20, total_pages: 1 } };
    }
    return payload;
  }

  async getProject(id: string): Promise<PQMProject> {
    const response = await apiClient.get(`/pqm/projects/${id}/`);
    return response.data.data;
  }

  async createProject(data: Partial<PQMProject>): Promise<PQMProject> {
    const response = await apiClient.post('/pqm/projects/', data);
    return response.data.data;
  }

  async updateProject(id: string, data: Partial<PQMProject>): Promise<PQMProject> {
    const response = await apiClient.patch(`/pqm/projects/${id}/`, data);
    return response.data.data;
  }

  async deleteProject(id: string, reason?: string): Promise<void> {
    await apiClient.delete(`/pqm/projects/${id}/`, { data: { reason } });
  }

  async restoreProject(id: string): Promise<void> {
    await apiClient.post(`/pqm/projects/${id}/restore/`);
  }

  async listSites(projectId?: string): Promise<PQMSite[]> {
    const response = await apiClient.get('/pqm/sites/', {
      params: projectId ? { project: projectId } : {},
    });
    return response.data.data;
  }

  async createSite(data: Partial<PQMSite>): Promise<PQMSite> {
    const response = await apiClient.post('/pqm/sites/', data);
    return response.data.data;
  }

  async updateSite(id: string, data: Partial<PQMSite>): Promise<PQMSite> {
    const response = await apiClient.patch(`/pqm/sites/${id}/`, data);
    return response.data.data;
  }

  // ── Project Team ───────────────────────────────────────────────────────────
  async listProjectMembers(projectId: string): Promise<any[]> {
    const response = await apiClient.get(`/pqm/projects/${projectId}/members/`);
    return response.data.data;
  }

  // ── Export ─────────────────────────────────────────────────────────────────
  async exportNCs(filters: NCFilters): Promise<Blob> {
    const response = await apiClient.get('/pqm/nc/export/', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  }
  // ── Dashboard ──────────────────────────────────────────────────────────────
  async getDashboardKPI(projectId?: string): Promise<DashboardKPI> {
    const response = await apiClient.get('/pqm/dashboard/', {
      params: projectId ? { project: projectId } : {},
    });
    return response.data.data;
  }

  async getDashboardTrends(projectId?: string): Promise<{ month: string; created_count: number }[]> {
    const response = await apiClient.get('/pqm/dashboard/trends/', {
      params: projectId ? { project: projectId } : {},
    });
    return response.data.data;
  }
}
export const pqmService = new PqmService();
