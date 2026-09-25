from rest_framework import serializers

from .models import Project, Task


class TaskSerializer(serializers.ModelSerializer):
    assignee_names = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id', 'project', 'title', 'description', 'assignees', 'assignee_names',
            'status', 'created_at', 'updated_at',
        ]
        read_only_fields = ['project']

    def get_assignee_names(self, obj):
        return [a.profile.full_name or a.profile.email for a in obj.assignees.select_related('profile')]


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
