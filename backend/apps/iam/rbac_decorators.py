# yss_orbit\backend\apps\rbac\decorators.py
from functools import wraps
from typing import Any, Callable
from rest_framework.request import Request
from django.http import HttpRequest
from apps.platform.core_exceptions import PermissionDeniedException

def requires_permission(permission_code: str) -> Callable:
    """
    Decorator for views or methods to enforce a specific RBAC permission.
    Raises PermissionDeniedException if the user lacks the permission.
    """
    def decorator(view_func: Callable[..., Any]) -> Callable[..., Any]:
        @wraps(view_func)
        def _wrapped_view(*args: Any, **kwargs: Any) -> Any:
            req = None
            # Search positional args for Request/HttpRequest
            for arg in args:
                if isinstance(arg, (Request, HttpRequest)):
                    req = arg
                    break
            # Search keyword args
            if req is None:
                for val in kwargs.values():
                    if isinstance(val, (Request, HttpRequest)):
                        req = val
                        break

            if req is None:
                raise RuntimeError(
                    "@requires_permission decorated function must have a Request or HttpRequest argument."
                )

            ctx = getattr(req, "security_context", None)
            if ctx is None:
                raise PermissionDeniedException(
                    message="Authentication is required.",
                    details={"required_permission": permission_code},
                )

            ctx.require_permission(permission_code)
            return view_func(*args, **kwargs)
        return _wrapped_view
    return decorator
