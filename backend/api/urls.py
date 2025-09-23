from django.urls import path
from . import views # Import your app's views.py

urlpatterns = [
    path('application/<int:id>/checklist', views.getChecklist, name='checklist'),
    path('application/<int:id>/autofill/export', views.exportUserData, name='export-data'),
]