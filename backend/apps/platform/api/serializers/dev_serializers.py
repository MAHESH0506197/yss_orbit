from rest_framework import serializers
from apps.platform.models import WebhookEndpoint, WebhookDelivery

class WebhookEndpointSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebhookEndpoint
        fields = '__all__'
        extra_kwargs = {
            'secret': {'write_only': True}
        }

class WebhookDeliverySerializer(serializers.ModelSerializer):
    class Meta:
        model = WebhookDelivery
        fields = '__all__'
