from rest_framework.views import APIView
from rest_framework.request import Request
from rest_framework.response import Response
from apps.platform.core_permissions import IsAuthenticated
from apps.platform.core_response import success_response
from apps.tenancy.models import TenantModule
from apps.tenancy.api.serializers.tenant_module_serializers import TenantModuleSerializer

class TenantModuleListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        bu_id = request.security_context.require_business_unit()
        modules = TenantModule.objects.filter(business_unit_id=bu_id)
        serializer = TenantModuleSerializer(modules, many=True)
        return success_response(data=serializer.data)
