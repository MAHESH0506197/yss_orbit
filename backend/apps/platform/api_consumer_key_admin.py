# yss_orbit\backend\apps\api_consumer_key\admin.py
from django.contrib import admin
from apps.platform.models.api_consumer_key import APIConsumerKey

@admin.register(APIConsumerKey)
class APIConsumerKeyAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'key_prefix', 'is_active', 'user_id', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'key_prefix', 'user_id')
    readonly_fields = ('key_prefix', 'hashed_key')
