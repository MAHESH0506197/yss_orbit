# yss_orbit\backend\apps\pqm\services\migration_service.py
"""Legacy data migration — Excel/CSV import with LEGACY series numbering."""
from __future__ import annotations

import uuid
import logging
from typing import Any

from apps.pqm.enums import NCStatus, NCSeries

logger = logging.getLogger(__name__)


class MigrationService:

    @staticmethod
    def import_legacy_batch(
        rows: list[dict[str, Any]],
        organization_id: uuid.UUID,
        bu_id: uuid.UUID,
        actor_id: uuid.UUID,
        org_code: str = "NC",
    ) -> dict:
        """
        Import a list of row-dicts as legacy NCs.
        Returns: {'loaded': N, 'rejected': M, 'rejected_rows': [{'row': i, 'reason': str}]}
        """
        from apps.pqm.models import NonConformance, PQMProject, PQMSite
        from apps.pqm.services.numbering_service import NumberingService

        loaded = 0
        rejected_rows = []

        for idx, row in enumerate(rows, start=1):
            try:
                # Resolve project / site
                project = MigrationService._resolve_project(row, organization_id, bu_id)
                site = MigrationService._resolve_site(row, project)

                nc = NonConformance(
                    organization_id=organization_id,
                    business_unit_id=bu_id,
                    project=project,
                    title=row.get("title", "Legacy NC"),
                    description=row.get("description", ""),
                    status=NCStatus.CLOSED,  # legacy records are typically closed
                    is_migrated=True,
                    legacy_reference=row.get("legacy_reference", f"LEGACY-ROW-{idx}"),
                    series=NCSeries.LEGACY,
                    raised_by_id=actor_id,
                    created_by_id=actor_id,
                )

                nc.nc_number = NumberingService.generate_nc_number(
                    project,
                    series=NCSeries.LEGACY,
                )
                nc.save()
                loaded += 1

            except Exception as exc:
                logger.warning("Legacy import row %d failed: %s", idx, exc)
                rejected_rows.append({"row": idx, "reason": str(exc)})

        return {
            "loaded": loaded,
            "rejected": len(rejected_rows),
            "rejected_rows": rejected_rows,
            "total_rows": len(rows),
        }

    @staticmethod
    def _resolve_project(row: dict, organization_id: uuid.UUID, bu_id: uuid.UUID):
        from apps.pqm.models import PQMProject
        project_name = row.get("project_name", "Legacy Project")
        project, _ = PQMProject.objects.get_or_create(
            organization_id=organization_id,
            business_unit_id=bu_id,
            name=project_name,
            defaults={"code": project_name[:30], "is_active": True},
        )
        return project

    @staticmethod
    def _resolve_site(row: dict, project):
        from apps.pqm.models import PQMSite
        site_name = row.get("site_name", "Legacy Site")
        site, _ = PQMSite.objects.get_or_create(
            organization_id=project.organization_id,
            business_unit_id=project.business_unit_id,
            project=project,
            name=site_name,
            defaults={"code": site_name[:30], "is_active": True},
        )
        return site
