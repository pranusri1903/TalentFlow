from rest_framework.permissions import BasePermission


def role_permission(*allowed_roles):
    class RolePermission(BasePermission):
        def has_permission(self, request, view):
            return bool(request.user and request.user.role in allowed_roles)

    return RolePermission


IsAdmin = role_permission('admin')
IsHR = role_permission('hr')
IsEmployee = role_permission('employee')
IsCandidate = role_permission('candidate')
IsHROrAdmin = role_permission('hr', 'admin')
IsEmployeeOrAdmin = role_permission('employee', 'admin')
