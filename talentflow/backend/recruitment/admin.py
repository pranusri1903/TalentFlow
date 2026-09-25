from django.contrib import admin

from .models import Application, Job


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ('title', 'department', 'location', 'status', 'created_at')
    list_filter = ('status', 'department')
    search_fields = ('title', 'skills')


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ('candidate', 'job', 'status', 'applied_at')
    list_filter = ('status',)
