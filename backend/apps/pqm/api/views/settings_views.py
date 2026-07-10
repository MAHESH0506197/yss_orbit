import uuid
from rest_framework.views import APIView
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.platform.core_response import success_response, error_response, created_response, no_content_response
from apps.pqm.models.dropdown_option import PQMDropdownOption
from apps.pqm.api.serializers.dropdown_option import PQMDropdownOptionSerializer
from apps.pqm.permissions import PQMPermission
from apps.pqm.api.views.utils import _get_org_id, _require_bu

class DropdownOptionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        org_id = _get_org_id(request)
        field_type = request.query_params.get("field_type")
        
        qs = PQMDropdownOption.objects.filter(business_unit_id=bu_id, is_deleted=False)
        if field_type:
            qs = qs.filter(field_type=field_type)
            
        qs = qs.order_by("field_type", "display_order", "name")
        return success_response(data=PQMDropdownOptionSerializer(qs, many=True, context={"request": request}).data, request=request)

    def post(self, request: Request) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        if not PQMPermission.check_permission(request, PQMPermission.MANAGE_CONFIG):
            return error_response("PQM_FORBIDDEN", "No permission.", http_status=403, request=request)
            
        org_id = _get_org_id(request)
        field_type = request.data.get("field_type")
        name = request.data.get("name")
        
        # Check for existing (including soft-deleted)
        existing = PQMDropdownOption.all_objects.filter(
            business_unit_id=bu_id, field_type=field_type, name=name
        ).first()
        
        if existing:
            if existing.is_deleted:
                existing.restore(save=False)
                existing.display_order = request.data.get("display_order", existing.display_order)
                existing.is_active = request.data.get("is_active", True)
                existing.save()
                return created_response(data=PQMDropdownOptionSerializer(existing, context={"request": request}).data, request=request)
            else:
                return error_response("DUPLICATE_OPTION", "An option with this name already exists.", http_status=400, request=request)

        serializer = PQMDropdownOptionSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            return error_response("PQM_VALIDATION_ERROR", "Invalid data.", details=serializer.errors, http_status=400, request=request)
            
        try:
            obj = serializer.save(organization_id=org_id, business_unit_id=bu_id, created_by_id=request.user.id)
            return created_response(data=PQMDropdownOptionSerializer(obj, context={"request": request}).data, request=request)
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            return error_response("SERVER_ERROR", str(e), details={"trace": error_trace}, http_status=500, request=request)


class DropdownOptionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get(self, pk, bu_id):
        try:
            return PQMDropdownOption.objects.get(id=pk, business_unit_id=bu_id, is_deleted=False), None
        except PQMDropdownOption.DoesNotExist:
            return None, "Dropdown option not found."

    def get(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        obj, err_msg = self._get(pk, bu_id)
        if err_msg:
            return error_response("NOT_FOUND", err_msg, http_status=404, request=request)
        return success_response(data=PQMDropdownOptionSerializer(obj, context={"request": request}).data, request=request)

    def patch(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        if not PQMPermission.check_permission(request, PQMPermission.MANAGE_CONFIG):
            return error_response("PQM_FORBIDDEN", "No permission.", http_status=403, request=request)
            
        obj, err_msg = self._get(pk, bu_id)
        if err_msg:
            return error_response("NOT_FOUND", err_msg, http_status=404, request=request)
            
        serializer = PQMDropdownOptionSerializer(obj, data=request.data, partial=True, context={"request": request})
        if not serializer.is_valid():
            return error_response("PQM_VALIDATION_ERROR", "Invalid data.", details=serializer.errors, http_status=400, request=request)
            
        serializer.save(updated_by_id=request.user.id)
        return success_response(data=serializer.data, request=request)

    def delete(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        if not PQMPermission.check_permission(request, PQMPermission.MANAGE_CONFIG):
            return error_response("PQM_FORBIDDEN", "No permission.", http_status=403, request=request)
            
        obj, err_msg = self._get(pk, bu_id)
        if err_msg:
            return error_response("NOT_FOUND", err_msg, http_status=404, request=request)
            
        obj.delete()
        return no_content_response(request=request)
