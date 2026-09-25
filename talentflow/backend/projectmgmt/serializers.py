from rest_framework import serializers

from .models import Project, Sprint, Task


class TaskSerializer(serializers.ModelSerializer):
    assignee_names = serializers.SerializerMethodField()
    sprint_name = serializers.CharField(source='sprint.name', read_only=True, default=None)

    class Meta:
        model = Task
        fields = [
            'id', 'project', 'sprint', 'sprint_name', 'title', 'description',
            'assignees', 'assignee_names', 'status', 'created_at', 'updated_at',
        ]
        read_only_fields = ['project']

    def get_assignee_names(self, obj):
        return [a.profile.full_name or a.profile.email for a in obj.assignees.select_related('profile')]


class SprintSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sprint
        fields = ['id', 'project', 'name', 'start_date', 'end_date', 'status', 'created_at']
        read_only_fields = ['project']


class ProjectSerializer(serializers.ModelSerializer):
    member_names = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'members', 'member_names', 'created_at']

    def get_member_names(self, obj):
        return [
            m.profile.full_name or m.profile.email
            for m in obj.members.select_related('profile').filter(profile__is_active=True)
        ]
