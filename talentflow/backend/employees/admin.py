from django.contrib import admin

from .models import Employee, LeaveRequest


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('profile', 'job_title', 'department', 'manager', 'status', 'date_joined')
    list_filter = ('department', 'status')


@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = ('employee', 'start_date', 'end_date', 'status', 'created_at')
    list_filter = ('status',)
