from django.http import JsonResponse
from django.urls import path
from . import views
def healthcheck(request):
    return JsonResponse({"ok": True})

urlpatterns = [
    path("health/", healthcheck, name="health"),
    path("trips/", views.TripListCreateView.as_view(), name="trip-list-create"),
    path("trips/<str:id>/", views.TripDetailView.as_view(), name="trip-detail"),
    path("rules/", views.RulesView.as_view(), name="rules"),
    path("application/<str:id>/checklist", views.getChecklist, name="checklist"),
    path("application/<str:id>/autofill/export", views.exportUserData, name="export-data"),
]