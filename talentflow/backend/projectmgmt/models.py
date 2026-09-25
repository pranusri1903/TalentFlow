from django.db import models

from employees.models import Employee


class Project(models.Model):
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    members = models.ManyToManyField(Employee, related_name='projects', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Sprint(models.Model):
    PLANNED = 'planned'
    ACTIVE = 'active'
    COMPLETED = 'completed'
    STATUS_CHOICES = [
        (PLANNED, 'Planned'),
        (ACTIVE, 'Active'),
        (COMPLETED, 'Completed'),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='sprints')
    name = models.CharField(max_length=150)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default=PLANNED)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Task(models.Model):
    TODO = 'todo'
    IN_PROGRESS = 'in_progress'
    REVIEW = 'review'
    DONE = 'done'
    STATUS_CHOICES = [
        (TODO, 'To Do'),
        (IN_PROGRESS, 'In Progress'),
        (REVIEW, 'Review'),
        (DONE, 'Done'),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    sprint = models.ForeignKey(Sprint, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    assignees = models.ManyToManyField(Employee, related_name='tasks', blank=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default=TODO)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
