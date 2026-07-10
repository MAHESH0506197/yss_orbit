# yss_orbit\backend\apps\support\urls.py
from django.urls import path
from .views import TicketListView, TicketDetailView, TicketCommentView, TicketCategoryListView

app_name = "support"

urlpatterns = [
    path("categories/", TicketCategoryListView.as_view(), name="ticket-categories"),
    path("tickets/", TicketListView.as_view(), name="ticket-list"),
    path("tickets/<str:pk>/", TicketDetailView.as_view(), name="ticket-detail"),
    path("tickets/<str:pk>/comments/", TicketCommentView.as_view(), name="ticket-comment"),
]
