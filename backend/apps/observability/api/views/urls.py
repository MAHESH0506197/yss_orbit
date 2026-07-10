# yss_orbit\backend\apps\reporting\api\views\urls.py
from rest_framework import viewsets, permissions
from apps.observability.models.urls import Urls
from apps.observability.api.serializers.urls_serializer import UrlsSerializer

class UrlsViewSet(viewsets.ModelViewSet):
    queryset = Urls.objects.all()
    serializer_class = UrlsSerializer
    permission_classes = [permissions.IsAuthenticated]
