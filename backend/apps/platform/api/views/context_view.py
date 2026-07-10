from rest_framework.views import APIView
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.platform.core_response import success_response
from apps.organization.models import BusinessUnit, BusinessUnitModule
from apps.platform.models.brand_configuration import BrandConfiguration
import uuid

class PlatformContextView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        if hasattr(request, "security_context") and request.security_context:
            bu_id = request.security_context.business_unit_id
        else:
            bu_id = request.headers.get("X-Business-Unit-Id")

        # Default platform branding
        branding = {
            "branding_mode": "platform",
            "logo_url": None,
        }

        if not bu_id:
            return success_response(data={
                "business_unit": None,
                "branding": branding,
                "subscribed_modules": [],
                "feature_flags": {},
                "settings": {}
            })
            
        try:
            bu = BusinessUnit.objects.get(id=bu_id)
            
            # Fetch Brand Configuration
            config = BrandConfiguration.objects.filter(
                business_unit=bu, is_active=True, is_deleted=False
            ).first()
            
            # Fallback to Organization Brand Configuration if BU doesn't have one
            if not config:
                config = BrandConfiguration.objects.filter(
                    organization=bu.organization, business_unit__isnull=True, is_active=True, is_deleted=False
                ).first()

            if config:
                branding = {
                    "branding_mode": config.branding_mode,
                    "logo_url": config.logo_url or bu.organization.logo_url,
                }
            else:
                branding["logo_url"] = bu.organization.logo_url
                branding["branding_mode"] = "platform"

            return success_response(data={
                "business_unit": {"id": str(bu.id), "name": bu.name, "code": bu.code},
                "branding": branding,
                "subscribed_modules": [],
                "feature_flags": {},
                "settings": {}
            })
        except Exception:
            return success_response(data={
                "business_unit": None,
                "branding": branding,
                "subscribed_modules": [],
                "feature_flags": {},
                "settings": {}
            })
