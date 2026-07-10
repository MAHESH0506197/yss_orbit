import logging
from celery import shared_task
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def send_security_email_task(self, template_name, subject, recipient_email, context):
    """
    Asynchronously render an HTML email template and send it.
    """
    try:
        html_message = render_to_string(f'emails/{template_name}', context)
        plain_message = strip_tags(html_message)
        
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient_email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"Successfully sent {template_name} email to {recipient_email}")
        return True
    except Exception as exc:
        logger.error(f"Failed to send email to {recipient_email}: {exc}")
        self.retry(exc=exc, countdown=60)


class EmailService:
    @staticmethod
    def _dispatch_task(template_name, subject, recipient_email, context):
        try:
            send_security_email_task.delay(
                template_name=template_name,
                subject=subject,
                recipient_email=recipient_email,
                context=context
            )
        except Exception as e:
            logger.error(f"Failed to dispatch email task to Celery: {e}")
            # If the broker is down (e.g. locally), we catch the exception so the API doesn't 500.
            # In a strict production setup, you could fallback to sync `send_security_email_task(...)` here.

    @staticmethod
    def send_welcome_email(user_email, first_name):
        context = {'user': {'first_name': first_name}}
        EmailService._dispatch_task(
            template_name='welcome.html',
            subject='Welcome to YSS Orbit!',
            recipient_email=user_email,
            context=context
        )

    @staticmethod
    def send_profile_updated_email(user_email, first_name):
        context = {'user': {'first_name': first_name}}
        EmailService._dispatch_task(
            template_name='profile_updated.html',
            subject='Security Alert: Profile Updated',
            recipient_email=user_email,
            context=context
        )

    @staticmethod
    def send_email_verified_email(user_email, first_name):
        context = {'user': {'first_name': first_name}}
        EmailService._dispatch_task(
            template_name='email_verified.html',
            subject='Email Verified Successfully',
            recipient_email=user_email,
            context=context
        )

    @staticmethod
    def send_password_reset_alert(user_email, first_name):
        context = {'user': {'first_name': first_name}}
        EmailService._dispatch_task(
            template_name='password_reset_alert.html',
            subject='Security Alert: Password Changed',
            recipient_email=user_email,
            context=context
        )
