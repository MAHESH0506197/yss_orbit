# yss_orbit\backend\apps\leave\apps.py
"""YSS Orbit — Leave Management AppConfig"""
from django.apps import AppConfig


class LeaveConfig(AppConfig):
    name = "apps.leave"
    verbose_name = "Leave Management"
    default_auto_field = "django.db.models.BigAutoField"

