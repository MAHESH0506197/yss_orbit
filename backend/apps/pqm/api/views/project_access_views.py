from __future__ import annotations

import uuid
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.platform.core_response import success_response, created_response, error_response
from apps.pqm.models.project_access import PQMAccessRequest, PQMProjectMember
from apps.pqm.models.project import PQMProject
from apps.pqm.api.views.utils import _require_bu, _get_org_id
from apps.iam.models.user import User

class ProjectMembersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
            
        try:
            project = PQMProject.objects.get(id=pk, business_unit_id=bu_id, is_deleted=False)
        except PQMProject.DoesNotExist:
            return error_response("PQM_NOT_FOUND", "Project not found.", http_status=404, request=request)
            
        members = PQMProjectMember.objects.filter(project_id=project.id, is_deleted=False)
        user_ids = members.values_list("user_id", flat=True)
        
        users = User.objects.filter(id__in=user_ids)
        user_map = {u.id: u for u in users}
        
        data = []
        for mem in members:
            u = user_map.get(mem.user_id)
            if u:
                data.append({
                    "id": mem.id,
                    "user_id": u.id,
                    "name": f"{u.first_name} {u.last_name}".strip() or u.email,
                    "email": u.email,
                    "role": mem.role,
                    "joined_at": mem.created_at
                })
                
        return success_response(data=data, request=request)


class ProjectAccessRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
            
        projects = request.data.get("projects", [])
        if not projects or not isinstance(projects, list):
            return error_response("PQM_VALIDATION_ERROR", "projects list is required.", http_status=400, request=request)
            
        justification = request.data.get("justification", "")
        
        # Verify projects exist and belong to the BU
        valid_projects = PQMProject.objects.filter(id__in=projects, business_unit_id=bu_id, is_deleted=False).values_list('id', flat=True)
        valid_projects_str = [str(p) for p in valid_projects]
        
        if not valid_projects_str:
            return error_response("PQM_VALIDATION_ERROR", "None of the provided projects are valid.", http_status=400, request=request)
            
        access_request = PQMAccessRequest.objects.create(
            user_id=request.user.id,
            projects=valid_projects_str,
            justification=justification,
            status="PENDING",
            organization_id=_get_org_id(request),
            business_unit_id=bu_id
        )
        
        return created_response(
            data={
                "id": access_request.id,
                "status": access_request.status,
                "projects": access_request.projects
            },
            request=request
        )


class ProjectAccessApprovalView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
            
        qs = PQMAccessRequest.objects.filter(business_unit_id=bu_id, status="PENDING", is_deleted=False)
        
        data = []
        for req in qs:
            data.append({
                "id": req.id,
                "user_id": req.user_id,
                "projects": req.projects,
                "status": req.status,
                "justification": req.justification,
                "created_at": req.created_at
            })
            
        return success_response(data=data, request=request)

    def post(self, request: Request) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
            
        request_id = request.data.get("request_id")
        action = request.data.get("action")  # APPROVED or REJECTED
        
        if not request_id:
            return error_response("PQM_VALIDATION_ERROR", "request_id is required.", http_status=400, request=request)
            
        if action not in ["APPROVED", "REJECTED"]:
            return error_response("PQM_VALIDATION_ERROR", "action must be APPROVED or REJECTED.", http_status=400, request=request)
            
        try:
            access_req = PQMAccessRequest.objects.get(id=request_id, business_unit_id=bu_id, is_deleted=False)
        except (PQMAccessRequest.DoesNotExist, ValueError):
            return error_response("PQM_NOT_FOUND", "Access request not found.", http_status=404, request=request)
            
        if access_req.status != "PENDING":
            return error_response("PQM_VALIDATION_ERROR", "Request is already processed.", http_status=400, request=request)
            
        access_req.status = action
        access_req.approved_by_id = request.user.id
        access_req.save(update_fields=["status", "approved_by_id", "updated_at"])
        
        if action == "APPROVED":
            for proj_id in access_req.projects:
                try:
                    proj_uuid = uuid.UUID(proj_id)
                    if not PQMProjectMember.objects.filter(user_id=access_req.user_id, project_id=proj_uuid, is_deleted=False).exists():
                        PQMProjectMember.objects.create(
                            user_id=access_req.user_id,
                            project_id=proj_uuid,
                            role="MEMBER",
                            assigned_by_id=request.user.id,
                            organization_id=_get_org_id(request),
                            business_unit_id=bu_id
                        )
                except ValueError:
                    continue
                    
        return success_response(
            data={"id": access_req.id, "status": access_req.status},
            request=request
        )
