from django.urls import path

from .views import (
    MyTasksView, ProjectDetailView, ProjectListCreateView, ProjectSprintListCreateView,
    ProjectTaskListCreateView, SprintDetailView, TaskDetailView, TaskStatusUpdateView,
)

urlpatterns = [
    path('projects/', ProjectListCreateView.as_view(), name='project-list-create'),
    path('projects/<int:pk>/', ProjectDetailView.as_view(), name='project-detail'),
    path('projects/<int:project_id>/tasks/', ProjectTaskListCreateView.as_view(), name='project-task-list-create'),
    path('projects/<int:project_id>/sprints/', ProjectSprintListCreateView.as_view(), name='project-sprint-list-create'),
    path('sprints/<int:pk>/', SprintDetailView.as_view(), name='sprint-detail'),
    path('my-tasks/', MyTasksView.as_view(), name='my-tasks'),
    path('tasks/<int:pk>/', TaskDetailView.as_view(), name='task-detail'),
    path('tasks/<int:pk>/status/', TaskStatusUpdateView.as_view(), name='task-status'),
]
