from rest_framework import serializers

from .models import Project, Task


class TaskSerializer(serializers.ModelSerializer):
    assignee_name = serializers.CharField(source='assignee.profile.full_name', read_only=True, default='')

    class Meta:
        model = Task
        fields = [
            'id', 'project', 'title', 'description', 'assignee', 'assignee_name',
            'status', 'created_at', 'updated_at',
        ]


class ProjectSerializer(serializers.ModelSerializer):
    member_names = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'members', 'member_names', 'created_at']

    def get_member_names(self, obj):
        return [m.profile.full_name or m.profile.email for m in obj.members.select_related('profile')]
