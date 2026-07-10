# yss_orbit\backend\apps\domain\tasks\domain_tasks.py
import logging
from celery import shared_task
from apps.tenancy.services.domain_service import DomainService
from apps.tenancy.repositories.domain_repository import DomainRepository

logger = logging.getLogger(__name__)

@shared_task(name="domain.provision_ssl")
def provision_ssl_for_domain(domain_id: int):
    """
    Background task to provision an SSL certificate for a newly registered domain.
    """
    logger.info(f"Starting SSL provisioning for domain {domain_id}")
    domain = DomainRepository.get_by_id(domain_id)
    if not domain:
        logger.error(f"Domain {domain_id} not found.")
        return

    try:
        # Placeholder for real ACME protocol / Let's Encrypt integration
        domain = DomainRepository.update(domain, ssl_status='active', ssl_enabled=True)
        logger.info(f"SSL provisioned successfully for {domain.name}")
    except Exception as e:
        logger.exception(f"Failed to provision SSL for domain {domain.name}")
        DomainRepository.update(domain, ssl_status='failed')
