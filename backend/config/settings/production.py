# yss_orbit\backend\config\settings\production.py
"""
YSS Orbit — Production Settings
Maximum security. All secrets from environment. No debug.
"""
from .base import *  # noqa: F401, F403

# ---------------------------------------------------------------------------
# Core
# ---------------------------------------------------------------------------
DEBUG = False

# ---------------------------------------------------------------------------
# Security Headers — full hardening
# ---------------------------------------------------------------------------
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = "DENY"
REFERRER_POLICY = "strict-origin-when-cross-origin"

# ---------------------------------------------------------------------------
# JWT Cookies — __Host- prefix in production (HTTPS only)
# ---------------------------------------------------------------------------
JWT_AUTH_COOKIE = "__Host-yss_access"
JWT_REFRESH_COOKIE = "__Host-yss_refresh"
JWT_AUTH_COOKIE_SECURE = True
JWT_AUTH_COOKIE_SAMESITE = "Strict"

# ---------------------------------------------------------------------------
# Email — SendGrid via django-ses or SMTP
# ---------------------------------------------------------------------------
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = env("EMAIL_HOST", default="smtp.sendgrid.net")  # noqa: F405
EMAIL_PORT = env.int("EMAIL_PORT", default=587)  # noqa: F405
EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="apikey")  # noqa: F405
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")  # noqa: F405
EMAIL_USE_TLS = True

# ---------------------------------------------------------------------------
# Storage — AWS S3 in production
# ---------------------------------------------------------------------------
DEFAULT_FILE_STORAGE = "storages.backends.s3boto3.S3Boto3Storage"
STATICFILES_STORAGE = "storages.backends.s3boto3.S3ManifestStaticFilesStorage"
AWS_S3_CUSTOM_DOMAIN = env("AWS_S3_CUSTOM_DOMAIN", default="")  # noqa: F405
VIRUS_SCAN_ENABLED = True

# ---------------------------------------------------------------------------
# CSP — Content Security Policy
# ---------------------------------------------------------------------------
CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC = ("'self'", "https://checkout.razorpay.com")
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'", "https://fonts.googleapis.com")
CSP_FONT_SRC = ("'self'", "https://fonts.gstatic.com")
CSP_IMG_SRC = ("'self'", "data:", "https:")
CSP_CONNECT_SRC = ("'self'", "https://api.razorpay.com")
CSP_FRAME_SRC = ("'none'",)
CSP_OBJECT_SRC = ("'none'",)
CSP_BASE_URI = ("'self'",)
CSP_FORM_ACTION = ("'self'",)

# ---------------------------------------------------------------------------
# Sentry — full production tracking
# ---------------------------------------------------------------------------
SENTRY_TRACES_SAMPLE_RATE = 0.1
SENTRY_PROFILES_SAMPLE_RATE = 0.05

# ---------------------------------------------------------------------------
# Caching — production TTLs
# ---------------------------------------------------------------------------
# Inherited from base.py

# ---------------------------------------------------------------------------
# Database — production pool settings
# ---------------------------------------------------------------------------
DATABASES["default"]["CONN_MAX_AGE"] = 60  # noqa: F405
DATABASES["default"]["OPTIONS"]["connect_timeout"] = 5  # noqa: F405

# ---------------------------------------------------------------------------
# Logging — production: INFO only, structured JSON
# ---------------------------------------------------------------------------
LOGGING["loggers"]["django.db.backends"]["level"] = "WARNING"  # type: ignore[index]

# ---------------------------------------------------------------------------
# Admin — disable in prod if not needed
# ---------------------------------------------------------------------------
# Uncomment to disable Django admin in production
# INSTALLED_APPS = [app for app in INSTALLED_APPS if app != 'django.contrib.admin']

# ---------------------------------------------------------------------------
# Session
# ---------------------------------------------------------------------------
SESSION_COOKIE_AGE = 86400  # 24 hours
SESSION_EXPIRE_AT_BROWSER_CLOSE = False
