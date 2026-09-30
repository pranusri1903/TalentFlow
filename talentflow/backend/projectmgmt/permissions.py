from accounts.models import Profile


def user_can_manage_project(user, project):
    """Admin can manage every project; otherwise only the project's assigned manager can."""
    if user.role == Profile.ADMIN:
        return True
    return bool(project.manager_id and project.manager.profile_id == user.id)


def user_can_view_project(user, project):
    """Anyone who can manage the project, plus any of its team members, can view it."""
    if user_can_manage_project(user, project):
        return True
    from employees.models import Employee
    employee = Employee.objects.filter(profile=user).first()
    return bool(employee and project.members.filter(id=employee.id).exists())


def visible_projects_for(user):
    """Projects a user may see: every project for admin, else ones they're a member of or manage."""
    from django.db.models import Q
    from employees.models import Employee

    from .models import Project

    qs = Project.objects.all()
    if user.role == Profile.ADMIN:
        return qs
    employee = Employee.objects.filter(profile=user).first()
    if not employee:
        return qs.none()
    return qs.filter(Q(members=employee) | Q(manager=employee)).distinct()
