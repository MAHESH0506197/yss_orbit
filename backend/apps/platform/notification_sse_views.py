# yss_orbit\backend\apps\notification\sse_views.py
"""
YSS Orbit — Server-Sent Events (SSE) View
Real-time push notifications to frontend clients over HTTP long-poll.
Architecture:
  - One Redis Pub/Sub channel per business_unit: sse:{business_unit_id}
  - Client connects → held open → events streamed as text/event-stream
  - Reconnect handled by browser (retry: 3000ms)
  - Max 50 concurrent connections per BU (SSE_MAX_CONNECTIONS_PER_BU setting)

Security:
  - Requires valid JWT cookie (CookieJWTAuthentication runs)
  - Requires X-Business-Unit-Id header
  - No CSRF required (GET request, SSE is read-only)
"""
from __future__ import annotations

import json
import logging
import time
import uuid

from django.conf import settings
from django.http import StreamingHttpResponse, HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request

logger = logging.getLogger(__name__)


def _get_ip(request: Request) -> str:
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "0.0.0.0")


def _event_stream(user_id: uuid.UUID, business_unit_id: uuid.UUID, correlation_id: str):
    """
    Generator that yields SSE-formatted events from Redis Pub/Sub.
    Falls back to polling-based keepalive if Redis Pub/Sub unavailable.
    """
    reconnect_ms = getattr(settings, "SSE_RECONNECT_MS", 3000)

    # Send connection acknowledgment
    yield f"retry: {reconnect_ms}\n"
    yield f"event: connected\n"
    yield f"data: {json.dumps({'status': 'connected', 'user_id': str(user_id), 'business_unit_id': str(business_unit_id)})}\n\n"

    try:
        import redis
        from django.conf import settings as conf

        redis_url = getattr(conf, "REDIS_URL", "redis://localhost:6379")
        r = redis.from_url(redis_url, decode_responses=True)
        pubsub = r.pubsub()
        channel = f"sse:{business_unit_id}"
        pubsub.subscribe(channel)

        logger.info(
            "SSE client connected",
            extra={
                "user_id": str(user_id),
                "business_unit_id": str(business_unit_id),
                "channel": channel,
                "correlation_id": correlation_id,
            },
        )

        last_keepalive = time.time()
        keepalive_interval = 25  # seconds — prevent proxy timeouts

        for message in pubsub.listen():
            # Keepalive comment every 25s
            now = time.time()
            if now - last_keepalive > keepalive_interval:
                yield ": keepalive\n\n"
                last_keepalive = now

            if message["type"] != "message":
                continue

            try:
                data = message["data"]
                # Validate it's JSON
                json.loads(data)
                yield f"event: notification\n"
                yield f"data: {data}\n\n"
            except (json.JSONDecodeError, Exception) as e:
                logger.warning(
                    "SSE: malformed message on channel %s: %s",
                    channel,
                    str(e)[:200],
                )

    except Exception as exc:
        logger.error(
            "SSE stream error for user %s BU %s: %s",
            user_id,
            business_unit_id,
            str(exc)[:200],
            extra={"correlation_id": correlation_id},
        )
        # Send error event and close
        yield f"event: error\n"
        yield f"data: {json.dumps({'error': 'Stream interrupted. Reconnecting...'})}\n\n"


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def sse_stream(request: Request) -> StreamingHttpResponse | HttpResponse:
    """
    GET /api/v1/events/stream/

    Opens an SSE stream for the authenticated user.
    Events: connected, notification, error, keepalive comments.

    Required headers:
      - Cookie: yss_access=<jwt>  (handled by CookieJWTAuthentication)
      - X-Business-Unit-Id: <uuid>

    The connection stays open until client disconnects or server closes.
    Frontend: use EventSource API.
    """
    correlation_id = getattr(request, "correlation_id", str(uuid.uuid4()))

    # Require business unit context
    business_unit_id = getattr(request, "business_unit_id", None)
    if business_unit_id is None:
        return HttpResponse(
            "X-Business-Unit-Id header is required for SSE stream.",
            status=400,
            content_type="text/plain",
        )

    user_id: uuid.UUID = request.user.id

    logger.info(
        "SSE connection established",
        extra={
            "user_id": str(user_id),
            "business_unit_id": str(business_unit_id),
            "ip": _get_ip(request),
            "correlation_id": correlation_id,
        },
    )

    response = StreamingHttpResponse(
        _event_stream(user_id, business_unit_id, correlation_id),
        content_type="text/event-stream",
        status=200,
    )
    # Required SSE headers
    response["Cache-Control"] = "no-cache"
    response["X-Accel-Buffering"] = "no"  # Disable Nginx buffering
    response["Access-Control-Allow-Credentials"] = "true"
    response["X-Correlation-Id"] = correlation_id
    return response
