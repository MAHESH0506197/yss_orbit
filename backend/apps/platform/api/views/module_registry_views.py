from rest_framework.views import APIView
from rest_framework.request import Request
from rest_framework.response import Response
from apps.platform.core_permissions import IsAuthenticated
from apps.iam.permissions.permissions import HasPermission
from apps.platform.core_response import success_response
from apps.platform.services.module_registry_service import ModuleRegistryService
from apps.tenancy.models.tenant_module_models import TenantModule, ModuleStatus

class SystemModulesView(APIView):
    """
    Platform Admin view to see all system modules and their subscription stats.
    """
    permission_classes = [IsAuthenticated] # In a real implementation this would use HasPermission("platform.modules.view") or similar

    def get(self, request: Request) -> Response:
        # We can add an extra super admin check here if required, similar to other platform views
        # sec_ctx = getattr(request, 'security_context', None)
        # if not sec_ctx or not sec_ctx.is_super_admin:
        #     return Response({"detail": "Forbidden"}, status=403)
            
        data = ModuleRegistryService.get_system_modules_with_stats()
        return success_response(data=data)

class SubscribedModulesView(APIView):
    """ Tenant view to list their active modules """
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        bu_id = request.security_context.require_business_unit()
        modules = TenantModule.objects.filter(business_unit_id=bu_id, status=ModuleStatus.ACTIVE).values_list('module_code', flat=True)
        return success_response(data=list(modules))

class ActivateModuleView(APIView):
    """ Tenant view to activate a module """
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, module_code: str) -> Response:
        bu_id = request.security_context.require_business_unit()
        
        missing_deps = ModuleRegistryService.validate_activation_dependencies(module_code, bu_id)
        if missing_deps:
            return Response(
                {"detail": f"Cannot activate {module_code}. Missing dependencies: {', '.join(missing_deps)}"}, 
                status=400
            )
            
        tm, created = TenantModule.objects.get_or_create(
            business_unit_id=bu_id,
            module_code=module_code,
            defaults={"status": ModuleStatus.ACTIVE}
        )
        if not created and tm.status != ModuleStatus.ACTIVE:
            tm.status = ModuleStatus.ACTIVE
            tm.save()
            
        return success_response(data={"module_code": module_code, "status": "ACTIVE"})

class DeactivateModuleView(APIView):
    """ Tenant view to deactivate a module """
    permission_classes = [IsAuthenticated]

    def delete(self, request: Request, module_code: str) -> Response:
        bu_id = request.security_context.require_business_unit()
        TenantModule.objects.filter(business_unit_id=bu_id, module_code=module_code).update(status=ModuleStatus.INACTIVE)
        return success_response(data={"module_code": module_code, "status": "INACTIVE"})
