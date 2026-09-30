from rest_framework import serializers

from accounts.serializers import ProfileSerializer

from .models import Application, Job


class JobSerializer(serializers.ModelSerializer):
    posted_by_name = serializers.CharField(source='posted_by.full_name', read_only=True, default='')

    class Meta:
        model = Job
        fields = [
            'id', 'job_code', 'title', 'department', 'location', 'employment_type', 'description',
            'skills', 'salary_min', 'salary_max', 'status', 'posted_by', 'posted_by_name',
            'created_at',
        ]
        read_only_fields = ['posted_by', 'posted_by_name', 'created_at']


class ApplicationSerializer(serializers.ModelSerializer):
    candidate = ProfileSerializer(read_only=True)
    job_title = serializers.CharField(source='job.title', read_only=True)
    job_code = serializers.CharField(source='job.job_code', read_only=True)
    resume = serializers.SerializerMethodField()
    resume_upload = serializers.FileField(write_only=True)

    class Meta:
        model = Application
        fields = [
            'id', 'job', 'job_title', 'job_code', 'candidate', 'resume', 'resume_upload', 'cover_letter',
            'status', 'applied_at', 'updated_at',
        ]
        read_only_fields = ['job', 'candidate', 'status', 'applied_at', 'updated_at']

    def get_resume(self, obj):
        if not obj.resume_data:
            return None
        path = f'/api/recruitment/applications/{obj.id}/resume/'
        request = self.context.get('request')
        return request.build_absolute_uri(path) if request else path

    def create(self, validated_data):
        upload = validated_data.pop('resume_upload')
        validated_data['resume_data'] = upload.read()
        validated_data['resume_content_type'] = upload.content_type or 'application/octet-stream'
        validated_data['resume_filename'] = upload.name
        return super().create(validated_data)


class ApplicationStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = ['status']
