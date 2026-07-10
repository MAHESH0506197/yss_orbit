from django.urls import path
from apps.iam.api.views.profile_views import ProfileDetailView, AvatarManageView, UserSessionListView, UserSessionRevokeView

urlpatterns = [
    path("me/", ProfileDetailView.as_view(), name="profile-me"),
    path("me/avatar/", AvatarManageView.as_view(), name="profile-avatar"),
    path("me/sessions/", UserSessionListView.as_view(), name="profile-sessions-list"),
    path("me/sessions/<uuid:session_id>/revoke/", UserSessionRevokeView.as_view(), name="profile-sessions-revoke"),
]
