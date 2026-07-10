# yss_orbit\backend\apps\appraisal\api\views\feedback_view.py
from rest_framework import viewsets, permissions
from apps.appraisal.models.feedback import Feedback
from apps.appraisal.api.serializers.feedback_serializer import FeedbackSerializer

class FeedbackViewSet(viewsets.ModelViewSet):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer
    permission_classes = [permissions.IsAuthenticated]
