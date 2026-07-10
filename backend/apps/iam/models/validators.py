# yss_orbit\backend\apps\users\models\validators.py
from __future__ import annotations

import re
from typing import TYPE_CHECKING

from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _
from django.contrib.auth.hashers import check_password

if TYPE_CHECKING:
    from apps.iam.models import User


class PasswordStrengthValidator:
    """
    Validates that passwords meet the minimum complexity requirements:
    - Minimum 8 characters.
    - At least one uppercase letter.
    - At least one lowercase letter.
    - At least one digit.
    - At least one special character.
    - Cannot match any of the last 5 passwords in the user's password history.
    """

    def validate(self, password: str, user: User | None = None) -> None:
        if len(password) < 8:
            raise ValidationError(
                _("This password must contain at least 8 characters."),
                code="password_too_short",
            )
        if not re.search(r"[A-Z]", password):
            raise ValidationError(
                _("This password must contain at least one uppercase letter."),
                code="password_no_uppercase",
            )
        if not re.search(r"[a-z]", password):
            raise ValidationError(
                _("This password must contain at least one lowercase letter."),
                code="password_no_lowercase",
            )
        if not re.search(r"[0-9]", password):
            raise ValidationError(
                _("This password must contain at least one digit."),
                code="password_no_digit",
            )
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
            raise ValidationError(
                _("This password must contain at least one special character."),
                code="password_no_special",
            )

        # Check last-5 password history
        if user and user.pk:
            from apps.iam.models import PasswordHistory
            history_entries = PasswordHistory.objects.filter(user=user).order_by("-created_at")[:5]
            for entry in history_entries:
                if check_password(password, entry.hashed_password):
                    raise ValidationError(
                        _("This password has been used recently. Choose another password."),
                        code="password_history_reused",
                    )

    def get_help_text(self) -> str:
        return _(
            "Your password must contain at least 8 characters, including at least one uppercase letter, "
            "one lowercase letter, one digit, and one special character. It cannot be any of your last 5 passwords."
        )
