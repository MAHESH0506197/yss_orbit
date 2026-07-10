from django.contrib import admin
from .models import FeatureFlag

@admin.register(FeatureFlag)
class FeatureFlagAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'is_active', 'is_enabled_globally', 'rollout_percentage')
    search_fields = ('code', 'name')
    list_filter = ('is_active', 'is_enabled_globally')
