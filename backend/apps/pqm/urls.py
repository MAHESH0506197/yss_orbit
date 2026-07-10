from django.urls import path, include

urlpatterns = [
    path("api/v1/pqm/", include("apps.pqm.api.urls")),
]
