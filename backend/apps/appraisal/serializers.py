# yss_orbit\backend\apps\appraisal\serializers.py
from rest_framework import serializers
from .models.appraisal_model import Appraisal
from .models import AppraisalCycle, KPI

class AppraisalCycleSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppraisalCycle
        fields = '__all__'

class KPISerializer(serializers.ModelSerializer):
    class Meta:
        model = KPI
        fields = '__all__'

class AppraisalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appraisal
        fields = '__all__'
