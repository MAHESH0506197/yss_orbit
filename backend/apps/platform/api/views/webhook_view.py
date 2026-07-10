# yss_orbit\backend\apps\integration\api\views\webhook_view.py
import uuid
import logging
from rest_framework.views import APIView
from rest_framework.request import Request
from rest_framework.response import Response

from apps.platform.core_permissions import IsAuthenticated, IsTenantMember
from apps.platform.core_response import success_response, created_response, error_response, no_content_response
from apps.platform.models import WebhookEndpoint
from apps.platform.api.serializers.webhook_serializer import WebhookSerializer, WebhookCreateSerializer, WebhookUpdateSerializer
from apps.platform.webhook_webhook_service import WebhookService

logger = logging.getLogger(__name__)

class WebhookListView(APIView):
    permission_classes = [IsAuthenticated, IsTenantMember]

    def get(self, request: Request) -> Response:
        ctx = request.security_context
        bu_id = ctx.require_business_unit()
        ctx.require_permission("webhooks.view")

        webhooks = Webhook.objects.filter(business_unit_id=bu_id)
        serializer = WebhookSerializer(webhooks, many=True)
        return success_response(data=serializer.data, request=request)

    def post(self, request: Request) -> Response:
        ctx = request.security_context
        bu_id = ctx.require_business_unit()
        ctx.require_permission("webhooks.create")

        serializer = WebhookCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                error_code="WEBHOOK_001",
                message="Invalid webhook data.",
                details=serializer.errors,
                http_status=400,
                request=request
            )

        data = serializer.validated_data
        webhook = WebhookService.register_webhook(
            business_unit_id=bu_id,
            user_id=ctx.user_id,
            url=data["url"],
            events=data["events"],
            description=data.get("description", "")
        )

        return created_response(
            data=WebhookSerializer(webhook).data,
            request=request
        )

class WebhookDetailView(APIView):
    permission_classes = [IsAuthenticated, IsTenantMember]

    def get(self, request: Request, pk: str) -> Response:
        ctx = request.security_context
        bu_id = ctx.require_business_unit()
        ctx.require_permission("webhooks.view")

        try:
            webhook = Webhook.objects.get(id=pk, business_unit_id=bu_id)
        except Webhook.DoesNotExist:
            return error_response("WEBHOOK_002", "Webhook not found.", http_status=404, request=request)
            
        serializer = WebhookSerializer(webhook)
        return success_response(data=serializer.data, request=request)

    def patch(self, request: Request, pk: str) -> Response:
        ctx = request.security_context
        bu_id = ctx.require_business_unit()
        ctx.require_permission("webhooks.update")

        serializer = WebhookUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("WEBHOOK_003", "Invalid update data.", details=serializer.errors, http_status=400, request=request)

        try:
            pk_uuid = uuid.UUID(pk)
        except ValueError:
            return error_response("WEBHOOK_004", "Invalid UUID.", http_status=400, request=request)

        webhook = WebhookService.update_webhook(
            webhook_id=pk_uuid,
            business_unit_id=bu_id,
            user_id=ctx.user_id,
            **serializer.validated_data
        )

        if not webhook:
            return error_response("WEBHOOK_002", "Webhook not found.", http_status=404, request=request)

        return success_response(data=WebhookSerializer(webhook).data, request=request)

    def delete(self, request: Request, pk: str) -> Response:
        ctx = request.security_context
        bu_id = ctx.require_business_unit()
        ctx.require_permission("webhooks.delete")

        try:
            pk_uuid = uuid.UUID(pk)
        except ValueError:
            return error_response("WEBHOOK_004", "Invalid UUID.", http_status=400, request=request)

        deleted = WebhookService.delete_webhook(pk_uuid, bu_id, ctx.user_id)
        if not deleted:
            return error_response("WEBHOOK_002", "Webhook not found.", http_status=404, request=request)

        return no_content_response(request=request)
