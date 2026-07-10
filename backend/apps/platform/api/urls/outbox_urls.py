# yss_orbit\backend\apps\outbox\urls.py
from django.urls import path, include

urlpatterns = [
    path('api/', include('apps.platform.api.urls')),
]
