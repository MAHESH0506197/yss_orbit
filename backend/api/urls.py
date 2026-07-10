# yss_orbit\backend\api\urls.py
"""
Root API URL Configuration.
"""
from django.urls import path, include

urlpatterns = [
    path('v1/', include('api.v1.urls')),
]
