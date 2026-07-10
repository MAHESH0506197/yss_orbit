# yss_orbit\backend\apps\users\api\urls\auth_urls.py
from django.urls import path
from apps.iam.api.views.auth_views import (
    csrf_init,
    login_view,
    logout_view,
    token_refresh_view,
    otp_verify_view,
    otp_resend_view,
    password_forgot_view,
    password_reset_view,
    password_change_view,
    me_view,
    account_unlock_request_view,
)

urlpatterns = [
    path("login/", login_view, name="auth-login"),
    path("logout/", logout_view, name="auth-logout"),
    path("token/refresh/", token_refresh_view, name="auth-token-refresh"),
    path("otp/verify/", otp_verify_view, name="auth-otp-verify"),
    path("otp/resend/", otp_resend_view, name="auth-otp-resend"),
    path("password/forgot/", password_forgot_view, name="auth-password-forgot"),
    path("password/reset/", password_reset_view, name="auth-password-reset"),
    path("password/change/", password_change_view, name="auth-password-change"),
    path("unlock/request/", account_unlock_request_view, name="auth-unlock-request"),
    path("me/", me_view, name="auth-me"),
]
