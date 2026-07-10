# yss_orbit\backend\apps\reporting\api\serializers\urls.py
from rest_framework import serializers
from apps.observability.models.urls import Urls

class UrlsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Urls
        fields = '__all__'
