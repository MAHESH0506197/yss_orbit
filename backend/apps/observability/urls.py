# yss_orbit\backend\apps\observability\urls.py
from django.urls import path
from apps.observability.views import liveness, readiness

urlpatterns = [
    path("live/", liveness, name="health-live"),
    path("ready/", readiness, name="health-ready"),
]
