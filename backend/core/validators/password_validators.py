# yss_orbit\backend\core\validators\password_validators.py
"""
Password validators.
"""
import re
from django.core.exceptions import ValidationError

class PasswordStrengthValidator:
    """Validate password strength."""
    def validate(self, password, user=None):
        if len(password) < 8:
            raise ValidationError("Password must be at least 8 characters long.")
        if not re.search(r'[A-Z]', password):
            raise ValidationError("Password must contain at least one uppercase letter.")
        if not re.search(r'[a-z]', password):
            raise ValidationError("Password must contain at least one lowercase letter.")
        if not re.search(r'[0-9]', password):
            raise ValidationError("Password must contain at least one number.")
            
    def get_help_text(self):
        return "Your password must contain at least 8 characters, an uppercase letter, a lowercase letter, and a number."
