# Generated manually for Enterprise Audit rebuild
# Q3 approval: OrganizationSettings converted to BaseModel with UUID PK
# PostgreSQL cannot cast bigint to uuid directly — we must drop+recreate the settings table.
# Existing OrganizationSettings data is auto-provisioned when needed (get_or_create),
# so data loss is acceptable and expected.

import uuid
from django.db import migrations, models


def drop_org_settings_table(apps, schema_editor):
    if schema_editor.connection.vendor == 'postgresql':
        schema_editor.execute("DROP TABLE IF EXISTS organization_settings CASCADE;")
    else:
        schema_editor.execute("DROP TABLE IF EXISTS organization_settings;")

class Migration(migrations.Migration):

    dependencies = [
        ("organization", "0003_remove_businessdomain_slug"),
    ]

    operations = [
        # ── Organization model changes ──────────────────────────────────────────
        migrations.RemoveIndex(
            model_name="organization",
            name="org_slug_idx",
        ),
        migrations.RemoveField(
            model_name="organization",
            name="slug",
        ),
        migrations.AddField(
            model_name="organization",
            name="restored_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="organization",
            name="restored_by_id",
            field=models.UUIDField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="organization",
            name="email",
            field=models.EmailField(blank=True, db_index=True, default="", max_length=254),
        ),
        migrations.AlterField(
            model_name="organization",
            name="owner_id",
            field=models.UUIDField(blank=True, db_index=True, null=True),
        ),
        migrations.AddIndex(
            model_name="organization",
            index=models.Index(
                fields=["business_domain_id", "is_active"], name="org_domain_active_idx"
            ),
        ),

        # ── OrganizationSettings: drop and recreate with UUID PK + BaseModel fields ──
        # PostgreSQL cannot cast bigint→uuid with ALTER COLUMN. Drop the table and
        # recreate it. OrganizationSettings is auto-provisioned via get_or_create,
        # so existing rows will be re-created on first access.
        migrations.RunPython(
            drop_org_settings_table,
            reverse_code=migrations.RunPython.noop
        ),
        migrations.CreateModel(
            name="OrganizationSettings",
            fields=[
                ("id",              models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, db_index=True, serialize=False)),
                ("is_active",       models.BooleanField(default=True, db_index=True)),
                ("is_deleted",      models.BooleanField(default=False, db_index=True)),
                ("deleted_at",      models.DateTimeField(blank=True, null=True)),
                ("deleted_by_id",   models.UUIDField(blank=True, null=True)),
                ("created_at",      models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at",      models.DateTimeField(auto_now=True)),
                ("created_by_id",   models.UUIDField(blank=True, null=True)),
                ("updated_by_id",   models.UUIDField(blank=True, null=True)),
                ("organization",    models.OneToOneField(
                    on_delete=models.CASCADE,
                    related_name="settings",
                    to="organization.organization",
                )),
                ("theme_color",     models.CharField(default="#6366F1", help_text="Primary hex color (e.g. #6366F1)", max_length=7)),
                ("favicon_url",     models.URLField(blank=True, max_length=500, null=True)),
                ("require_mfa",     models.BooleanField(default=False)),
                ("session_timeout_minutes", models.IntegerField(default=60)),
                ("allowed_ip_ranges",       models.JSONField(blank=True, default=list)),
                ("enable_audit_log",        models.BooleanField(default=True)),
                ("enable_api_access",       models.BooleanField(default=False)),
                ("max_users",               models.IntegerField(blank=True, null=True, help_text="Null = unlimited")),
                ("notify_on_login",         models.BooleanField(default=False)),
                ("notify_on_data_export",   models.BooleanField(default=True)),
            ],
            options={
                "verbose_name": "Organization Settings",
                "verbose_name_plural": "Organization Settings",
                "db_table": "organization_settings",
            },
        ),
    ]
