from django.db import models

from accounts.models import Profile


class Employee(models.Model):
    ACTIVE = 'active'
    ON_LEAVE = 'on_leave'
    TERMINATED = 'terminated'
    STATUS_CHOICES = [(ACTIVE, 'Active'), (ON_LEAVE, 'On Leave'), (TERMINATED, 'Terminated')]

    DEVELOPMENT = 'development'
    DESIGNING = 'designing'
    HR = 'hr'
    SALES = 'sales'
    OTHER = 'other'
    DEPARTMENT_CHOICES = [
        (DEVELOPMENT, 'Development'),
        (DESIGNING, 'Designing'),
        (HR, 'Hr'),
        (SALES, 'Sales'),
        (OTHER, 'Other'),
    ]

    profile = models.OneToOneField(Profile, on_delete=models.CASCADE, related_name='employee')
    job_title = models.CharField(max_length=100, blank=True)
    department = models.CharField(max_length=20, choices=DEPARTMENT_CHOICES, blank=True)
    manager = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='reports')
    date_joined = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default=ACTIVE)

    @property
    def is_manager(self):
        # Manager-ness is derived from the designation itself (e.g. "Manager", "HR Manager",
        # "Associate Sales Manager") rather than a separate flag, so the two can never disagree.
        return 'manager' in self.job_title.lower()

    def __str__(self):
        return f"{self.profile.full_name or self.profile.email} - {self.job_title}"


class LeaveRequest(models.Model):
    PENDING = 'pending'
    APPROVED = 'approved'
    REJECTED = 'rejected'
    CANCELLED = 'cancelled'
    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (APPROVED, 'Approved'),
        (REJECTED, 'Rejected'),
        (CANCELLED, 'Cancelled'),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leave_requests')
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=PENDING)
    decided_by = models.ForeignKey(Profile, on_delete=models.SET_NULL, null=True, blank=True, related_name='+')
    decided_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def days(self):
        return (self.end_date - self.start_date).days + 1

    def __str__(self):
        return f"{self.employee} {self.start_date}..{self.end_date} ({self.status})"
