from django.apps import AppConfig


class OrganizationsConfig(AppConfig):
    name = "apps.organization"
    verbose_name = "Organizations"
    default_auto_field = "django.db.models.BigAutoField"

    def ready(self):
        import apps.organization.events.event_handlers  # noqa: F401  register signals
