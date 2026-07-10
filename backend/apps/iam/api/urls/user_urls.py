# yss_orbit\backend\apps\users\api\urls\user_urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.iam.api.views.user_views import UserViewSet

router = DefaultRouter()
router.register("", UserViewSet, basename="user")

urlpatterns = [
    path("", include(router.urls)),
]
