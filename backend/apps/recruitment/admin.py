from django.contrib import admin
from apps.recruitment.models import JobPosting

@admin.register(JobPosting)
class JobPostingAdmin(admin.ModelAdmin):
    pass
