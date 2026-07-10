import threading

_thread_locals = threading.local()

def get_current_user():
    return getattr(_thread_locals, 'user', None)

def get_current_ip():
    return getattr(_thread_locals, 'ip_address', None)

def get_current_tenant_id():
    return getattr(_thread_locals, 'tenant_id', None)

class AuditMiddleware:
    """
    Middleware to capture request context (User, IP, Tenant) into thread-local storage 
    for use by the AuditableModel mixin.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Capture context
        _thread_locals.user = getattr(request, 'user', None)
        _thread_locals.ip_address = self.get_client_ip(request)
        _thread_locals.tenant_id = getattr(request, 'tenant_id', None)

        response = self.get_response(request)

        # Cleanup
        if hasattr(_thread_locals, 'user'):
            del _thread_locals.user
        if hasattr(_thread_locals, 'ip_address'):
            del _thread_locals.ip_address
        if hasattr(_thread_locals, 'tenant_id'):
            del _thread_locals.tenant_id

        return response

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
