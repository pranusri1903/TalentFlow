from rest_framework import serializers

from accounts.serializers import ProfileSerializer

from .models import Employee


class EmployeeSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    manager_name = serializers.CharField(source='manager.profile.full_name', read_only=True, default='')

    class Meta:
        model = Employee
        fields = [
            'id', 'profile', 'job_title', 'department',
            'manager', 'manager_name', 'date_joined', 'status',
        ]


class EmployeeUpdateSerializer(serializers.ModelSerializer):
    # job_title/department are edited via accounts.UserDetailView instead, since changing
    # department there also keeps Profile.role (hr vs employee) in sync.
    class Meta:
        model = Employee
        fields = ['manager', 'status']
