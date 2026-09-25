from rest_framework import serializers

from employees.models import Employee

from .models import Profile

DEPARTMENT_CHOICES = [c[0] for c in Employee.DEPARTMENT_CHOICES]


class ProfileSerializer(serializers.ModelSerializer):
    employee_id = serializers.SerializerMethodField()
    job_title = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            'id', 'email', 'full_name', 'role',
            'must_change_password', 'is_active', 'deactivated_at', 'created_at',
            'employee_id', 'job_title', 'department',
        ]
        read_only_fields = fields

    def get_employee_id(self, obj):
        employee = getattr(obj, 'employee', None)
        return employee.id if employee else None

    def get_job_title(self, obj):
        employee = getattr(obj, 'employee', None)
        return employee.job_title if employee else None

    def get_department(self, obj):
        employee = getattr(obj, 'employee', None)
        return employee.department if employee else None


class CreateUserSerializer(serializers.Serializer):
    email = serializers.EmailField()
    full_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    account_type = serializers.ChoiceField(choices=['admin', 'staff'])
    department = serializers.ChoiceField(choices=DEPARTMENT_CHOICES, required=False)
    job_title = serializers.CharField(max_length=100, required=False, allow_blank=True)

    def validate(self, data):
        if data['account_type'] == 'staff' and not data.get('department'):
            raise serializers.ValidationError({'department': 'Required for staff accounts.'})
        return data


class UpdateUserSerializer(serializers.Serializer):
    account_type = serializers.ChoiceField(choices=['admin', 'staff'], required=False)
    department = serializers.ChoiceField(choices=DEPARTMENT_CHOICES, required=False)
    job_title = serializers.CharField(max_length=100, required=False, allow_blank=True)
    is_active = serializers.BooleanField(required=False)
