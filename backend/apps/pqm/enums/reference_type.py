from django.db import models

class ReferenceType(models.TextChoices):
    DRAWING       = "Drawing",       "Drawing"
    DOCUMENT      = "Document",      "Document"
    SPECIFICATION = "Specification", "Specification"
    OTHER         = "Other",         "Other"
