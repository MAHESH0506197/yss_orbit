from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from apps.platform.services.email_service import EmailService

User = get_user_model()

@receiver(post_save, sender=User)
def user_post_save(sender, instance, created, **kwargs):
    if created:
        EmailService.send_welcome_email(
            user_email=instance.email,
            first_name=instance.first_name
        )
    else:
        # Check if critical details changed. Since we can't easily check what fields changed
        # in post_save without tracking them, a simple approach is:
        # if update_fields is passed and contains critical fields.
        # But generally, signals without tracking old state are hard for 'profile updated'.
        # We'll trigger it if update_fields has 'first_name', 'last_name', etc. or just leave it for now
        # and send it if we detect changes to critical fields if update_fields is passed.
        update_fields = kwargs.get('update_fields')
        if update_fields:
            critical_fields = {'first_name', 'last_name', 'email', 'username'}
            if critical_fields.intersection(set(update_fields)):
                EmailService.send_profile_updated_email(
                    user_email=instance.email,
                    first_name=instance.first_name
                )
