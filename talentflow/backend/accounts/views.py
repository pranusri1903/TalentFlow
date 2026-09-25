from django.utils import timezone
from rest_framework.generics import ListAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from employees.models import Employee

from .models import Profile
from .permissions import IsAdmin
from .serializers import CreateUserSerializer, ProfileSerializer, UpdateUserSerializer
from .services import create_supabase_user, generate_temp_password, send_temp_password_email


def role_for(account_type, department):
    if account_type == 'admin':
        return Profile.ADMIN
    return Profile.HR if department == Employee.HR else Profile.EMPLOYEE


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(ProfileSerializer(request.user).data)


class MarkPasswordChangedView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.must_change_password = False
        request.user.save(update_fields=['must_change_password'])
        return Response(ProfileSerializer(request.user).data)


class UserListCreateView(ListAPIView):
    permission_classes = [IsAdmin]
    serializer_class = ProfileSerializer
    queryset = Profile.objects.select_related('employee').order_by('-created_at')

    def post(self, request):
        serializer = CreateUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        role = role_for(data['account_type'], data.get('department'))
        temp_password = generate_temp_password()
        supabase_uid = create_supabase_user(data['email'], temp_password, data.get('full_name', ''))

        profile = Profile.objects.create(
            supabase_uid=supabase_uid,
            email=data['email'],
            full_name=data.get('full_name', ''),
            role=role,
            must_change_password=True,
        )
        if data['account_type'] == 'staff':
            Employee.objects.create(
                profile=profile, department=data['department'], job_title=data.get('job_title', '')
            )
        send_temp_password_email(profile.email, profile.full_name, temp_password, profile.role)
        return Response(ProfileSerializer(profile).data, status=201)


class UserDetailView(RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    queryset = Profile.objects.all()

    def get_serializer_class(self):
        return UpdateUserSerializer if self.request.method in ('PATCH', 'PUT') else ProfileSerializer

    def patch(self, request, *args, **kwargs):
        profile = self.get_object()
        serializer = UpdateUserSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if ('account_type' in data or 'department' in data) and profile.role == Profile.CANDIDATE:
            return Response(
                {'detail': 'Candidates become employees/HR by being hired through the recruitment pipeline, not by admin promotion.'},
                status=400,
            )

        if 'account_type' in data:
            if data['account_type'] == 'admin':
                profile.role = Profile.ADMIN
                Employee.objects.filter(profile=profile).delete()
            else:
                Employee.objects.get_or_create(profile=profile)
                profile.role = Profile.EMPLOYEE

        if 'department' in data:
            employee, _ = Employee.objects.get_or_create(profile=profile)
            employee.department = data['department']
            employee.save(update_fields=['department'])
            profile.role = role_for('staff', data['department'])

        if 'job_title' in data:
            employee, _ = Employee.objects.get_or_create(profile=profile)
            employee.job_title = data['job_title']
            employee.save(update_fields=['job_title'])

        if 'is_active' in data:
            was_active = profile.is_active
            profile.is_active = data['is_active']
            if was_active and not profile.is_active:
                profile.deactivated_at = timezone.now()
            elif profile.is_active and not was_active:
                profile.deactivated_at = None

        profile.save()
        return Response(ProfileSerializer(profile).data)
