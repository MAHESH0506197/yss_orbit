# yss_orbit\backend\config\settings\development.py
"""
YSS Orbit — Development Settings
Local development environment — relaxed security, verbose logging, console email.
"""
from .base import *  # noqa: F401, F403

# ---------------------------------------------------------------------------
# Core
# ---------------------------------------------------------------------------
DEBUG = True
ALLOWED_HOSTS = ["*"]

# ---------------------------------------------------------------------------
# Database (dev — local PostgreSQL)
# ---------------------------------------------------------------------------
# DATABASE_URL set in .env.development

# ---------------------------------------------------------------------------
# Email — console backend (prints to terminal)
# ---------------------------------------------------------------------------
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# ---------------------------------------------------------------------------
# CORS — relaxed for local dev
# ---------------------------------------------------------------------------
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# ---------------------------------------------------------------------------
# CSRF — relaxed for dev
# ---------------------------------------------------------------------------
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

# ---------------------------------------------------------------------------
# JWT Cookies — http (non-secure) in dev
# ---------------------------------------------------------------------------
JWT_AUTH_COOKIE_SECURE = False
JWT_AUTH_COOKIE = "yss_access"
JWT_REFRESH_COOKIE = "yss_refresh"

# ---------------------------------------------------------------------------
# Cache — use Redis if available, fallback to implemented
# ---------------------------------------------------------------------------
# CACHES config inherited from base.py (uses REDIS_URL)

# ---------------------------------------------------------------------------
# Storage — local filesystem in dev
# ---------------------------------------------------------------------------
DEFAULT_FILE_STORAGE = "django.core.files.storage.FileSystemStorage"
STATICFILES_STORAGE = "django.contrib.staticfiles.storage.StaticFilesStorage"
VIRUS_SCAN_ENABLED = False

# ---------------------------------------------------------------------------
# Development apps
# ---------------------------------------------------------------------------
INSTALLED_APPS += [  # noqa: F405
    # "debug_toolbar", # Massive overhead, enable only when debugging performance
    # "silk",          # Massive overhead, enable only when debugging performance
    "django_extensions",
    "nplusone.ext.django",
]

MIDDLEWARE += [  # noqa: F405
    # "debug_toolbar.middleware.DebugToolbarMiddleware",
    # "silk.middleware.SilkyMiddleware",
    "nplusone.ext.django.NPlusOneMiddleware",
]

# ---------------------------------------------------------------------------
# Debug Toolbar
# ---------------------------------------------------------------------------
INTERNAL_IPS = ["127.0.0.1", "::1"]

DEBUG_TOOLBAR_CONFIG = {
    "SHOW_TOOLBAR_CALLBACK": lambda request: DEBUG,
    "RESULTS_CACHE_SIZE": 25,
}

# ---------------------------------------------------------------------------
# Silk Profiling
# ---------------------------------------------------------------------------
SILKY_PYTHON_PROFILER = False  # Enable when profiling needed
SILKY_ANALYZE_QUERIES = False
SILKY_MAX_RECORDED_REQUESTS = 100

# ---------------------------------------------------------------------------
# N+1 Detection — raise exception in dev
# ---------------------------------------------------------------------------
NPLUSONE_RAISE = True
NPLUSONE_WHITELIST = [
    {"model": "auth.Permission"},
    {"model": "organization.Organization", "field": "settings"},
]

# ---------------------------------------------------------------------------
# Logging — more verbose in dev, but human-readable (no JSON)
# ---------------------------------------------------------------------------
LOGGING["handlers"]["console"]["formatter"] = "verbose"  # type: ignore[index]
LOGGING["loggers"]["django.db.backends"]["level"] = "WARNING"  # type: ignore[index]
LOGGING["loggers"]["apps"]["level"] = "DEBUG"  # type: ignore[index]

# Silence annoying local development logs
LOGGING["loggers"]["django.utils.autoreload"] = {"level": "WARNING", "handlers": ["console"], "propagate": False}  # type: ignore[index]
LOGGING["loggers"]["django.server"] = {"level": "WARNING", "handlers": ["console"], "propagate": False}  # type: ignore[index]

# ---------------------------------------------------------------------------
# Security — relaxed in dev
# ---------------------------------------------------------------------------
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# ---------------------------------------------------------------------------
# Celery — use synchronous tasks in dev to avoid message broker dependency
# ---------------------------------------------------------------------------
CELERY_TASK_ALWAYS_EAGER = True
CELERY_BROKER_URL = "memory://"
CELERY_RESULT_BACKEND = "cache+memory://"

# ---------------------------------------------------------------------------
# Sentry — disabled in dev unless DSN set
# ---------------------------------------------------------------------------
SENTRY_TRACES_SAMPLE_RATE = 0.0

# ---------------------------------------------------------------------------
# OTP — shorter expiry in dev for convenience
# ---------------------------------------------------------------------------
OTP_EXPIRY_MINUTES = 30  # Longer window for dev

# ---------------------------------------------------------------------------
# Fast Password Hashing for Development
# ---------------------------------------------------------------------------
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
