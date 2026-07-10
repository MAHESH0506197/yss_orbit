# yss_orbit\backend\apps\core\urls\csrf_urls.py
from django.urls import path
from apps.iam.api.views.auth_views import csrf_init

urlpatterns = [
    path("", csrf_init, name="csrf-init"),
]
