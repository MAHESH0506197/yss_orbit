# yss_orbit\backend\apps\webhook\services\webhook_delivery_service.py
import logging
import requests
import json
from django.db import transaction

logger = logging.getLogger(__name__)

class WebhookDeliveryService:
    def __init__(self, user=None):
        self.user = user

    def deliver_payload(self, endpoint_url: str, payload: dict, secret: str = None):
        logger.info(f"Delivering webhook payload to {endpoint_url}")
        headers = {'Content-Type': 'application/json'}
        if secret:
            import hmac
            import hashlib
            signature = hmac.new(secret.encode(), json.dumps(payload).encode(), hashlib.sha256).hexdigest()
            headers['X-Signature'] = signature
        
        try:
            response = requests.post(endpoint_url, json=payload, headers=headers, timeout=10)
            response.raise_for_status()
            logger.info("Webhook delivered successfully")
            return {"status": "success", "status_code": response.status_code}
        except requests.RequestException as e:
            logger.error(f"Failed to deliver webhook: {e}")
            return {"status": "failed", "error": str(e)}

    @transaction.atomic
    def process(self, data: dict):
        endpoint = data.get('endpoint')
        payload = data.get('payload', {})
        if not endpoint:
            return {"status": "error", "message": "No endpoint provided"}
        return self.deliver_payload(endpoint, payload)
