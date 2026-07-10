# yss_orbit\backend\core\responses\response_codes.py
class ResponseCode:
    """
    Standard Application Response Codes.
    These codes provide a consistent way for clients to identify
    the exact type of response/error programmatically.
    """
    # Success
    SUCCESS = "SUCCESS"
    CREATED = "CREATED"
    ACCEPTED = "ACCEPTED"
    NO_CONTENT = "NO_CONTENT"
    
    # Client Errors
    BAD_REQUEST = "BAD_REQUEST"
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    NOT_FOUND = "NOT_FOUND"
    METHOD_NOT_ALLOWED = "METHOD_NOT_ALLOWED"
    CONFLICT = "CONFLICT"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    UNPROCESSABLE_ENTITY = "UNPROCESSABLE_ENTITY"
    TOO_MANY_REQUESTS = "TOO_MANY_REQUESTS"
    
    # Server Errors
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"
    NOT_IMPLEMENTED = "NOT_IMPLEMENTED"
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
