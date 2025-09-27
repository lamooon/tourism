from django.urls import path
from . import views # Import your app's views.py
from .views import TripListCreateView, TripDetailView, RulesView

urlpatterns = [
    path("trips/", TripListCreateView.as_view(), name="trip-list-create"),
    path("trips/<uuid:id>/", TripDetailView.as_view(), name="trip-detail"),
    path("rules/", RulesView.as_view(), name="rules"),
    path('application/<int:id>/checklist', views.getChecklist, name='checklist'),
    path('application/<int:id>/autofill/export', views.exportUserData, name='export-data'),
]