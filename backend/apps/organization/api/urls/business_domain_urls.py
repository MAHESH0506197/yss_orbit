from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.organization.api.views.business_domain_view import BusinessDomainViewSet

router = DefaultRouter()
router.register(r"", BusinessDomainViewSet, basename="business-domains")

urlpatterns = [
    path("", include(router.urls)),
]
