# yss_orbit\backend\apps\webhook\webhook_views.py
import uuid
import hmac
import hashlib
from typing import Any
from django.utils import timezone

from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.platform.core_pagination import CursorResultsPagination
from apps.platform.core_permissions import IsAuthenticated
from apps.platform.core_response import success_response, created_response, no_content_response
from apps.platform.webhook_webhook_serializer import (
    WebhookEndpointSerializer,
    WebhookEndpointCreateSerializer,
    WebhookDeliverySerializer,
)
from apps.platform.webhook_webhook_service import WebhookService


class WebhookEndpointListCreateView(APIView):
    """
    List or create webhook endpoints for the current business unit.
    """
    permission_classes = [IsAuthenticated]

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self.service = WebhookService()
        self.paginator = CursorResultsPagination()

    def get(self, request: Request) -> Response:
        ctx = request.security_context
        bu_id = ctx.require_business_unit()

        endpoints = self.service.list_endpoints(business_unit_id=bu_id)
        page = self.paginator.paginate_queryset(endpoints, request, view=self)
        if page is not None:
            serializer = WebhookEndpointSerializer(page, many=True)
            return self.paginator.get_paginated_response(serializer.data)

        serializer = WebhookEndpointSerializer(endpoints, many=True)
        return success_response(data=serializer.data)

    def post(self, request: Request) -> Response:
        ctx = request.security_context
        bu_id = ctx.require_business_unit()

        serializer = WebhookEndpointCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        endpoint = self.service.create_endpoint(
            business_unit_id=bu_id,
            data=serializer.validated_data,
            created_by_id=ctx.effective_user_id,
        )

        response_serializer = WebhookEndpointSerializer(endpoint)
        return created_response(
            data=response_serializer.data,
            message="Webhook endpoint created successfully.",
            request=request,
        )


class WebhookEndpointDetailView(APIView):
    """
    Retrieve, update, or soft-delete a specific webhook endpoint.
    """
    permission_classes = [IsAuthenticated]

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self.service = WebhookService()

    def get(self, request: Request, pk: uuid.UUID) -> Response:
        ctx = request.security_context
        bu_id = ctx.require_business_unit()

        endpoint = self.service.get_endpoint(business_unit_id=bu_id, endpoint_id=pk)
        serializer = WebhookEndpointSerializer(endpoint)
        return success_response(data=serializer.data)

    def put(self, request: Request, pk: uuid.UUID) -> Response:
        ctx = request.security_context
        bu_id = ctx.require_business_unit()

        serializer = WebhookEndpointSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        endpoint = self.service.update_endpoint(
            business_unit_id=bu_id,
            endpoint_id=pk,
            data=serializer.validated_data,
            updated_by_id=ctx.effective_user_id,
        )
        response_serializer = WebhookEndpointSerializer(endpoint)
        return success_response(
            data=response_serializer.data, message="Webhook endpoint updated successfully."
        )

    def delete(self, request: Request, pk: uuid.UUID) -> Response:
        ctx = request.security_context
        bu_id = ctx.require_business_unit()

        self.service.delete_endpoint(
            business_unit_id=bu_id, endpoint_id=pk, deleted_by_id=ctx.effective_user_id
        )
        return no_content_response(request=request)


class WebhookDeliveryListView(APIView):
    """
    List webhook delivery attempts (audit trail).
    """
    permission_classes = [IsAuthenticated]

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self.service = WebhookService()
        self.paginator = CursorResultsPagination()
        self.paginator.ordering = '-created_at'

    def get(self, request: Request) -> Response:
        ctx = request.security_context
        bu_id = ctx.require_business_unit()

        deliveries = self.service.list_deliveries(business_unit_id=bu_id)
        page = self.paginator.paginate_queryset(deliveries, request, view=self)
        if page is not None:
            serializer = WebhookDeliverySerializer(page, many=True)
            return self.paginator.get_paginated_response(serializer.data)

        serializer = WebhookDeliverySerializer(deliveries, many=True)
        return success_response(data=serializer.data)


class WebhookDeliveryDetailView(APIView):
    """
    Retrieve details of a specific webhook delivery attempt.
    """
    permission_classes = [IsAuthenticated]

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self.service = WebhookService()

    def get(self, request: Request, pk: uuid.UUID) -> Response:
        ctx = request.security_context
        bu_id = ctx.require_business_unit()

        delivery = self.service.get_delivery(business_unit_id=bu_id, delivery_id=pk)
        serializer = WebhookDeliverySerializer(delivery)
        return success_response(data=serializer.data)


class InboundWebhookView(APIView):
    """
    Base view for receiving inbound webhooks from external providers.
    Provides HMAC verification and replay protection.
    Inheriting classes should define `provider_secret` or override `get_provider_secret()`,
    and implement `process_webhook(payload, request)`.
    """
    authentication_classes = []  # Typically no DRF auth, rely on HMAC
    permission_classes = []

    def get_provider_secret(self, request: Request) -> str:
        return None

    def verify_signature(self, request: Request, payload: bytes) -> bool:
        """Verify HMAC signature (example implementation, override per provider if needed)."""
        signature_header = request.headers.get("X-Signature")
        if not signature_header:
            return False
            
        secret = self.get_provider_secret(request)
        expected_signature = hmac.new(
            key=secret.encode("utf-8"),
            msg=payload,
            digestmod=hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(f"sha256={expected_signature}", signature_header)

    def verify_timestamp(self, request: Request) -> bool:
        """Replay protection: 5-minute window."""
        timestamp_str = request.headers.get("X-Timestamp")
        if not timestamp_str:
            return False
            
        try:
            timestamp = int(timestamp_str)
            current_time = int(timezone.now().timestamp())
            if abs(current_time - timestamp) > 300: # 5 minutes
                return False
            return True
        except ValueError:
            return False

    def post(self, request: Request, *args, **kwargs) -> Response:
        import hmac
        import hashlib
        from django.utils import timezone
        
        payload = request.body
        
        if not self.verify_timestamp(request):
            return Response({"error": "Request expired or invalid timestamp."}, status=status.HTTP_401_UNAUTHORIZED)
            
        if not self.verify_signature(request, payload):
            return Response({"error": "Invalid signature."}, status=status.HTTP_401_UNAUTHORIZED)
            
        return self.process_webhook(request.data, request, *args, **kwargs)
        
    def process_webhook(self, payload: dict, request: Request, *args, **kwargs) -> Response:
        return None

