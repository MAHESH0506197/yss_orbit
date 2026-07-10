# yss_orbit\backend\apps\domain\services\domain_service.py
import logging
from apps.tenancy.models.domain_model import Domain
from apps.tenancy.repositories.domain_repository import DomainRepository
from django.core.exceptions import ValidationError

logger = logging.getLogger(__name__)

class DomainService:
    """
    Business logic for Domain operations.
    """
    @staticmethod
    def provision_domain(name: str, is_primary: bool = False) -> Domain:
        if DomainRepository.get_by_name(name):
            raise ValidationError(f"Domain {name} is already registered.")
            
        domain = DomainRepository.create(name=name, is_primary=is_primary)
        logger.info(f"Successfully provisioned domain: {name}")
        return domain

    @staticmethod
    def verify_domain_ownership(domain_id: int) -> Domain:
        domain = DomainRepository.get_by_id(domain_id)
        # Placeholder for DNS text record verification logic
        domain = DomainRepository.update(domain, is_verified=True)
        logger.info(f"Domain {domain.name} ownership verified.")
        return domain

    @staticmethod
    def enable_ssl(domain_id: int) -> Domain:
        domain = DomainRepository.get_by_id(domain_id)
        if not domain.is_verified:
            raise ValidationError("Cannot enable SSL on an unverified domain.")
            
        # Trigger background task for SSL issuance (e.g., Let's Encrypt)
        domain = DomainRepository.update(domain, ssl_enabled=True, ssl_status='pending')
        return domain
