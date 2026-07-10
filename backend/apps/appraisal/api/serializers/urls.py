# yss_orbit\backend\apps\appraisal\api\serializers\urls.py
from rest_framework import serializers
from apps.appraisal.models.urls import Urls

class UrlsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Urls
        fields = '__all__'
