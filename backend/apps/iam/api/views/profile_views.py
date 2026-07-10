# yss_orbit\backend\apps\users\api\views\profile_views.py
import logging
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from apps.iam.models.user import User as Profile
from apps.iam.api.serializers.user_serializer import UserSerializer as ProfileSerializer

logger = logging.getLogger(__name__)

class ProfileDetailView(generics.RetrieveUpdateAPIView):
    """
    Enterprise-grade View for Current User Profile.
    Returns and updates the currently authenticated user.
    """
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        from apps.iam.api.serializers.user_serializer import UserSerializer, UserProfileUpdateSerializer
        if self.request.method in ['PUT', 'PATCH']:
            return UserProfileUpdateSerializer
        return UserSerializer
        
    def get_object(self):
        """
        Always return the current request.user
        """
        return self.request.user


class AvatarManageView(generics.GenericAPIView):
    """
    PUT /api/v1/profile/me/avatar/
    DELETE /api/v1/profile/me/avatar/
    """
    permission_classes = [IsAuthenticated]

    def put(self, request, *args, **kwargs):
        from rest_framework.response import Response
        from rest_framework import status
        
        avatar_file = request.FILES.get('avatar')
        if not avatar_file:
            return Response({"message": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

        MAX_SIZE = 5 * 1024 * 1024
        if avatar_file.size > MAX_SIZE:
            return Response({"message": "File exceeds 5MB limit."}, status=status.HTTP_400_BAD_REQUEST)

        allowed_types = ['image/jpeg', 'image/png']
        if avatar_file.content_type not in allowed_types:
            return Response({"message": "Only JPEG and PNG are allowed."}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        if user.avatar:
            user.avatar.delete(save=False)
            
        user.avatar = avatar_file
        user.save(update_fields=['avatar', 'updated_at'])

        serializer = ProfileSerializer(user, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, *args, **kwargs):
        from rest_framework.response import Response
        from rest_framework import status
        
        user = request.user
        if user.avatar:
            user.avatar.delete(save=False)
            user.avatar = None
            user.save(update_fields=['avatar', 'updated_at'])
            
        serializer = ProfileSerializer(user, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserSessionListView(generics.ListAPIView):
    """
    GET /api/v1/profile/me/sessions/
    Returns all active sessions for the authenticated user.
    """
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        from apps.iam.api.serializers.session_serializer import UserSessionSerializer
        return UserSessionSerializer
        
    def get_queryset(self):
        from core.auth.session_backend import SessionBackend
        return SessionBackend.get_active_sessions(self.request.user).order_by('-last_active_at')


class UserSessionRevokeView(generics.DestroyAPIView):
    """
    DELETE /api/v1/profile/me/sessions/<session_id>/revoke/
    Revokes a specific active session.
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        from core.auth.session_backend import SessionBackend
        return SessionBackend.get_active_sessions(self.request.user)
        
    def delete(self, request, *args, **kwargs):
        from core.auth.session_backend import SessionBackend
        from rest_framework.response import Response
        from rest_framework import status
        
        session_id = kwargs.get('session_id')
        if not session_id:
            return Response({"message": "Session ID required"}, status=status.HTTP_400_BAD_REQUEST)
            
        # Ensure the session belongs to the user by fetching from our queryset
        qs = self.get_queryset()
        try:
            session = qs.get(id=session_id)
            SessionBackend.revoke_session(str(session.id))
            return Response({"message": "Session revoked successfully."}, status=status.HTTP_200_OK)
        except Exception:
            # Hide whether it exists or just isn't theirs
            return Response({"message": "Session not found or already revoked."}, status=status.HTTP_404_NOT_FOUND)
