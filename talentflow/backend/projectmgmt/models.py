from django.db import models

from accounts.models import Profile
from employees.models import Employee


class Project(models.Model):
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    members = models.ManyToManyField(Employee, related_name='projects', blank=True)
    manager = models.ForeignKey(
        Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_projects'
    )
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


class Epic(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='epics')
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
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

    LOW = 'low'
    MEDIUM = 'medium'
    HIGH = 'high'
    URGENT = 'urgent'
    PRIORITY_CHOICES = [
        (LOW, 'Low'),
        (MEDIUM, 'Medium'),
        (HIGH, 'High'),
        (URGENT, 'Urgent'),
    ]

    TASK = 'task'
    BUG = 'bug'
    STORY = 'story'
    TYPE_CHOICES = [
        (TASK, 'Task'),
        (BUG, 'Bug'),
        (STORY, 'Story'),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    sprint = models.ForeignKey(Sprint, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks')
    epic = models.ForeignKey(Epic, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    assignees = models.ManyToManyField(Employee, related_name='tasks', blank=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default=TODO)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default=MEDIUM)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES, default=TASK)
    due_date = models.DateField(null=True, blank=True)
    labels = models.CharField(max_length=200, blank=True, help_text='Comma-separated')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class TaskComment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='+')
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.author} on {self.task}"


class TaskActivity(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='activity')
    actor = models.ForeignKey(Profile, on_delete=models.SET_NULL, null=True, related_name='+')
    message = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        verbose_name_plural = 'Task activity'

    def __str__(self):
        return self.message
