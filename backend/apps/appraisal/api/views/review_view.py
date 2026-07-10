# yss_orbit\backend\apps\appraisal\api\views\review_view.py
from rest_framework import viewsets, permissions
from apps.appraisal.models.review import Review
from apps.appraisal.api.serializers.review_serializer import ReviewSerializer
from apps.iam.permissions.hrms_permissions import IsNotSelfEdit

class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated, IsNotSelfEdit]
