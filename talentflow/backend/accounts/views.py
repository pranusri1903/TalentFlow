from rest_framework.generics import ListAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Profile
from .permissions import IsAdmin
from .serializers import CreateUserSerializer, ProfileSerializer, UpdateUserSerializer
from .services import create_supabase_user, generate_temp_password, send_temp_password_email


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
    queryset = Profile.objects.all().order_by('-created_at')

    def post(self, request):
        serializer = CreateUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        temp_password = generate_temp_password()
        supabase_uid = create_supabase_user(data['email'], temp_password, data.get('full_name', ''))

        profile = Profile.objects.create(
            supabase_uid=supabase_uid,
            email=data['email'],
            full_name=data.get('full_name', ''),
            role=data['role'],
            must_change_password=True,
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
        for field, value in serializer.validated_data.items():
            setattr(profile, field, value)
        profile.save()
        return Response(ProfileSerializer(profile).data)
