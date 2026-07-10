# yss_orbit\backend\apps\branding\services\branding_service.py
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
