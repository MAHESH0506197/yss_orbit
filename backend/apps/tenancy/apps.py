# yss_orbit\backend\apps\tenancy\apps.py
"""YSS Orbit — Tenancy AppConfig"""
from django.apps import AppConfig


class TenancyConfig(AppConfig):
    name = "apps.tenancy"
    verbose_name = "Tenancy"
    default_auto_field = "django.db.models.BigAutoField"

