# yss_orbit\backend\config\asgi.py
"""
YSS Orbit — ASGI Application Entry Point (SSE support)
"""
import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.production")

# ASGI application — supports SSE via async views
application = get_asgi_application()
