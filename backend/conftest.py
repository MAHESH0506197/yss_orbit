# yss_orbit/backend/apps/hrms/tests/conftest.py
"""
Shared pytest fixtures for HRMS tests.
Provides `tenant_bu` and `default_user` for all test classes in this package.

BusinessUnit requires a parent Organization (NOT NULL constraint).
We create a minimal Organization → BusinessUnit chain here.
"""
from __future__ import annotations

import uuid

import pytest
from rest_framework.test import APIClient


@pytest.fixture
def tenant_org(db):
    """Creates a minimal Organization for test BusinessUnits."""
    from django.apps import apps
    Org = apps.get_model("organization", "Organization")
    BusinessDomain = apps.get_model("organization", "BusinessDomain")
    domain, _ = BusinessDomain.objects.get_or_create(
        name="Global Test Domain",
        defaults={"code": "GTD", "is_active": True}
    )
    return Org.objects.create(
        name=f"Test Org {uuid.uuid4().hex[:6]}",
        is_active=True,
        business_domain=domain
    )


@pytest.fixture
def tenant_bu(db, tenant_org):
    """
    Creates and returns a BusinessUnit scoped to this test.
    All HRMS TenantModel subclasses require a valid business_unit_id.
    """
    from apps.organization.models.business_unit_model import BusinessUnit
    return BusinessUnit.objects.create(
        organization=tenant_org,
        name=f"Test BU {uuid.uuid4().hex[:6]}",
        code=f"BU{uuid.uuid4().hex[:4].upper()}",
        is_active=True,
    )


@pytest.fixture
def default_user(db):
    """Creates and returns a User for use in HRMS tests."""
    from apps.iam.models.user import User
    uid = uuid.uuid4().hex[:6]
    return User.objects.create_user(
        username=f"testuser-{uid}",
        email=f"testuser-{uid}@orbit.test",
        password="TestPass@123",
        first_name="Test",
        last_name="User",
    )


@pytest.fixture
def api_client():
    """Unauthenticated DRF APIClient."""
    return APIClient()


@pytest.fixture
def auth_client(default_user):
    """Authenticated DRF APIClient pre-authenticated as default_user."""
    client = APIClient()
    client.force_authenticate(user=default_user)
    return client


@pytest.fixture(autouse=True)
def media_root(settings, tmp_path):
    """
    Redirect file storage to a real FileSystemStorage in tmp_path for every test.

    Test settings use InMemoryStorage which has no .path attribute — so any
    service that calls session.file_path.path (e.g. EmployeeImportService)
    would fail. This fixture switches to FileSystemStorage backed by a real
    temp directory, giving a proper on-disk path.
    """
    media = tmp_path / "media"
    media.mkdir(parents=True, exist_ok=True)
    settings.MEDIA_ROOT = str(media)
    settings.DEFAULT_FILE_STORAGE = "django.core.files.storage.FileSystemStorage"
    settings.STORAGES = {
        "default": {
            "BACKEND": "django.core.files.storage.FileSystemStorage",
            "OPTIONS": {"location": str(media)},
        },
        "staticfiles": {
            "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
        },
    }
    # Reset the cached default_storage instance so it re-reads the new settings
    from django.core.files.storage import default_storage
    from django.utils.functional import empty
    if hasattr(default_storage, "_wrapped"):
        default_storage._wrapped = empty


