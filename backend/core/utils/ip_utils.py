def get_client_ip(request) -> str:
    """
    Get the client's IP address from the request object.
    Handles X-Forwarded-For headers if the app is behind a proxy.
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR', '')
    return ip
