from rest_framework.generics import ListAPIView, RetrieveUpdateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdmin

from .models import Employee
from .serializers import EmployeeSerializer, EmployeeUpdateSerializer


class MyEmployeeProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        employee = Employee.objects.filter(profile=request.user).first()
        if not employee:
            return Response({'detail': 'No employee profile for this account.'}, status=404)
        return Response(EmployeeSerializer(employee).data)


class EmployeeListView(ListAPIView):
    permission_classes = [IsAdmin]
    serializer_class = EmployeeSerializer
    queryset = Employee.objects.select_related('profile', 'manager__profile').filter(
        profile__is_active=True
    ).order_by('-date_joined')


class EmployeeDetailView(RetrieveUpdateAPIView):
    permission_classes = [IsAdmin]
    queryset = Employee.objects.select_related('profile', 'manager__profile')

    def get_serializer_class(self):
        return EmployeeUpdateSerializer if self.request.method == 'PATCH' else EmployeeSerializer
