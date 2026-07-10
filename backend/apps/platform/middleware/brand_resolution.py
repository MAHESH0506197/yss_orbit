import logging
from django.utils.deprecation import MiddlewareMixin
from django.core.cache import cache
from apps.platform.models.brand_configuration import BrandConfiguration
from apps.organization.models.organization_model import Organization

logger = logging.getLogger(__name__)

class BrandResolutionMiddleware(MiddlewareMixin):
    """
    Parses the Host header to determine the visual brand context.
    Strictly separates Brand Resolution from Tenant Resolution.
    Brand Resolution = Organization Branding
    Tenant Resolution = Business Unit Security Context
    """

    def process_request(self, request):
        host = request.get_host().split(':')[0].lower() # e.g. "hr.paynex.com" or "paynex.yssorbit.com"
        
        # Cache TTL: 15 minutes as per Enterprise rules.
        cache_key = f"brand_context:{host}"
        cached_context = cache.get(cache_key)
        
        if cached_context is not None:
            request.brand_context = cached_context
            return

        brand_context = {
            "found": False,
            "is_suspended": False,
            "organization_id": None,
            "mode": "platform",
            "logo_url": None,
        }

        try:
            # 1. Check Custom Domain (White Label)
            # Only use if domain is verified
            config = BrandConfiguration.objects.select_related('organization').filter(
                custom_domain=host,
                is_active=True,
                is_deleted=False
            ).first()

            if config and config.domain_status == BrandConfiguration.DomainStatus.VERIFIED:
                self._populate_context(brand_context, config)
            else:
                # 2. Check Subdomain (Platform or Co-Brand)
                parts = host.split('.')
                if len(parts) >= 3:
                    subdomain = parts[0]
                    # We only match by Organization slug. 
                    org = Organization.objects.filter(slug=subdomain, is_deleted=False).first()
                    if org:
                        # Find org-level config
                        org_config = BrandConfiguration.objects.filter(
                            organization=org,
                            business_unit__isnull=True,
                            is_active=True,
                            is_deleted=False
                        ).first()
                        
                        brand_context["organization_id"] = str(org.id)
                        brand_context["is_suspended"] = not org.is_active
                        
                        if org_config:
                            self._populate_context(brand_context, org_config)
                        else:
                            # Org exists but no custom branding, return basic context
                            brand_context["found"] = True

        except Exception as e:
            logger.error(f"BrandResolutionMiddleware error for host {host}: {e}")

        # Cache for 15 minutes (900 seconds)
        cache.set(cache_key, brand_context, timeout=900)
        request.brand_context = brand_context

    def _populate_context(self, context, config):
        org = config.organization
        context["found"] = True
        context["is_suspended"] = not org.is_active
        context["organization_id"] = str(org.id)
        context["mode"] = config.branding_mode
        context["logo_url"] = config.logo_url
