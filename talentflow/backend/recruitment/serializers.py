from rest_framework import serializers

from accounts.serializers import ProfileSerializer

from .models import Application, Job


class JobSerializer(serializers.ModelSerializer):
    posted_by_name = serializers.CharField(source='posted_by.full_name', read_only=True, default='')

    class Meta:
        model = Job
        fields = [
            'id', 'title', 'department', 'location', 'employment_type', 'description',
            'skills', 'salary_min', 'salary_max', 'status', 'posted_by', 'posted_by_name',
            'created_at',
        ]
        read_only_fields = ['posted_by', 'posted_by_name', 'created_at']


class ApplicationSerializer(serializers.ModelSerializer):
    candidate = ProfileSerializer(read_only=True)
    job_title = serializers.CharField(source='job.title', read_only=True)

    class Meta:
        model = Application
        fields = [
            'id', 'job', 'job_title', 'candidate', 'resume', 'cover_letter',
            'status', 'applied_at', 'updated_at',
        ]
        read_only_fields = ['candidate', 'status', 'applied_at', 'updated_at']


class ApplicationStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = ['status']
