# yss_orbit\backend\apps\hrms\urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api.views.employee_view import EmployeeViewSet

router = DefaultRouter()
router.register(r'employees', EmployeeViewSet, basename='employee')

urlpatterns = [
    path('', include(router.urls)),
]\n