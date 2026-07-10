# yss_orbit\backend\apps\branding\urls.py
from django.urls import path
from rest_framework.routers import DefaultRouter

app_name = 'branding'
router = DefaultRouter()

urlpatterns = [
    # path('api/v1/branding/', views.ListCreateAPIView.as_view(), name='list'),
] + router.urls
