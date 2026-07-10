# yss_orbit\backend\apps\notification\services\notification_template_service.py
from apps.platform.models.notification_template_model import NotificationTemplate
from django.template import Context, Template
import logging

logger = logging.getLogger(__name__)

class NotificationTemplateService:
    """
    Renders dynamic notification templates with context variables.
    """
    @staticmethod
    def render_template(template_name: str, context_data: dict) -> tuple[str, str]:
        """
        Returns (subject, body)
        """
        try:
            template_obj = NotificationTemplate.objects.get(name=template_name)
            
            subject_tpl = Template(template_obj.subject_template or "")
            body_tpl = Template(template_obj.body_template)
            
            context = Context(context_data)
            
            subject = subject_tpl.render(context)
            body = body_tpl.render(context)
            
            return subject, body
        except NotificationTemplate.DoesNotExist:
            logger.error(f"Notification Template '{template_name}' not found.")
            return "", ""
