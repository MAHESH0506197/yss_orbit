# yss_orbit\backend\apps\domain\repositories\domain_repository.py
from apps.tenancy.models.domain_model import Domain

class DomainRepository:
    """
    Repository layer for encapsulating Domain database queries.
    """
    @staticmethod
    def get_by_id(domain_id: int) -> Domain:
        return Domain.objects.get(id=domain_id)

    @staticmethod
    def get_by_name(name: str) -> Domain | None:
        return Domain.objects.filter(name=name).first()

    @staticmethod
    def create(name: str, is_primary: bool = False, **kwargs) -> Domain:
        return Domain.objects.create(name=name, is_primary=is_primary, **kwargs)

    @staticmethod
    def update(domain: Domain, **kwargs) -> Domain:
        for key, value in kwargs.items():
            setattr(domain, key, value)
        domain.save()
        return domain
