from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.organization.api.views.business_unit_view import BusinessUnitViewSet
from apps.organization.api.views.business_unit_module_view import BusinessUnitModuleViewSet

router = DefaultRouter()
router.register(r"modules", BusinessUnitModuleViewSet, basename="business-unit-modules")
router.register(r"", BusinessUnitViewSet, basename="business-units")

urlpatterns = [
    path("", include(router.urls)),
]
