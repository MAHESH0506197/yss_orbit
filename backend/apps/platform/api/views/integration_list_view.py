# yss_orbit\backend\apps\integration\api\views\integration_list_view.py
import uuid
import logging
from rest_framework.views import APIView
from rest_framework.request import Request
from rest_framework.response import Response

from apps.platform.core_permissions import IsAuthenticated, IsTenantMember
from apps.platform.core_response import success_response, created_response, error_response
from apps.platform.models import Integration
from apps.platform.api.serializers.integration_serializer import IntegrationSerializer, IntegrationCreateSerializer
from apps.platform.services.integration_service import IntegrationService

logger = logging.getLogger(__name__)

class IntegrationListView(APIView):
    permission_classes = [IsAuthenticated, IsTenantMember]

    def get(self, request: Request) -> Response:
        ctx = request.security_context
        bu_id = ctx.require_business_unit()
        ctx.require_permission("integrations.view")

        integrations = Integration.objects.filter(business_unit_id=bu_id)
        serializer = IntegrationSerializer(integrations, many=True)
        return success_response(data=serializer.data, request=request)

    def post(self, request: Request) -> Response:
        ctx = request.security_context
        bu_id = ctx.require_business_unit()
        ctx.require_permission("integrations.create")

        serializer = IntegrationCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                error_code="INTEGRATION_001",
                message="Invalid integration data.",
                details=serializer.errors,
                http_status=400,
                request=request
            )

        data = serializer.validated_data
        integration = IntegrationService.create_integration(
            business_unit_id=bu_id,
            user_id=ctx.user_id,
            name=data["name"],
            provider=data["provider"],
            credentials=data.get("credentials", {}),
            settings=data.get("settings", {})
        )
        
        logger.info("Integration created", extra={
            "integration_id": str(integration.id),
            "business_unit_id": str(bu_id)
        })

        return created_response(
            data=IntegrationSerializer(integration).data,
            request=request
        )
