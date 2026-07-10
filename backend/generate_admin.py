# yss_orbit\backend\generate_admin.py
﻿import os

BASE_DIR = r"c:\PROJECT\yss_orbit\backend\apps"

ADMIN_CODE = {
    "branding": {
        "admin.py": '''
from django.contrib import admin
from .models.brand_configuration import BrandConfiguration

@admin.register(BrandConfiguration)
class BrandConfigurationAdmin(admin.ModelAdmin):
    list_display = ('business_unit_id', 'mode', 'company_name', 'custom_domain')
    search_fields = ('company_name', 'custom_domain', 'business_unit_id')
'''
    },
    "feature_flags": {
        "admin.py": '''
from django.contrib import admin
from .models.feature_flag_model import FeatureFlag, TenantFlagOverride

@admin.register(FeatureFlag)
class FeatureFlagAdmin(admin.ModelAdmin):
    list_display = ('key', 'default_enabled')
    search_fields = ('key',)

@admin.register(TenantFlagOverride)
class TenantFlagOverrideAdmin(admin.ModelAdmin):
    list_display = ('business_unit_id', 'flag', 'is_enabled')
    search_fields = ('business_unit_id', 'flag__key')
'''
    },
    "module_registry": {
        "admin.py": '''
from django.contrib import admin
from .models.module_model import Module, TenantModule

@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active')
    search_fields = ('name',)

@admin.register(TenantModule)
class TenantModuleAdmin(admin.ModelAdmin):
    list_display = ('business_unit_id', 'module', 'is_active', 'trial_end')
    search_fields = ('business_unit_id', 'module__name')
'''
    },
    "tenant_settings": {
        "admin.py": '''
from django.contrib import admin
from .models.tenant_settings_model import TenantSetting

@admin.register(TenantSetting)
class TenantSettingAdmin(admin.ModelAdmin):
    list_display = ('business_unit_id', 'key', 'value_type', 'is_public')
    search_fields = ('business_unit_id', 'key')
'''
    }
}

for app_name, files in ADMIN_CODE.items():
    app_dir = os.path.join(BASE_DIR, app_name)
    os.makedirs(app_dir, exist_ok=True)
    
    for file_path, content in files.items():
        full_path = os.path.join(app_dir, file_path)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content.strip() + "\\n")
            
print("Done writing admin files.")
