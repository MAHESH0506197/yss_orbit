# yss_orbit\backend\apps\orchestration\urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from ..views import SagaViewSet

router = DefaultRouter()
router.register(r'sagas', SagaViewSet, basename='saga')

urlpatterns = [
    path('', include(router.urls)),
]
