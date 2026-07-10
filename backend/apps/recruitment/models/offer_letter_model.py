# yss_orbit\backend\apps\recruitment\models\offer_letter_model.py
from django.db import models
from apps.platform.models.base import TenantModel

class OfferLetter(TenantModel):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'recruitment_offer_letter'
        verbose_name = 'OfferLetter'
        verbose_name_plural = 'OfferLetters'

    def __str__(self):
        return str(self.id)
