# yss_orbit\backend\generate_services.py
﻿import os

BASE_DIR = r"c:\PROJECT\yss_orbit\backend\apps"

SERVICES_CODE = {
    "branding": {
        "services/__init__.py": "from .branding_service import BrandingService",
        "services/branding_service.py": '''
from apps.platform.models.brand_configuration import BrandConfiguration
from django.core.exceptions import ObjectDoesNotExist

class BrandingService:
    def get_brand_configuration(self, business_unit_id: str) -> BrandConfiguration:
        try:
            return BrandConfiguration.objects.get(business_unit_id=business_unit_id)
        except ObjectDoesNotExist:
            return BrandConfiguration(business_unit_id=business_unit_id)

    def update_brand_configuration(self, business_unit_id: str, **kwargs) -> BrandConfiguration:
        brand, created = BrandConfiguration.objects.get_or_create(business_unit_id=business_unit_id)
        for key, value in kwargs.items():
            if hasattr(brand, key):
                setattr(brand, key, value)
        brand.save()
        return brand
'''
    },
    "feature_flags": {
        "services/__init__.py": "from .feature_flag_service import FeatureFlagService",
        "services/feature_flag_service.py": '''
from apps.platform.models.feature_flag_model import FeatureFlag, TenantFlagOverride

class FeatureFlagService:
    def is_enabled(self, business_unit_id: str, flag_key: str) -> bool:
        try:
            flag = FeatureFlag.objects.get(key=flag_key)
            override = TenantFlagOverride.objects.filter(business_unit_id=business_unit_id, flag=flag).first()
            if override:
                return override.is_enabled
            return flag.default_enabled
        except FeatureFlag.DoesNotExist:
            return False

    def set_override(self, business_unit_id: str, flag_key: str, is_enabled: bool) -> TenantFlagOverride:
        flag, _ = FeatureFlag.objects.get_or_create(key=flag_key)
        override, _ = TenantFlagOverride.objects.get_or_create(business_unit_id=business_unit_id, flag=flag)
        override.is_enabled = is_enabled
        override.save()
        return override
'''
    },
    "module_registry": {
        "services/__init__.py": "from .module_service import ModuleService",
        "services/module_service.py": '''
from apps.platform.models.module_model import Module, TenantModule
from django.utils import timezone

class ModuleService:
    def subscribe_module(self, business_unit_id: str, module_name: str, trial_days: int = 14) -> TenantModule:
        module, _ = Module.objects.get_or_create(name=module_name)
        trial_end = timezone.now() + timezone.timedelta(days=trial_days)
        tenant_module, created = TenantModule.objects.get_or_create(
            business_unit_id=business_unit_id,
            module=module
        )
        if created or not tenant_module.is_active:
            tenant_module.is_active = True
            tenant_module.trial_end = trial_end
            tenant_module.save()
        return tenant_module

    def is_module_active(self, business_unit_id: str, module_name: str) -> bool:
        try:
            tenant_module = TenantModule.objects.select_related('module').get(
                business_unit_id=business_unit_id, 
                module__name=module_name
            )
            return tenant_module.is_active
        except TenantModule.DoesNotExist:
            return False
'''
    },
    "tenant_settings": {
        "services/__init__.py": "from .tenant_settings_service import TenantSettingsService",
        "services/tenant_settings_service.py": '''
from apps.tenancy.models.tenant_settings_model import TenantSetting

class TenantSettingsService:
    def get_setting(self, business_unit_id: str, key: str, default=None):
        try:
            setting = TenantSetting.objects.get(business_unit_id=business_unit_id, key=key)
            return setting.value
        except TenantSetting.DoesNotExist:
            return default

    def set_setting(self, business_unit_id: str, key: str, value: str, value_type: str = "STRING", is_public: bool = False) -> TenantSetting:
        setting, _ = TenantSetting.objects.get_or_create(business_unit_id=business_unit_id, key=key)
        setting.value = str(value)
        setting.value_type = value_type
        setting.is_public = is_public
        setting.save()
        return setting

    def delete_setting(self, business_unit_id: str, key: str):
        TenantSetting.objects.filter(business_unit_id=business_unit_id, key=key).delete()
'''
    }
}

for app_name, files in SERVICES_CODE.items():
    app_dir = os.path.join(BASE_DIR, app_name)
    os.makedirs(app_dir, exist_ok=True)
    
    for file_path, content in files.items():
        full_path = os.path.join(app_dir, file_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content.strip() + "\\n")
            
print("Done writing service files.")
