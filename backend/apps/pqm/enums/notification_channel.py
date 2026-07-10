# yss_orbit\backend\apps\pqm\enums\notification_channel.py
from django.db import models


class NotificationChannel(models.TextChoices):
    EMAIL  = "email",  "Email"
    IN_APP = "in_app", "In-App"
