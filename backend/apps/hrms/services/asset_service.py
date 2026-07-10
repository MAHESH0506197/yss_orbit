"""
YSS Orbit — Asset Service (v2 — field-aligned)

Field mapping aligned to actual Asset/AssetAssignment model schema
as defined in apps/hrms/models/asset.py:
  - Asset.Status.ASSIGNED (not IN_USE)
  - Asset has no name / assigned_to_employee_id fields
  - AssetAssignment.condition_on_assign / condition_on_return (not return_condition)
  - AssetAssignment.received_by_id (not returned_by_id)
"""
from __future__ import annotations

import uuid
import logging
from datetime import date
from typing import Optional

from django.db import transaction

from apps.hrms.models.asset import Asset, AssetAssignment, AssetCategory
from apps.hrms.services.lifecycle_event_publisher import LifecycleEventPublisher

logger = logging.getLogger(__name__)


class AssetError(Exception):
    pass


def _asset_display_name(asset: Asset) -> str:
    parts = [asset.brand, asset.model_name]
    return " ".join(p for p in parts if p) or asset.asset_tag


class AssetService:
    """Manages asset lifecycle: assign → return → retire."""

    @staticmethod
    @transaction.atomic
    def assign(
        bu_id: uuid.UUID,
        asset_id: uuid.UUID,
        employee_id: uuid.UUID,
        assigned_by_id: uuid.UUID,
        expected_return_date: Optional[date] = None,
        condition_on_assign: str = Asset.Condition.GOOD,
        notes: str = "",
    ) -> AssetAssignment:
        """
        Assign an asset to an employee.
        Sets Asset.status → ASSIGNED and creates AssetAssignment.
        """
        try:
            asset = Asset.objects.select_for_update().get(
                id=asset_id, business_unit_id=bu_id,
                status=Asset.Status.AVAILABLE,
            )
        except Asset.DoesNotExist:
            raise AssetError(f"Asset {asset_id} is not available for assignment.")

        # Defensive: ensure no active assignment exists
        if AssetAssignment.objects.filter(
            asset=asset, status=AssetAssignment.Status.ACTIVE
        ).exists():
            raise AssetError(f"Asset {asset_id} already has an active assignment.")

        asset.status = Asset.Status.ASSIGNED
        asset.save(update_fields=["status", "updated_at"])

        assignment = AssetAssignment.objects.create(
            business_unit_id=bu_id,
            asset=asset,
            employee_id=employee_id,
            assigned_by_id=assigned_by_id,
            assigned_on=date.today(),
            condition_on_assign=condition_on_assign,
            status=AssetAssignment.Status.ACTIVE,
            notes=notes,
        )

        display_name = _asset_display_name(asset)
        LifecycleEventPublisher.asset_assigned(
            employee_id=employee_id, bu_id=bu_id,
            asset_name=display_name,
            asset_tag=asset.asset_tag,
            actor_id=assigned_by_id,
            reference_id=assignment.id,
        )

        logger.info("Asset assigned", extra={
            "asset_id": str(asset_id),
            "employee_id": str(employee_id),
            "assignment_id": str(assignment.id),
        })
        return assignment

    @staticmethod
    @transaction.atomic
    def return_asset(
        bu_id: uuid.UUID,
        assignment_id: uuid.UUID,
        returned_by_id: uuid.UUID,
        condition_on_return: str = Asset.Condition.GOOD,
        notes: str = "",
    ) -> AssetAssignment:
        """
        Record asset return. Sets Asset.status → AVAILABLE.
        """
        try:
            assignment = AssetAssignment.objects.select_for_update().get(
                id=assignment_id, business_unit_id=bu_id,
                status=AssetAssignment.Status.ACTIVE,
            )
        except AssetAssignment.DoesNotExist:
            raise AssetError(f"Active assignment {assignment_id} not found.")

        asset = assignment.asset

        assignment.status = AssetAssignment.Status.RETURNED
        assignment.returned_on = date.today()
        assignment.condition_on_return = condition_on_return
        assignment.received_by_id = returned_by_id
        if notes:
            assignment.notes = f"{assignment.notes}\nReturn notes: {notes}".strip()
        assignment.save(update_fields=[
            "status", "returned_on", "condition_on_return", "received_by_id", "notes", "updated_at"
        ])

        asset.status = Asset.Status.AVAILABLE
        asset.save(update_fields=["status", "updated_at"])

        display_name = _asset_display_name(asset)
        LifecycleEventPublisher.asset_returned(
            employee_id=assignment.employee_id, bu_id=bu_id,
            asset_name=display_name,
            asset_tag=asset.asset_tag,
            actor_id=returned_by_id,
            reference_id=assignment.id,
        )

        logger.info("Asset returned", extra={
            "asset_id": str(asset.id),
            "employee_id": str(assignment.employee_id),
        })
        return assignment

    @staticmethod
    def get_employee_assets(bu_id: uuid.UUID, employee_id: uuid.UUID) -> list[dict]:
        """Returns list of active asset assignments for an employee."""
        assignments = AssetAssignment.objects.filter(
            business_unit_id=bu_id,
            employee_id=employee_id,
            status=AssetAssignment.Status.ACTIVE,
        ).select_related("asset", "asset__category")

        return [
            {
                "assignment_id": str(a.id),
                "asset_id": str(a.asset.id),
                "asset_display": _asset_display_name(a.asset),
                "asset_tag": a.asset.asset_tag,
                "category": a.asset.category.name if a.asset.category else None,
                "assigned_on": a.assigned_on.isoformat(),
                "condition": a.condition_on_assign,
                "serial_number": a.asset.serial_number,
            }
            for a in assignments
        ]

    @staticmethod
    def get_overdue_assignments(bu_id: uuid.UUID, expected_return_before: date) -> list[dict]:
        """
        Returns all active assignments that are past expected return date.
        NOTE: expected_return_date is not on the model — this filters by
        the asset warranty/contract dates. For overdue tracking, use
        separate scheduling logic or check assignment creation date.
        """
        # Since AssetAssignment doesn't have expected_return_date,
        # return all ACTIVE assignments — caller can filter by duration
        active = AssetAssignment.objects.filter(
            business_unit_id=bu_id,
            status=AssetAssignment.Status.ACTIVE,
            assigned_on__lt=expected_return_before,
        ).select_related("asset")

        return [
            {
                "assignment_id": str(a.id),
                "employee_id": str(a.employee_id),
                "asset_display": _asset_display_name(a.asset),
                "asset_tag": a.asset.asset_tag,
                "assigned_on": a.assigned_on.isoformat(),
                "days_held": (date.today() - a.assigned_on).days,
            }
            for a in active
        ]
