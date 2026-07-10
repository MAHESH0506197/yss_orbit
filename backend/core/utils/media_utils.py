# core/utils/media_utils.py
"""
YSS Orbit — Shared Media / File Upload Utility

ENTERPRISE AUDIT: Logo upload logic was copy-pasted verbatim in 3 separate places:
  - apps/organization/api/views/organization_view.py (upload_logo action)
  - apps/organization/api/views/business_unit_view.py (upload_logo action)
  - apps/organization/services/business_domain_service.py (upload_logo method)

This module centralises that logic into a single function, eliminating the DRY
violation and ensuring consistent validation, storage, cleanup, and audit recording.

Usage:
    from core.utils.media_utils import save_logo_file

    logo_url = save_logo_file(
        file=request.FILES['logo'],
        entity_type='org_logos',
        entity_id=str(org.id),
    )
"""
from __future__ import annotations

import logging
import os
import uuid
from typing import Any

logger = logging.getLogger(__name__)

# Allowed MIME types for logo uploads
ALLOWED_LOGO_CONTENT_TYPES = frozenset({
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
})

MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


def save_logo_file(
    file: Any,
    entity_type: str,
    entity_id: str,
    old_logo_url: str | None = None,
) -> str:
    """
    Validate, store, and return the URL for a logo upload.

    Args:
        file:           The uploaded file object (from request.FILES).
        entity_type:    Subdirectory under MEDIA_ROOT, e.g. 'org_logos', 'bu_logos', 'domain_logos'.
        entity_id:      Unique identifier string for the entity (UUID as string).
        old_logo_url:   Current logo URL to remove after successful upload (optional).

    Returns:
        The new logo URL (relative to MEDIA_URL).

    Raises:
        ValueError: If the file is missing, has an unsupported type, or exceeds size limit.
    """
    from django.conf import settings as django_settings

    if not file:
        raise ValueError("No file provided.")
    if file.content_type not in ALLOWED_LOGO_CONTENT_TYPES:
        raise ValueError(
            f"Unsupported file type '{file.content_type}'. "
            f"Allowed: JPEG, PNG, WebP, GIF."
        )
    if file.size > MAX_LOGO_SIZE_BYTES:
        raise ValueError(f"File too large. Maximum allowed size is 5 MB.")

    ext = os.path.splitext(file.name)[1].lower() or ".png"
    filename = f"{uuid.uuid4().hex}{ext}"
    rel_path = os.path.join(entity_type, entity_id, filename)
    abs_dir  = os.path.join(django_settings.MEDIA_ROOT, entity_type, entity_id)
    os.makedirs(abs_dir, exist_ok=True)

    # Remove old logo file if it exists
    if old_logo_url:
        _remove_old_logo(old_logo_url, django_settings)

    # Write new file
    abs_path = os.path.join(abs_dir, filename)
    with open(abs_path, "wb") as fh:
        for chunk in file.chunks():
            fh.write(chunk)

    logo_url = django_settings.MEDIA_URL + rel_path.replace("\\", "/")
    logger.info("Logo saved: entity_type=%s, entity_id=%s, url=%s", entity_type, entity_id, logo_url)
    return logo_url


def delete_logo_file(logo_url: str) -> None:
    """
    Remove a logo file from disk given its URL.
    Safe to call even if the file no longer exists.
    """
    from django.conf import settings as django_settings
    _remove_old_logo(logo_url, django_settings)


def _remove_old_logo(logo_url: str, django_settings: Any) -> None:
    """Internal: remove a file by its MEDIA_URL-relative URL."""
    try:
        old_rel = logo_url.split(django_settings.MEDIA_URL, 1)[-1].lstrip("/")
        old_abs = os.path.join(django_settings.MEDIA_ROOT, old_rel)
        if os.path.isfile(old_abs):
            os.remove(old_abs)
            logger.debug("Removed old logo: %s", old_abs)
        # Remove empty parent directory
        parent_dir = os.path.dirname(old_abs)
        if os.path.isdir(parent_dir) and not os.listdir(parent_dir):
            os.rmdir(parent_dir)
    except Exception as exc:
        logger.warning("Could not remove old logo '%s': %s", logo_url, exc)
