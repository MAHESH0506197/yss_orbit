# yss_orbit\backend\apps\notification\tasks\notification_tasks.py
from celery import shared_task
from apps.platform.services.notification_service import NotificationService
import logging

logger = logging.getLogger(__name__)

@shared_task(name="notification.dispatch_async")
def dispatch_notification_async(notification_id: str):
    """
    Celery task to dispatch notifications asynchronously without blocking the main thread.
    """
    logger.info(f"Async dispatch for notification {notification_id}")
    NotificationService.dispatch_notification(notification_id)

@shared_task(name="notification.send_otp")
def send_otp_notification(user_id: str, otp: str, email: str, purpose: str, correlation_id: str, username: str = "User"):
    """
    Sends an OTP email to the user for a specific purpose.
    """
    from apps.platform.services.email_notification_service import EmailNotificationService
    
    subject = f"Your OTP for {purpose}"
    body = f"""
    Hello {username},

    You have requested an OTP for the following purpose: {purpose}.

    Your OTP is: {otp}

    If you did not request this, please ignore this email.
    """
    
    # In development, it logs to terminal. In prod, it sends a real email.
    logger.info(f"--- EMAIL DISPATCH ---")
    logger.info(f"To: {email}")
    logger.info(f"Subject: {subject}")
    logger.info(f"Body: {body}")
    logger.info(f"----------------------")

    EmailNotificationService.send_email(to_address=email, subject=subject, html_body=f"<pre>{body}</pre>")

