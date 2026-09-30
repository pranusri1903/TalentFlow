from django.db import models

from accounts.models import Profile


class Job(models.Model):
    OPEN = 'open'
    CLOSED = 'closed'
    STATUS_CHOICES = [(OPEN, 'Open'), (CLOSED, 'Closed')]

    job_code = models.CharField(max_length=20, unique=True, blank=True, editable=False)
    title = models.CharField(max_length=150)
    department = models.CharField(max_length=100, blank=True)
    location = models.CharField(max_length=100, blank=True)
    employment_type = models.CharField(max_length=50, blank=True)
    description = models.TextField()
    skills = models.CharField(max_length=300, blank=True, help_text='Comma-separated')
    salary_min = models.PositiveIntegerField(null=True, blank=True)
    salary_max = models.PositiveIntegerField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=OPEN)
    posted_by = models.ForeignKey(Profile, on_delete=models.SET_NULL, null=True, related_name='jobs_posted')
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if not self.job_code:
            # Derived from the row's own pk once it exists, same pattern as Employee.employee_code.
            self.job_code = f'JOB{self.pk:04d}'
            super().save(update_fields=['job_code'])

    def __str__(self):
        return self.title


class Application(models.Model):
    APPLIED = 'applied'
    SHORTLISTED = 'shortlisted'
    INTERVIEW = 'interview'
    REJECTED = 'rejected'
    HIRED = 'hired'
    STATUS_CHOICES = [
        (APPLIED, 'Applied'),
        (SHORTLISTED, 'Shortlisted'),
        (INTERVIEW, 'Interview'),
        (REJECTED, 'Rejected'),
        (HIRED, 'Hired'),
    ]

    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applications')
    candidate = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='applications')
    # Stored as bytes in Postgres rather than on local disk: Render's filesystem is ephemeral
    # (wiped on restart/redeploy), but the DB isn't. Cleared once hired/rejected (see
    # ApplicationStatusUpdateView) so only actively-in-pipeline resumes are ever kept.
    resume_data = models.BinaryField(null=True, blank=True)
    resume_content_type = models.CharField(max_length=100, blank=True)
    resume_filename = models.CharField(max_length=255, blank=True)
    cover_letter = models.TextField(blank=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default=APPLIED)
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('job', 'candidate')

    def __str__(self):
        return f"{self.candidate.email} -> {self.job.title}"
