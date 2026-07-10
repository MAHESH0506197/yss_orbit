# yss_orbit\backend\apps\pqm\enums\severity.py
from django.db import models


class Severity(models.TextChoices):
    MAJOR       = "Major",       "Major"
    MINOR       = "Minor",       "Minor"
