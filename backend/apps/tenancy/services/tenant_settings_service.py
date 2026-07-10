# yss_orbit\backend\apps\tenant_settings\services\tenant_settings_service.py
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
