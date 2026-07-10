# yss_orbit\backend\apps\rbac\management\commands\seed_role_templates.py
"""
YSS Orbit — Seed Standard Role Templates

Idempotent command to populate the platform-level RoleTemplate catalogue.

WHAT THIS DOES:
  - Creates or updates each RoleTemplate (module_code + name is unique key).
  - Syncs permissions: adds missing ones, removes stale ones.
    → This is a FULL SYNC, not append-only.
  - Updates description if it has changed.

PREREQUISITE: Run `manage.py sync_rbac` first so Permission rows exist.

RUN ON EVERY DEPLOY (idempotent):
  python manage.py seed_role_templates
  python manage.py seed_role_templates --dry-run  # preview changes only
"""
import logging

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.iam.models.rbac_models import RoleTemplate, RoleTemplatePermission, Permission

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────────────
# CATALOGUE  (module_code must match RbacSubModule.code seeded by seed_rbac_modules)
# ──────────────────────────────────────────────────────────────────────────────
TEMPLATE_CATALOGUE = [
    # ── Category: Core HR (core_hr) ─────────────────────────────────────────────────
    {
        "module_code": "core_hr",
        "name": "HR Director",
        "description": "Full administrative access across the entire HR lifecycle, policies, and dashboards.",
        "permissions": [
            "hrms.employee.view", "hrms.employee.create", "hrms.employee.update", "hrms.employee.delete",
            "hrms.department.manage", "hrms.designation.manage", "hrms.shift.manage",
            "hrms.onboarding.manage", "hrms.offboarding.manage", "hrms.asset.manage", "hrms.team_data.view",
            "hrms.contract.manage", "hrms.document.manage", "hrms.benefit.manage", "hrms.policy.manage",
            "hrms.report.view", "hrms.dashboard.view"
        ],
    },
    {
        "module_code": "core_hr",
        "name": "HR Manager",
        "description": "Broad access to manage employees, contracts, onboarding, and team data.",
        "permissions": [
            "hrms.employee.view", "hrms.employee.create", "hrms.employee.update",
            "hrms.department.manage", "hrms.designation.manage", "hrms.shift.manage",
            "hrms.onboarding.manage", "hrms.offboarding.manage", "hrms.asset.manage", "hrms.team_data.view",
            "hrms.contract.manage", "hrms.document.manage", "hrms.benefit.manage", "hrms.report.view"
        ],
    },
    {
        "module_code": "core_hr",
        "name": "HR Business Partner",
        "description": "Strategic HR role focused on employee management and team data.",
        "permissions": [
            "hrms.employee.view", "hrms.employee.update", "hrms.team_data.view",
            "hrms.contract.manage", "hrms.report.view", "hrms.dashboard.view"
        ],
    },
    {
        "module_code": "core_hr",
        "name": "HR Operations Specialist",
        "description": "Focused on the logistics of HR: onboarding, offboarding, asset allocation, and documents.",
        "permissions": [
            "hrms.employee.view", "hrms.employee.create", "hrms.employee.update",
            "hrms.onboarding.manage", "hrms.offboarding.manage", "hrms.asset.manage", "hrms.document.manage"
        ],
    },
    {
        "module_code": "core_hr",
        "name": "Recruitment Specialist",
        "description": "Specialized role for managing new hires and onboarding flows.",
        "permissions": [
            "hrms.employee.view", "hrms.onboarding.manage", "hrms.document.manage"
        ],
    },
    {
        "module_code": "core_hr",
        "name": "Onboarding Specialist",
        "description": "Manages onboarding flows and initial employee document collection.",
        "permissions": [
            "hrms.employee.view", "hrms.onboarding.manage", "hrms.document.manage", "hrms.asset.manage"
        ],
    },
    {
        "module_code": "core_hr",
        "name": "Compensation & Benefits Specialist",
        "description": "Manages employee benefits, contracts, and compensation-related employee data.",
        "permissions": [
            "hrms.employee.view", "hrms.benefit.manage", "hrms.contract.manage"
        ],
    },
    {
        "module_code": "core_hr",
        "name": "HR Auditor",
        "description": "Read-only access to all employee data, team data, and reports for auditing.",
        "permissions": [
            "hrms.employee.view", "hrms.team_data.view", "hrms.report.view", "hrms.dashboard.view"
        ],
    },

    # ── Category: Payroll (payroll) ─────────────────────────────────────────────────
    {
        "module_code": "payroll",
        "name": "Payroll Director",
        "description": "Full access to the payroll lifecycle, structures, compliance, and final execution.",
        "permissions": [
            "payroll.run.view", "payroll.run.execute", "payroll.structure.manage", "payroll.payslip.view",
            "payroll.tax.manage", "payroll.report.view", "payroll.compliance.view", "payroll.loan.manage",
            "payroll.expense.manage", "payroll.dashboard.view", "payroll.advance.manage", "payroll.bonus.manage"
        ],
    },
    {
        "module_code": "payroll",
        "name": "Payroll Manager",
        "description": "Manages payroll structures, runs, and oversees team processes.",
        "permissions": [
            "payroll.run.view", "payroll.run.execute", "payroll.structure.manage", "payroll.payslip.view",
            "payroll.tax.manage", "payroll.report.view", "payroll.compliance.view", "payroll.bonus.manage"
        ],
    },
    {
        "module_code": "payroll",
        "name": "Payroll Specialist",
        "description": "Executes payroll runs, manages day-to-day advances, expenses, and loans.",
        "permissions": [
            "payroll.run.view", "payroll.run.execute", "payroll.payslip.view",
            "payroll.loan.manage", "payroll.expense.manage", "payroll.advance.manage", "payroll.bonus.manage"
        ],
    },
    {
        "module_code": "payroll",
        "name": "Payroll Processor",
        "description": "Standard processing role for data entry and pre-payroll validation.",
        "permissions": [
            "payroll.run.view", "payroll.payslip.view", "payroll.expense.manage", "payroll.advance.manage"
        ],
    },
    {
        "module_code": "payroll",
        "name": "Tax Officer",
        "description": "Specialized access to manage tax declarations.",
        "permissions": [
            "payroll.payslip.view", "payroll.tax.manage", "payroll.compliance.view", "payroll.report.view"
        ],
    },
    {
        "module_code": "payroll",
        "name": "Compliance Officer",
        "description": "Monitors payroll compliance and statutory reporting.",
        "permissions": [
            "payroll.compliance.view", "payroll.report.view", "payroll.dashboard.view"
        ],
    },
    {
        "module_code": "payroll",
        "name": "Payroll Auditor",
        "description": "View-only access to payroll runs, payslips, and compliance reports for financial auditing.",
        "permissions": [
            "payroll.run.view", "payroll.payslip.view", "payroll.report.view", "payroll.compliance.view", "payroll.dashboard.view"
        ],
    },

    # ── Category: Attendance (attendance) ──────────────────────────────────────────────
    {
        "module_code": "attendance",
        "name": "Attendance Manager",
        "description": "Full access to shift rosters, biometric devices, and final approval of regularizations.",
        "permissions": [
            "attendance.dashboard.view", "attendance.log.view", "attendance.log.update",
            "attendance.device.manage", "attendance.shift_roster.manage",
            "attendance.regularization.approve", "attendance.report.view"
        ],
    },
    {
        "module_code": "attendance",
        "name": "Attendance Supervisor",
        "description": "Capable of managing rosters, correcting logs, and approving team regularizations.",
        "permissions": [
            "attendance.dashboard.view", "attendance.log.view", "attendance.log.update",
            "attendance.shift_roster.manage", "attendance.regularization.approve"
        ],
    },
    {
        "module_code": "attendance",
        "name": "Shift Manager",
        "description": "Manages shift rosters and daily attendance exceptions.",
        "permissions": [
            "attendance.log.view", "attendance.shift_roster.manage", "attendance.regularization.approve"
        ],
    },
    {
        "module_code": "attendance",
        "name": "Biometric Administrator",
        "description": "Manages hardware biometric devices and synchronizes punch logs.",
        "permissions": [
            "attendance.log.view", "attendance.device.manage"
        ],
    },

    # ── Category: Leave (leave) ───────────────────────────────────────────────────
    {
        "module_code": "leave",
        "name": "Leave Administrator",
        "description": "Configures company policies, holiday calendars, and manages overall balances.",
        "permissions": [
            "leave.dashboard.view", "leave.request.view", "leave.request.approve",
            "leave.balance.manage", "leave.policy.manage", "leave.holiday.manage", "leave.report.view"
        ],
    },
    {
        "module_code": "leave",
        "name": "Leave Manager",
        "description": "Manages leave operations and policy compliance.",
        "permissions": [
            "leave.dashboard.view", "leave.request.view", "leave.request.approve",
            "leave.balance.manage", "leave.report.view"
        ],
    },
    {
        "module_code": "leave",
        "name": "Leave Approver",
        "description": "Dedicated role for viewing team balances and approving/rejecting leave requests.",
        "permissions": [
            "leave.dashboard.view", "leave.request.view", "leave.request.approve"
        ],
    },
    {
        "module_code": "leave",
        "name": "Employee Self Service",
        "description": "Standard role for employees to view balances and submit leave requests.",
        "permissions": [
            "leave.dashboard.view", "leave.request.view", "leave.request.create"
        ],
    },

    # ── Category: Appraisal (appraisal) ───────────────────────────────────────────────
    {
        "module_code": "appraisal",
        "name": "Performance Director",
        "description": "Controls appraisal cycles, templates, overarching goals, and reports.",
        "permissions": [
            "appraisal.cycle.manage", "appraisal.review.view", "appraisal.review.submit",
            "appraisal.template.manage", "appraisal.goal.manage", "appraisal.report.view",
            "appraisal.feedback.submit"
        ],
    },
    {
        "module_code": "appraisal",
        "name": "Performance Manager",
        "description": "Manages appraisal cycles and templates.",
        "permissions": [
            "appraisal.cycle.manage", "appraisal.review.view", "appraisal.template.manage", "appraisal.report.view"
        ],
    },
    {
        "module_code": "appraisal",
        "name": "Reviewer",
        "description": "Manages team goals and submits manager-level reviews.",
        "permissions": [
            "appraisal.review.view", "appraisal.review.submit", "appraisal.goal.manage", "appraisal.feedback.submit"
        ],
    },
    {
        "module_code": "appraisal",
        "name": "Employee Participant",
        "description": "Standard access to submit self-reviews and continuous feedback.",
        "permissions": [
            "appraisal.review.view", "appraisal.review.submit", "appraisal.feedback.submit"
        ],
    },

    # ── Category: Recruitment (recruitment) ─────────────────────────────────────────
    {
        "module_code": "recruitment",
        "name": "Recruitment Director",
        "description": "Full access to recruitment strategy, reports, and senior hiring processes.",
        "permissions": [
            "recruitment.job.manage", "recruitment.candidate.manage", "recruitment.interview.manage",
            "recruitment.offer.manage", "recruitment.report.view"
        ],
    },
    {
        "module_code": "recruitment",
        "name": "Recruitment Manager",
        "description": "Manages job postings, hiring workflows, and offers.",
        "permissions": [
            "recruitment.job.manage", "recruitment.candidate.manage", "recruitment.interview.manage",
            "recruitment.offer.manage", "recruitment.report.view"
        ],
    },
    {
        "module_code": "recruitment",
        "name": "Recruiter",
        "description": "Daily operations for sourcing, screening, and managing candidates.",
        "permissions": [
            "recruitment.job.manage", "recruitment.candidate.manage", "recruitment.interview.manage"
        ],
    },
    {
        "module_code": "recruitment",
        "name": "Interviewer",
        "description": "Access to view candidate profiles and submit interview feedback.",
        "permissions": [
            "recruitment.candidate.manage", "recruitment.interview.manage"
        ],
    },
    {
        "module_code": "recruitment",
        "name": "Hiring Coordinator",
        "description": "Coordinates interview schedules and handles logistical candidate tracking.",
        "permissions": [
            "recruitment.candidate.manage", "recruitment.interview.manage"
        ],
    },
    {
        "module_code": "recruitment",
        "name": "Recruitment Auditor",
        "description": "Read-only access to recruitment pipelines and reports.",
        "permissions": [
            "recruitment.report.view", "recruitment.job.manage"
        ],
    },
]


