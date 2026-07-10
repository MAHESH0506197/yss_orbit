# yss_orbit\backend\apps\appraisal\admin.py
from django.contrib import admin
from apps.appraisal.models.appraisal_model import Appraisal
from apps.appraisal.models.feedback_model import Feedback
from apps.appraisal.models.goal import Goal
from apps.appraisal.models.kpi_model import Kpi
from apps.appraisal.models.performance_review import PerformanceReview
from apps.appraisal.models.review_cycle_model import ReviewCycle

admin.site.register(Appraisal)
admin.site.register(Feedback)
admin.site.register(Goal)
admin.site.register(Kpi)
admin.site.register(PerformanceReview)
admin.site.register(ReviewCycle)

