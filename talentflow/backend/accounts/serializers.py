from rest_framework import serializers

from .models import Profile


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = [
            'id', 'email', 'full_name', 'role',
            'must_change_password', 'is_active', 'created_at',
        ]
        read_only_fields = fields


class CreateUserSerializer(serializers.Serializer):
    email = serializers.EmailField()
    full_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=[Profile.HR, Profile.EMPLOYEE, Profile.ADMIN])


class UpdateUserSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=Profile.ROLE_CHOICES, required=False)
    is_active = serializers.BooleanField(required=False)