class Command(BaseCommand):
    help = (
        "Seeds standard enterprise Role Templates (idempotent). "
        "Run after sync_rbac. Syncs permissions — both adds and removes."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Print what would change without writing to the database.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        dry_run = options["dry_run"]

        # Pre-load all active permissions keyed by code for O(1) lookup.
        all_perms = {
            p.code: p
            for p in Permission.objects.filter(is_active=True)
        }

        created_count = 0
        updated_count = 0
        permission_adds = 0
        permission_removes = 0

        for entry in TEMPLATE_CATALOGUE:
            module_code = entry["module_code"]
            name = entry["name"]
            description = entry.get("description", "")
            permission_codes = entry.get("permissions", [])

            template, was_created = RoleTemplate.objects.get_or_create(
                module_code=module_code,
                name=name,
                defaults={"description": description},
            )

            needs_save = False
            if was_created:
                created_count += 1
            else:
                # Update description if it drifted.
                if template.description != description:
                    template.description = description
                    needs_save = True
                updated_count += 1

            if needs_save and not dry_run:
                template.save(update_fields=["description"])

            # Resolve permission codes → Permission objects.
            target_perms = {
                all_perms[code]
                for code in permission_codes
                if code in all_perms
            }
            missing_codes = [c for c in permission_codes if c not in all_perms]
            if missing_codes:
                self.stdout.write(
                    self.style.WARNING(
                        f"  [{name}] Missing permissions (run sync_rbac first): "
                        + ", ".join(missing_codes)
                    )
                )

            # Sync: full replace — compute add/remove sets.
            current_perms = set(template.permissions.all())
            to_add = target_perms - current_perms
            to_remove = current_perms - target_perms

            permission_adds += len(to_add)
            permission_removes += len(to_remove)

            if not dry_run:
                if to_remove:
                    RoleTemplatePermission.objects.filter(
                        template=template,
                        permission__in=to_remove,
                    ).delete()
                if to_add:
                    RoleTemplatePermission.objects.bulk_create([
                        RoleTemplatePermission(template=template, permission=perm)
                        for perm in to_add
                    ])

            action_label = "CREATED" if was_created else "SYNCED"
            perm_note = f"+{len(to_add)}/-{len(to_remove)} permissions"
            self.stdout.write(
                self.style.SUCCESS(f"  [{action_label}] {module_code} / {name}  ({perm_note})")
            )

        if dry_run:
            transaction.set_rollback(True)

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone: {created_count} created, {updated_count} updated, "
                f"{permission_adds} permission grants added, "
                f"{permission_removes} stale permission grants removed."
                + (" (DRY RUN — no changes committed)" if dry_run else "")
            )
        )
