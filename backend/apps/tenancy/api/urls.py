# yss_orbit\backend\apps\subscription\urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views.subscription_views import (
    SubscriptionPlanListView,
    BusinessUnitSubscriptionView,
    SubscriptionChangePlanView,
    SubscriptionCancelView,
)

from .views.platform_module_view import PlatformModuleViewSet

router = DefaultRouter()
router.register(r"platform-modules", PlatformModuleViewSet, basename="platform-modules")

urlpatterns = [
    path("", include(router.urls)),
    path("plans/", SubscriptionPlanListView.as_view(), name="subscription_plans"),
    path("business-units/<str:business_unit_id>/", BusinessUnitSubscriptionView.as_view(), name="bu_subscription"),
    path("business-units/<str:business_unit_id>/trial/", BusinessUnitSubscriptionView.as_view(), name="bu_subscription_trial"),
    path("business-units/<str:business_unit_id>/change-plan/", SubscriptionChangePlanView.as_view(), name="bu_change_plan"),
    path("business-units/<str:business_unit_id>/cancel/", SubscriptionCancelView.as_view(), name="bu_cancel_plan"),
]
