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

from .models import Epic, Project, Sprint, Task, TaskActivity, TaskComment
from .permissions import user_can_manage_project, user_can_view_project, visible_projects_for
from .serializers import (
    EpicSerializer, ProjectSerializer, SprintSerializer, TaskActivitySerializer, TaskCommentSerializer,
    TaskSerializer,
)


def _actor_name(user):
    return user.full_name or user.email


def _task_snapshot(task):
    return {
        'status': task.get_status_display(),
        'priority': task.get_priority_display(),
        'type': task.get_type_display(),
        'due date': task.due_date,
        'sprint': task.sprint.name if task.sprint else 'Backlog',
        'epic': task.epic.name if task.epic else 'None',
        'title': task.title,
    }


class ProjectListCreateView(ListCreateAPIView):
    serializer_class = ProjectSerializer

    def get_permissions(self):
        return [IsAuthenticated()] if self.request.method == 'GET' else [IsAdmin()]

    def get_queryset(self):
        qs = visible_projects_for(self.request.user).prefetch_related('members__profile').select_related(
            'manager__profile'
        )
        return qs.order_by('-created_at')


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
        return Task.objects.prefetch_related('assignees__profile').select_related('sprint', 'epic').filter(
            project_id=self.kwargs['project_id']
        )

    def perform_create(self, serializer):
        project = get_object_or_404(Project, id=self.kwargs['project_id'])
        if not user_can_manage_project(self.request.user, project):
            raise PermissionDenied('Not allowed.')
        task = serializer.save(project=project)
        TaskActivity.objects.create(
            task=task, actor=self.request.user, message=f'{_actor_name(self.request.user)} created this task.'
        )
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


class ProjectEpicListCreateView(ListCreateAPIView):
    serializer_class = EpicSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Epic.objects.filter(project_id=self.kwargs['project_id']).order_by('-created_at')

    def perform_create(self, serializer):
        project = get_object_or_404(Project, id=self.kwargs['project_id'])
        if not user_can_manage_project(self.request.user, project):
            raise PermissionDenied('Not allowed.')
        serializer.save(project=project)


class EpicDetailView(RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = EpicSerializer
    queryset = Epic.objects.select_related('project')

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if request.method not in ('GET', 'HEAD', 'OPTIONS') and not user_can_manage_project(request.user, obj.project):
            raise PermissionDenied('Not allowed.')


class TaskDetailView(RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TaskSerializer
    queryset = Task.objects.prefetch_related('assignees__profile').select_related('sprint', 'epic', 'project')

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if request.method not in ('GET', 'HEAD', 'OPTIONS') and not user_can_manage_project(request.user, obj.project):
            raise PermissionDenied('Not allowed.')

    def perform_update(self, serializer):
        task = serializer.instance
        before = _task_snapshot(task)
        previous_assignee_ids = set(task.assignees.values_list('id', flat=True))

        task = serializer.save()
        actor_name = _actor_name(self.request.user)
        after = _task_snapshot(task)
        for field, old_value in before.items():
            new_value = after[field]
            if new_value != old_value:
                TaskActivity.objects.create(
                    task=task, actor=self.request.user,
                    message=f'{actor_name} changed {field} from "{old_value}" to "{new_value}".',
                )

        newly_assigned = task.assignees.exclude(id__in=previous_assignee_ids).select_related('profile')
        for assignee in newly_assigned:
            notify(assignee.profile, f"You were assigned to task '{task.title}' in {task.project.name}.", link='/employee')
        if set(task.assignees.values_list('id', flat=True)) != previous_assignee_ids:
            TaskActivity.objects.create(task=task, actor=self.request.user, message=f'{actor_name} updated assignees.')


class MyTasksView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TaskSerializer

    def get_queryset(self):
        employee = Employee.objects.filter(profile=self.request.user).first()
        if not employee:
            return Task.objects.none()
        return Task.objects.prefetch_related('assignees__profile').select_related('sprint', 'epic').filter(
            assignees=employee
        ).order_by('-updated_at')


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

        old_status_label = task.get_status_display()
        task.status = status_value
        task.save(update_fields=['status', 'updated_at'])
        if task.get_status_display() != old_status_label:
            TaskActivity.objects.create(
                task=task, actor=request.user,
                message=f'{_actor_name(request.user)} changed status from "{old_status_label}" to "{task.get_status_display()}".',
            )
        return Response(TaskSerializer(task).data)


class TaskCommentListCreateView(ListCreateAPIView):
    serializer_class = TaskCommentSerializer
    permission_classes = [IsAuthenticated]

    def _task(self):
        return get_object_or_404(Task.objects.select_related('project'), pk=self.kwargs['pk'])

    def get_queryset(self):
        task = self._task()
        if not user_can_view_project(self.request.user, task.project):
            raise PermissionDenied('Not allowed.')
        return TaskComment.objects.filter(task=task).select_related('author')

    def perform_create(self, serializer):
        task = self._task()
        if not user_can_view_project(self.request.user, task.project):
            raise PermissionDenied('Not allowed.')
        comment = serializer.save(task=task, author=self.request.user)
        actor_name = _actor_name(self.request.user)
        TaskActivity.objects.create(task=task, actor=self.request.user, message=f'{actor_name} commented.')

        members = Employee.objects.filter(projects=task.project).select_related('profile')
        for member in members:
            name = member.profile.full_name
            if name and member.profile_id != self.request.user.id and f'@{name}' in comment.body:
                notify(
                    member.profile,
                    f"{actor_name} mentioned you in a comment on '{task.title}'.",
                    link='/employee',
                )


class TaskActivityListView(ListAPIView):
    serializer_class = TaskActivitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        task = get_object_or_404(Task.objects.select_related('project'), pk=self.kwargs['pk'])
        if not user_can_view_project(self.request.user, task.project):
            raise PermissionDenied('Not allowed.')
        return TaskActivity.objects.filter(task=task).select_related('actor')


class GlobalTaskSearchView(ListAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Task.objects.filter(project__in=visible_projects_for(self.request.user)).select_related(
            'project', 'sprint', 'epic'
        ).prefetch_related('assignees__profile').order_by('-updated_at')

        params = self.request.query_params
        q = params.get('q')
        if q:
            from django.db.models import Q
            qs = qs.filter(Q(title__icontains=q) | Q(description__icontains=q))
        for field in ('status', 'priority', 'project'):
            value = params.get(field)
            if value:
                qs = qs.filter(**{field: value})
        return qs
