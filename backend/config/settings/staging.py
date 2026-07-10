# yss_orbit\backend\config\settings\staging.py
"""
YSS Orbit — Staging Settings
Near-production. Uses real infrastructure but test credentials.
"""
from .production import *  # noqa: F401, F403

# Staging uses production settings with these overrides:

DEBUG = False
SENTRY_ENVIRONMENT = "staging"
SENTRY_TRACES_SAMPLE_RATE = 1.0  # Full tracing in staging

# Staging CORS — allow staging frontend
CORS_ALLOW_ALL_ORIGINS = False

# Email — Mailtrap in staging (catches all outgoing email)
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = env("STAGING_EMAIL_HOST", default="smtp.mailtrap.io")  # noqa: F405
EMAIL_PORT = env.int("STAGING_EMAIL_PORT", default=2525)  # noqa: F405

# Virus scanning enabled in staging
VIRUS_SCAN_ENABLED = True

# N+1 detection — log in staging (don't raise)
NPLUSONE_RAISE = False
