# yss_orbit\backend\config\settings\base.py
"""
YSS Orbit — Base Django Settings
Shared across ALL environments. Environment-specific overrides in
development.py / staging.py / production.py / testing.py
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import environ

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent.parent
APPS_DIR = BASE_DIR / "apps"

# ---------------------------------------------------------------------------
# Environment Variables
# ---------------------------------------------------------------------------
env = environ.Env()

# Read .env file if present (dev only; prod uses OS env vars)
env_file = BASE_DIR.parent / ".env"
if env_file.exists():
    environ.Env.read_env(str(env_file))

# ---------------------------------------------------------------------------
# Startup Fail-Fast Validation
# (All required vars must be set or Django refuses to start)
# ---------------------------------------------------------------------------
_REQUIRED_ENV_VARS = [
    "DJANGO_SECRET_KEY",
    "DJANGO_SETTINGS_MODULE",
    "DATABASE_URL",
    "REDIS_URL",
    "JWT_SIGNING_KEY",
    "JWT_REFRESH_SIGNING_KEY",
]


def _validate_env_vars() -> None:
    missing = [var for var in _REQUIRED_ENV_VARS if not os.environ.get(var)]
    if missing:
        raise RuntimeError(
            f"[YSS Orbit] FATAL: Missing required environment variables: {missing}\n"
            "The application cannot start without these variables. "
            "Check your .env file or environment configuration."
        )


_validate_env_vars()

# ---------------------------------------------------------------------------
# Core
# ---------------------------------------------------------------------------
SECRET_KEY = env("DJANGO_SECRET_KEY")
DEBUG = env.bool("DJANGO_DEBUG", default=False)
ALLOWED_HOSTS: list[str] = env.list("DJANGO_ALLOWED_HOSTS", default=["localhost", "127.0.0.1"])

# ---------------------------------------------------------------------------
# Application Definition
# ---------------------------------------------------------------------------
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.postgres",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "django_filters",
    "drf_spectacular",
    "django_celery_beat",
    "django_celery_results",
    "storages",
]

LOCAL_APPS = [
    "apps.iam",
    "apps.tenancy",
    "apps.platform",
    "apps.compliance",
    "apps.observability",
    "apps.organization",
    "apps.hrms",
    "apps.attendance",
    "apps.leave",
    "apps.payroll",
    "apps.recruitment",
    "apps.appraisal",
    "apps.hrms_core",
    "apps.pqm",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# ---------------------------------------------------------------------------
# Middleware (ORDER IS CRITICAL)
# ---------------------------------------------------------------------------
MIDDLEWARE = [
    # Security first
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "core.middleware.log_failed_middleware.LogFailedRequestsMiddleware",
    # Correlation ID — must be before request processing
    "apps.observability.middleware.CorrelationIdMiddleware",
    # Session / Auth
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    # Brand resolution
    "apps.platform.middleware.brand_resolution.BrandResolutionMiddleware",
    # Tenant isolation — after auth, before views
    "apps.tenancy.middleware.TenantMiddleware",
    # Idempotency — after tenant
    "apps.platform.middleware.idempotency.IdempotencyMiddleware",
    "apps.pqm.middleware.idempotency.PQMIdempotencyMiddleware",
    # Rate Limiting
    "apps.platform.middleware.rate_limit.RateLimitMiddleware",
    # Module subscription — last (needs auth + tenant)
    "apps.platform.catalogue.middleware.ModuleSubscriptionMiddleware",
]

# ---------------------------------------------------------------------------
# URL Configuration
# ---------------------------------------------------------------------------
ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# ---------------------------------------------------------------------------
# Templates
# ---------------------------------------------------------------------------
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
DATABASES = {
    "default": env.db("DATABASE_URL"),
    "replica": env.db("DATABASE_REPLICA_URL", default=env("DATABASE_URL")),
}

# Connection persistence (prevents constant reconnect overhead)
DATABASES["default"]["CONN_MAX_AGE"] = env.int("DB_CONN_MAX_AGE", default=60)
if "postgres" in DATABASES["default"]["ENGINE"]:
    DATABASES["default"]["OPTIONS"] = {
        "options": "-c search_path=public",
        "connect_timeout": 10,
    }

# Database routers
DATABASE_ROUTERS = ["apps.platform.core_db_routers.PrimaryReplicaRouter"]

# ---------------------------------------------------------------------------
# Custom User Model
# ---------------------------------------------------------------------------
AUTH_USER_MODEL = "iam.User"

# ---------------------------------------------------------------------------
# Password Validation
# ---------------------------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
    {"NAME": "apps.iam.models.validators.PasswordStrengthValidator"},
]

# ---------------------------------------------------------------------------
# Password Hashing — Argon2 is MANDATORY
# ---------------------------------------------------------------------------
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.Argon2PasswordHasher",
]

# ---------------------------------------------------------------------------
# Internationalization
# ---------------------------------------------------------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"  # Always UTC in backend — tenant timezone applied at display layer
USE_I18N = True
USE_TZ = True  # MANDATORY — all timestamps as TIMESTAMPTZ

# ---------------------------------------------------------------------------
# Static & Media Files
# ---------------------------------------------------------------------------
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# ---------------------------------------------------------------------------
# Default Primary Key
# ---------------------------------------------------------------------------
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ---------------------------------------------------------------------------
# REST Framework
# ---------------------------------------------------------------------------
REST_FRAMEWORK: dict[str, Any] = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "apps.iam.api.authentication.CookieJWTAuthentication",
        "apps.platform.api_consumer_key_authentication.APIKeyAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
        "rest_framework.parsers.MultiPartParser",
        "rest_framework.parsers.FormParser",
    ],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_PAGINATION_CLASS": "apps.platform.core_pagination.StandardResultsPagination",
    "PAGE_SIZE": 25,
    "EXCEPTION_HANDLER": "apps.platform.core_exceptions.global_exception_handler",
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

# ---------------------------------------------------------------------------
# JWT Configuration
# ---------------------------------------------------------------------------
from datetime import timedelta

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": env("JWT_SIGNING_KEY"),
    "VERIFYING_KEY": env("JWT_SIGNING_KEY"),
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    "TOKEN_TYPE_CLAIM": "token_type",
    "JTI_CLAIM": "jti",
    # Custom claims
    "TOKEN_OBTAIN_SERIALIZER": "apps.iam.api.serializers.token_serializers.CustomTokenObtainSerializer",
    "TOKEN_REFRESH_SERIALIZER": "apps.iam.api.serializers.token_serializers.CustomTokenRefreshSerializer",
}

JWT_REFRESH_SIGNING_KEY = env("JWT_REFRESH_SIGNING_KEY")

# Cookie settings (overridden per environment)
JWT_AUTH_COOKIE = "yss_access"
JWT_REFRESH_COOKIE = "yss_refresh"
JWT_AUTH_COOKIE_SECURE = env.bool("JWT_AUTH_COOKIE_SECURE", default=not DEBUG)
JWT_AUTH_COOKIE_HTTP_ONLY = True
JWT_AUTH_COOKIE_SAMESITE = "Lax"

# ---------------------------------------------------------------------------
# CSRF
# ---------------------------------------------------------------------------
CSRF_COOKIE_HTTPONLY = False  # Frontend must read CSRF cookie value
CSRF_USE_SESSIONS = False
CSRF_HEADER_NAME = "HTTP_X_CSRFTOKEN"
# CSRF_COOKIE_SECURE overridden in production

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
from corsheaders.defaults import default_headers

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS: list[str] = env.list(
    "CORS_ALLOWED_ORIGINS",
    default=["http://localhost:3000", "http://localhost:5173"],
)
CORS_ALLOW_HEADERS = (
    *default_headers,
    "x-business-unit-id",
)
CORS_EXPOSE_HEADERS = [
    "X-Correlation-Id",
    "X-Request-Id",
    "X-RateLimit-Limit",
    "X-RateLimit-Remaining",
    "X-RateLimit-Reset",
    "X-Plan-Limit-Type",
    "Deprecation-Warning",
]

# ---------------------------------------------------------------------------
# Redis
# ---------------------------------------------------------------------------
REDIS_URL = env("REDIS_URL", default="redis://localhost:6379")

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": f"{REDIS_URL}/0",
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "CONNECTION_POOL_KWARGS": {
                "max_connections": 100,
                "retry_on_timeout": True,
            },
            "SERIALIZER": "django_redis.serializers.json.JSONSerializer",
            "COMPRESSOR": "django_redis.compressors.zlib.ZlibCompressor",
        },
        "KEY_PREFIX": "yss_orbit",
        "TIMEOUT": 300,  # 5 minutes default
    },
    "rate_limit": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": f"{REDIS_URL}/2",
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        },
        "KEY_PREFIX": "rl",
        "TIMEOUT": 60,
    },
    "sessions": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": f"{REDIS_URL}/3",
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        },
        "KEY_PREFIX": "sess",
        "TIMEOUT": 86400,  # 24 hours
    },
}

SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "sessions"

# ---------------------------------------------------------------------------
# Celery
# ---------------------------------------------------------------------------
CELERY_BROKER_URL = f"{REDIS_URL}/1"
CELERY_RESULT_BACKEND = f"{REDIS_URL}/1"
CELERY_BROKER_TRANSPORT_OPTIONS = {
    "visibility_timeout": 3600,
    "max_retries": 3,
}
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TIMEZONE = "UTC"
CELERY_ENABLE_UTC = True
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_ACKS_LATE = True  # Ensure tasks are not lost on worker crash
CELERY_WORKER_PREFETCH_MULTIPLIER = 1  # Fair distribution
CELERY_TASK_ALWAYS_EAGER = False  # NEVER eager mode — always async
CELERY_TASK_SOFT_TIME_LIMIT = 300  # 5 minutes default
CELERY_TASK_TIME_LIMIT = 360  # Hard limit = soft + 60s

# Queue routing
CELERY_TASK_ROUTES = {
    "apps.events.tasks.*": {"queue": "queue_outbox"},
    "apps.payroll.tasks.*": {"queue": "queue_payroll"},
    "apps.inventory.tasks.*": {"queue": "queue_inventory"},
    "apps.hrms.tasks.*": {"queue": "queue_hrms"},
    "apps.attendance.tasks.*": {"queue": "queue_hrms"},
    "apps.leave.tasks.*": {"queue": "queue_hrms"},
    "apps.notification.tasks.*": {"queue": "queue_notifications"},
    "apps.webhook.tasks.*": {"queue": "queue_notifications"},
    "apps.reporting.tasks.*": {"queue": "queue_reports"},
    "apps.files.tasks.*": {"queue": "queue_default"},
    "apps.audit.tasks.*": {"queue": "queue_default"},
}

CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"

# ---------------------------------------------------------------------------
# File Storage
# ---------------------------------------------------------------------------
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB

# Allowed MIME types for upload
ALLOWED_FILE_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]

# ---------------------------------------------------------------------------
# Email (overridden per environment)
# ---------------------------------------------------------------------------
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="noreply@yssorbit.com")
SERVER_EMAIL = env("SERVER_EMAIL", default="server@yssorbit.com")

if DEBUG:
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
else:
    EMAIL_BACKEND = env("EMAIL_BACKEND", default="django.core.mail.backends.smtp.EmailBackend")
    EMAIL_HOST = env("EMAIL_HOST", default="smtp.sendgrid.net")
    EMAIL_PORT = env.int("EMAIL_PORT", default=587)
    EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="apikey")
    EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")
    EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=True)

# ---------------------------------------------------------------------------
# OpenAPI / Spectacular
# ---------------------------------------------------------------------------
SPECTACULAR_SETTINGS = {
    "TITLE": "YSS Orbit API",
    "DESCRIPTION": (
        "Enterprise SaaS Platform API — Multi-tenant, RBAC-secured, "
        "event-driven architecture. All endpoints require authentication "
        "and X-Business-Unit-Id header (except public endpoints)."
    ),
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
    "SORT_OPERATIONS": False,
    "TAGS": [
        {"name": "Auth", "description": "Authentication endpoints"},
        {"name": "Platform", "description": "Platform administration"},
        {"name": "Organizations", "description": "Organization management"},
        {"name": "Business Units", "description": "Business unit management"},
        {"name": "Users", "description": "User management"},
        {"name": "RBAC", "description": "Role-based access control"},
        {"name": "Inventory", "description": "Inventory management"},
        {"name": "POS", "description": "Point of sale"},
        {"name": "Billing", "description": "Billing and invoicing"},
        {"name": "HRMS", "description": "Human resource management"},
        {"name": "Attendance", "description": "Attendance management"},
        {"name": "Leave", "description": "Leave management"},
        {"name": "Payroll", "description": "Payroll processing"},
        {"name": "Notifications", "description": "Notification system"},
        {"name": "Reports", "description": "Reporting and analytics"},
        {"name": "Health", "description": "Health checks"},
    ],
    "POSTPROCESSING_HOOKS": [
        "drf_spectacular.hooks.postprocess_schema_enums",
    ],
}

# ---------------------------------------------------------------------------
# Sentry
# ---------------------------------------------------------------------------
SENTRY_DSN = env("SENTRY_DSN", default="")
SENTRY_ENVIRONMENT = env("SENTRY_ENVIRONMENT", default="development")
SENTRY_TRACES_SAMPLE_RATE = env.float("SENTRY_TRACES_SAMPLE_RATE", default=0.1)
SENTRY_PROFILES_SAMPLE_RATE = env.float("SENTRY_PROFILES_SAMPLE_RATE", default=0.1)

# PII fields to scrub from Sentry events
SENTRY_SCRUB_FIELDS = [
    "password", "otp", "token", "secret", "key", "pan", "aadhaar",
    "bank_account", "bank_account_number", "bank_ifsc", "credit_card",
]

# ---------------------------------------------------------------------------
# OpenTelemetry
# ---------------------------------------------------------------------------
OTEL_EXPORTER_OTLP_ENDPOINT = env("OTEL_EXPORTER_OTLP_ENDPOINT", default="")
OTEL_SERVICE_NAME = env("OTEL_SERVICE_NAME", default="yss-orbit-api")

# ---------------------------------------------------------------------------
# Logging — JSON structured, mandatory
# ---------------------------------------------------------------------------
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "()": "pythonjsonlogger.jsonlogger.JsonFormatter",
            "format": (
                "%(asctime)s %(levelname)s %(name)s %(message)s "
                "%(correlation_id)s %(trace_id)s %(user_id)s "
                "%(business_unit_id)s %(endpoint)s %(method)s "
                "%(status_code)s %(duration_ms)s %(environment)s"
            ),
        },
        "verbose": {
            "format": "{levelname} {asctime} {module} {process:d} {thread:d} {message}",
            "style": "{",
        },
    },
    "filters": {
        "require_debug_false": {"()": "django.utils.log.RequireDebugFalse"},
        "require_debug_true": {"()": "django.utils.log.RequireDebugTrue"},
    },
    "handlers": {
        "console": {
            "level": "DEBUG",
            "class": "logging.StreamHandler",
            "formatter": "json",
        },
        "null": {"class": "logging.NullHandler"},
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "django.db.backends": {
            "handlers": ["console"],
            "level": "WARNING",  # Set to DEBUG to see SQL queries
            "propagate": False,
        },
        "apps": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": False,
        },
        "celery": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
    },
}

# ---------------------------------------------------------------------------
# Security (base — hardened further in production)
# ---------------------------------------------------------------------------
X_FRAME_OPTIONS = "DENY"
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True

# ---------------------------------------------------------------------------
# Encryption
# ---------------------------------------------------------------------------
FIELD_ENCRYPTION_KEY = env("FIELD_ENCRYPTION_KEY", default="")

# ---------------------------------------------------------------------------
# Platform Configuration
# ---------------------------------------------------------------------------
PLATFORM_NAME = "YSS Orbit"
PLATFORM_SUPPORT_EMAIL = env("PLATFORM_SUPPORT_EMAIL", default="support@yssorbit.com")
PLATFORM_LOGO_PATH = "/assets/images/YSS_Logo.png"

# OTP Configuration
OTP_LENGTH = 6
OTP_EXPIRY_MINUTES = 10
OTP_MAX_ATTEMPTS = 5
OTP_RATE_LIMIT = 5  # Max OTP generation requests per 10 minutes per user
OTP_COOLDOWN_SECONDS = 60  # Frontend resend cooldown

# Login Security
LOGIN_MAX_ATTEMPTS = 5
LOGIN_LOCKOUT_MINUTES = 30

# Invitation
INVITATION_EXPIRY_DAYS = 7
INVITATION_RESEND_RATE_LIMIT = 3  # Per hour

# Background Jobs
JOB_EXPIRY_HOURS = 24

# Idempotency
IDEMPOTENCY_KEY_EXPIRY_HOURS = 24

# File storage
DEFAULT_FILE_SIZE_LIMIT_MB = 10
VIRUS_SCAN_ENABLED = env.bool("VIRUS_SCAN_ENABLED", default=False)

# Rate Limiting defaults per plan (requests per minute)
RATE_LIMIT_PER_PLAN = {
    "FREE": 100,
    "BASIC": 500,
    "PRO": 2000,
    "ENTERPRISE": 10000,
}

# SSE
SSE_MAX_CONNECTIONS_PER_BU = 50
SSE_RECONNECT_MS = 3000

# ---------------------------------------------------------------------------
# Razorpay
# ---------------------------------------------------------------------------
RAZORPAY_KEY_ID = env("RAZORPAY_KEY_ID", default="")
RAZORPAY_KEY_SECRET = env("RAZORPAY_KEY_SECRET", default="")
RAZORPAY_WEBHOOK_SECRET = env("RAZORPAY_WEBHOOK_SECRET", default="")

# ---------------------------------------------------------------------------
# Communication
# ---------------------------------------------------------------------------
SENDGRID_API_KEY = env("SENDGRID_API_KEY", default="")
TWILIO_ACCOUNT_SID = env("TWILIO_ACCOUNT_SID", default="")
TWILIO_AUTH_TOKEN = env("TWILIO_AUTH_TOKEN", default="")
TWILIO_PHONE_NUMBER = env("TWILIO_PHONE_NUMBER", default="")
WABA_TOKEN = env("WABA_TOKEN", default="")  # WhatsApp Business API

# ---------------------------------------------------------------------------
# AWS S3
# ---------------------------------------------------------------------------
AWS_ACCESS_KEY_ID = env("AWS_ACCESS_KEY_ID", default="")
AWS_SECRET_ACCESS_KEY = env("AWS_SECRET_ACCESS_KEY", default="")
AWS_STORAGE_BUCKET_NAME = env("AWS_STORAGE_BUCKET_NAME", default="")
AWS_S3_REGION_NAME = env("AWS_S3_REGION_NAME", default="ap-south-1")
AWS_DEFAULT_ACL = "private"
AWS_S3_FILE_OVERWRITE = False
AWS_S3_OBJECT_PARAMETERS = {"CacheControl": "max-age=86400"}

# ---------------------------------------------------------------------------
# GST API
# ---------------------------------------------------------------------------
GST_API_URL = env("GST_API_URL", default="https://api.gst.gov.in/")
GST_API_KEY = env("GST_API_KEY", default="")
