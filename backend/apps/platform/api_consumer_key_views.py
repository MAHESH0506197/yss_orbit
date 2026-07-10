# yss_orbit\backend\apps\api_consumer_key\views.py
"""
YSS Orbit — API Consumer Key Views
Manage machine-to-machine API keys for external integrations.
Keys are bcrypt-hashed. Plaintext shown ONLY at creation.
"""
from __future__ import annotations

import logging
import secrets
import uuid

from rest_framework import serializers
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.platform.models import APIConsumerKey
from apps.platform.core_permissions import IsAuthenticated, IsTenantMember
from apps.platform.core_response import created_response, error_response, no_content_response, success_response

logger = logging.getLogger(__name__)

_KEY_LENGTH = 64  # 64-char random key


class APIKeyListSerializer(serializers.ModelSerializer):
    """Safe serializer — never exposes hashed_key."""
    class Meta:
        model = APIConsumerKey
        fields = [
            "id", "name", "key_prefix", "permissions",
            "is_active", "expires_at", "last_used_at", "created_at",
        ]
        read_only_fields = fields


class APIKeyCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    permissions = serializers.ListField(
        child=serializers.CharField(),
        default=list,
        help_text="List of permission codes this key is allowed to use.",
    )
    expires_at = serializers.DateTimeField(required=False, allow_null=True)


class APIKeyListView(APIView):
    """
    GET  /api/v1/api-keys/    → List keys for BU
    POST /api/v1/api-keys/    → Create new key (plaintext shown once in response)
    """
    permission_classes = [IsAuthenticated, IsTenantMember]

    def get(self, request: Request) -> Response:
        ctx = request.security_context  # type: ignore[attr-defined]
        bu_id: uuid.UUID = ctx.require_business_unit()
        ctx.require_permission("api_keys.view")

        keys = APIConsumerKey.objects.filter(business_unit_id=bu_id).order_by("-created_at")
        serializer = APIKeyListSerializer(keys, many=True)
        return success_response(data=serializer.data, request=request)

    def post(self, request: Request) -> Response:
        ctx = request.security_context  # type: ignore[attr-defined]
        bu_id: uuid.UUID = ctx.require_business_unit()
        ctx.require_permission("api_keys.create")

        serializer = APIKeyCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                error_code="APIKEY_001",
                message="Invalid API key request.",
                details=serializer.errors,
                http_status=400,
                request=request,
            )

        data = serializer.validated_data
        # Generate a cryptographically secure random key
        plaintext_key = secrets.token_urlsafe(_KEY_LENGTH)

        api_key = APIConsumerKey(
            business_unit_id=bu_id,
            name=data["name"],
            permissions=data.get("permissions", []),
            expires_at=data.get("expires_at"),
            user_id=ctx.user_id,
            created_by_id=ctx.user_id,
        )
        api_key.set_key(plaintext_key)
        api_key.save()

        logger.info(
            "API key created",
            extra={
                "api_key_id": str(api_key.id),
                "user_id": str(ctx.user_id),
                "business_unit_id": str(bu_id),
                "correlation_id": ctx.correlation_id,
            },
        )

        return created_response(
            data={
                "id": str(api_key.id),
                "name": api_key.name,
                "key": plaintext_key,  # Only time plaintext is returned
                "key_prefix": api_key.key_prefix,
                "permissions": api_key.permissions,
                "expires_at": str(api_key.expires_at) if api_key.expires_at else None,
                "warning": "Store this key securely. It will NOT be shown again.",
            },
            request=request,
        )


class APIKeyDetailView(APIView):
    """
    DELETE /api/v1/api-keys/{key_id}/   → Revoke (soft delete) an API key
    """
    permission_classes = [IsAuthenticated, IsTenantMember]

    def delete(self, request: Request, key_id: str) -> Response:
        ctx = request.security_context  # type: ignore[attr-defined]
        bu_id: uuid.UUID = ctx.require_business_unit()
        ctx.require_permission("api_keys.revoke")

        try:
            kid = uuid.UUID(key_id)
        except ValueError:
            return error_response(
                error_code="APIKEY_002",
                message="Invalid key ID format.",
                http_status=400,
                request=request,
            )

        try:
            key = APIConsumerKey.objects.get(id=kid, business_unit_id=bu_id)
        except APIConsumerKey.DoesNotExist:
            return error_response(
                error_code="APIKEY_003",
                message="API key not found.",
                http_status=404,
                request=request,
            )

        key.soft_delete(deleted_by_id=ctx.user_id)
        logger.info(
            "API key revoked",
            extra={
                "api_key_id": str(key.id),
                "user_id": str(ctx.user_id),
                "business_unit_id": str(bu_id),
                "correlation_id": ctx.correlation_id,
            },
        )
        return no_content_response(request=request)
