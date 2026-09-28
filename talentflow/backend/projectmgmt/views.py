from django.shortcuts import get_object_or_404
from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import (
    ListAPIView, ListCreateAPIView, RetrieveUpdateAPIView, RetrieveUpdateDestroyAPIView,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Profile
from accounts.permissions import IsAdmin
from accounts.services import notify
from employees.models import Employee

from .models import Project, Sprint, Task
from .permissions import user_can_manage_project
from .serializers import ProjectSerializer, SprintSerializer, TaskSerializer


class ProjectListCreateView(ListCreateAPIView):
    serializer_class = ProjectSerializer

    def get_permissions(self):
        return [IsAuthenticated()] if self.request.method == 'GET' else [IsAdmin()]

    def get_queryset(self):
        qs = Project.objects.prefetch_related('members__profile').select_related('manager__profile')
        if self.request.user.role == Profile.ADMIN:
            return qs.order_by('-created_at')
        employee = Employee.objects.filter(profile=self.request.user).first()
        if not employee:
            return qs.none()
        from django.db.models import Q
        return qs.filter(Q(members=employee) | Q(manager=employee)).distinct().order_by('-created_at')


class ProjectDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]
    queryset = Project.objects.prefetch_related('members__profile').select_related('manager__profile')

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return
        if request.method == 'DELETE' and request.user.role != Profile.ADMIN:
            raise PermissionDenied('Only admin can delete a project.')
        if not user_can_manage_project(request.user, obj):
            raise PermissionDenied('Not allowed.')
        if request.user.role != Profile.ADMIN and 'manager' in request.data:
            raise PermissionDenied("Only admin can reassign a project's manager.")


class ProjectTaskListCreateView(ListCreateAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Task.objects.prefetch_related('assignees__profile').select_related('sprint').filter(
            project_id=self.kwargs['project_id']
        )

    def perform_create(self, serializer):
        project = get_object_or_404(Project, id=self.kwargs['project_id'])
        if not user_can_manage_project(self.request.user, project):
            raise PermissionDenied('Not allowed.')
        task = serializer.save(project=project)
        for assignee in task.assignees.select_related('profile'):
            notify(assignee.profile, f"You were assigned to task '{task.title}' in {task.project.name}.", link='/employee')


class ProjectSprintListCreateView(ListCreateAPIView):
    serializer_class = SprintSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Sprint.objects.filter(project_id=self.kwargs['project_id']).order_by('-start_date')

    def perform_create(self, serializer):
        project = get_object_or_404(Project, id=self.kwargs['project_id'])
        if not user_can_manage_project(self.request.user, project):
            raise PermissionDenied('Not allowed.')
        serializer.save(project=project)


class SprintDetailView(RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = SprintSerializer
    queryset = Sprint.objects.select_related('project')

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if request.method not in ('GET', 'HEAD', 'OPTIONS') and not user_can_manage_project(request.user, obj.project):
            raise PermissionDenied('Not allowed.')


class TaskDetailView(RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TaskSerializer
    queryset = Task.objects.prefetch_related('assignees__profile').select_related('sprint', 'project')

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if request.method not in ('GET', 'HEAD', 'OPTIONS') and not user_can_manage_project(request.user, obj.project):
            raise PermissionDenied('Not allowed.')

    def perform_update(self, serializer):
        previous_assignee_ids = set(serializer.instance.assignees.values_list('id', flat=True))
        task = serializer.save()
        newly_assigned = task.assignees.exclude(id__in=previous_assignee_ids).select_related('profile')
        for assignee in newly_assigned:
            notify(assignee.profile, f"You were assigned to task '{task.title}' in {task.project.name}.", link='/employee')


class MyTasksView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TaskSerializer

    def get_queryset(self):
        employee = Employee.objects.filter(profile=self.request.user).first()
        if not employee:
            return Task.objects.none()
        return Task.objects.prefetch_related('assignees__profile').filter(assignees=employee).order_by('-updated_at')


class TaskStatusUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        task = Task.objects.prefetch_related('assignees__profile').select_related('project').filter(pk=pk).first()
        if not task:
            return Response({'detail': 'Task not found.'}, status=404)

        is_owner = task.assignees.filter(profile_id=request.user.id).exists()
        if not is_owner and not user_can_manage_project(request.user, task.project):
            return Response({'detail': 'Not allowed.'}, status=403)

        status_value = request.data.get('status')
        if status_value not in dict(Task.STATUS_CHOICES):
            return Response({'detail': 'Invalid status.'}, status=400)

        task.status = status_value
        task.save(update_fields=['status', 'updated_at'])
        return Response(TaskSerializer(task).data)
