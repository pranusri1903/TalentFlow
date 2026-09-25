from rest_framework.generics import (
    ListAPIView, ListCreateAPIView, RetrieveUpdateAPIView, RetrieveUpdateDestroyAPIView,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Profile
from accounts.permissions import IsAdmin
from employees.models import Employee

from .models import Project, Sprint, Task
from .serializers import ProjectSerializer, SprintSerializer, TaskSerializer


class ProjectListCreateView(ListCreateAPIView):
    serializer_class = ProjectSerializer

    def get_permissions(self):
        return [IsAuthenticated()] if self.request.method == 'GET' else [IsAdmin()]

    def get_queryset(self):
        qs = Project.objects.prefetch_related('members__profile')
        if self.request.user.role == Profile.ADMIN:
            return qs.order_by('-created_at')
        employee = Employee.objects.filter(profile=self.request.user).first()
        return qs.filter(members=employee).order_by('-created_at') if employee else qs.none()


class ProjectDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = ProjectSerializer
    queryset = Project.objects.prefetch_related('members__profile')

    def get_permissions(self):
        return [IsAuthenticated()] if self.request.method == 'GET' else [IsAdmin()]


class ProjectTaskListCreateView(ListCreateAPIView):
    serializer_class = TaskSerializer

    def get_permissions(self):
        return [IsAuthenticated()] if self.request.method == 'GET' else [IsAdmin()]

    def get_queryset(self):
        return Task.objects.prefetch_related('assignees__profile').select_related('sprint').filter(
            project_id=self.kwargs['project_id']
        )

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs['project_id'])


class ProjectSprintListCreateView(ListCreateAPIView):
    serializer_class = SprintSerializer

    def get_permissions(self):
        return [IsAuthenticated()] if self.request.method == 'GET' else [IsAdmin()]

    def get_queryset(self):
        return Sprint.objects.filter(project_id=self.kwargs['project_id']).order_by('-start_date')

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs['project_id'])


class SprintDetailView(RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    serializer_class = SprintSerializer
    queryset = Sprint.objects.all()


class TaskDetailView(RetrieveUpdateAPIView):
    permission_classes = [IsAdmin]
    serializer_class = TaskSerializer
    queryset = Task.objects.prefetch_related('assignees__profile').select_related('sprint')


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
        task = Task.objects.prefetch_related('assignees__profile').filter(pk=pk).first()
        if not task:
            return Response({'detail': 'Task not found.'}, status=404)

        is_owner = task.assignees.filter(profile_id=request.user.id).exists()
        if request.user.role != Profile.ADMIN and not is_owner:
            return Response({'detail': 'Not allowed.'}, status=403)

        status_value = request.data.get('status')
        if status_value not in dict(Task.STATUS_CHOICES):
            return Response({'detail': 'Invalid status.'}, status=400)

        task.status = status_value
        task.save(update_fields=['status', 'updated_at'])
        return Response(TaskSerializer(task).data)
