from rest_framework import serializers

from .models import Epic, Project, Sprint, Task, TaskActivity, TaskComment


class TaskSerializer(serializers.ModelSerializer):
    assignee_names = serializers.SerializerMethodField()
    sprint_name = serializers.CharField(source='sprint.name', read_only=True, default=None)
    epic_name = serializers.CharField(source='epic.name', read_only=True, default=None)
    project_name = serializers.CharField(source='project.name', read_only=True, default=None)

    class Meta:
        model = Task
        fields = [
            'id', 'project', 'project_name', 'sprint', 'sprint_name', 'epic', 'epic_name', 'title', 'description',
            'assignees', 'assignee_names', 'status', 'priority', 'type', 'due_date', 'labels',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['project']

    def get_assignee_names(self, obj):
        return [a.profile.full_name or a.profile.email for a in obj.assignees.select_related('profile')]


class SprintSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sprint
        fields = ['id', 'project', 'name', 'start_date', 'end_date', 'status', 'created_at']
        read_only_fields = ['project']


class EpicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Epic
        fields = ['id', 'project', 'name', 'description', 'created_at']
        read_only_fields = ['project']


class TaskCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.full_name', read_only=True, default=None)

    class Meta:
        model = TaskComment
        fields = ['id', 'task', 'author', 'author_name', 'body', 'created_at']
        read_only_fields = ['task', 'author', 'created_at']


class TaskActivitySerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source='actor.full_name', read_only=True, default=None)

    class Meta:
        model = TaskActivity
        fields = ['id', 'task', 'actor_name', 'message', 'created_at']
        read_only_fields = fields


class ProjectSerializer(serializers.ModelSerializer):
    member_names = serializers.SerializerMethodField()
    manager_name = serializers.CharField(source='manager.profile.full_name', read_only=True, default=None)

    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'members', 'member_names', 'manager', 'manager_name', 'created_at']

    def get_member_names(self, obj):
        return [
            m.profile.full_name or m.profile.email
            for m in obj.members.select_related('profile').filter(profile__is_active=True)
        ]

    def validate_manager(self, manager):
        if manager and not manager.is_manager:
            raise serializers.ValidationError('Selected employee is not marked as a manager.')
        return manager

    def validate(self, attrs):
        # On update (not create — there's no team yet to check against there), a manager can
        # only be assigned from among the project's existing/incoming members.
        if self.instance is not None and attrs.get('manager') is not None:
            members = attrs.get('members')
            if members is None:
                members = list(self.instance.members.all())
            if attrs['manager'] not in members:
                raise serializers.ValidationError({'manager': 'Manager must already be a member of this project.'})
        return attrs

    def create(self, validated_data):
        manager = validated_data.get('manager')
        instance = super().create(validated_data)
        # A project's manager is always implicitly on its team, even if the creation form
        # (which has no team yet to pick from) didn't include them in members.
        if manager:
            instance.members.add(manager)
        return instance

    def update(self, instance, validated_data):
        members_provided = 'members' in validated_data
        instance = super().update(instance, validated_data)
        # If the team was just edited and no longer includes the current manager, they can no
        # longer manage a team they're not on — clear it rather than leaving a dangling manager.
        if members_provided and instance.manager_id and not instance.members.filter(id=instance.manager_id).exists():
            instance.manager = None
            instance.save(update_fields=['manager'])
        return instance
