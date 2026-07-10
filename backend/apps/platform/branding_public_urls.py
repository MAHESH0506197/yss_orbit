# yss_orbit\backend\apps\branding\public_urls.py
from django.urls import path
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.request import Request


@api_view(["GET"])
@permission_classes([AllowAny])
def public_tenant_config(request: Request) -> JsonResponse:
    """
    GET /api/tenant-config/
    Returns branding config for the current host domain/subdomain.
    Resolved by BrandResolutionMiddleware and served from cache.
    """
    context = getattr(request, 'brand_context', {"found": False})
    return JsonResponse(context, status=200)


urlpatterns = [
    path("", public_tenant_config, name="public-tenant-config"),
]
