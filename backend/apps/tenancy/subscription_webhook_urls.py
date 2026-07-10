# yss_orbit\backend\apps\subscription\webhook_urls.py
from django.urls import path
from rest_framework.routers import DefaultRouter

app_name = 'subscription'
router = DefaultRouter()

urlpatterns = [
    # path('api/v1/subscription/', views.ListCreateAPIView.as_view(), name='list'),
] + router.urls
