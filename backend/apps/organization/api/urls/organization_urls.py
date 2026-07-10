from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.organization.api.views.organization_view import OrganizationViewSet

router = DefaultRouter()
router.register(r"", OrganizationViewSet, basename="organizations")

urlpatterns = [
    path("", include(router.urls)),
]
