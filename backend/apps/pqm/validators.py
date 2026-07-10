# yss_orbit\backend\apps\pqm\validators.py
"""
PQM Domain Validators — pure functions, no side effects.

All validators raise django.core.exceptions.ValidationError on failure.
They are called from service layer before persisting changes.
"""
from __future__ import annotations

import logging
from datetime import date
from typing import TYPE_CHECKING

from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.pqm.enums import AttachmentStage, NCStatus

if TYPE_CHECKING:
    from apps.pqm.models import NonConformance, PQMAttachment

logger = logging.getLogger(__name__)


def validate_before_photos_on_submit(nc: "NonConformance") -> None:
    """
    Validate that the NC has at least one 'before' stage attachment before submission.

    Raises:
        ValidationError: If no before-stage attachments exist.
    """
    has_before_photos = nc.attachments.filter(
        attachment_stage=AttachmentStage.BEFORE,
        is_deleted=False,
    ).exists()
    if not has_before_photos:
        raise ValidationError(
            {
                "attachments": (
                    "At least one 'Before Evidence' photo must be uploaded before submitting "
                    "this Non-Conformance. Please upload a before-stage attachment."
                )
            },
            code="missing_before_photos",
        )


def validate_closure_gate(nc: "NonConformance") -> None:
    """
    Validate that an NC meets all closure preconditions before requesting closure.

    Preconditions:
    1. root_cause_description must not be blank.
    2. At least one 'after' stage attachment must exist.

    Raises:
        ValidationError: If any precondition is not met (all errors collected).
    """
    errors: dict[str, str] = {}

    if not nc.root_cause_description or not nc.root_cause_description.strip():
        errors["root_cause_description"] = (
            "Root cause description is required before requesting closure. "
            "Please document the identified root cause."
        )

    has_after_photos = nc.attachments.filter(
        attachment_stage=AttachmentStage.AFTER,
        is_deleted=False,
    ).exists()
    if not has_after_photos:
        errors["attachments"] = (
            "At least one 'After Rectification' photo must be uploaded before requesting closure."
        )

    if errors:
        raise ValidationError(errors, code="closure_gate_failed")


def validate_extension_request(nc: "NonConformance", new_date: date) -> None:
    """
    Validate that an extension request proposes a date strictly after the current target.

    Args:
        nc: The NonConformance being extended.
        new_date: The proposed new target closure date.

    Raises:
        ValidationError: If new_date is not strictly after nc.target_closure_date.
    """
    if nc.target_closure_date is None:
        raise ValidationError(
            {"requested_date": "NC does not have a target closure date to extend."},
            code="no_target_date",
        )

    if new_date <= nc.target_closure_date:
        raise ValidationError(
            {
                "requested_date": (
                    f"Requested extension date ({new_date}) must be strictly after "
                    f"the current target closure date ({nc.target_closure_date})."
                )
            },
            code="extension_date_not_future",
        )


def validate_client_captured_at(ts) -> None:
    """
    Validate that the offline capture timestamp is not in the future.

    Args:
        ts: A datetime object (with or without timezone).

    Raises:
        ValidationError: If ts is in the future relative to timezone.now().
    """
    if ts is None:
        return

    now = timezone.now()

    # Make ts timezone-aware if it is naive
    if timezone.is_naive(ts):
        ts = timezone.make_aware(ts)

    if ts > now:
        raise ValidationError(
            {
                "client_captured_at": (
                    f"Offline capture timestamp ({ts.isoformat()}) cannot be in the future. "
                    f"Current server time is {now.isoformat()}."
                )
            },
            code="future_capture_timestamp",
        )


def validate_nc_transition(nc: "NonConformance", target_status: str) -> None:
    """
    Validate that transitioning to target_status is allowed from nc's current status.

    Uses NCStatus.allowed_transitions() state machine.

    Args:
        nc: The NonConformance being transitioned.
        target_status: The desired new status string.

    Raises:
        ValidationError: If the transition is not in the allowed set.
    """
    allowed = NCStatus.allowed_transitions().get(nc.status, set())

    if target_status not in allowed:
        raise ValidationError(
            {
                "status": (
                    f"Cannot transition NC from '{nc.status}' to '{target_status}'. "
                    f"Allowed transitions from '{nc.status}': "
                    f"{sorted(allowed) if allowed else 'none (terminal state)'}."
                )
            },
            code="invalid_nc_transition",
        )
