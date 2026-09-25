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

    def __str__(self):
        return f"{self.profile.full_name or self.profile.email} - {self.job_title}"
