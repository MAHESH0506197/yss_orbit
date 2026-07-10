# yss_orbit\backend\generate_apps.py
﻿import os

BASE_DIR = r"c:\PROJECT\yss_orbit\backend\apps"

APPS_CODE = {
    "branding": {
        "models/__init__.py": "from .brand_configuration import BrandConfiguration",
        "models/brand_configuration.py": '''
import uuid
from django.db import models
from apps.platform.models.base import TenantModel

class BrandConfiguration(TenantModel):
    mode = models.CharField(max_length=50, choices=[('platform', 'Platform'), ('co_brand', 'Co-Brand'), ('white_label', 'White Label')], default='platform')
    logo_url = models.URLField(blank=True, null=True)
    favicon_url = models.URLField(blank=True, null=True)
    primary_color = models.CharField(max_length=7, blank=True)
    secondary_color = models.CharField(max_length=7, blank=True)
    company_name = models.CharField(max_length=255, blank=True)
    custom_domain = models.CharField(max_length=255, blank=True, unique=True, null=True)

    class Meta(TenantModel.Meta):
        db_table = "brand_configurations"
''',
        "api/serializers/__init__.py": "from .brand_serializer import BrandConfigurationSerializer",
        "api/serializers/brand_serializer.py": '''
from rest_framework import serializers
from apps.platform.models import BrandConfiguration

class BrandConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = BrandConfiguration
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'business_unit_id']
''',
        "api/views/__init__.py": "from .brand_view import BrandConfigurationView",
        "api/views/brand_view.py": '''
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.platform.models import BrandConfiguration
from apps.platform.api.serializers import BrandConfigurationSerializer
from apps.platform.core_permissions import IsAuthenticated

class BrandConfigurationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        bu_id = request.security_context.require_business_unit()
        brand, _ = BrandConfiguration.objects.get_or_create(business_unit_id=bu_id)
        serializer = BrandConfigurationSerializer(brand)
        return Response({'success': True, 'data': serializer.data})

    def post(self, request):
        bu_id = request.security_context.require_business_unit()
        brand, _ = BrandConfiguration.objects.get_or_create(business_unit_id=bu_id)
        serializer = BrandConfigurationSerializer(brand, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'success': True, 'data': serializer.data})
''',
        "urls.py": '''
from django.urls import path
from .api.views.brand_view import BrandConfigurationView

urlpatterns = [
    path('', BrandConfigurationView.as_view(), name='brand-config'),
]
'''
    },
    "feature_flags": {
        "models/__init__.py": "from .feature_flag_model import FeatureFlag, TenantFlagOverride",
        "models/feature_flag_model.py": '''
import uuid
from django.db import models
from apps.platform.models.base import PlatformModel, TenantModel

class FeatureFlag(PlatformModel):
    key = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    default_enabled = models.BooleanField(default=False)

    class Meta(PlatformModel.Meta):
        db_table = "feature_flags"

class TenantFlagOverride(TenantModel):
    flag = models.ForeignKey(FeatureFlag, on_delete=models.CASCADE, related_name='tenant_overrides')
    is_enabled = models.BooleanField()

    class Meta(TenantModel.Meta):
        db_table = "tenant_flag_overrides"
        unique_together = (('business_unit_id', 'flag'),)
''',
        "api/serializers/__init__.py": "from .flag_serializer import FeatureFlagSerializer, TenantFlagOverrideSerializer",
        "api/serializers/flag_serializer.py": '''
from rest_framework import serializers
from apps.platform.models.feature_flag_model import FeatureFlag, TenantFlagOverride

class FeatureFlagSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeatureFlag
        fields = '__all__'

class TenantFlagOverrideSerializer(serializers.ModelSerializer):
    flag_key = serializers.CharField(source='flag.key', read_only=True)
    
    class Meta:
        model = TenantFlagOverride
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'business_unit_id']
''',
        "api/views/__init__.py": "from .flag_view import FeatureFlagListView",
        "api/views/flag_view.py": '''
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.platform.models.feature_flag_model import FeatureFlag, TenantFlagOverride
from apps.platform.api.serializers.flag_serializer import FeatureFlagSerializer
from apps.platform.core_permissions import IsAuthenticated

class FeatureFlagListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        bu_id = request.security_context.require_business_unit()
        flags = FeatureFlag.objects.all()
        overrides = TenantFlagOverride.objects.filter(business_unit_id=bu_id).select_related('flag')
        
        override_map = {ov.flag_id: ov.is_enabled for ov in overrides}
        
        data = []
        for flag in flags:
            is_enabled = override_map.get(flag.id, flag.default_enabled)
            data.append({
                'key': flag.key,
                'description': flag.description,
                'is_enabled': is_enabled
            })
            
        return Response({'success': True, 'data': data})
''',
        "urls.py": '''
from django.urls import path
from .api.views.flag_view import FeatureFlagListView

urlpatterns = [
    path('', FeatureFlagListView.as_view(), name='feature-flags'),
]
'''
    },
    "module_registry": {
        "models/__init__.py": "from .module_model import Module, TenantModule",
        "models/module_model.py": '''
import uuid
from django.db import models
from apps.platform.models.base import PlatformModel, TenantModel

class Module(PlatformModel):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta(PlatformModel.Meta):
        db_table = "modules"

class TenantModule(TenantModel):
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='tenant_subscriptions')
    is_active = models.BooleanField(default=False)
    trial_end = models.DateTimeField(null=True, blank=True)
    next_billing_date = models.DateTimeField(null=True, blank=True)

    class Meta(TenantModel.Meta):
        db_table = "tenant_modules"
        unique_together = (('business_unit_id', 'module'),)
''',
        "api/serializers/__init__.py": "from .module_serializer import ModuleSerializer, TenantModuleSerializer",
        "api/serializers/module_serializer.py": '''
from rest_framework import serializers
from apps.platform.models.module_model import Module, TenantModule

class ModuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Module
        fields = '__all__'

class TenantModuleSerializer(serializers.ModelSerializer):
    module_name = serializers.CharField(source='module.name', read_only=True)

    class Meta:
        model = TenantModule
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'business_unit_id']
''',
        "api/views/__init__.py": "from .module_view import TenantModuleListView",
        "api/views/module_view.py": '''
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.platform.models.module_model import Module, TenantModule
from apps.platform.api.serializers.module_serializer import TenantModuleSerializer
from apps.platform.core_permissions import IsAuthenticated

class TenantModuleListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        bu_id = request.security_context.require_business_unit()
        modules = TenantModule.objects.filter(business_unit_id=bu_id).select_related('module')
        serializer = TenantModuleSerializer(modules, many=True)
        return Response({'success': True, 'data': serializer.data})
''',
        "urls.py": '''
from django.urls import path
from .api.views.module_view import TenantModuleListView

urlpatterns = [
    path('', TenantModuleListView.as_view(), name='tenant-modules'),
]
'''
    },
    "tenant_settings": {
        "models/__init__.py": "from .tenant_settings_model import TenantSetting",
        "models/tenant_settings_model.py": '''
import uuid
from django.db import models
from apps.platform.models.base import TenantModel

class TenantSetting(TenantModel):
    class ValueType(models.TextChoices):
        STRING = "STRING", "String"
        INTEGER = "INTEGER", "Integer"
        BOOLEAN = "BOOLEAN", "Boolean"
        JSON = "JSON", "JSON Object"

    key = models.CharField(max_length=255)
    value = models.TextField()
    value_type = models.CharField(max_length=50, choices=ValueType.choices, default=ValueType.STRING)
    description = models.TextField(blank=True)
    is_public = models.BooleanField(default=False)

    class Meta(TenantModel.Meta):
        db_table = "tenant_settings"
        unique_together = (('business_unit_id', 'key'),)
''',
        "api/serializers/__init__.py": "from .settings_serializer import TenantSettingSerializer",
        "api/serializers/settings_serializer.py": '''
from rest_framework import serializers
from apps.tenancy.models.tenant_settings_model import TenantSetting

class TenantSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = TenantSetting
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'business_unit_id']
''',
        "api/views/__init__.py": "from .settings_view import TenantSettingsView",
        "api/views/settings_view.py": '''
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.tenancy.models.tenant_settings_model import TenantSetting
from apps.tenancy.api.serializers.settings_serializer import TenantSettingSerializer
from apps.platform.core_permissions import IsAuthenticated

class TenantSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        bu_id = request.security_context.require_business_unit()
        settings = TenantSetting.objects.filter(business_unit_id=bu_id)
        serializer = TenantSettingSerializer(settings, many=True)
        return Response({'success': True, 'data': serializer.data})
        
    def post(self, request):
        bu_id = request.security_context.require_business_unit()
        key = request.data.get('key')
        setting, _ = TenantSetting.objects.get_or_create(business_unit_id=bu_id, key=key)
        serializer = TenantSettingSerializer(setting, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'success': True, 'data': serializer.data})
''',
        "urls.py": '''
from django.urls import path
from .api.views.settings_view import TenantSettingsView

urlpatterns = [
    path('', TenantSettingsView.as_view(), name='tenant-settings'),
]
'''
    }
}

for app_name, files in APPS_CODE.items():
    app_dir = os.path.join(BASE_DIR, app_name)
    os.makedirs(app_dir, exist_ok=True)
    
    # Also write a standard apps.py if it's missing or empty
    apps_py = os.path.join(app_dir, "apps.py")
    if not os.path.exists(apps_py) or os.path.getsize(apps_py) == 0:
        with open(apps_py, "w", encoding="utf-8") as f:
            f.write(f'''
from django.apps import AppConfig

class {app_name.title().replace("_", "")}Config(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.{app_name}'
''')

    for file_path, content in files.items():
        full_path = os.path.join(app_dir, file_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content.strip() + "\\n")
            
print("Done writing app files.")
