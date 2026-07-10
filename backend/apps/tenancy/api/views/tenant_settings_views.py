# yss_orbit\backend\apps\tenant_settings\api\views\tenant_settings_views.py
from rest_framework.views import APIView
from rest_framework.request import Request
from rest_framework.response import Response

from apps.platform.core_permissions import IsAuthenticated
from apps.platform.core_response import success_response, no_content_response
from apps.tenancy.services.tenant_settings_service import TenantSettingsService
from apps.tenancy.api.serializers.tenant_settings_serializer import TenantSettingSerializer, TenantSettingCreateUpdateSerializer

class TenantSettingsView(APIView):
    """
    List or Update Tenant Settings for the current Business Unit.
    """
    permission_classes = [IsAuthenticated]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = TenantSettingsService()

    def get(self, request: Request) -> Response:
        ctx = request.security_context
        bu_id = ctx.require_business_unit()
        
        # We can either return just key-value dict or the detailed models.
        # Let's return the detailed models using the ORM to list all
        from apps.tenancy.models import TenantSetting
        settings = TenantSetting.objects.filter(business_unit_id=bu_id)
        serializer = TenantSettingSerializer(settings, many=True)
        return success_response(data=serializer.data)

    def post(self, request: Request) -> Response:
        """
        Create or update a tenant setting.
        """
        ctx = request.security_context
        bu_id = ctx.require_business_unit()

        serializer = TenantSettingCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        setting = self.service.set_setting(
            business_unit_id=bu_id,
            key=data['key'],
            value=data['value'],
            value_type=data.get('value_type', 'STRING'),
            is_public=data.get('is_public', False),
            description=data.get('description', '')
        )

        response_serializer = TenantSettingSerializer(setting)
        return success_response(data=response_serializer.data, message="Setting updated successfully.")

class TenantSettingDetailView(APIView):
    """
    Delete a tenant setting.
    """
    permission_classes = [IsAuthenticated]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = TenantSettingsService()
        
    def delete(self, request: Request, key: str) -> Response:
        ctx = request.security_context
        bu_id = ctx.require_business_unit()
        
        self.service.delete_setting(business_unit_id=bu_id, key=key)
        return no_content_response(request=request)
