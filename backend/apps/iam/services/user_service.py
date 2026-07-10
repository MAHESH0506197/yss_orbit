# yss_orbit\backend\apps\users\services\user_service.py
import uuid
from typing import Any

from django.db import transaction

from apps.platform.core_exceptions import ValidationException, ResourceNotFoundException
from apps.iam.models.user import User
from apps.iam.repositories.user_repository import UserRepository, UserBusinessUnitRepository


class UserService:
    def __init__(self) -> None:
        self.repo = UserRepository()
        self.bu_repo = UserBusinessUnitRepository()

    def get_user(self, user_id: uuid.UUID) -> User:
        return self.repo.get_by_id(user_id)

    def list_users_by_bu(self, bu_id: uuid.UUID) -> list[User]:
        return list(self.repo.list_by_business_unit(bu_id))

    @transaction.atomic
    def invite_user_to_bu(
        self,
        bu_id: uuid.UUID,
        email: str,
        role_id: uuid.UUID,
        invited_by_id: uuid.UUID,
    ) -> User:
        """
        Invites a user to a business unit.
        If the user does not exist, a placeholder user is created.
        An invitation email with a token should be sent (via notification service).
        """
        user = self.repo.get_by_email(email)
        if not user:
            # Create a placeholder user
            username = email.split("@")[0] + "_" + str(uuid.uuid4())[:8]
            user = self.repo.create({
                "email": email,
                "username": username,
                "is_active": False, # Will become active once they accept the invite
            })
        
        # Map user to BU
        self.bu_repo.add_user_to_business_unit(
            user_id=user.id,
            business_unit_id=bu_id,
            role_id=role_id,
            invited_by_id=invited_by_id,
        )
        
        # Here we would normally trigger an event or celery task to send the email
        # EventBus.publish("user.invited", payload={...})
        
        return user

    @transaction.atomic
    def update_profile(
        self,
        user_id: uuid.UUID,
        data: dict[str, Any],
    ) -> User:
        user = self.repo.get_by_id(user_id)
        
        # Protect certain fields
        safe_data = {
            k: v for k, v in data.items()
            if k in ["first_name", "last_name", "timezone", "language", "theme"]
        }
        
        return self.repo.update(user, safe_data)

    @transaction.atomic
    def remove_user_from_bu(
        self,
        user_id: uuid.UUID,
        bu_id: uuid.UUID,
    ) -> None:
        self.bu_repo.remove_user_from_business_unit(user_id, bu_id)
