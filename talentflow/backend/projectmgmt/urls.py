from django.urls import path

from .views import (
    EpicDetailView, GlobalTaskSearchView, MyTasksView, ProjectDetailView, ProjectEpicListCreateView,
    ProjectListCreateView, ProjectSprintListCreateView, ProjectTaskListCreateView, SprintDetailView,
    TaskActivityListView, TaskCommentListCreateView, TaskDetailView, TaskStatusUpdateView,
)

urlpatterns = [
    path('projects/', ProjectListCreateView.as_view(), name='project-list-create'),
    path('projects/<int:pk>/', ProjectDetailView.as_view(), name='project-detail'),
    path('projects/<int:project_id>/tasks/', ProjectTaskListCreateView.as_view(), name='project-task-list-create'),
    path('projects/<int:project_id>/sprints/', ProjectSprintListCreateView.as_view(), name='project-sprint-list-create'),
    path('projects/<int:project_id>/epics/', ProjectEpicListCreateView.as_view(), name='project-epic-list-create'),
    path('sprints/<int:pk>/', SprintDetailView.as_view(), name='sprint-detail'),
    path('epics/<int:pk>/', EpicDetailView.as_view(), name='epic-detail'),
    path('my-tasks/', MyTasksView.as_view(), name='my-tasks'),
    path('tasks/search/', GlobalTaskSearchView.as_view(), name='task-search'),
    path('tasks/<int:pk>/', TaskDetailView.as_view(), name='task-detail'),
    path('tasks/<int:pk>/status/', TaskStatusUpdateView.as_view(), name='task-status'),
    path('tasks/<int:pk>/comments/', TaskCommentListCreateView.as_view(), name='task-comments'),
    path('tasks/<int:pk>/activity/', TaskActivityListView.as_view(), name='task-activity'),
]
