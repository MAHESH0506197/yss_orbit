# yss_orbit\backend\apps\users\tests\test_user_model.py
import pytest
from apps.iam.models import User
from django.utils import timezone
from datetime import timedelta

@pytest.mark.django_db
class TestUserModel:
    def test_create_user(self):
        user = User.objects.create_user(
            username="newuser",
            email="newuser@example.com",
            password="password123"
        )
        assert user.username == "newuser"
        assert user.email == "newuser@example.com"
        assert user.check_password("password123")
        assert user.is_active is False
        assert user.is_super_admin is False

    def test_create_superuser(self):
        admin = User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="adminpass"
        )
        assert admin.is_super_admin is True
        assert admin.is_active is True
        assert admin.is_email_verified is True

    def test_increment_failed_attempts(self):
        user = User.objects.create_user("failuser", "fail@example.com", "pass")
        assert user.failed_login_attempts == 0
        assert user.is_locked() is False

        for _ in range(5):
            user.increment_failed_attempts()

        user.refresh_from_db()
        assert user.failed_login_attempts == 5
        assert user.is_locked() is True

    def test_reset_failed_attempts(self):
        user = User.objects.create_user("resetuser", "reset@example.com", "pass")
        user.failed_login_attempts = 3
        user.locked_until = timezone.now() + timedelta(minutes=10)
        user.save()

        user.reset_failed_attempts()
        user.refresh_from_db()
        assert user.failed_login_attempts == 0
        assert user.locked_until is None
        assert user.is_locked() is False

    def test_soft_delete(self):
        user = User.objects.create_user("deluser", "del@example.com", "pass")
        user.soft_delete()
        
        user.refresh_from_db()
        assert user.is_deleted is True
        assert user.is_active is False
        assert user.deleted_at is not None
