import logging
import json

logger = logging.getLogger(__name__)

class LogFailedRequestsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # We need to read the body now because it might be consumed by the view
        body = b""
        if request.body:
            body = request.body
            
        response = self.get_response(request)
        
        if response.status_code >= 400:
            try:
                with open("c:\\PROJECT\\yss_orbit\\backend\\scratch\\failed_requests.log", "a") as f:
                    f.write(f"--- FAILED REQUEST: {request.method} {request.path} ---\n")
                    f.write(f"Status: {response.status_code}\n")
                    f.write(f"Body: {body.decode('utf-8')}\n")
                    f.write(f"Response: {response.content.decode('utf-8')}\n")
                    f.write("-" * 50 + "\n")
            except Exception as e:
                pass
                
        return response
