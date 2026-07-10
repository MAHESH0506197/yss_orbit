from typing import Dict, Any, List
from django.db.models import Count, Q
from apps.platform.catalogue.module_catalogue import ModuleCatalogue
from apps.tenancy.models import TenantModule, ModuleStatus

class ModuleRegistryService:
    
    @classmethod
    def get_system_modules_with_stats(cls) -> Dict[str, Any]:
        """
        Returns all modules from the catalogue enriched with live subscription statistics.
        """
        all_modules = ModuleCatalogue.get_all_modules()
        
        # Aggregate stats from TenantModule
        stats = TenantModule.objects.values('module_code').annotate(
            active_count=Count('id', filter=Q(status=ModuleStatus.ACTIVE)),
            inactive_count=Count('id', filter=Q(status=ModuleStatus.INACTIVE)),
            suspended_count=Count('id', filter=Q(status=ModuleStatus.SUSPENDED))
        )
        
        stats_map = {item['module_code']: item for item in stats}
        
        total_modules = len(all_modules)
        core_modules = 0
        premium_modules = 0
        deprecated_modules = 0
        total_active_subscriptions = 0
        total_inactive_subscriptions = 0
        
        enriched_modules = []
        for mod in all_modules:
            mod_code = mod['code']
            
            if mod.get('is_core'): core_modules += 1
            if mod.get('is_premium'): premium_modules += 1
            if mod.get('is_deprecated'): deprecated_modules += 1
            
            mod_stats = stats_map.get(mod_code, {})
            active_subs = mod_stats.get('active_count', 0)
            inactive_subs = mod_stats.get('inactive_count', 0)
            suspended_subs = mod_stats.get('suspended_count', 0)
            
            total_active_subscriptions += active_subs
            total_inactive_subscriptions += (inactive_subs + suspended_subs)
            
            enriched_modules.append({
                **mod,
                'active_subscription_count': active_subs,
                'inactive_subscription_count': inactive_subs,
                'suspended_subscription_count': suspended_subs,
            })
            
        return {
            "statistics": {
                "total_modules": total_modules,
                "core_modules": core_modules,
                "premium_modules": premium_modules,
                "deprecated_modules": deprecated_modules,
                "active_subscriptions": total_active_subscriptions,
                "inactive_subscriptions": total_inactive_subscriptions,
            },
            "modules": enriched_modules
        }

    @classmethod
    def validate_activation_dependencies(cls, module_code: str, business_unit_id: str) -> List[str]:
        """
        Validates if a module's dependencies are met for a specific Business Unit.
        Returns a list of missing dependency names (empty list if all met).
        """
        all_modules = ModuleCatalogue.get_all_modules()
        target_mod = next((m for m in all_modules if m['code'] == module_code), None)
        
        if not target_mod:
            raise ValueError(f"Module '{module_code}' does not exist in the registry.")
            
        dependencies = target_mod.get('dependencies', [])
        if not dependencies:
            return []
            
        # Get active modules for this BU
        active_tenant_modules = TenantModule.objects.filter(
            business_unit_id=business_unit_id,
            status=ModuleStatus.ACTIVE
        ).values_list('module_code', flat=True)
        
        missing_dependencies = []
        for dep_code in dependencies:
            if dep_code not in active_tenant_modules:
                dep_mod = next((m for m in all_modules if m['code'] == dep_code), None)
                dep_name = dep_mod['name'] if dep_mod else dep_code
                missing_dependencies.append(dep_name)
                
        return missing_dependencies
