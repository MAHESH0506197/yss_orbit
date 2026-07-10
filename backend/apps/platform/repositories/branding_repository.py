# yss_orbit\backend\apps\branding\repositories\branding_repository.py
from typing import Any
import uuid

from apps.platform.repositories.base import BaseRepository
from apps.platform.models.brand_configuration import BrandConfiguration
from apps.platform.core_exceptions import ResourceNotFoundException

class BrandConfigurationRepository(BaseRepository[BrandConfiguration]):
    def __init__(self) -> None:
        super().__init__(BrandConfiguration)

    def get_by_business_unit(self, business_unit_id: uuid.UUID) -> BrandConfiguration:
        try:
            return self.model_class.objects.get(
                business_unit_id=business_unit_id,
                is_deleted=False
            )
        except self.model_class.DoesNotExist:
            raise ResourceNotFoundException(resource_name="BrandConfiguration")

    def get_by_domain(self, domain: str) -> BrandConfiguration | None:
        return self.model_class.objects.filter(
            custom_domain=domain,
            is_deleted=False
        ).first()
