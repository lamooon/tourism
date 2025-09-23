from django.urls import path
from .views import TripListCreateView, TripDetailView, RulesView

urlpatterns = [
    path("trips/", TripListCreateView.as_view(), name="trip-list-create"),
    path("trips/<uuid:id>/", TripDetailView.as_view(), name="trip-detail"),
    path("rules/", RulesView.as_view(), name="rules"),
]