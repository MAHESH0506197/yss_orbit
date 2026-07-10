import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)

class EmailNotificationService:
    """
    Handles sending emails via Django's configured EmailBackend.
    Automatically routes to console in dev and SMTP in production.
    """
    @staticmethod
    def send_email(to_address: str, subject: str, html_body: str) -> bool:
        logger.info(f"Sending email to {to_address} with subject: {subject}")
        try:
            send_mail(
                subject=subject,
                message=html_body,  # Plain text fallback
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@yssorbit.com'),
                recipient_list=[to_address],
                html_message=html_body,
                fail_silently=False,
            )
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to_address}: {e}")
            return False
