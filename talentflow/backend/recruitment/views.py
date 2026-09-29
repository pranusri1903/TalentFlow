from django.db import transaction
from rest_framework.generics import (
    ListAPIView, ListCreateAPIView, RetrieveUpdateDestroyAPIView,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Profile
from accounts.permissions import IsCandidate, IsHR, IsHROrAdmin
from accounts.services import notify
from employees.models import Employee

from .models import Application, Job
from .serializers import ApplicationSerializer, ApplicationStatusUpdateSerializer, JobSerializer


class JobListCreateView(ListCreateAPIView):
    serializer_class = JobSerializer

    def get_permissions(self):
        return [IsAuthenticated()] if self.request.method == 'GET' else [IsHROrAdmin()]

    def get_queryset(self):
        qs = Job.objects.select_related('posted_by').order_by('-created_at')
        params = self.request.query_params
        search = params.get('search')
        if search:
            from django.db.models import Q
            qs = qs.filter(Q(title__icontains=search) | Q(skills__icontains=search))
        for field in ('department', 'location', 'status'):
            value = params.get(field)
            if value:
                qs = qs.filter(**{field: value})
        return qs

    def perform_create(self, serializer):
        serializer.save(posted_by=self.request.user)


class JobDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = JobSerializer
    queryset = Job.objects.select_related('posted_by')

    def get_permissions(self):
        return [IsAuthenticated()] if self.request.method == 'GET' else [IsHROrAdmin()]


class MyApplicationsView(ListAPIView):
    permission_classes = [IsCandidate]
    serializer_class = ApplicationSerializer

    def get_queryset(self):
        return Application.objects.select_related('job', 'candidate').filter(
            candidate=self.request.user
        ).order_by('-applied_at')


class ApplyToJobView(APIView):
    permission_classes = [IsCandidate]

    def post(self, request, job_id):
        job = Job.objects.filter(id=job_id, status=Job.OPEN).first()
        if not job:
            return Response({'detail': 'Job not found or closed.'}, status=404)
        if Application.objects.filter(job=job, candidate=request.user).exists():
            return Response({'detail': 'You already applied to this job.'}, status=400)

        serializer = ApplicationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        application = serializer.save(job=job, candidate=request.user)
        return Response(ApplicationSerializer(application).data, status=201)


class JobApplicationsView(ListAPIView):
    permission_classes = [IsHROrAdmin]
    serializer_class = ApplicationSerializer

    def get_queryset(self):
        return Application.objects.select_related('job', 'candidate').filter(
            job_id=self.kwargs['job_id']
        ).order_by('-applied_at')


class ApplicationStatusUpdateView(APIView):
    # Only HR can move an application through the pipeline (including hiring, which converts
    # the candidate into an employee) — admin manages roles/promotions afterwards, not hiring.
    permission_classes = [IsHR]

    def patch(self, request, pk):
        application = Application.objects.select_related('job', 'candidate').filter(pk=pk).first()
        if not application:
            return Response({'detail': 'Application not found.'}, status=404)
        if application.status == Application.HIRED:
            return Response({'detail': 'This candidate is already hired; status can no longer be changed.'}, status=400)

        serializer = ApplicationStatusUpdateSerializer(application, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        department = request.data.get('department', '')
        job_title = request.data.get('job_title', '')
        if serializer.validated_data.get('status') == Application.HIRED:
            if department not in dict(Employee.DEPARTMENT_CHOICES):
                return Response({'detail': 'A valid department is required to hire a candidate.'}, status=400)
            if not job_title:
                return Response({'detail': 'A designation is required to hire a candidate.'}, status=400)

        with transaction.atomic():
            serializer.save()
            if application.status == Application.HIRED:
                self._convert_to_employee(application.candidate, department, job_title)

        notify(
            application.candidate,
            f"Your application for '{application.job.title}' is now {application.get_status_display().lower()}.",
            link='/employee' if application.status == Application.HIRED else '/my-applications',
        )
        return Response(ApplicationSerializer(application).data)

    @staticmethod
    def _convert_to_employee(candidate, department, job_title):
        candidate.role = Profile.HR if department == Employee.HR else Profile.EMPLOYEE
        candidate.save(update_fields=['role'])
        employee, _ = Employee.objects.get_or_create(profile=candidate)
        employee.department = department
        employee.job_title = job_title
        employee.save(update_fields=['department', 'job_title'])
