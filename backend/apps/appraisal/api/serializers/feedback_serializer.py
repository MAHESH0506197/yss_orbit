# yss_orbit\backend\apps\appraisal\api\serializers\feedback_serializer.py
from rest_framework import serializers
from apps.appraisal.models.feedback import Feedback

class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = '__all__'
