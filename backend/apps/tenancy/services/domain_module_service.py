# yss_orbit\backend\apps\domain\services\domain_module_service.py
from apps.tenancy.models.domain_module_map_model import DomainModuleMap
from apps.tenancy.models.domain_model import Domain
from django.core.exceptions import ValidationError

class DomainModuleService:
    """
    Business logic for mapping domains to platform modules.
    """
    @staticmethod
    def map_module(domain: Domain, module_name: str) -> DomainModuleMap:
        if DomainModuleMap.objects.filter(domain=domain, module_name=module_name).exists():
            raise ValidationError(f"Module {module_name} is already mapped to {domain.name}")
            
        return DomainModuleMap.objects.create(domain=domain, module_name=module_name, is_active=True)

    @staticmethod
    def unmap_module(domain: Domain, module_name: str) -> None:
        mapping = DomainModuleMap.objects.filter(domain=domain, module_name=module_name).first()
        if mapping:
            mapping.delete()
