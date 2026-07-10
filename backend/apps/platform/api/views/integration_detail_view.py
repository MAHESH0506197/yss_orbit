# yss_orbit\backend\apps\integration\api\views\integration_detail_view.py
import uuid
import logging
from rest_framework.views import APIView
from rest_framework.request import Request
from rest_framework.response import Response

from apps.platform.core_permissions import IsAuthenticated, IsTenantMember
from apps.platform.core_response import success_response, error_response, no_content_response
from apps.platform.models import Integration
from apps.platform.api.serializers.integration_serializer import IntegrationSerializer, IntegrationUpdateSerializer
from apps.platform.services.integration_service import IntegrationService

logger = logging.getLogger(__name__)

class IntegrationDetailView(APIView):
    permission_classes = [IsAuthenticated, IsTenantMember]

    def get(self, request: Request, pk: str) -> Response:
        ctx = request.security_context
        bu_id = ctx.require_business_unit()
        ctx.require_permission("integrations.view")

        try:
            integration = Integration.objects.get(id=pk, business_unit_id=bu_id)
        except Integration.DoesNotExist:
            return error_response("INTEGRATION_002", "Integration not found.", http_status=404, request=request)
            
        serializer = IntegrationSerializer(integration)
        return success_response(data=serializer.data, request=request)

    def patch(self, request: Request, pk: str) -> Response:
        ctx = request.security_context
        bu_id = ctx.require_business_unit()
        ctx.require_permission("integrations.update")

        serializer = IntegrationUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("INTEGRATION_003", "Invalid update data.", details=serializer.errors, http_status=400, request=request)

        try:
            pk_uuid = uuid.UUID(pk)
        except ValueError:
            return error_response("INTEGRATION_004", "Invalid UUID.", http_status=400, request=request)

        integration = IntegrationService.update_integration(
            integration_id=pk_uuid,
            business_unit_id=bu_id,
            user_id=ctx.user_id,
            **serializer.validated_data
        )

        if not integration:
            return error_response("INTEGRATION_002", "Integration not found.", http_status=404, request=request)

        return success_response(data=IntegrationSerializer(integration).data, request=request)

    def delete(self, request: Request, pk: str) -> Response:
        ctx = request.security_context
        bu_id = ctx.require_business_unit()
        ctx.require_permission("integrations.delete")

        try:
            pk_uuid = uuid.UUID(pk)
        except ValueError:
            return error_response("INTEGRATION_004", "Invalid UUID.", http_status=400, request=request)

        deleted = IntegrationService.delete_integration(pk_uuid, bu_id, ctx.user_id)
        if not deleted:
            return error_response("INTEGRATION_002", "Integration not found.", http_status=404, request=request)

        return no_content_response(request=request)
