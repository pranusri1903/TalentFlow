from django.urls import path

from .views import (
    MyTasksView, ProjectDetailView, ProjectListCreateView,
    ProjectTaskListCreateView, TaskStatusUpdateView,
)

urlpatterns = [
    path('projects/', ProjectListCreateView.as_view(), name='project-list-create'),
    path('projects/<int:pk>/', ProjectDetailView.as_view(), name='project-detail'),
    path('projects/<int:project_id>/tasks/', ProjectTaskListCreateView.as_view(), name='project-task-list-create'),
    path('my-tasks/', MyTasksView.as_view(), name='my-tasks'),
    path('tasks/<int:pk>/status/', TaskStatusUpdateView.as_view(), name='task-status'),
]
