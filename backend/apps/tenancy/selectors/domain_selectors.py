# yss_orbit\backend\apps\domain\selectors\domain_selectors.py
from apps.tenancy.models.domain_model import Domain
from django.db.models import QuerySet

class DomainSelectors:
    """
    Selector logic for Domain read operations (CQRS pattern).
    """
    @staticmethod
    def get_all_active_domains() -> QuerySet[Domain]:
        return Domain.objects.filter(is_verified=True)

    @staticmethod
    def get_primary_domain() -> Domain | None:
        return Domain.objects.filter(is_primary=True).first()
