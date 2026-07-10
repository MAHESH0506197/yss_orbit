from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.organization.api.views.user_business_unit_view import UserBusinessUnitViewSet

router = DefaultRouter()
router.register(r"memberships", UserBusinessUnitViewSet, basename="ubu")

urlpatterns = [
    path("", include(router.urls)),
]
