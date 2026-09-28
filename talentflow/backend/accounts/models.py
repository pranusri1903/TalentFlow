from django.db import models


class Profile(models.Model):
    CANDIDATE = 'candidate'
    HR = 'hr'
    EMPLOYEE = 'employee'
    ADMIN = 'admin'
    ROLE_CHOICES = [
        (CANDIDATE, 'Candidate'),
        (HR, 'HR'),
        (EMPLOYEE, 'Employee'),
        (ADMIN, 'Admin'),
    ]

    supabase_uid = models.CharField(max_length=64, unique=True)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=150, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=CANDIDATE)
    must_change_password = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    deactivated_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def is_authenticated(self):
        return True

    def __str__(self):
        return f"{self.email} ({self.role})"


class Notification(models.Model):
    recipient = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='notifications')
    message = models.CharField(max_length=255)
    link = models.CharField(max_length=200, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.recipient.email}: {self.message}"
