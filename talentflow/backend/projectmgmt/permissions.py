from accounts.models import Profile


def user_can_manage_project(user, project):
    """Admin can manage every project; otherwise only the project's assigned manager can."""
    if user.role == Profile.ADMIN:
        return True
    return bool(project.manager_id and project.manager.profile_id == user.id)
