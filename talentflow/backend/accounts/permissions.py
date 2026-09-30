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


class IsAdminOrManager(BasePermission):
    """Admin, or a staff member flagged as a manager (approves their reports' leave, runs their projects)."""

    def has_permission(self, request, view):
        user = request.user
        if not user:
            return False
        if user.role == 'admin':
            return True
        employee = getattr(user, 'employee', None)
        return bool(employee and employee.is_manager)
