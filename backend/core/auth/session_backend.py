# yss_orbit\backend\core\auth\session_backend.py
"""
YSS Orbit - Session Backend
Provides session management, tracking, and invalidation mechanisms.
"""
from __future__ import annotations

import logging
from typing import Optional
from django.utils import timezone
from apps.iam.models import User, UserSession

logger = logging.getLogger(__name__)


class SessionBackend:
    """
    Manages user sessions, ensuring security properties like concurrent session 
    limits, session invalidation, and tracking of active sessions.
    """

    @staticmethod
    def get_active_sessions(user: User):
        """Retrieve all active sessions for a user."""
        return UserSession.objects.filter(user=user, is_active=True, expires_at__gt=timezone.now())

    @staticmethod
    def revoke_session(session_id: str) -> bool:
        """
        Revokes a specific session by ID.
        """
        try:
            session = UserSession.objects.get(id=session_id)
            session.is_active = False
            session.save(update_fields=["is_active"])
            logger.info(f"Session revoked manually: {session_id}")
            return True
        except UserSession.DoesNotExist:
            logger.warning(f"Attempted to revoke non-existent session: {session_id}")
            return False

    @staticmethod
    def revoke_all_user_sessions(user: User) -> int:
        """
        Revokes all active sessions for a user.
        Useful for password resets or security breaches.
        """
        count = UserSession.objects.filter(user=user, is_active=True).update(is_active=False)
        if count > 0:
            logger.info(f"Revoked {count} sessions for user: {user.id}")
        return count

    @staticmethod
    def enforce_concurrent_session_limit(user: User, limit: int = 5):
        """
        Enforce a maximum number of concurrent sessions.
        Oldest sessions are revoked if the limit is exceeded.
        """
        active_sessions = UserSession.objects.filter(
            user=user, is_active=True, expires_at__gt=timezone.now()
        ).order_by("-created_at")

        if active_sessions.count() > limit:
            sessions_to_revoke = active_sessions[limit:]
            for session in sessions_to_revoke:
                session.is_active = False
                session.save(update_fields=["is_active"])
                logger.info(f"Session revoked due to concurrent limit: {session.id}")
