# yss_orbit\backend\apps\appraisal\api\views\urls.py
from rest_framework import viewsets, permissions
from apps.appraisal.models.urls import Urls
from apps.appraisal.api.serializers.urls_serializer import UrlsSerializer

class UrlsViewSet(viewsets.ModelViewSet):
    queryset = Urls.objects.all()
    serializer_class = UrlsSerializer
    permission_classes = [permissions.IsAuthenticated]
