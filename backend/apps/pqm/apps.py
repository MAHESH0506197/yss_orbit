# yss_orbit\backend\apps\pqm\apps.py
"""YSS Orbit — PQM AppConfig"""
from django.apps import AppConfig


class PqmConfig(AppConfig):
    name = "apps.pqm"
    verbose_name = "Project Quality Management"
    default_auto_field = "django.db.models.BigAutoField"

    def ready(self) -> None:
        # Register signals when app is fully loaded
        import apps.pqm.signals  # noqa: F401
