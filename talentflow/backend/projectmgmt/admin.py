from django.contrib import admin

from .models import Project, Sprint, Task


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')


@admin.register(Sprint)
class SprintAdmin(admin.ModelAdmin):
    list_display = ('name', 'project', 'start_date', 'end_date', 'status')
    list_filter = ('status', 'project')


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'project', 'sprint', 'status', 'updated_at')
    list_filter = ('status', 'project', 'sprint')
    filter_horizontal = ('assignees',)
