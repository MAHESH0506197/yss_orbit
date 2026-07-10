# yss_orbit\backend\apps\users\tests\test_auth.py
import pytest
import uuid
from datetime import timedelta
from django.utils import timezone
from django.core.exceptions import ValidationError
from apps.iam.models import User, OTP, OTPPurpose, UserSession
from core.auth.authentication_backend import AuthService, LoginStatus
from apps.iam.services.otp_service import OTPService
from core.auth.jwt_handler import TokenService
from apps.platform.core_exceptions import (
    InvalidCredentialsError, AccountLockedError,
    EmailNotVerifiedError, MFARequiredError, OTPInvalidError, OTPExpiredError,
    OTPMaxAttemptsError, OTPRateLimitError, TokenInvalidError, SessionRevokedError
)

@pytest.mark.django_db
class TestUserAuthFlows:
    
    @pytest.fixture(autouse=True)
    def setup_data(self):
        self.password = "Secr3t_P@ss123!"
        self.user = User.objects.create_user(
            username="testuser",
            email="testuser@example.com",
            password=self.password,
            is_email_verified=True,
            mfa_enabled=False,
            is_active=True
        )
        self.ip = "127.0.0.1"
        self.ua = "Pytest"
        self.correlation_id = "test-corr-id"

        from apps.organization.models.organization_model import Organization
        from apps.organization.models import BusinessUnit
        from apps.organization.models.user_business_unit_model import UserBusinessUnitModel
        
        org = Organization.objects.create(name="Test Org", business_domain=__import__('apps.organization.models.business_domain_model', fromlist=['BusinessDomain']).BusinessDomain.objects.get_or_create(name='Test Domain ' + __import__('uuid').uuid4().hex[:8], code='TEST' + __import__('uuid').uuid4().hex[:4])[0])
        bu = BusinessUnit.objects.create(name="Test BU", code=f"TB-{uuid.uuid4().hex[:6]}", organization=org)
        UserBusinessUnitModel.objects.create(user=self.user, business_unit=bu)

    def test_login_steps_1_to_4_generic_error(self):
        # Step 1: User does not exist
        with pytest.raises(InvalidCredentialsError):
            AuthService.login("nonexistent", self.password, self.ip, self.ua, self.correlation_id)
            
        # Step 2: User is inactive
        self.user.is_active = False
        self.user.save()
        with pytest.raises(InvalidCredentialsError):
            AuthService.login(self.user.username, self.password, self.ip, self.ua, self.correlation_id)
        self.user.is_active = True
        self.user.save()
            
        # Step 4: Incorrect password
        with pytest.raises(InvalidCredentialsError):
            AuthService.login(self.user.username, "wrongpass", self.ip, self.ua, self.correlation_id)

    def test_account_lockout(self):
        # Failed attempts increment
        for _ in range(5):
            with pytest.raises(InvalidCredentialsError):
                AuthService.login(self.user.username, "wrongpass", self.ip, self.ua, self.correlation_id)
                
        # 6th attempt locks account
        self.user.refresh_from_db()
        assert self.user.failed_login_attempts >= 5
        assert self.user.is_locked()
        
        with pytest.raises(AccountLockedError):
            AuthService.login(self.user.username, self.password, self.ip, self.ua, self.correlation_id)

    def test_email_verification_requirement(self):
        self.user.is_email_verified = False
        self.user.save()
        
        res = AuthService.login(self.user.username, self.password, self.ip, self.ua, self.correlation_id)
        assert res.status == LoginStatus.EMAIL_VERIFICATION_REQUIRED
        assert res.requires_otp_purpose == OTPPurpose.EMAIL_VERIFICATION

    def test_mfa_requirement(self):
        self.user.mfa_enabled = True
        self.user.save()
        
        res = AuthService.login(self.user.username, self.password, self.ip, self.ua, self.correlation_id)
        assert res.status == LoginStatus.MFA_REQUIRED
        assert res.requires_otp_purpose == OTPPurpose.MFA

    def test_successful_login(self):
        res = AuthService.login(self.user.username, self.password, self.ip, self.ua, self.correlation_id)
        assert res.status == LoginStatus.AUTHENTICATED
        assert res.access_token is not None
        assert res.refresh_token is not None

    def test_otp_lifecycle(self):
        # Generate OTP
        otp_code = OTPService.generate(self.user.id, OTPPurpose.PASSWORD_RESET, self.correlation_id)
        assert len(otp_code) == 6
        
        # Verify valid OTP
        OTPService.verify(self.user.id, otp_code, OTPPurpose.PASSWORD_RESET, self.correlation_id)
        
        # Single use check (cannot verify twice)
        with pytest.raises(OTPInvalidError):
            OTPService.verify(self.user.id, otp_code, OTPPurpose.PASSWORD_RESET, self.correlation_id)
            
        # Wrong purpose check
        otp_code_2 = OTPService.generate(self.user.id, OTPPurpose.EMAIL_VERIFICATION, self.correlation_id)
        with pytest.raises(OTPInvalidError):
            OTPService.verify(self.user.id, otp_code_2, OTPPurpose.PASSWORD_RESET, self.correlation_id)
            
        # Expired OTP check
        otp_code_3 = OTPService.generate(self.user.id, OTPPurpose.MFA, self.correlation_id)
        otp_record = OTP.objects.filter(user_id=self.user.id, purpose=OTPPurpose.MFA).first()
        otp_record.expires_at = timezone.now() - timedelta(minutes=1)
        otp_record.save()
        
        with pytest.raises(OTPExpiredError):
            OTPService.verify(self.user.id, otp_code_3, OTPPurpose.MFA, self.correlation_id)

    def test_otp_max_attempts(self):
        otp_code = OTPService.generate(self.user.id, OTPPurpose.MFA, self.correlation_id)
        for _ in range(5):
            with pytest.raises(OTPInvalidError):
                OTPService.verify(self.user.id, "000000", OTPPurpose.MFA, self.correlation_id)
                
        with pytest.raises(OTPMaxAttemptsError):
            OTPService.verify(self.user.id, otp_code, OTPPurpose.MFA, self.correlation_id)

    def test_token_refresh_and_rotation(self):
        access, refresh, session_id = TokenService.issue_tokens(
            self.user, self.ip, self.ua, self.correlation_id
        )
        
        # Rotate refresh token
        new_access, new_refresh = TokenService.refresh_tokens(refresh, self.correlation_id)
        assert new_access != access
        assert new_refresh != refresh
        
        # Reuse old refresh token (should revoke all sessions)
        with pytest.raises(SessionRevokedError):
            TokenService.refresh_tokens(refresh, self.correlation_id)
            
        assert UserSession.objects.filter(user=self.user, is_active=True).count() == 0
