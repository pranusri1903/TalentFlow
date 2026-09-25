from django.contrib import admin

from .models import Employee


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('profile', 'job_title', 'department', 'manager', 'status', 'date_joined')
    list_filter = ('department', 'status')
