# yss_orbit\backend\apps\files\urls.py
from django.urls import path
from ..views import FilePresignView, FileDetailView, FileConfirmView, FileDownloadView

urlpatterns = [
    path("presign/", FilePresignView.as_view(), name="file-presign"),
    path("confirm/<str:file_id>/", FileConfirmView.as_view(), name="file-confirm"),
    path("download/<str:file_id>/", FileDownloadView.as_view(), name="file-download"),
    path("<str:file_id>/", FileDetailView.as_view(), name="file-detail"),
]
