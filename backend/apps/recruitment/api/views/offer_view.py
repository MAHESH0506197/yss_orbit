# yss_orbit\backend\apps\recruitment\api\views\offer_view.py
from rest_framework import viewsets, permissions
from apps.recruitment.models.offer import Offer
from apps.recruitment.api.serializers.offer_serializer import OfferSerializer

class OfferViewSet(viewsets.ModelViewSet):
    queryset = Offer.objects.all()
    serializer_class = OfferSerializer
    permission_classes = [permissions.IsAuthenticated]
