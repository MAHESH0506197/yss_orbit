# yss_orbit\backend\apps\notification\urls.py
from django.urls import path
from rest_framework.routers import DefaultRouter

app_name = 'notifications'
router = DefaultRouter()

urlpatterns = [
    # path('api/v1/notifications/', views.ListCreateAPIView.as_view(), name='list'),
] + router.urls
