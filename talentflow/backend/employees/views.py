from django.utils import timezone
from rest_framework.exceptions import NotFound
from rest_framework.generics import ListAPIView, ListCreateAPIView, RetrieveUpdateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Profile
from accounts.permissions import IsAdmin, IsAdminOrManager
from accounts.services import notify

from .models import Employee, LeaveRequest
from .serializers import (
    EmployeeSerializer, EmployeeUpdateSerializer, LeaveDecisionSerializer, LeaveRequestSerializer,
)

ANNUAL_LEAVE_DAYS = 20


class MyEmployeeProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        employee = Employee.objects.filter(profile=request.user).first()
        if not employee:
            return Response({'detail': 'No employee profile for this account.'}, status=404)
        return Response(EmployeeSerializer(employee).data)


class EmployeeListView(ListAPIView):
    permission_classes = [IsAdminOrManager]
    serializer_class = EmployeeSerializer
    queryset = Employee.objects.select_related('profile', 'manager__profile').filter(
        profile__is_active=True
    ).order_by('-date_joined')


class EmployeeDetailView(RetrieveUpdateAPIView):
    permission_classes = [IsAdmin]
    queryset = Employee.objects.select_related('profile', 'manager__profile')

    def get_serializer_class(self):
        return EmployeeUpdateSerializer if self.request.method == 'PATCH' else EmployeeSerializer


class MyLeaveRequestsView(ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = LeaveRequestSerializer

    def _employee(self):
        return Employee.objects.filter(profile=self.request.user).first()

    def get_queryset(self):
        employee = self._employee()
        return LeaveRequest.objects.filter(employee=employee).order_by('-created_at') if employee else LeaveRequest.objects.none()

    def perform_create(self, serializer):
        employee = self._employee()
        if not employee:
            raise NotFound('No employee profile for this account.')
        serializer.save(employee=employee)


class MyLeaveBalanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        employee = Employee.objects.filter(profile=request.user).first()
        if not employee:
            return Response({'detail': 'No employee profile for this account.'}, status=404)

        approved = LeaveRequest.objects.filter(
            employee=employee, status=LeaveRequest.APPROVED, start_date__year=timezone.now().year,
        )
        used = sum(r.days for r in approved)
        return Response({'allowance': ANNUAL_LEAVE_DAYS, 'used': used, 'remaining': ANNUAL_LEAVE_DAYS - used})


class LeaveRequestQueueView(ListAPIView):
    """Admin sees every request; a manager sees only their direct reports' requests."""

    permission_classes = [IsAdminOrManager]
    serializer_class = LeaveRequestSerializer

    def get_queryset(self):
        qs = LeaveRequest.objects.select_related('employee__profile', 'employee__manager__profile')
        if self.request.user.role != Profile.ADMIN:
            manager = Employee.objects.filter(profile=self.request.user, job_title__icontains='manager').first()
            qs = qs.filter(employee__manager=manager)
        qs = qs.order_by('-created_at')
        status_param = self.request.query_params.get('status')
        return qs.filter(status=status_param) if status_param else qs


class MyLeaveCancelView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        employee = Employee.objects.filter(profile=request.user).first()
        leave_request = LeaveRequest.objects.filter(pk=pk, employee=employee).first()
        if not leave_request:
            return Response({'detail': 'Leave request not found.'}, status=404)
        if leave_request.status != LeaveRequest.APPROVED:
            return Response({'detail': 'Only an approved request can be cancelled.'}, status=400)
        if leave_request.start_date <= timezone.now().date():
            return Response({'detail': 'This leave has already started and can no longer be cancelled.'}, status=400)

        leave_request.status = LeaveRequest.CANCELLED
        leave_request.save(update_fields=['status'])
        notify(
            leave_request.decided_by,
            f"{leave_request.employee.profile.full_name or leave_request.employee.profile.email} cancelled "
            f"their approved leave ({leave_request.start_date} to {leave_request.end_date}).",
            link='/admin/leave' if leave_request.decided_by and leave_request.decided_by.role == Profile.ADMIN else '/employee',
        )
        return Response(LeaveRequestSerializer(leave_request).data)


class LeaveDecisionView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        leave_request = LeaveRequest.objects.select_related('employee__profile', 'employee__manager__profile').filter(pk=pk).first()
        if not leave_request:
            return Response({'detail': 'Leave request not found.'}, status=404)
        if leave_request.status != LeaveRequest.PENDING:
            return Response({'detail': 'This request has already been decided.'}, status=400)

        is_their_manager = (
            leave_request.employee.manager_id
            and leave_request.employee.manager.profile_id == request.user.id
            and leave_request.employee.manager.is_manager
        )
        if request.user.role != Profile.ADMIN and not is_their_manager:
            return Response({'detail': 'Not allowed.'}, status=403)

        serializer = LeaveDecisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        leave_request.status = serializer.validated_data['status']
        leave_request.decided_by = request.user
        leave_request.decided_at = timezone.now()
        leave_request.save(update_fields=['status', 'decided_by', 'decided_at'])
        notify(
            leave_request.employee.profile,
            f"Your leave request ({leave_request.start_date} to {leave_request.end_date}) was {leave_request.status}.",
            link='/employee',
        )
        return Response(LeaveRequestSerializer(leave_request).data)
