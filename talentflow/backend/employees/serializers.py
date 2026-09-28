from rest_framework import serializers

from accounts.serializers import ProfileSerializer

from .models import Employee, LeaveRequest


class EmployeeSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    manager_name = serializers.CharField(source='manager.profile.full_name', read_only=True, default='')

    class Meta:
        model = Employee
        fields = [
            'id', 'profile', 'job_title', 'department',
            'manager', 'manager_name', 'is_manager', 'date_joined', 'status',
        ]


class EmployeeUpdateSerializer(serializers.ModelSerializer):
    # job_title/department are edited via accounts.UserDetailView instead, since changing
    # department there also keeps Profile.role (hr vs employee) in sync.
    class Meta:
        model = Employee
        fields = ['manager', 'is_manager', 'status']

    def validate_manager(self, manager):
        if manager and not manager.is_manager:
            raise serializers.ValidationError('Selected employee is not marked as a manager.')
        return manager


class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.profile.full_name', read_only=True)
    days = serializers.IntegerField(read_only=True)

    class Meta:
        model = LeaveRequest
        fields = [
            'id', 'employee', 'employee_name', 'start_date', 'end_date', 'reason',
            'days', 'status', 'decided_at', 'created_at',
        ]
        read_only_fields = ['employee', 'status', 'decided_at', 'created_at']

    def validate(self, data):
        start = data.get('start_date', getattr(self.instance, 'start_date', None))
        end = data.get('end_date', getattr(self.instance, 'end_date', None))
        if start and end and end < start:
            raise serializers.ValidationError({'end_date': 'Must be on or after the start date.'})
        return data


class LeaveDecisionSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[LeaveRequest.APPROVED, LeaveRequest.REJECTED])
