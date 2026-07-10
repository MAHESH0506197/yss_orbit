# yss_orbit\backend\config\settings\testing.py
"""
YSS Orbit — Testing Settings
Fast, isolated. SQLite in-memory. No external services.
"""
import os
os.environ.setdefault("DJANGO_SECRET_KEY", "test-secret-key-at-least-50-chars-long-for-pytest-runs-locally")
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("DATABASE_REPLICA_URL", "sqlite:///:memory:")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379")
os.environ.setdefault("JWT_SIGNING_KEY", "test-jwt-signing-key-32-chars-long-for-jwt-cookies")
os.environ.setdefault("JWT_REFRESH_SIGNING_KEY", "test-jwt-refresh-signing-key-32-chars-long-for-jwt-cookies")
os.environ.setdefault("FIELD_ENCRYPTION_KEY", "48VWUYPJz9EKhedlUuRDKz0nV0fQmlb5LWiMdfB69WU=")

from .base import *  # noqa: F401, F403

DEBUG = False

# ---------------------------------------------------------------------------
# Database — in-memory SQLite for speed
# ---------------------------------------------------------------------------
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    },
    "replica": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    },
}

# ---------------------------------------------------------------------------
# Password Hashing — fast MD5 for tests
# ---------------------------------------------------------------------------
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

# ---------------------------------------------------------------------------
# Email — in-memory backend
# ---------------------------------------------------------------------------
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

# ---------------------------------------------------------------------------
# Cache — implemented (tests should mock cache explicitly)
# ---------------------------------------------------------------------------
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "test-default",
    },
    "rate_limit": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "test-rate-limit",
    },
    "sessions": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "test-sessions",
    },
}

# ---------------------------------------------------------------------------
# Celery — NEVER eager in tests (use mocks instead)
# ---------------------------------------------------------------------------
CELERY_TASK_ALWAYS_EAGER = False
CELERY_TASK_EAGER_PROPAGATES = False

# ---------------------------------------------------------------------------
# Storage — memory in tests
# ---------------------------------------------------------------------------
DEFAULT_FILE_STORAGE = "django.core.files.storage.InMemoryStorage"
VIRUS_SCAN_ENABLED = False

# ---------------------------------------------------------------------------
# Secrets — test values
# ---------------------------------------------------------------------------
JWT_SIGNING_KEY = "test-jwt-signing-key-change-in-production-min-32-chars!"
JWT_REFRESH_SIGNING_KEY = "test-jwt-refresh-signing-key-change-in-production!"
FIELD_ENCRYPTION_KEY = "48VWUYPJz9EKhedlUuRDKz0nV0fQmlb5LWiMdfB69WU="

# ---------------------------------------------------------------------------
# Remove dev apps not needed in tests
# ---------------------------------------------------------------------------
INSTALLED_APPS = [app for app in INSTALLED_APPS  # noqa: F405
                  if app not in ("debug_toolbar", "silk", "nplusone.ext.django", "django_extensions")]
MIDDLEWARE = [mw for mw in MIDDLEWARE  # noqa: F405
              if mw not in (
                  "debug_toolbar.middleware.DebugToolbarMiddleware",
                  "silk.middleware.SilkyMiddleware",
                  "nplusone.ext.django.NPlusOneMiddleware",
              )]
ALLOWED_HOSTS = ["*"]
