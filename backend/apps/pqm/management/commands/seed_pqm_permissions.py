# yss_orbit\backend\apps\pqm\management\commands\seed_pqm_permissions.py
"""
Management command: seed_pqm_permissions
Seeds all PQM RBAC permissions into the platform permission table.

Usage:
    python manage.py seed_pqm_permissions
    python manage.py seed_pqm_permissions --force-update
"""
from __future__ import annotations

from django.core.management.base import BaseCommand, CommandError

# ── Permission definitions ────────────────────────────────────────────────────
# Field mapping for apps.iam.models.rbac_models.Permission:
#   code, name, description, module, is_active
PQM_PERMISSIONS = [
    {"code": "pqm.view_nc",             "name": "View Non-Conformances",            "module": "pqm"},
    {"code": "pqm.create_nc",           "name": "Create Non-Conformance",           "module": "pqm"},
    {"code": "pqm.edit_nc",             "name": "Edit Non-Conformance",             "module": "pqm"},
    {"code": "pqm.submit_nc",           "name": "Submit Non-Conformance",           "module": "pqm"},
    {"code": "pqm.review_nc",           "name": "Review / Approve Submitted NC",    "module": "pqm"},
    {"code": "pqm.assign_nc",           "name": "Assign NC to Engineer",            "module": "pqm"},
    {"code": "pqm.update_nc_progress",  "name": "Start Work / Update NC Progress",  "module": "pqm"},
    {"code": "pqm.request_closure",     "name": "Request NC Closure",               "module": "pqm"},
    {"code": "pqm.verify_nc",           "name": "Verify and Approve NC Closure",    "module": "pqm"},
    {"code": "pqm.reopen_nc",           "name": "Reopen Closed NC",                 "module": "pqm"},
    {"code": "pqm.merge_nc",            "name": "Merge Duplicate NCs",              "module": "pqm"},
    {"code": "pqm.delete_nc",           "name": "Soft Delete NC (Draft only)",      "module": "pqm"},
    {"code": "pqm.upload_attachment",   "name": "Upload NC Attachments",            "module": "pqm"},
    {"code": "pqm.view_comments",       "name": "View NC Comments",                 "module": "pqm"},
    {"code": "pqm.comment_nc",          "name": "Post Comment on NC",               "module": "pqm"},
    {"code": "pqm.view_audit",          "name": "View NC Audit History / Timeline", "module": "pqm"},
    {"code": "pqm.view_dashboard",      "name": "View PQM Dashboard",               "module": "pqm"},
    {"code": "pqm.view_backcharge",     "name": "View Backcharge Information",      "module": "pqm"},
    {"code": "pqm.manage_backcharge",   "name": "Manage Backcharge Records",        "module": "pqm"},
    {"code": "pqm.manage_config",       "name": "Manage PQM Configuration",         "module": "pqm"},
    {"code": "pqm.export_report",       "name": "Export NC Reports",                "module": "pqm"},
    {"code": "pqm.run_legacy_import",   "name": "Run Legacy NC Import",             "module": "pqm"},
]

ALL_PQM_CODES = [p["code"] for p in PQM_PERMISSIONS]

# ── Role definitions ──────────────────────────────────────────────────────────
PQM_ROLES = {
    "PQM Site Engineer": [
        "pqm.view_nc", "pqm.create_nc", "pqm.edit_nc", "pqm.submit_nc",
        "pqm.upload_attachment", "pqm.view_comments", "pqm.comment_nc",
        "pqm.update_nc_progress", "pqm.request_closure", "pqm.view_dashboard",
    ],
    "PQM Site Incharge": [
        "pqm.view_nc", "pqm.create_nc", "pqm.edit_nc", "pqm.submit_nc",
        "pqm.review_nc", "pqm.assign_nc", "pqm.upload_attachment",
        "pqm.view_comments", "pqm.comment_nc", "pqm.update_nc_progress",
        "pqm.request_closure", "pqm.view_dashboard", "pqm.view_audit",
    ],
    "PQM Quality Incharge": [
        "pqm.view_nc", "pqm.create_nc", "pqm.edit_nc", "pqm.submit_nc",
        "pqm.review_nc", "pqm.assign_nc", "pqm.upload_attachment",
        "pqm.view_comments", "pqm.comment_nc", "pqm.update_nc_progress",
        "pqm.request_closure", "pqm.verify_nc", "pqm.view_dashboard",
        "pqm.view_audit", "pqm.export_report", "pqm.manage_backcharge",
        "pqm.view_backcharge",
    ],
    "PQM Project Manager": [
        "pqm.view_nc", "pqm.review_nc", "pqm.assign_nc", "pqm.verify_nc",
        "pqm.reopen_nc", "pqm.merge_nc", "pqm.view_comments",
        "pqm.view_dashboard", "pqm.view_audit", "pqm.export_report",
        "pqm.view_backcharge", "pqm.manage_backcharge",
    ],
    "PQM Administrator": ALL_PQM_CODES,
    "PQM External Client Auditor": [
        "pqm.view_nc", "pqm.view_dashboard",
    ],
}


class Command(BaseCommand):
    help = "Seed PQM RBAC permissions and default roles into the platform."

    def add_arguments(self, parser):
        parser.add_argument(
            "--force-update",
            action="store_true",
            help="Update existing permission names if they differ.",
        )

    def handle(self, *args, **options):
        force = options["force_update"]

        # ── Resolve Permission model ──────────────────────────────────────────
        Permission = self._get_model("iam", "Permission")
        if Permission is None:
            raise CommandError(
                "Cannot find apps.iam Permission model. "
                "Check apps/iam/models/rbac_models.py."
            )

        self.stdout.write(self.style.MIGRATE_HEADING("Seeding PQM permissions…"))
        created_count = updated_count = 0

        for perm in PQM_PERMISSIONS:
            obj, created = Permission.objects.get_or_create(
                code=perm["code"],
                defaults={
                    "name":    perm["name"],
                    "module":  perm["module"],
                    "is_active": True,
                },
            )
            if created:
                created_count += 1
                self.stdout.write(f"  [CREATE] {perm['code']}")
            elif force and obj.name != perm["name"]:
                obj.name = perm["name"]
                obj.save(update_fields=["name"])
                updated_count += 1
                self.stdout.write(f"  [UPDATE] {perm['code']}")

        self.stdout.write(
            self.style.SUCCESS(
                f"[OK] Permissions: {created_count} created, "
                f"{updated_count} updated, "
                f"{len(PQM_PERMISSIONS) - created_count - updated_count} unchanged."
            )
        )

        # ── Roles are BU-scoped in this platform ──────────────────────────────────
        # The rbac_roles table has a NOT NULL business_unit_id constraint,
        # meaning roles must be created per Business Unit — not globally.
        # To assign PQM roles to users:
        #   1. Log in as a super admin
        #   2. Go to Platform > Roles Management
        #   3. Create roles (PQM Site Engineer, PQM Quality Incharge, etc.)
        #      for each Business Unit that uses PQM
        #   4. Assign the PQM permissions defined above to each role
        #
        # The 22 PQM permissions are now available in the Permissions Registry.
        self.stdout.write(
            self.style.WARNING(
                "\n[SKIP] Role seeding skipped: Roles require business_unit_id "
                "(BU-scoped). Create PQM roles per-BU via Platform > Roles Management."
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                "\n[OK] PQM seed complete. 22 permissions ready in Permissions Registry."
            )
        )

    @staticmethod
    def _get_model(app_label: str, model_name: str):
        try:
            from django.apps import apps
            return apps.get_model(app_label, model_name)
        except (LookupError, Exception):
            return None
