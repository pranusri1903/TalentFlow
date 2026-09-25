from django.urls import path

from .views import (
    ApplicationStatusUpdateView, ApplyToJobView, JobApplicationsView,
    JobDetailView, JobListCreateView, MyApplicationsView,
)

urlpatterns = [
    path('jobs/', JobListCreateView.as_view(), name='job-list-create'),
    path('jobs/<int:pk>/', JobDetailView.as_view(), name='job-detail'),
    path('jobs/<int:job_id>/apply/', ApplyToJobView.as_view(), name='job-apply'),
    path('jobs/<int:job_id>/applications/', JobApplicationsView.as_view(), name='job-applications'),
    path('my-applications/', MyApplicationsView.as_view(), name='my-applications'),
    path('applications/<int:pk>/status/', ApplicationStatusUpdateView.as_view(), name='application-status'),
]
